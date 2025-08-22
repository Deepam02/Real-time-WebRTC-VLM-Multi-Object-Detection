'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function StreamPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [status, setStatus] = useState('initializing');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const init = async () => {
      // Setup WebSocket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to signaling server');
        newSocket.emit('join-session', { sessionId, role: 'streamer' });
        setStatus('connected');
      });

      newSocket.on('answer', async (data) => {
        console.log('Received answer from viewer');
        const pc = peerConnectionRef.current;
        if (pc && data.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      newSocket.on('ice-candidate', async (data) => {
        console.log('Received ICE candidate');
        const pc = peerConnectionRef.current;
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      newSocket.on('viewer-disconnected', () => {
        console.log('Viewer disconnected');
        setStatus('connected');
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setStatus('error');
      });
    };

    init();

    return () => {
      stopStreaming();
      if (socket) {
        socket.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [sessionId]);

  const startStreaming = async () => {
    try {
      setStatus('requesting_permission');
      
      // Get camera stream with better constraints for mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup WebRTC peer connection
      await setupPeerConnection(stream);
      
      setIsStreaming(true);
      setStatus('streaming');
      
    } catch (error) {
      console.error('Error starting stream:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setStatus('permission_denied');
        } else if (error.name === 'NotFoundError') {
          setStatus('no_camera');
        } else {
          setStatus('error');
        }
      } else {
        setStatus('error');
      }
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsStreaming(false);
    setStatus('connected');
  };

  const setupPeerConnection = async (stream: MediaStream) => {
    if (!socket) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add stream to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          sessionId
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };

    peerConnectionRef.current = pc;

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('offer', {
      offer: pc.localDescription,
      sessionId
    });
  };

  const switchCamera = async () => {
    if (!streamRef.current) return;

    try {
      // Get current video track
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const currentFacingMode = videoTrack.getSettings().facingMode;
      
      // Switch between front and back camera
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      // Stop current stream
      streamRef.current.getTracks().forEach(track => track.stop());
      
      // Get new stream with switched camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      });

      streamRef.current = newStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Update peer connection with new stream
      if (peerConnectionRef.current) {
        // Remove old tracks
        const senders = peerConnectionRef.current.getSenders();
        for (const sender of senders) {
          peerConnectionRef.current.removeTrack(sender);
        }
        
        // Add new tracks
        newStream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, newStream);
        });

        // Create new offer with updated stream
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        
        if (socket) {
          socket.emit('offer', {
            offer: peerConnectionRef.current.localDescription,
            sessionId
          });
        }
      }
      
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'initializing':
        return 'Initializing AI detection session...';
      case 'connected':
        return 'Connected! Tap "Start AI Detection Stream" to begin object detection.';
      case 'requesting_permission':
        return 'Requesting camera permission for AI detection...';
      case 'streaming':
        return 'AI Detection active! Keep this page open for real-time object detection.';
      case 'permission_denied':
        return 'Camera permission denied. AI detection requires camera access. Please allow and refresh.';
      case 'no_camera':
        return 'No camera found. AI detection requires camera access.';
      case 'error':
        return 'Connection error. Please refresh and try again.';
      default:
        return 'Unknown status';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'streaming':
        return 'status connected';
      case 'permission_denied':
      case 'no_camera':
      case 'error':
        return 'status error';
      default:
        return 'status waiting';
    }
  };

  return (
    <div className="card">
      <h1 className="title">📱🤖 AI Detection Camera</h1>
      <p className="subtitle">Session: {sessionId}</p>

      <div className={getStatusClass()}>
        {getStatusMessage()}
      </div>

      <div className="video-container">
        {isStreaming ? (
          <video
            ref={videoRef}
            className="video"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="video-placeholder">
            🎯 AI Detection Camera will appear here when streaming
          </div>
        )}
        
        {isStreaming && (
          <div className="controls">
            <button className="button" onClick={switchCamera} style={{ marginRight: '10px' }}>
              🔄 Switch Camera
            </button>
            <button className="button" onClick={stopStreaming} style={{ background: '#dc3545' }}>
              ⏹️ Stop AI Stream
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        {!isStreaming && status === 'connected' && (
          <button className="button" onClick={startStreaming}>
            🎯 Start AI Detection Stream
          </button>
        )}
        
        {status === 'permission_denied' && (
          <button className="button" onClick={() => window.location.reload()}>
            🔄 Retry Camera Access
          </button>
        )}
      </div>

      <div className="instruction" style={{ marginTop: '20px' }}>
        <h3>🤖 AI Detection Instructions:</h3>
        <ul style={{ marginLeft: '20px', textAlign: 'left' }}>
          <li>Keep this page open while AI detection is active</li>
          <li>Use "Switch Camera" to toggle between front/back camera</li>
          <li>The viewer will see your camera feed with real-time object detection</li>
          <li>Point camera at objects for AI to detect and analyze</li>
          <li>Ensure good lighting for optimal detection accuracy</li>
          <li>Keep device steady for better detection performance</li>
        </ul>
      </div>
    </div>
  );
}
