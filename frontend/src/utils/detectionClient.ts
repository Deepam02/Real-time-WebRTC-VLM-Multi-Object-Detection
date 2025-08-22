/**
 * Detection Service Client
 * Integrates object detection with WebRTC video streaming
 */

import { io, Socket } from 'socket.io-client';

export interface DetectionResult {
  detections: Detection[];
  processing_time: number;
  fps: number;
  image_size: {
    width: number;
    height: number;
  };
  detection_count: number;
  session_id?: string;
  timestamp?: number;
  error?: string;
}

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
}

export interface DetectionServiceConfig {
  url?: string;
  autoConnect?: boolean;
  enableDetection?: boolean;
  detectionInterval?: number; // milliseconds between detections
  confidenceThreshold?: number;
}

export class DetectionServiceClient {
  private socket: Socket | null = null;
  private config: DetectionServiceConfig;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private lastDetectionTime: number = 0;
  private detectionCallbacks: ((results: DetectionResult) => void)[] = [];
  private statusCallbacks: ((status: string) => void)[] = [];

  constructor(config: DetectionServiceConfig = {}) {
    this.config = {
      url: config.url || 'http://localhost:5000',
      autoConnect: config.autoConnect ?? true,
      enableDetection: config.enableDetection ?? true,
      detectionInterval: config.detectionInterval || 100, // 10 FPS max
      confidenceThreshold: config.confidenceThreshold || 0.25,
      ...config
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the detection service
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        resolve();
        return;
      }

      try {
        this.socket = io(this.config.url!, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to detection service');
          this.isConnected = true;
          this.notifyStatus('connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from detection service');
          this.isConnected = false;
          this.notifyStatus('disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('Detection service connection error:', error);
          this.isConnected = false;
          this.notifyStatus('error');
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('Detection service error:', error);
          this.notifyStatus('error');
        });

        this.socket.on('detection_results', (results: DetectionResult) => {
          this.handleDetectionResults(results);
        });

        this.socket.on('joined_session', (data) => {
          console.log('Joined detection session:', data);
          this.notifyStatus('session_joined');
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the detection service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.sessionId = null;
      this.notifyStatus('disconnected');
    }
  }

  /**
   * Join a detection session
   */
  joinSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to detection service'));
        return;
      }

      this.sessionId = sessionId;
      
      const timeout = setTimeout(() => {
        reject(new Error('Join session timeout'));
      }, 5000);

      const onJoined = () => {
        clearTimeout(timeout);
        this.socket!.off('joined_session', onJoined);
        resolve();
      };

      this.socket.on('joined_session', onJoined);
      this.socket.emit('join_detection_session', { session_id: sessionId });
    });
  }

  /**
   * Process a video frame for object detection
   */
  processFrame(videoElement: HTMLVideoElement): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected || !this.sessionId) {
        reject(new Error('Not connected or no active session'));
        return;
      }

      if (!this.config.enableDetection) {
        reject(new Error('Detection is disabled'));
        return;
      }

      // Throttle detection requests
      const now = Date.now();
      if (now - this.lastDetectionTime < this.config.detectionInterval!) {
        reject(new Error('Detection throttled'));
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set target size for processing (320x240)
        canvas.width = 320;
        canvas.height = 240;
        
        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Send for processing
        const timestamp = now;
        this.lastDetectionTime = now;
        
        // Set up one-time listener for results
        const onResults = (results: DetectionResult) => {
          if (results.timestamp === timestamp || results.session_id === this.sessionId) {
            this.socket!.off('detection_results', onResults);
            resolve(results);
          }
        };
        
        this.socket.on('detection_results', onResults);
        
        this.socket.emit('process_frame', {
          session_id: this.sessionId,
          image: imageData,
          timestamp: timestamp
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          this.socket!.off('detection_results', onResults);
          reject(new Error('Detection timeout'));
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add callback for detection results
   */
  onDetection(callback: (results: DetectionResult) => void): void {
    this.detectionCallbacks.push(callback);
  }

  /**
   * Add callback for status changes
   */
  onStatusChange(callback: (status: string) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Remove detection callback
   */
  removeDetectionCallback(callback: (results: DetectionResult) => void): void {
    const index = this.detectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.detectionCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove status callback
   */
  removeStatusCallback(callback: (status: string) => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    sessionId: string | null;
    serviceUrl: string;
  } {
    return {
      connected: this.isConnected,
      sessionId: this.sessionId,
      serviceUrl: this.config.url!
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DetectionServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private handleDetectionResults(results: DetectionResult): void {
    // Filter detections by confidence threshold
    if (results.detections) {
      results.detections = results.detections.filter(
        detection => detection.confidence >= this.config.confidenceThreshold!
      );
      results.detection_count = results.detections.length;
    }

    // Notify all callbacks
    this.detectionCallbacks.forEach(callback => {
      try {
        callback(results);
      } catch (error) {
        console.error('Error in detection callback:', error);
      }
    });
  }

  private notifyStatus(status: string): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }
}

// Utility functions
export const drawDetections = (
  canvas: HTMLCanvasElement,
  detections: Detection[],
  options: {
    drawLabels?: boolean;
    drawConfidence?: boolean;
    colors?: string[];
  } = {}
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { drawLabels = true, drawConfidence = true, colors = [
    '#00FF00', '#FF0000', '#0000FF', '#FFFF00', '#FF00FF',
    '#00FFFF', '#800080', '#FFA500', '#008000', '#808000'
  ] } = options;

  detections.forEach((detection, index) => {
    const { bbox, class_name, confidence, class_id } = detection;
    
    // Convert normalized coordinates to canvas coordinates
    const x1 = bbox.x1 * canvas.width;
    const y1 = bbox.y1 * canvas.height;
    const x2 = bbox.x2 * canvas.width;
    const y2 = bbox.y2 * canvas.height;
    
    // Choose color
    const color = colors[class_id % colors.length];
    
    // Draw bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
    // Draw label and confidence
    if (drawLabels || drawConfidence) {
      let label = '';
      if (drawLabels) label += class_name;
      if (drawConfidence) label += ` (${(confidence * 100).toFixed(1)}%)`;
      
      if (label) {
        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        
        // Background for text
        const textMetrics = ctx.measureText(label);
        ctx.fillRect(x1, y1 - 20, textMetrics.width + 10, 20);
        
        // Text
        ctx.fillStyle = 'white';
        ctx.fillText(label, x1 + 5, y1 - 5);
      }
    }
  });
};

export default DetectionServiceClient;
