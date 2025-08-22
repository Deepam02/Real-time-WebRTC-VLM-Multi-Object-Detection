'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { io, Socket } from 'socket.io-client';

export default function ViewerPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [status, setStatus] = useState('initializing');
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Generate QR code and setup WebRTC
  useEffect(() => {
    if (!sessionId) return;

    const init = async () => {
      // Generate QR code for phone access
      const phoneUrl = `${window.location.origin}/stream/${sessionId}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(phoneUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }

      // Setup WebSocket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to signaling server');
        newSocket.emit('join-session', { sessionId, role: 'viewer' });
        setStatus('waiting');
      });

      newSocket.on('streamer-connected', () => {
        console.log('Streamer connected');
        setStatus('connected');
      });

      newSocket.on('offer', async (data) => {
        console.log('Received offer from streamer');
        if (!peerConnectionRef.current) {
          setupPeerConnection(newSocket);
        }

        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          newSocket.emit('answer', {
            answer: pc.localDescription,
            sessionId
          });
        }
      });

      newSocket.on('ice-candidate', async (data) => {
        console.log('Received ICE candidate');
        const pc = peerConnectionRef.current;
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      newSocket.on('streamer-disconnected', () => {
        console.log('Streamer disconnected');
        setStatus('waiting');
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setStatus('error');
      });
    };

    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [sessionId]);

  const setupPeerConnection = (socket: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          sessionId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream');
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('streaming');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('waiting');
      }
    };

    peerConnectionRef.current = pc;
  };

  const copyPhoneUrl = () => {
    const phoneUrl = `${window.location.origin}/stream/${sessionId}`;
    navigator.clipboard.writeText(phoneUrl);
    alert('Phone URL copied to clipboard!');
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'initializing':
        return 'Initializing session...';
      case 'waiting':
        return 'Waiting for phone to connect. Scan the QR code below with your phone.';
      case 'connected':
        return 'Phone connected. Setting up video stream...';
      case 'streaming':
        return 'Streaming live video from phone!';
      case 'error':
        return 'Connection error. Please refresh and try again.';
      default:
        return 'Unknown status';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'streaming':
      case 'connected':
        return 'status connected';
      case 'error':
        return 'status error';
      default:
        return 'status waiting';
    }
  };

  return (
    <div className="card">
      <h1 className="title">📺 Viewer</h1>
      <p className="subtitle">Session: {sessionId}</p>

      <div className={getStatusClass()}>
        {getStatusMessage()}
      </div>

      {status === 'waiting' && qrCodeUrl && (
        <div>
          <div className="qr-container">
            <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%' }} />
          </div>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Or manually enter this URL on your phone:
          </p>
          <input
            type="text"
            className="url-input"
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/stream/${sessionId}`}
            readOnly
          />
          <button className="button" onClick={copyPhoneUrl}>
            📋 Copy Phone URL
          </button>
        </div>
      )}

      <div className="video-container">
        {status === 'streaming' ? (
          <video
            ref={videoRef}
            className="video"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="video-placeholder">
            {status === 'waiting' && '📱 Scan QR code with your phone'}
            {status === 'connected' && '🔄 Setting up video...'}
            {status === 'initializing' && '⚙️ Initializing...'}
            {status === 'error' && '❌ Connection error'}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          className="button" 
          onClick={() => window.location.href = '/'}
          style={{ background: '#6c757d' }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
