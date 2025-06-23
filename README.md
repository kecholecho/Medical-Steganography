# HealthSteg - Healthcare Steganography System

A secure medical data steganography solution that combines AES-256 encryption with LSB (Least Significant Bit) steganography to hide sensitive patient information inside medical images.

## Features

- **Dual-Key Security**: Separate cipher key (AES encryption) and stego key (embedding pattern)
- **AES-256 Encryption**: Military-grade encryption for patient data
- **LSB Steganography**: Invisible embedding in image pixels
- **Medical Image Support**: PNG and JPEG formats
- **HIPAA-Conscious Design**: Built for healthcare compliance
- **Real-time Preview**: View encrypted images before download

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Modern web browser
- Basic terminal/command prompt access

### Installation

1. **Clone or download the project files**
2. **Open terminal in the project directory**
3. **Run the setup script:**

```bash
python run_backend.py
```

This will automatically:

- Check Python version compatibility
- Install required dependencies
- Create necessary directories
- Start the backend server

4. **Open the frontend:**
   - Open `index.html` in your web browser
   - Or serve it from a local web server

## Project Structure

```
healthsteg/
├── app.py              # Flask backend API
├── script.js           # Frontend JavaScript
├── styles.css          # Frontend styles
├── index.html          # Main webpage
├── run_backend.py      # Setup and run script
├── uploads/           # Temporary upload storage
├── outputs/           # Generated stego images
└── README.md          # This file
```

## 🔧 Manual Setup (Alternative)

If the automatic setup doesn't work:

1. **Install Python dependencies:**

```bash
pip install -r requirements.txt
```

2. **Start the backend:**

```bash
python app.py
```

3. **Open frontend:**
   - Open `index.html` in your browser
   - Backend should be running on `http://localhost:5000`

## Usage

### Embedding Data

1. **Upload Medical Image**: Select a PNG or JPEG medical image
2. **Enter Text to Embed**: Patient information, diagnosis, etc.
3. **Enter Cipher Key**: For AES encryption (minimum 8 characters)
4. **Enter Stego Key**: For embedding pattern (minimum 8 characters)
5. **Click "Encrypt & Embed"**: Process the steganography
6. **Preview & Download**: View the result and download the stego image

### Extracting Data

1. **Upload Stego Image**: The image with embedded data
2. **Enter Cipher Key**: Same key used for embedding
3. **Enter Stego Key**: Same key used for embedding
4. **Click "Reveal Hidden Info"**: Extract and decrypt the data
5. **View Results**: See the extracted patient information

## Security Features

### AES-256 Encryption

- Advanced Encryption Standard with 256-bit keys
- CBC mode with random initialization vectors
- SHA-256 key derivation from user passwords

### LSB Steganography

- Least Significant Bit manipulation in image pixels
- Pseudo-random embedding pattern based on stego key
- XOR operation for additional security layer
- Preserves image visual quality

### Dual-Key Protection

- **Cipher Key**: Controls AES encryption/decryption
- **Stego Key**: Controls pixel embedding pattern
- Both keys required for data extraction
- Enhanced security even if one key is compromised

## Healthcare Compliance

- **Data Protection**: Sensitive information never stored permanently
- **Secure Processing**: All operations performed locally
- **Clean Vectors**: Automatic cleanup of temporary files
- **HIPAA Conscious**: Designed with healthcare regulations in mind

## API Endpoints

The backend provides these REST API endpoints:

- `POST /embed`: Embed encrypted text into image
- `POST /extract`: Extract and decrypt text from stego image
- `GET /download/<filename>`: Download generated stego image
- `GET /health`: Backend health check
- `POST /cleanup`: Clean temporary files

## Testing

Test the system with sample medical data:

```
Patient ID: MED-12345
Diagnosis: Mild fracture in left radius
Doctor: Dr. Sarah Johnson
Date: 2025-01-15
Notes: Patient responding well to treatment
Treatment: Rest and physical therapy
```

Use strong keys for testing:

- Cipher Key: `MedicalSecure2025!`
- Stego Key: `HiddenPattern$123`

## Important Notes

1. **Key Security**: Store encryption keys securely and separately
2. **Image Quality**: Larger images provide better embedding capacity
3. **Data Length**: Longer texts require larger images
4. **Production Use**: Consider additional security measures for production
5. **Backup**: Always backup original images before embedding

## Troubleshooting

### Backend Issues

- **Connection Error**: Ensure Python backend is running on port 5000
- **Dependencies**: Run `pip install -r requirements.txt`
- **OpenCV Issues**: Try `pip install opencv-python-headless`

### Frontend Issues

- **CORS Errors**: Serve HTML from local web server instead of file://
- **File Upload Fails**: Check image format (PNG/JPEG only)
- **Preview Issues**: Ensure backend is accessible

### Common Errors

- **"Extraction failed"**: Verify both keys match exactly
- **"Invalid image"**: Check file format and size
- **"Backend offline"**: Start Python server first

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify all setup steps were completed
3. Check browser console for error messages
4. Ensure Python backend is running properly

## License

This project is for educational and research purposes. Ensure compliance with local healthcare regulations when handling real patient data.

---

**Kesha Patel | Healthcare Security**
