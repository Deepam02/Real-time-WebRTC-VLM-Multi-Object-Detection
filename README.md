# 📱📺 WebRTC Camera Stream

A real-time camera streaming application that allows you to stream your phone's camera to a laptop browser using WebRTC technology.

## 🎯 How It Works

1. **Laptop (Viewer)** creates a session and displays a QR code
2. **Phone** scans the QR code and grants camera access
3. **WebRTC** establishes peer-to-peer connection for real-time streaming
4. **Live video** streams from phone to laptop browser

## 🏗️ Architecture

- **Frontend**: Next.js (React) - deployed on Vercel
- **Backend**: Node.js with Socket.IO - deployed on Render
- **WebRTC**: Peer-to-peer video streaming
- **Signaling**: WebSocket-based session management

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to start streaming!

## 📦 Project Structure

```
webrtc/
├── backend/           # Node.js signaling server
│   ├── server.js      # Main server file
│   ├── package.json   # Backend dependencies
│   └── README.md      # Backend documentation
├── frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/# React components
│   │   └── utils/     # Utility functions
│   ├── package.json   # Frontend dependencies
│   └── README.md      # Frontend documentation
└── README.md          # This file
```

## 🌐 Deployment

### Backend (Render)

1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable: `FRONTEND_URL=https://your-vercel-app.vercel.app`

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory to `frontend/`
3. Add environment variable: `NEXT_PUBLIC_SIGNALING_SERVER_URL=https://your-render-app.onrender.com`
4. Deploy!

## 🔧 Environment Variables

### Backend (.env)
```
PORT=3001
FRONTEND_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SIGNALING_SERVER_URL=https://your-render-app.onrender.com
```

## 📱 Usage

1. **Create Session**: Visit the web app and click "Start New Session"
2. **Scan QR Code**: Use your phone to scan the displayed QR code
3. **Grant Permissions**: Allow camera and microphone access on your phone
4. **Start Streaming**: Tap "Start Streaming" on your phone
5. **View Stream**: Watch the live video feed on your laptop!

## 🎮 Features

- ✅ Real-time video streaming
- ✅ QR code session joining
- ✅ Mobile-optimized interface
- ✅ Camera switching (front/back)
- ✅ Automatic reconnection
- ✅ Session management
- ✅ Responsive design

## 🔒 Security & Privacy

- **HTTPS Required**: Camera access requires secure connection (except localhost)
- **Peer-to-Peer**: Video streams directly between devices (not through server)
- **Temporary Sessions**: Sessions are automatically cleaned up
- **No Recording**: No video data is stored on servers

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Modern browser with WebRTC support
- HTTPS for production (camera access requirement)

### Local Development
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Visit `http://localhost:3000`

## 📋 Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop)
- ❌ Internet Explorer (not supported)

## 🐛 Troubleshooting

**Camera not working?**
- Ensure HTTPS connection in production
- Check browser permissions
- Try refreshing the page

**Connection issues?**
- Check network connectivity
- Verify environment variables
- Check browser console for errors

**QR code not scanning?**
- Ensure good lighting
- Try manual URL entry
- Check if QR scanner app is working

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
