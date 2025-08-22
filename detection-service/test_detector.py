"""
Test script for YOLO detector
"""

import os
import sys
import cv2
import numpy as np
from PIL import Image
import base64
from io import BytesIO

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from yolo_detector import YOLODetector

def create_test_image():
    """Create a simple test image"""
    # Create a test image with some shapes
    img = np.ones((240, 320, 3), dtype=np.uint8) * 255
    
    # Draw some colored rectangles to simulate objects
    cv2.rectangle(img, (50, 50), (150, 150), (255, 0, 0), -1)  # Blue rectangle
    cv2.rectangle(img, (200, 100), (300, 200), (0, 255, 0), -1)  # Green rectangle
    cv2.circle(img, (160, 120), 30, (0, 0, 255), -1)  # Red circle
    
    return img

def image_to_base64(image):
    """Convert image to base64 string"""
    if isinstance(image, np.ndarray):
        image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    buffer = BytesIO()
    image.save(buffer, format='JPEG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/jpeg;base64,{img_str}"

def test_detector():
    """Test the YOLO detector"""
    model_path = "../yolov5n.pt"
    
    if not os.path.exists(model_path):
        print(f"❌ Model not found at {model_path}")
        print("Please ensure yolov5n.pt is in the root directory")
        return False
    
    try:
        print("🔄 Initializing YOLOv5n detector...")
        detector = YOLODetector(model_path)
        print("✅ Detector initialized successfully!")
        
        # Create test image
        print("🔄 Creating test image...")
        test_img = create_test_image()
        
        # Test with numpy array
        print("🔄 Testing detection with numpy array...")
        results = detector.detect_objects(test_img)
        print(f"✅ Detection completed!")
        print(f"   - Processing time: {results['processing_time']:.3f}s")
        print(f"   - FPS: {results['fps']:.1f}")
        print(f"   - Detections: {results['detection_count']}")
        
        for i, detection in enumerate(results['detections'][:5]):  # Show first 5
            print(f"   - Object {i+1}: {detection['class_name']} (conf: {detection['confidence']:.2f})")
        
        # Test with base64 string
        print("🔄 Testing detection with base64 image...")
        base64_img = image_to_base64(test_img)
        results2 = detector.detect_objects(base64_img)
        print(f"✅ Base64 detection completed!")
        print(f"   - Processing time: {results2['processing_time']:.3f}s")
        print(f"   - FPS: {results2['fps']:.1f}")
        print(f"   - Detections: {results2['detection_count']}")
        
        # Test drawing detections
        print("🔄 Testing detection drawing...")
        pil_img = Image.fromarray(cv2.cvtColor(test_img, cv2.COLOR_BGR2RGB))
        drawn_img = detector.draw_detections(pil_img, results['detections'])
        print("✅ Detection drawing completed!")
        
        # Save test results
        output_path = os.path.join(current_dir, "test_output.jpg")
        drawn_img.save(output_path)
        print(f"💾 Test output saved to: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing detector: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting YOLO detector test...")
    print("=" * 50)
    
    success = test_detector()
    
    print("=" * 50)
    if success:
        print("✅ All tests passed! Detector is working correctly.")
    else:
        print("❌ Tests failed. Please check the error messages above.")
