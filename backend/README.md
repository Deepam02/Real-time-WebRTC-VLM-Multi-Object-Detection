# WebRTC Signaling Server

This is the backend signaling server for the WebRTC camera streaming application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Start production server:
```bash
npm start
```

## Deployment to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `FRONTEND_URL`: Your Vercel app URL (e.g., https://your-app.vercel.app)

## Environment Variables

- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend application URL for CORS
- `NODE_ENV`: Environment (development/production)

## API Endpoints

- `GET /health` - Health check
- `POST /session` - Create new session
- `GET /session/:sessionId` - Get session info

## Socket Events

- `join-session` - Join a session as viewer or streamer
- `offer` - WebRTC offer
- `answer` - WebRTC answer  
- `ice-candidate` - ICE candidate exchange
