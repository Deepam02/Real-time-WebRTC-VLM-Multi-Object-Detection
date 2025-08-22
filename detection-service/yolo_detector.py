import cv2
import torch
import numpy as np
from ultralytics import YOLO
import base64
from io import BytesIO
from PIL import Image
import json
import time

class YOLODetector:
    def __init__(self, model_path, conf_threshold=0.25, target_size=(320, 240), target_fps=15):
        """
        Initialize YOLO detector with quantized model
        
        Args:
            model_path: Path to YOLOv5n.pt model
            conf_threshold: Confidence threshold for detections
            target_size: Target processing size (width, height)
            target_fps: Target processing FPS
        """
        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self.target_size = target_size
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps
        
        # Load YOLOv5n model
        print(f"Loading YOLOv5n model from {model_path}...")
        self.model = YOLO(model_path)
        
        # Set model to evaluation mode and optimize for inference
        self.model.model.eval()
        
        # COCO class names
        self.class_names = [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
            'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
            'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
            'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
            'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
            'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
            'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
            'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
            'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
            'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
            'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
            'toothbrush'
        ]
        
        print(f"Model loaded successfully! Target processing: {target_size[0]}x{target_size[1]} @ {target_fps} FPS")
        
    def preprocess_image(self, image):
        """
        Preprocess image for YOLO detection
        
        Args:
            image: Input image (PIL Image or numpy array)
            
        Returns:
            Preprocessed image
        """
        if isinstance(image, np.ndarray):
            # Convert BGR to RGB if needed
            if len(image.shape) == 3 and image.shape[2] == 3:
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(image)
        
        # Resize to target size while maintaining aspect ratio
        image = image.resize(self.target_size, Image.Resampling.LANCZOS)
        return image
    
    def detect_objects(self, image):
        """
        Detect objects in image using YOLOv5n
        
        Args:
            image: Input image (PIL Image, numpy array, or base64 string)
            
        Returns:
            Dictionary containing detection results
        """
        start_time = time.time()
        
        # Handle different input types
        if isinstance(image, str):
            # Base64 encoded image
            image_data = base64.b64decode(image.split(',')[-1])
            image = Image.open(BytesIO(image_data))
        elif isinstance(image, np.ndarray):
            image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        # Preprocess image
        processed_image = self.preprocess_image(image)
        
        # Run inference
        results = self.model(processed_image, conf=self.conf_threshold, verbose=False)
        
        # Process results
        detections = []
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            
            for i in range(len(boxes)):
                # Get box coordinates (normalized)
                box = boxes.xyxy[i].cpu().numpy()
                conf = boxes.conf[i].cpu().numpy()
                cls = int(boxes.cls[i].cpu().numpy())
                
                # Convert coordinates to original image scale
                x1, y1, x2, y2 = box
                
                # Normalize coordinates to 0-1 range
                img_width, img_height = processed_image.size
                x1_norm = float(x1 / img_width)
                y1_norm = float(y1 / img_height)
                x2_norm = float(x2 / img_width)
                y2_norm = float(y2 / img_height)
                
                detection = {
                    'class_id': cls,
                    'class_name': self.class_names[cls] if cls < len(self.class_names) else f'class_{cls}',
                    'confidence': float(conf),
                    'bbox': {
                        'x1': x1_norm,
                        'y1': y1_norm,
                        'x2': x2_norm,
                        'y2': y2_norm,
                        'width': x2_norm - x1_norm,
                        'height': y2_norm - y1_norm
                    }
                }
                detections.append(detection)
        
        processing_time = time.time() - start_time
        fps = 1.0 / processing_time if processing_time > 0 else 0
        
        return {
            'detections': detections,
            'processing_time': processing_time,
            'fps': fps,
            'image_size': {
                'width': processed_image.size[0],
                'height': processed_image.size[1]
            },
            'detection_count': len(detections)
        }
    
    def draw_detections(self, image, detections, draw_labels=True, draw_confidence=True):
        """
        Draw detection boxes on image
        
        Args:
            image: PIL Image
            detections: List of detection dictionaries
            draw_labels: Whether to draw class labels
            draw_confidence: Whether to draw confidence scores
            
        Returns:
            PIL Image with drawn detections
        """
        # Convert PIL to OpenCV format
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        height, width = cv_image.shape[:2]
        
        # Colors for different classes (BGR format)
        colors = [
            (0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255),
            (0, 255, 255), (128, 0, 128), (255, 165, 0), (0, 128, 0), (128, 128, 0)
        ]
        
        for detection in detections:
            bbox = detection['bbox']
            class_name = detection['class_name']
            confidence = detection['confidence']
            class_id = detection['class_id']
            
            # Convert normalized coordinates to pixel coordinates
            x1 = int(bbox['x1'] * width)
            y1 = int(bbox['y1'] * height)
            x2 = int(bbox['x2'] * width)
            y2 = int(bbox['y2'] * height)
            
            # Choose color based on class_id
            color = colors[class_id % len(colors)]
            
            # Draw bounding box
            cv2.rectangle(cv_image, (x1, y1), (x2, y2), color, 2)
            
            # Draw label and confidence
            if draw_labels or draw_confidence:
                label = ""
                if draw_labels:
                    label += class_name
                if draw_confidence:
                    if label:
                        label += f" ({confidence:.2f})"
                    else:
                        label = f"{confidence:.2f}"
                
                # Calculate text size
                font_scale = 0.5
                font_thickness = 1
                (text_width, text_height), baseline = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness
                )
                
                # Draw text background
                cv2.rectangle(
                    cv_image,
                    (x1, y1 - text_height - baseline - 5),
                    (x1 + text_width, y1),
                    color,
                    -1
                )
                
                # Draw text
                cv2.putText(
                    cv_image, label,
                    (x1, y1 - baseline - 2),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, (255, 255, 255), font_thickness
                )
        
        # Convert back to PIL
        return Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))

if __name__ == "__main__":
    # Test the detector
    import sys
    import os
    
    # Add parent directory to path to access the model
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    
    model_path = "../yolov5n.pt"
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}")
        sys.exit(1)
    
    detector = YOLODetector(model_path)
    print("YOLOv5n detector initialized successfully!")
    print(f"Target processing: {detector.target_size[0]}x{detector.target_size[1]} @ {detector.target_fps} FPS")
