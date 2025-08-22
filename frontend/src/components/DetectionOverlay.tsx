/**
 * Example integration of object detection with WebRTC streaming
 * Add this to your existing stream or viewer pages
 */

import { useEffect, useRef, useState } from 'react';
import DetectionServiceClient, { DetectionResult, Detection } from '../utils/detectionClient';

interface DetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  sessionId: string;
  enableDetection: boolean;
}

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  videoRef,
  sessionId,
  enableDetection
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionClientRef = useRef<DetectionServiceClient | null>(null);
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>('disconnected');
  const [fps, setFps] = useState<number>(0);

  // Initialize detection service client
  useEffect(() => {
    if (!enableDetection) return;

    const client = new DetectionServiceClient({
      url: process.env.NEXT_PUBLIC_DETECTION_SERVER_URL || 'http://localhost:5000', // Update this to your detection service URL
      enableDetection: true,
      detectionInterval: 100, // 10 FPS max
      confidenceThreshold: 0.3
    });

    detectionClientRef.current = client;

    // Set up callbacks
    client.onStatusChange((status) => {
      setDetectionStatus(status);
      console.log('Detection service status:', status);
    });

    client.onDetection((results) => {
      setDetectionResults(results);
      setFps(results.fps);
      
      // Draw detections on canvas overlay
      if (canvasRef.current && videoRef.current) {
        drawDetectionsOnCanvas(results.detections);
      }
    });

    // Connect and join session
    client.connect()
      .then(() => client.joinSession(sessionId))
      .catch((error) => {
        console.error('Failed to connect to detection service:', error);
      });

    return () => {
      client.disconnect();
    };
  }, [sessionId, enableDetection]);

  // Process video frames for detection
  useEffect(() => {
    if (!enableDetection || !detectionClientRef.current || !videoRef.current) return;

    let animationFrame: number;
    let lastProcessTime = 0;
    const processInterval = 200; // Process every 200ms (5 FPS)

    const processFrame = () => {
      const now = Date.now();
      if (now - lastProcessTime >= processInterval && videoRef.current) {
        lastProcessTime = now;
        
        detectionClientRef.current?.processFrame(videoRef.current)
          .catch((error) => {
            // Ignore throttle errors and timeouts
            if (!error.message.includes('throttled') && !error.message.includes('timeout')) {
              console.warn('Detection processing error:', error);
            }
          });
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
  }, [enableDetection, videoRef]);

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
      updateCanvasSize(); // Initial size
    }

    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', updateCanvasSize);
        video.removeEventListener('resize', updateCanvasSize);
      }
    };
  }, [videoRef]);

  const drawDetectionsOnCanvas = (detections: Detection[]) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each detection
    detections.forEach((detection) => {
      const { bbox, class_name, confidence, class_id } = detection;
      
      // Convert normalized coordinates to canvas coordinates
      const x1 = bbox.x1 * canvas.width;
      const y1 = bbox.y1 * canvas.height;
      const x2 = bbox.x2 * canvas.width;
      const y2 = bbox.y2 * canvas.height;
      
      // Color based on class
      const colors = [
        '#00FF00', '#FF0000', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#800080', '#FFA500', '#008000', '#808000'
      ];
      const color = colors[class_id % colors.length];
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      // Draw label
      const label = `${class_name} (${(confidence * 100).toFixed(1)}%)`;
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Arial';
      
      // Background for text
      const textMetrics = ctx.measureText(label);
      ctx.fillRect(x1, y1 - 25, textMetrics.width + 10, 25);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.fillText(label, x1 + 5, y1 - 8);
    });
  };

  if (!enableDetection) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 20
        }}
      >
        <div>Detection: {detectionStatus}</div>
        <div>FPS: {fps.toFixed(1)}</div>
        <div>Objects: {detectionResults?.detection_count || 0}</div>
        {detectionResults && detectionResults.detections.length > 0 && (
          <div style={{ marginTop: '5px', maxWidth: '200px' }}>
            {detectionResults.detections.slice(0, 3).map((detection, i) => (
              <div key={i} style={{ fontSize: '10px' }}>
                {detection.class_name} ({(detection.confidence * 100).toFixed(0)}%)
              </div>
            ))}
            {detectionResults.detections.length > 3 && (
              <div style={{ fontSize: '10px' }}>
                +{detectionResults.detections.length - 3} more...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Example usage in your existing stream page
export const ExampleStreamPageWithDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enableDetection, setEnableDetection] = useState(false);
  const sessionId = "your-session-id"; // Get this from your routing

  return (
    <div style={{ position: 'relative' }}>
      {/* Your existing video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', maxWidth: '640px' }}
      />
      
      {/* Detection overlay */}
      <DetectionOverlay
        videoRef={videoRef}
        sessionId={sessionId}
        enableDetection={enableDetection}
      />
      
      {/* Control buttons */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setEnableDetection(!enableDetection)}
          style={{
            padding: '10px 20px',
            backgroundColor: enableDetection ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {enableDetection ? 'Disable Detection' : 'Enable Detection'}
        </button>
      </div>
    </div>
  );
};

export default DetectionOverlay;
