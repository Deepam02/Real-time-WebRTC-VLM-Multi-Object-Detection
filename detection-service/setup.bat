@echo off
echo ============================================
echo   Object Detection Service Setup
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+ first.
    echo    Download from: https://python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found!
python --version

echo.
echo 🔄 Setting up virtual environment...

REM Create virtual environment
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

echo.
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo 🔄 Upgrading pip...
python -m pip install --upgrade pip

echo.
echo 🔄 Installing PyTorch (CPU version for compatibility)...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo.
echo 🔄 Installing detection service dependencies...
pip install ultralytics opencv-python numpy pillow flask flask-cors python-socketio eventlet

echo.
echo 🔍 Checking if YOLOv5n model exists...
if exist "..\yolov5n.pt" (
    echo ✅ YOLOv5n model found at ..\yolov5n.pt
) else (
    echo ⚠️  YOLOv5n model not found!
    echo    Downloading YOLOv5n model...
    python -c "from ultralytics import YOLO; model = YOLO('yolov5n.pt'); model.save('../yolov5n.pt')"
    if errorlevel 1 (
        echo ❌ Failed to download model
    ) else (
        echo ✅ YOLOv5n model downloaded successfully
    )
)

echo.
echo 🧪 Testing the detector...
python test_detector.py

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start the detection service:
echo   1. cd detection-service
echo   2. venv\Scripts\activate.bat  (if not already activated)
echo   3. python detection_server.py
echo.
echo The service will run on http://localhost:5000
echo.
pause
