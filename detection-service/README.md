# Object Detection Service

This service provides real-time object detection for the WebRTC video streaming application using YOLOv5n.

## Features

- **Real-time Object Detection**: Uses YOLOv5n quantized model for fast inference
- **Optimized Performance**: Target processing at 320×240 resolution @ 10-15 FPS
- **WebSocket Communication**: Low-latency real-time detection results
- **REST API**: HTTP endpoints for testing and integration
- **Multi-session Support**: Handle multiple video streams simultaneously

## Installation

1. **Install Python Dependencies**:
```bash
cd detection-service
pip install -r requirements.txt
```

2. **Verify Model**: Ensure `yolov5n.pt` is in the parent directory
```bash
ls ../yolov5n.pt
```

## Usage

### 1. Start the Detection Service

```bash
cd detection-service
python detection_server.py
```

The service will start on `http://localhost:5000`

### 2. Test the Detector

```bash
python test_detector.py
```

This will test the YOLO detector with a sample image and save the results.

### 3. Integration with WebRTC Frontend

The detection service integrates with your existing WebRTC application through WebSocket connections.

## API Endpoints

### WebSocket Events

- **`join_detection_session`**: Join a detection session
  ```javascript
  socket.emit('join_detection_session', { session_id: 'your-session-id' });
  ```

- **`process_frame`**: Send frame for detection
  ```javascript
  socket.emit('process_frame', {
    session_id: 'your-session-id',
    image: base64ImageData,
    timestamp: Date.now()
  });
  ```

- **`detection_results`**: Receive detection results
  ```javascript
  socket.on('detection_results', (results) => {
    console.log(results.detections);
  });
  ```

### REST API

- **GET `/health`**: Health check and service status
- **POST `/detect`**: Single image detection
- **GET `/sessions`**: List active detection sessions

## Configuration

Edit the configuration variables in `detection_server.py`:

```python
MODEL_PATH = "../yolov5n.pt"        # Path to YOLOv5n model
TARGET_SIZE = (320, 240)            # Processing resolution
TARGET_FPS = 15                     # Target FPS
CONF_THRESHOLD = 0.25               # Detection confidence threshold
```

## Detection Results Format

```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "person",
      "confidence": 0.85,
      "bbox": {
        "x1": 0.1,
        "y1": 0.2,
        "x2": 0.8,
        "y2": 0.9,
        "width": 0.7,
        "height": 0.7
      }
    }
  ],
  "processing_time": 0.045,
  "fps": 22.2,
  "image_size": {
    "width": 320,
    "height": 240
  },
  "detection_count": 1,
  "session_id": "abc123",
  "timestamp": 1692123456.789
}
```

## Performance Optimization

- **Model**: YOLOv5n (nano) for fastest inference
- **Resolution**: Downscaled to 320×240 for processing
- **Queue Management**: Frame dropping when processing can't keep up
- **Threading**: Background worker for non-blocking detection

## Supported Object Classes

The detector can identify 80 different object classes from the COCO dataset:
- Person, vehicles (car, truck, bus, motorcycle, etc.)
- Animals (dog, cat, bird, horse, etc.)
- Objects (chair, table, laptop, phone, etc.)
- Food items (apple, banana, pizza, etc.)

## Troubleshooting

1. **Model Not Found**: Ensure `yolov5n.pt` is in the correct location
2. **Import Errors**: Install all dependencies with `pip install -r requirements.txt`
3. **Performance Issues**: Reduce TARGET_FPS or increase TARGET_SIZE for slower devices
4. **Memory Issues**: Decrease queue size or processing resolution

## Integration Example

See the integration example in the main README for connecting this service with your WebRTC frontend.
