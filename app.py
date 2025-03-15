import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "backend/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure upload directory exists
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def preprocess_image(image_path):
    """Convert image to grayscale and resize for consistency"""
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)  # Convert to grayscale
    image = cv2.resize(image, (400, 400))  # Resize to fixed size
    return image

def calculate_similarity(img1_path, img2_path):
    """Compute similarity using Structural Similarity Index (SSIM)"""
    img1 = preprocess_image(img1_path)
    img2 = preprocess_image(img2_path)
    
    # Compute SSIM
    score, _ = ssim(img1, img2, full=True)
    return round(score * 100, 2)  # Convert to percentage

@app.route("/process-handwriting", methods=["POST"])
def process_handwriting():
    print("\n✅ Received a request at /process-handwriting\n")  # ✅ Debugging

    if "sample" not in request.files or "handwriting" not in request.files:
        print("❌ Missing files!")  # ✅ Debugging
        return jsonify({"error": "Missing files"}), 400

    # Retrieve files
    sample_file = request.files["sample"]
    handwriting_file = request.files["handwriting"]

    # Save files
    sample_path = os.path.join(app.config["UPLOAD_FOLDER"], sample_file.filename)
    handwriting_path = os.path.join(app.config["UPLOAD_FOLDER"], handwriting_file.filename)
    sample_file.save(sample_path)
    handwriting_file.save(handwriting_path)

    print(f"📂 Files saved: {sample_path}, {handwriting_path}")  # ✅ Debugging

    # Calculate real handwriting similarity
    match_percentage = calculate_similarity(sample_path, handwriting_path)

    print(f"✅ Match Percentage: {match_percentage}%")  # ✅ Debugging
    return jsonify({"match": match_percentage})

if __name__ == "__main__":
    print("🚀 Starting Flask server...")
    app.run(debug=True)