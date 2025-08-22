/**
 * Simple Detection Client for WebRTC Integration
 */

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

export interface DetectionResult {
  detections: Detection[];
  processing_time: number;
  fps: number;
  detection_count: number;
  session_id?: string;
  timestamp?: number;
  error?: string;
}

export class SimpleDetectionClient {
  private detectionServiceUrl: string;
  private enabled: boolean = false;
  private lastDetectionTime: number = 0;
  private detectionInterval: number = 200; // 5 FPS max

  constructor(url: string = 'http://localhost:5000') {
    this.detectionServiceUrl = url;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async processFrame(videoElement: HTMLVideoElement): Promise<DetectionResult | null> {
    if (!this.enabled) return null;

    // Throttle detection requests
    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionInterval) {
      return null;
    }

    try {
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set target size for processing (320x240)
      canvas.width = 320;
      canvas.height = 240;
      
      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      this.lastDetectionTime = now;

      // Send to detection service
      const response = await fetch(`${this.detectionServiceUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          timestamp: now
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Detection error:', error);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.detectionServiceUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const drawDetections = (
  canvas: HTMLCanvasElement,
  detections: Detection[],
  videoWidth: number,
  videoHeight: number
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx || !detections.length) return;

  // Clear previous drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Colors for different classes
  const colors = [
    '#00FF00', '#FF0000', '#0000FF', '#FFFF00', '#FF00FF',
    '#00FFFF', '#800080', '#FFA500', '#008000', '#808000'
  ];

  detections.forEach((detection) => {
    const { bbox, class_name, confidence, class_id } = detection;
    
    // Convert normalized coordinates to canvas coordinates
    const x1 = bbox.x1 * canvas.width;
    const y1 = bbox.y1 * canvas.height;
    const x2 = bbox.x2 * canvas.width;
    const y2 = bbox.y2 * canvas.height;
    
    // Choose color based on class_id
    const color = colors[class_id % colors.length];
    
    // Draw bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
    // Draw label and confidence
    const label = `${class_name} (${(confidence * 100).toFixed(1)}%)`;
    ctx.fillStyle = color;
    ctx.font = 'bold 16px Arial';
    
    // Calculate text size
    const textMetrics = ctx.measureText(label);
    
    // Draw text background
    ctx.fillRect(x1, y1 - 30, textMetrics.width + 10, 30);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.fillText(label, x1 + 5, y1 - 8);
  });
};
