const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ["http://localhost:3000", "https://your-app.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ["http://localhost:3000", "https://your-app.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// Store active sessions
const sessions = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', sessions: sessions.size });
});

// Create a new session
app.post('/session', (req, res) => {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    id: sessionId,
    createdAt: new Date(),
    viewer: null,
    streamer: null,
    status: 'waiting'
  });
  
  console.log(`Session created: ${sessionId}`);
  res.json({ sessionId });
});

// Get session info
app.get('/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ sessionId: session.id, status: session.status });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-session', ({ sessionId, role }) => {
    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }
    
    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.role = role;
    
    if (role === 'viewer') {
      session.viewer = socket.id;
      console.log(`Viewer joined session ${sessionId}`);
    } else if (role === 'streamer') {
      session.streamer = socket.id;
      session.status = 'connected';
      console.log(`Streamer joined session ${sessionId}`);
      
      // Notify viewer that streamer has connected
      if (session.viewer) {
        io.to(session.viewer).emit('streamer-connected');
      }
    }
  });
  
  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    const session = sessions.get(socket.sessionId);
    if (session && session.viewer && socket.role === 'streamer') {
      io.to(session.viewer).emit('offer', data);
      console.log(`Offer sent from streamer to viewer in session ${socket.sessionId}`);
    }
  });
  
  socket.on('answer', (data) => {
    const session = sessions.get(socket.sessionId);
    if (session && session.streamer && socket.role === 'viewer') {
      io.to(session.streamer).emit('answer', data);
      console.log(`Answer sent from viewer to streamer in session ${socket.sessionId}`);
    }
  });
  
  socket.on('ice-candidate', (data) => {
    const session = sessions.get(socket.sessionId);
    if (!session) return;
    
    const targetSocket = socket.role === 'viewer' ? session.streamer : session.viewer;
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', data);
      console.log(`ICE candidate relayed in session ${socket.sessionId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.sessionId) {
      const session = sessions.get(socket.sessionId);
      if (session) {
        if (session.viewer === socket.id) {
          session.viewer = null;
          if (session.streamer) {
            io.to(session.streamer).emit('viewer-disconnected');
          }
        } else if (session.streamer === socket.id) {
          session.streamer = null;
          session.status = 'waiting';
          if (session.viewer) {
            io.to(session.viewer).emit('streamer-disconnected');
          }
        }
        
        // Clean up empty sessions after 5 minutes
        if (!session.viewer && !session.streamer) {
          setTimeout(() => {
            if (sessions.has(socket.sessionId) && 
                !sessions.get(socket.sessionId).viewer && 
                !sessions.get(socket.sessionId).streamer) {
              sessions.delete(socket.sessionId);
              console.log(`Session ${socket.sessionId} cleaned up`);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
  });
});

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
