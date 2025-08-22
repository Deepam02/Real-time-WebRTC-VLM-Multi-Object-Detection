# 📱🔍 Real-time WebRTC VLM Multi-Object Detection

A real-time camera streaming application with AI-powered object detection that streams video from mobile phones to laptop browsers and detects objects in real-time using YOLOv5n.

## 🎯 How It Works

1. **Laptop (Viewer)** creates a session and displays a QR code
2. **Phone** scans the QR code and grants camera access
3. **WebRTC** establishes peer-to-peer connection for real-time streaming
4. **Object Detection Service** processes video frames using YOLOv5n
5. **Real-time Detection** overlays detected objects on the live video stream

## 🏗️ Architecture

- **Frontend**: Next.js (React) with real-time detection overlay
- **Backend**: Node.js with Socket.IO for WebRTC signaling
- **Detection Service**: Python service with YOLOv5n for object detection
- **WebRTC**: Peer-to-peer video streaming
- **AI Processing**: 320×240 @ 10-15 FPS optimized detection

## ✨ Features

- ✅ **Real-time video streaming** via WebRTC
- ✅ **AI-powered object detection** with YOLOv5n
- ✅ **Mobile-optimized interface** for phone streaming
- ✅ **Live detection overlay** with bounding boxes and labels
- ✅ **Optimized performance** (320×240 @ 10-15 FPS)
- ✅ **80+ object classes** detection (COCO dataset)
- ✅ **Real-time FPS monitoring** and statistics
- ✅ **Confidence threshold** filtering
- ✅ **QR code session joining**
- ✅ **Multi-session support**

## 🚀 Quick Start

### 1. Backend Setup (WebRTC Signaling)

```bash
cd backend
npm install
npm run dev
```

### 2. Detection Service Setup (AI Processing)

```bash
cd detection-service
# Windows
setup.bat
# or Linux/Mac
chmod +x setup.sh && ./setup.sh
```

This will:
- Create a Python virtual environment
- Install all required dependencies (PyTorch, OpenCV, YOLOv5, etc.)
- Download the YOLOv5n model if not present
- Test the detector

### 3. Start Detection Service

```bash
cd detection-service
# Windows
venv\Scripts\activate.bat
# Linux/Mac
source venv/bin/activate

python detection_server.py
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 5. Start Streaming with Detection

1. Visit `http://localhost:3000`
2. Create a new session
3. Open the viewer page
4. Scan QR code with your phone
5. Enable object detection
6. Watch real-time AI-powered object detection!

## 📦 Project Structure

```
webrtc-vlm-detection/
├── backend/                 # Node.js WebRTC signaling server
│   ├── server.js           # Main signaling server
│   └── package.json        # Backend dependencies
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   └── utils/         # Utility functions
│   │       ├── webrtc.ts  # WebRTC utilities
│   │       └── detectionClient.ts # Detection service client
│   └── package.json       # Frontend dependencies
├── detection-service/      # Python AI detection service
│   ├── yolo_detector.py   # YOLOv5n detector implementation
│   ├── detection_server.py # Detection WebSocket server
│   ├── requirements.txt   # Python dependencies
│   ├── setup.bat         # Windows setup script
│   └── setup.sh          # Linux/Mac setup script
├── yolov5n.pt            # YOLOv5n quantized model
└── README.md             # This file
```

## 🔧 Configuration

### Detection Service Settings

Edit `detection-service/detection_server.py`:

```python
MODEL_PATH = "../yolov5n.pt"        # Path to YOLOv5n model
TARGET_SIZE = (320, 240)            # Processing resolution
TARGET_FPS = 15                     # Target processing FPS
CONF_THRESHOLD = 0.25               # Detection confidence threshold
```

### Environment Variables

#### Backend (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_DETECTION_SERVICE_URL=http://localhost:5000
```

## 🤖 Object Detection Details

### Supported Objects (80 classes)
- **People**: Person detection
- **Vehicles**: Car, truck, bus, motorcycle, bicycle, boat, airplane
- **Animals**: Dog, cat, bird, horse, cow, sheep, elephant, etc.
- **Objects**: Chair, table, laptop, phone, bottle, cup, book, etc.
- **Food**: Apple, banana, pizza, sandwich, etc.

### Performance Specs
- **Model**: YOLOv5n (nano) - optimized for speed
- **Input Size**: 320×240 pixels (downscaled from original)
- **Target FPS**: 10-15 FPS processing
- **Latency**: ~50-100ms per frame
- **Memory**: ~200MB GPU/CPU usage

### Detection Output Format
```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "person",
      "confidence": 0.85,
      "bbox": {
        "x1": 0.1, "y1": 0.2,
        "x2": 0.8, "y2": 0.9,
        "width": 0.7, "height": 0.7
      }
    }
  ],
  "processing_time": 0.045,
  "fps": 22.2,
  "detection_count": 1
}
```

## 🌐 API Endpoints

### WebRTC Signaling (Port 3001)
- `POST /session` - Create new streaming session
- `GET /session/:id` - Get session info
- WebSocket events for WebRTC signaling

### Detection Service (Port 5000)
- `GET /health` - Service health and status
- `POST /detect` - Single image detection (REST)
- `GET /sessions` - List active detection sessions
- WebSocket events for real-time detection

### WebSocket Events (Detection)
- `join_detection_session` - Join detection session
- `process_frame` - Send frame for detection
- `detection_results` - Receive detection results

## 🎮 Usage Instructions

### For Laptop Users (Viewers)
1. Open the web app and create a session
2. A QR code will appear on the viewer page
3. Enable object detection using the toggle button
4. Watch the live stream with AI detection overlays

### For Mobile Users (Streamers)
1. Scan the QR code with your phone
2. Grant camera permissions
3. Point the camera at objects to detect
4. Detection results appear in real-time on the viewer

## 🛠️ Development

### Testing Detection Service
```bash
cd detection-service
python test_detector.py
```

### Integration with Frontend
The detection service integrates via WebSocket connections. See `frontend/src/components/DetectionOverlay.tsx` for implementation example.

### Custom Model Training
To use your own trained model:
1. Export your model to YOLOv5 format (.pt)
2. Replace `yolov5n.pt` with your model
3. Update class names in `yolo_detector.py`

## 🔒 Security & Privacy

- **Peer-to-Peer**: Video streams directly between devices
- **Local Processing**: AI detection runs locally (not cloud)
- **HTTPS Required**: Camera access requires secure connections
- **No Recording**: No video or detection data stored
- **Temporary Sessions**: Auto cleanup after inactivity

## 📋 Browser Support

- ✅ Chrome (Desktop & Mobile) - Recommended
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop)
- ❌ Internet Explorer (not supported)

## 🐛 Troubleshooting

### Detection Service Issues
```bash
# Check if model exists
ls yolov5n.pt

# Test detector
cd detection-service
python test_detector.py

# Check service health
curl http://localhost:5000/health
```

### WebRTC Issues
- Ensure HTTPS in production
- Check browser permissions
- Verify environment variables

### Performance Issues
- Reduce TARGET_FPS for slower devices
- Increase CONF_THRESHOLD to show fewer objects
- Check Python virtual environment activation

## 🚀 Deployment

### Detection Service (Docker)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY detection-service/ .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "detection_server.py"]
```

### Production Environment
- Backend: Deploy to Render/Railway
- Frontend: Deploy to Vercel/Netlify  
- Detection: Deploy to GPU-enabled service (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using WebRTC, YOLOv5n, and modern web technologies**
