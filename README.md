# 🎯🤖 Real-time WebRTC VLM Multi-Object Detection

An intelligent real-time video streaming and object detection system that combines WebRTC technology with Vision Language Models (VLM) for advanced multi-object detection and analysis.

## 🎯 How It Works

1. **Laptop (Viewer)** creates a session and displays a QR code
2. **Phone** scans the QR code and grants camera access
3. **WebRTC** establishes peer-to-peer connection for real-time streaming
4. **AI Detection Service** analyzes video frames for object detection
5. **Real-time overlay** displays detected objects with bounding boxes and labels
6. **Live analytics** provides detection statistics and performance metrics

## 🏗️ Architecture

- **Frontend**: Next.js (TypeScript) - Real-time video streaming interface
- **Backend**: Node.js with Socket.IO - WebRTC signaling server
- **Detection Service**: Python FastAPI - YOLOv5 object detection engine
- **WebRTC**: Peer-to-peer video streaming with frame extraction
- **AI Models**: YOLOv5 for real-time multi-object detection

## 🚀 Quick Start

### 1. Backend Setup (WebRTC Signaling Server)

```bash
cd backend
npm install
npm run dev
```

### 2. Detection Service Setup (AI Object Detection)

```bash
cd detection-service
pip install -r requirements.txt
python detection_server.py
```

### 3. Frontend Setup (Web Interface)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to start intelligent video streaming with object detection!

## 📦 Project Structure

```
Real-time-WebRTC-VLM-Multi-Object-Detection/
├── backend/              # Node.js WebRTC signaling server
│   ├── server.js        # Main signaling server
│   ├── package.json     # Backend dependencies
│   └── test-backend.js  # Server testing utilities
├── frontend/            # Next.js TypeScript application
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # React components for detection overlay
│   │   └── utils/      # WebRTC and detection client utilities
│   ├── package.json    # Frontend dependencies
│   └── next.config.js  # Next.js configuration
├── detection-service/   # Python AI detection service
│   ├── detection_server.py    # FastAPI detection server
│   ├── yolo_detector.py      # YOLOv5 detection engine
│   ├── requirements.txt      # Python dependencies
│   ├── yolov5n.pt           # Pre-trained YOLO model
│   └── test_detector.py     # Detection testing utilities
└── README.md           # Project documentation
```

## 🌐 Deployment

### Backend Deployment (WebRTC Signaling)

1. Connect your GitHub repo to your preferred platform (Render/Heroku)
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable: `FRONTEND_URL=https://your-deployment-url.com`

### Frontend Deployment (Web Interface)

1. Connect your GitHub repo to Vercel/Netlify
2. Set root directory to `frontend/`
3. Add environment variables:
   - `NEXT_PUBLIC_SIGNALING_SERVER_URL=https://your-backend-url.com`
   - `NEXT_PUBLIC_DETECTION_SERVER_URL=https://your-detection-service-url.com`
4. Deploy!

### Detection Service Deployment (AI Service)

1. Deploy to cloud platform supporting Python (Google Cloud Run/AWS Lambda/Heroku)
2. Install dependencies: `pip install -r requirements.txt`
3. Start service: `python detection_server.py`
4. Ensure service is accessible via HTTP/HTTPS

## 🔧 Environment Variables

### Frontend (.env)

```bash
NEXT_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_DETECTION_SERVER_URL=http://localhost:5000
```

### Backend (.env)

```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Detection Service (.env)

```bash
PORT=5000
MODEL_PATH=./yolov5n.pt
DETECTION_THRESHOLD=0.5
MAX_DETECTIONS=100
```

## 📱 Usage

1. **Create Session**: Visit the web app and click "Start New Detection Session"
2. **Scan QR Code**: Use your phone to scan the displayed QR code
3. **Grant Permissions**: Allow camera and microphone access on your phone
4. **Enable AI Detection**: Toggle object detection to start AI analysis
5. **Start Streaming**: Watch live video with real-time object detection overlays
6. **Analyze Results**: View detection statistics, confidence scores, and FPS metrics

## 🎮 AI-Powered Features

- ✅ **Real-time Object Detection** - YOLOv5-powered multi-object recognition
- ✅ **Live Video Streaming** - WebRTC peer-to-peer video transmission
- ✅ **Detection Overlays** - Bounding boxes with confidence scores
- ✅ **QR Code Session Joining** - Easy mobile device connection
- ✅ **Performance Metrics** - Real-time FPS and detection statistics
- ✅ **Mobile-Optimized Interface** - Responsive design for all devices
- ✅ **Camera Switching** - Front/back camera toggle support
- ✅ **Automatic Reconnection** - Robust connection handling
- ✅ **Session Management** - Secure temporary session handling
- ✅ **Multi-Object Support** - Detect multiple objects simultaneously
- ✅ **Configurable Thresholds** - Adjustable detection confidence levels
- ✅ **Export Detection Results** - Save detection data and statistics

## 🔒 Security & Privacy

- **HTTPS Required**: Camera access requires secure connection (except localhost)
- **Peer-to-Peer**: Video streams directly between devices (not through server)
- **AI Processing**: Detection runs on dedicated service, no data retention
- **Temporary Sessions**: Sessions are automatically cleaned up
- **No Recording**: No video data is stored on servers
- **Secure Detection**: Object detection data is processed in real-time only

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Python 3.8+
- Modern browser with WebRTC support
- HTTPS for production (camera access requirement)

### Local Development

1. Start detection service: `cd detection-service && python detection_server.py`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Visit `http://localhost:3000`

## 📋 Browser Support

- ✅ Chrome (Desktop & Mobile) - Full WebRTC + Detection support
- ✅ Firefox (Desktop & Mobile) - Full WebRTC + Detection support
- ✅ Safari (Desktop & Mobile) - WebRTC support with detection
- ✅ Edge (Desktop) - Full feature support
- ❌ Internet Explorer (not supported)

## 🐛 Troubleshooting

**Object Detection not working?**
- Ensure detection service is running on port 5000
- Check detection service health endpoint
- Verify model file (yolov5n.pt) is present
- Check detection service logs for errors

**Camera not working?**
- Ensure HTTPS connection in production
- Check browser permissions
- Try refreshing the page

**Connection issues?**
- Check network connectivity
- Verify environment variables are set correctly
- Check browser console for WebRTC errors

**QR code not scanning?**
- Ensure good lighting conditions
- Try manual URL entry
- Check if QR scanner app is working properly

**Poor detection performance?**
- Adjust detection threshold settings
- Check lighting conditions
- Ensure stable network connection
- Monitor detection service CPU/memory usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
