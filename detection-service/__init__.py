"""
Object Detection Service for WebRTC Video Streaming

This service provides real-time object detection using YOLOv5n model.
It processes video frames from WebRTC streams and returns detection results.

Features:
- Real-time object detection with YOLOv5n
- WebSocket communication for low-latency streaming
- REST API endpoints for testing
- Optimized for mobile video input (320x240 @ 10-15 FPS)
- Multi-session support
"""

import os
import sys

# Add parent directory to path for model access
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

print(f"Detection service directory: {current_dir}")
print(f"Parent directory: {parent_dir}")
print(f"Looking for model at: {os.path.join(parent_dir, 'yolov5n.pt')}")
