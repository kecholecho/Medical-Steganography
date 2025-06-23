#!/usr/bin/env python3
"""
HealthSteg Backend Runner
Setup and run script for the Healthcare Steganography backend
"""

import subprocess
import sys
import os
import platform

def install_requirements():
    """Install required Python packages"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install dependencies: {e}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"Python 3.8+ required, but you have Python {version.major}.{version.minor}")
        return False
    
    print(f"Python {version.major}.{version.minor} detected")
    return True

def check_opencv():
    """Check if OpenCV can import properly"""
    try:
        import cv2
        print(f"OpenCV {cv2.__version__} ready")
        return True
    except ImportError:
        print("OpenCV not found. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python"])
            import cv2
            print(f"OpenCV {cv2.__version__} installed")
            return True
        except:
            print("Failed to install OpenCV")
            return False

def create_directories():
    """Create necessary directories"""
    dirs = ['uploads', 'outputs', 'temp']
    for dir_name in dirs:
        os.makedirs(dir_name, exist_ok=True)
        print(f"Created directory: {dir_name}")

def run_server():
    """Run the Flask backend server"""
    print("\nStarting HealthSteg Backend Server...")
    print("Backend will be available at: http://localhost:5000")
    print("Frontend should be opened in your browser")
    print("Keep this terminal open while using the application")
    print("\n" + "="*50)
    
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"\nServer error: {e}")

def main():
    """Main setup and run function"""
    print("HealthSteg - Healthcare Steganography Backend Setup")
    print("="*55)
    
    if not check_python_version():
        sys.exit(1)
    
    create_directories()
    
    if not os.path.exists('requirements.txt'):
        print("requirements.txt not found!")
        sys.exit(1)
    
    try:
        import flask
        import cv2
        from Crypto.Cipher import AES
        print("All dependencies already installed")
    except ImportError:
        if not install_requirements():
            sys.exit(1)
    
    if not check_opencv():
        sys.exit(1)
    
    print("\nSetup complete! Starting server...")
    run_server()

if __name__ == "__main__":
    main()
