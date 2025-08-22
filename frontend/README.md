# WebRTC Camera Stream - Frontend

This is the Next.js frontend for the WebRTC camera streaming application.

## Features

- **QR Code Generation**: Creates QR codes for easy phone access
- **Real-time Video Streaming**: WebRTC-based camera streaming
- **Mobile Optimized**: Responsive design for both desktop and mobile
- **Camera Controls**: Switch between front and back camera on mobile

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
# .env.local
NEXT_PUBLIC_SIGNALING_SERVER_URL=https://your-render-app.onrender.com
```

3. Run development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SIGNALING_SERVER_URL`: Your Render backend URL
3. Deploy!

## Pages

- `/` - Home page with session creation
- `/viewer/[sessionId]` - Viewer page with QR code and video display
- `/stream/[sessionId]` - Phone camera streaming page

## Environment Variables

- `NEXT_PUBLIC_SIGNALING_SERVER_URL`: Backend signaling server URL

## Browser Requirements

- Modern browsers with WebRTC support
- HTTPS required for camera access (except localhost)
- Mobile Safari, Chrome, Firefox supported
