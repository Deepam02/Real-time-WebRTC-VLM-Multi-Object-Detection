#!/bin/bash

echo "============================================"
echo "   Object Detection Service Setup"
echo "============================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python not found! Please install Python 3.8+ first."
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "✅ Python found!"
$PYTHON_CMD --version

echo
echo "🔄 Setting up virtual environment..."

# Create virtual environment
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo
echo "🔄 Activating virtual environment..."
source venv/bin/activate

echo
echo "🔄 Upgrading pip..."
python -m pip install --upgrade pip

echo
echo "🔄 Installing PyTorch (CPU version for compatibility)..."
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo
echo "🔄 Installing detection service dependencies..."
pip install ultralytics opencv-python numpy pillow flask flask-cors python-socketio eventlet

echo
echo "🔍 Checking if YOLOv5n model exists..."
if [ -f "../yolov5n.pt" ]; then
    echo "✅ YOLOv5n model found at ../yolov5n.pt"
else
    echo "⚠️  YOLOv5n model not found!"
    echo "    Downloading YOLOv5n model..."
    python -c "from ultralytics import YOLO; model = YOLO('yolov5n.pt'); model.save('../yolov5n.pt')"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to download model"
    else
        echo "✅ YOLOv5n model downloaded successfully"
    fi
fi

echo
echo "🧪 Testing the detector..."
python test_detector.py

echo
echo "============================================"
echo "   Setup Complete!"
echo "============================================"
echo
echo "To start the detection service:"
echo "   1. cd detection-service"
echo "   2. source venv/bin/activate  (if not already activated)"
echo "   3. python detection_server.py"
echo
echo "The service will run on http://localhost:5000"
echo
