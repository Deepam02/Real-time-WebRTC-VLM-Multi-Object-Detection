'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { io, Socket } from 'socket.io-client';
import { SimpleDetectionClient, DetectionResult, drawDetections } from '../../../utils/simpleDetectionClient';

export default function ViewerPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [status, setStatus] = useState('initializing');
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Detection states
  const [detectionEnabled, setDetectionEnabled] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>('disconnected');
  const [detectionFps, setDetectionFps] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const detectionClientRef = useRef<SimpleDetectionClient | null>(null);

  // Generate QR code and setup WebRTC
  useEffect(() => {
    if (!sessionId) return;

    // Initialize detection client
    detectionClientRef.current = new SimpleDetectionClient('http://localhost:5000');
    
    // Check detection service health
    detectionClientRef.current.checkHealth().then((healthy) => {
      setDetectionStatus(healthy ? 'ready' : 'unavailable');
    });

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

  // Detection processing loop
  useEffect(() => {
    if (!detectionEnabled || !videoRef.current || !canvasRef.current || !detectionClientRef.current) {
      return;
    }

    let animationFrame: number;
    let isProcessing = false;

    const processFrame = async () => {
      if (isProcessing || !videoRef.current || !canvasRef.current || !detectionClientRef.current) {
        animationFrame = requestAnimationFrame(processFrame);
        return;
      }

      isProcessing = true;
      
      try {
        const result = await detectionClientRef.current.processFrame(videoRef.current);
        
        if (result) {
          setDetectionResults(result);
          setDetectionFps(result.fps);
          
          // Draw detections on canvas overlay
          drawDetections(
            canvasRef.current,
            result.detections,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight
          );
        }
      } catch (error) {
        console.error('Detection processing error:', error);
      } finally {
        isProcessing = false;
      }

      animationFrame = requestAnimationFrame(processFrame);
    };

    // Start processing when video is playing
    const video = videoRef.current;
    const handleVideoPlay = () => {
      processFrame();
    };

    const handleVideoPause = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);

    // Start processing if video is already playing
    if (!video.paused) {
      processFrame();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
    };
  }, [detectionEnabled]);

  // Update canvas size to match video
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!canvasRef.current || !videoRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video display size
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', updateCanvasSize);
      video.addEventListener('resize', updateCanvasSize);
      
      // Update size when video starts playing
      const handleCanPlay = () => {
        updateCanvasSize();
      };
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('loadedmetadata', updateCanvasSize);
        video.removeEventListener('resize', updateCanvasSize);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [status]);

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

  const toggleDetection = () => {
    if (detectionStatus === 'unavailable') {
      alert('Detection service is not available. Please make sure it\'s running on http://localhost:5000');
      return;
    }
    
    const newEnabled = !detectionEnabled;
    setDetectionEnabled(newEnabled);
    
    if (detectionClientRef.current) {
      detectionClientRef.current.setEnabled(newEnabled);
    }

    // Clear canvas when disabling
    if (!newEnabled && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <div className="card">
      <h1 className="title">📺 Viewer</h1>
      <p className="subtitle">Session: {sessionId}</p>

      <div className={getStatusClass()}>
        {getStatusMessage()}
        {detectionStatus !== 'disconnected' && (
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            Detection Service: {detectionStatus === 'ready' ? '✅ Ready' : 
                             detectionStatus === 'unavailable' ? '❌ Unavailable' : 
                             '🔄 Checking...'}
          </div>
        )}
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

      <div className="video-container" style={{ position: 'relative', display: 'inline-block' }}>
        {status === 'streaming' ? (
          <>
            <video
              ref={videoRef}
              className="video"
              autoPlay
              playsInline
              muted
            />
            {/* Detection overlay canvas */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
            {/* Detection info panel */}
            {detectionEnabled && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  zIndex: 20,
                  minWidth: '150px'
                }}
              >
                <div>🤖 Detection: {detectionStatus}</div>
                <div>📊 FPS: {detectionFps.toFixed(1)}</div>
                <div>🎯 Objects: {detectionResults?.detection_count || 0}</div>
                {detectionResults && detectionResults.detections.length > 0 && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid #666', paddingTop: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Detected:</div>
                    {detectionResults.detections.slice(0, 3).map((detection, i) => (
                      <div key={i} style={{ fontSize: '11px', marginBottom: '2px' }}>
                        {detection.class_name} ({(detection.confidence * 100).toFixed(0)}%)
                      </div>
                    ))}
                    {detectionResults.detections.length > 3 && (
                      <div style={{ fontSize: '11px', color: '#aaa' }}>
                        +{detectionResults.detections.length - 3} more...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="video-placeholder">
            {status === 'waiting' && '📱 Scan QR code with your phone'}
            {status === 'connected' && '🔄 Setting up video...'}
            {status === 'initializing' && '⚙️ Initializing...'}
            {status === 'error' && '❌ Connection error'}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {/* Detection toggle button */}
        {status === 'streaming' && (
          <button
            onClick={toggleDetection}
            style={{
              padding: '12px 20px',
              backgroundColor: detectionEnabled ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: detectionStatus === 'unavailable' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: detectionStatus === 'unavailable' ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            disabled={detectionStatus === 'unavailable'}
          >
            {detectionEnabled ? '🚫 Disable Detection' : '🤖 Enable Detection'}
          </button>
        )}
        
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
