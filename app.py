#!/usr/bin/env python3
"""
HealthSteg - Healthcare Steganography Backend
Python Flask API for AES encryption + LSB steganography
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
import os
import io
import base64
from PIL import Image
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import hashlib
import tempfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
MAX_FILE_SIZE = 10 * 1024 * 1024 

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

class HealthStegCrypto:
    """Healthcare Steganography Encryption/Decryption Class"""
    
    @staticmethod
    def derive_key(user_key: str) -> bytes:
        """Derive AES key from user input"""
        return hashlib.sha256(user_key.encode()).digest()[:16]
    
    @staticmethod
    def encrypt_message(msg: str, cipher_key: str) -> bytes:
        """Encrypt message using AES-CBC"""
        key = HealthStegCrypto.derive_key(cipher_key)
        cipher = AES.new(key, AES.MODE_CBC)
        ct = cipher.encrypt(pad(msg.encode(), AES.block_size))
        return cipher.iv + ct
    
    @staticmethod
    def decrypt_message(cipher_bytes: bytes, cipher_key: str) -> str:
        """Decrypt message using AES-CBC"""
        key = HealthStegCrypto.derive_key(cipher_key)
        iv = cipher_bytes[:16]
        ct = cipher_bytes[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(ct), AES.block_size).decode()
    
    @staticmethod
    def generate_embedding_pattern(stego_key: str, length: int) -> list:
        """Generate pseudo-random embedding pattern based on stego key"""
        pattern = []
        key_hash = hashlib.sha256(stego_key.encode()).hexdigest()
        
        for i in range(length):
            hash_subset = key_hash[(i * 2) % len(key_hash):((i * 2) + 8) % len(key_hash)]
            if len(hash_subset) < 8:
                hash_subset = hash_subset + key_hash[:8 - len(hash_subset)]
            
            n = int(hash_subset[:2], 16) % 100  
            m = int(hash_subset[2:4], 16) % 100  
            z = int(hash_subset[4:6], 16) % 3    
            
            pattern.append((n, m, z))
        
        return pattern

class HealthStegProcessor:
    """Main processor for steganography operations"""
    
    def __init__(self):
        self.crypto = HealthStegCrypto()
    
    def embed_data(self, image_path: str, text: str, cipher_key: str, stego_key: str) -> str:
        """Embed encrypted text into image using LSB steganography"""
        try:
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not load image")
            
            logger.info(f"Image shape: {img.shape}")
            
            encrypted_bytes = self.crypto.encrypt_message(text, cipher_key)
            logger.info(f"Encrypted data length: {len(encrypted_bytes)} bytes")
            
            pattern = self.crypto.generate_embedding_pattern(stego_key, len(encrypted_bytes))
            
            d = {chr(i): i for i in range(256)}
            
            height, width, channels = img.shape
            stego_key_chars = [ord(c) for c in stego_key]
            
            for i, byte_val in enumerate(encrypted_bytes):
                if i >= len(pattern):
                    break
                
                n_offset, m_offset, z_offset = pattern[i]
                
                n = (i + n_offset) % height
                m = (i + m_offset) % width
                z = z_offset
                
                key_char = stego_key_chars[i % len(stego_key_chars)]
                
                original_val = img[n, m, z]
                modified_val = byte_val ^ key_char
                
                modified_val = modified_val % 256
                img[n, m, z] = modified_val
                
                logger.debug(f"Embedded byte {i}: {byte_val} ^ {key_char} = {modified_val} at ({n},{m},{z})")
            
            output_path = os.path.join(OUTPUT_FOLDER, f'stego_{os.path.basename(image_path)}')
            cv2.imwrite(output_path, img)
            
            logger.info(f"Steganography complete. Output: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Embedding error: {str(e)}")
            raise
    
    def extract_data(self, image_path: str, cipher_key: str, stego_key: str, data_length: int = None) -> str:
        """Extract and decrypt hidden data from stego image"""
        try:
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not load stego image")
            
            height, width, channels = img.shape
            
            if data_length is None:
                data_length = min(1000, height * width // 10)  
            
            pattern = self.crypto.generate_embedding_pattern(stego_key, data_length)
            
            stego_key_chars = [ord(c) for c in stego_key]
            encrypted_back = bytearray()
            
            for i in range(data_length):
                if i >= len(pattern):
                    break
                
                n_offset, m_offset, z_offset = pattern[i]
                
                n = (i + n_offset) % height
                m = (i + m_offset) % width
                z = z_offset
                
                key_char = stego_key_chars[i % len(stego_key_chars)]
                extracted_val = img[n, m, z] ^ key_char
                
                encrypted_back.append(extracted_val)
            
            
            for possible_length in range(32, min(len(encrypted_back), 500), 16):
                try:
                    test_data = bytes(encrypted_back[:possible_length])
                    decrypted = self.crypto.decrypt_message(test_data, cipher_key)
                    if len(decrypted) > 0 and all(ord(c) < 128 for c in decrypted):
                        logger.info(f"Successfully extracted {len(decrypted)} characters")
                        return decrypted
                except:
                    continue
            
            try:
                decrypted = self.crypto.decrypt_message(bytes(encrypted_back), cipher_key)
                return decrypted
            except Exception as e:
                logger.error(f"Decryption failed: {str(e)}")
                raise ValueError("Failed to decrypt extracted data. Check your keys.")
                
        except Exception as e:
            logger.error(f"Extraction error: {str(e)}")
            raise

processor = HealthStegProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'HealthSteg API'})

@app.route('/embed', methods=['POST'])
def embed_endpoint():
    """Embed encrypted text into image"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        text = request.form.get('text', '').strip()
        cipher_key = request.form.get('cipher_key', '').strip()
        stego_key = request.form.get('stego_key', '').strip()
        
        if not text:
            return jsonify({'error': 'Text to embed is required'}), 400
        if not cipher_key:
            return jsonify({'error': 'Cipher key is required'}), 400
        if not stego_key:
            return jsonify({'error': 'Stego key is required'}), 400
        
        allowed_extensions = {'.png', '.jpg', '.jpeg'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Only PNG and JPEG images are supported'}), 400
        
        filename = f"upload_{hash(file.filename + cipher_key)}.{file_ext[1:]}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        output_path = processor.embed_data(file_path, text, cipher_key, stego_key)
        
        with open(output_path, 'rb') as img_file:
            img_data = base64.b64encode(img_file.read()).decode()
        
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'Text successfully embedded',
            'preview_data': f"data:image/{file_ext[1:]};base64,{img_data}",
            'download_path': output_path,
            'filename': os.path.basename(output_path)
        })
        
    except Exception as e:
        logger.error(f"Embed endpoint error: {str(e)}")
        return jsonify({'error': f'Embedding failed: {str(e)}'}), 500

@app.route('/extract', methods=['POST'])
def extract_endpoint():
    """Extract and decrypt hidden text from stego image"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No stego image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No stego image file selected'}), 400
        
        cipher_key = request.form.get('cipher_key', '').strip()
        stego_key = request.form.get('stego_key', '').strip()
        
        if not cipher_key:
            return jsonify({'error': 'Cipher key is required'}), 400
        if not stego_key:
            return jsonify({'error': 'Stego key is required'}), 400
        
        allowed_extensions = {'.png', '.jpg', '.jpeg'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Only PNG and JPEG images are supported'}), 400
        
        filename = f"extract_{hash(file.filename + cipher_key)}.{file_ext[1:]}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        extracted_text = processor.extract_data(file_path, cipher_key, stego_key)
        
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'Data successfully extracted',
            'extracted_text': extracted_text
        })
        
    except Exception as e:
        logger.error(f"Extract endpoint error: {str(e)}")
        return jsonify({'error': f'Extraction failed: {str(e)}'}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download generated stego image"""
    try:
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, as_attachment=True, download_name=f"encrypted_{filename}")
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

@app.route('/cleanup', methods=['POST'])
def cleanup_files():
    """Clean up temporary files"""
    try:
        for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                if os.path.isfile(file_path):
                    file_age = os.path.getctime(file_path)
                    if file_age < (os.time.time() - 3600):  
                        os.remove(file_path)
        
        return jsonify({'success': True, 'message': 'Cleanup completed'})
        
    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}")
        return jsonify({'error': 'Cleanup failed'}), 500

if __name__ == '__main__':
    print("🏥 HealthSteg Backend Starting...")
    print("📡 API Endpoints:")
    print("   POST /embed    - Embed text into image")
    print("   POST /extract  - Extract text from stego image")
    print("   GET  /download/<filename> - Download stego image")
    print("   GET  /health   - Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
