import os
import sys
import json
import base64
import asyncio
import socketio
import eventlet
from flask import Flask, request, jsonify
from flask_cors import CORS
from yolo_detector import YOLODetector
import time
from threading import Lock
import queue
import threading

# Initialize Flask app
flask_app = Flask(__name__)
CORS(flask_app, cors_allowed_origins="*")

# Initialize Socket.IO server
sio = socketio.Server(
    cors_allowed_origins="*",
    async_mode='eventlet',
    ping_timeout=60,
    ping_interval=25
)
app = socketio.WSGIApp(sio, flask_app)

# Global variables
detector = None
detection_queue = queue.Queue(maxsize=10)  # Limit queue size to prevent memory issues
active_sessions = {}
session_lock = Lock()

# Configuration
MODEL_PATH = "yolov5n.pt"  # Try current directory first
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = "../yolov5n.pt"  # Then parent directory
TARGET_SIZE = (320, 240)
TARGET_FPS = 15
CONF_THRESHOLD = 0.25

def initialize_detector():
    """Initialize YOLO detector"""
    global detector
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"Error: Model file not found at {MODEL_PATH}")
            return False
        
        print("Initializing YOLOv5n detector...")
        detector = YOLODetector(
            model_path=MODEL_PATH,
            conf_threshold=CONF_THRESHOLD,
            target_size=TARGET_SIZE,
            target_fps=TARGET_FPS
        )
        print("YOLOv5n detector initialized successfully!")
        return True
    except Exception as e:
        print(f"Error initializing detector: {e}")
        return False

def detection_worker():
    """Background worker to process detection requests"""
    global detector
    
    while True:
        try:
            # Get detection request from queue
            session_id, image_data, timestamp = detection_queue.get(timeout=1)
            
            if detector is None:
                continue
            
            # Perform object detection
            results = detector.detect_objects(image_data)
            
            # Add metadata
            results['session_id'] = session_id
            results['timestamp'] = timestamp
            results['processing_timestamp'] = time.time()
            
            # Send results back to the specific session
            with session_lock:
                if session_id in active_sessions:
                    sio.emit('detection_results', results, room=session_id)
            
            detection_queue.task_done()
            
        except queue.Empty:
            continue
        except Exception as e:
            print(f"Error in detection worker: {e}")
            if not detection_queue.empty():
                detection_queue.task_done()

@sio.event
def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    return True

@sio.event
def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    
    # Remove from active sessions
    with session_lock:
        session_to_remove = None
        for session_id, session_info in active_sessions.items():
            if session_info['sid'] == sid:
                session_to_remove = session_id
                break
        
        if session_to_remove:
            del active_sessions[session_to_remove]
            print(f"Removed session: {session_to_remove}")

@sio.event
def join_detection_session(sid, data):
    """Join a detection session"""
    session_id = data.get('session_id')
    if not session_id:
        sio.emit('error', {'message': 'Session ID required'}, room=sid)
        return
    
    with session_lock:
        active_sessions[session_id] = {
            'sid': sid,
            'joined_at': time.time(),
            'frame_count': 0,
            'last_detection': None
        }
    
    sio.enter_room(sid, session_id)
    sio.emit('joined_session', {
        'session_id': session_id,
        'status': 'ready',
        'detector_info': {
            'model': 'YOLOv5n',
            'target_size': TARGET_SIZE,
            'target_fps': TARGET_FPS,
            'conf_threshold': CONF_THRESHOLD
        }
    }, room=sid)
    
    print(f"Client {sid} joined detection session: {session_id}")

@sio.event
def process_frame(sid, data):
    """Process a frame for object detection"""
    if detector is None:
        sio.emit('error', {'message': 'Detector not initialized'}, room=sid)
        return
    
    session_id = data.get('session_id')
    image_data = data.get('image')
    timestamp = data.get('timestamp', time.time())
    
    if not session_id or not image_data:
        sio.emit('error', {'message': 'Session ID and image data required'}, room=sid)
        return
    
    # Check if session exists
    with session_lock:
        if session_id not in active_sessions:
            sio.emit('error', {'message': 'Session not found'}, room=sid)
            return
        
        # Update frame count
        active_sessions[session_id]['frame_count'] += 1
    
    # Add to detection queue (non-blocking)
    try:
        detection_queue.put_nowait((session_id, image_data, timestamp))
    except queue.Full:
        # Queue is full, skip this frame
        sio.emit('detection_results', {
            'session_id': session_id,
            'timestamp': timestamp,
            'error': 'Detection queue full, frame skipped',
            'detections': [],
            'processing_time': 0,
            'fps': 0
        }, room=sid)

@sio.event
def get_session_stats(sid, data):
    """Get session statistics"""
    session_id = data.get('session_id')
    
    with session_lock:
        if session_id not in active_sessions:
            sio.emit('error', {'message': 'Session not found'}, room=sid)
            return
        
        session_info = active_sessions[session_id]
        stats = {
            'session_id': session_id,
            'uptime': time.time() - session_info['joined_at'],
            'frame_count': session_info['frame_count'],
            'last_detection': session_info['last_detection'],
            'queue_size': detection_queue.qsize(),
            'active_sessions': len(active_sessions)
        }
        
        sio.emit('session_stats', stats, room=sid)

# REST API endpoints
@flask_app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'detector_ready': detector is not None,
        'active_sessions': len(active_sessions),
        'queue_size': detection_queue.qsize(),
        'model_info': {
            'model': 'YOLOv5n',
            'target_size': TARGET_SIZE,
            'target_fps': TARGET_FPS,
            'conf_threshold': CONF_THRESHOLD
        }
    })

@flask_app.route('/detect', methods=['POST'])
def detect_objects_api():
    """REST API endpoint for object detection"""
    if detector is None:
        return jsonify({'error': 'Detector not initialized'}), 500
    
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Image data required'}), 400
        
        # Perform detection
        results = detector.detect_objects(image_data)
        results['timestamp'] = time.time()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@flask_app.route('/sessions', methods=['GET'])
def get_active_sessions():
    """Get list of active detection sessions"""
    with session_lock:
        sessions = []
        for session_id, session_info in active_sessions.items():
            sessions.append({
                'session_id': session_id,
                'uptime': time.time() - session_info['joined_at'],
                'frame_count': session_info['frame_count']
            })
    
    return jsonify({
        'active_sessions': sessions,
        'total_count': len(sessions)
    })

if __name__ == '__main__':
    # Initialize detector
    if not initialize_detector():
        print("Failed to initialize detector. Exiting.")
        sys.exit(1)
    
    # Start detection worker thread
    worker_thread = threading.Thread(target=detection_worker, daemon=True)
    worker_thread.start()
    
    print("Starting detection service...")
    print(f"Model: YOLOv5n ({MODEL_PATH})")
    print(f"Target processing: {TARGET_SIZE[0]}x{TARGET_SIZE[1]} @ {TARGET_FPS} FPS")
    print(f"Confidence threshold: {CONF_THRESHOLD}")
    print("Server running on http://localhost:5000")
    
    # Run the server
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)
