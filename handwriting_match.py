import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
import tensorflow as tf
import os

_siamese_model = None

def get_siamese_model():
    """
    Lazy-load the Siamese feature extractor using a cached MobileNetV2 base model.
    """
    global _siamese_model
    if _siamese_model is None:
        # Load local MobileNetV2 weights (dim 224x224x3) without top classification layers
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=False,
            weights='imagenet'
        )
        inputs = tf.keras.Input(shape=(224, 224, 3))
        x = base_model(inputs)
        outputs = tf.keras.layers.GlobalAveragePooling2D()(x)
        _siamese_model = tf.keras.Model(inputs, outputs)
    return _siamese_model

def deskew(img):
    """
    Detect text skew angle and rotate the image back to horizontal.
    """
    # Threshold to isolate ink pixels
    _, thresh = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) == 0:
        return img
    
    # Calculate min area rectangle bounding all text
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Rotate only if skew is significant (> 0.5 degrees)
    if abs(angle) > 0.5:
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated
    return img

def enhance_image(img_gray):
    """
    Stage-by-stage Smart Image Enhancement:
    1. Denoising: bilateral filter to preserve ink edges
    2. Rotation Correction: alignment using deskew angle
    3. Contrast: CLAHE
    4. Binarization: Otsu's adaptive thresholding
    5. Clean strokes: Morphological closing and outlines
    Returns a clean black-text-on-white-background binary image.
    """
    if img_gray is None:
        return None
    
    # 1. Denoise
    denoised = cv2.bilateralFilter(img_gray, 9, 75, 75)
    
    # 2. Deskew
    rotated = deskew(denoised)
    
    # 3. Contrast adjustment
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(rotated)
    
    # 4. Adaptive thresholding (extract text)
    _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # 5. Clean strokes using morphological close
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Return inverted binary (black ink on solid white background)
    return cv2.bitwise_not(cleaned)

def preprocess_image_cropped(img, size=(256, 256)):
    """
    Crop to the bounding box of the ink mask.
    Input image is expected to be inverse binary (white bg, black text).
    """
    thresh = cv2.bitwise_not(img)
    pts = cv2.findNonZero(thresh)
    if pts is not None:
        x, y, w, h = cv2.boundingRect(pts)
        margin = 5
        h_img, w_img = img.shape
        x1 = max(0, x - margin)
        y1 = max(0, y - margin)
        x2 = min(w_img, x + w + margin)
        y2 = min(h_img, y + h + margin)
        cropped = img[y1:y2, x1:x2]
    else:
        cropped = img
    return cv2.resize(cropped, size)

def calculate_stroke_style(img):
    """
    Extract Sobel edge orientation histograms to describe stroke direction styles.
    """
    img_resized = cv2.resize(img, (256, 256))
    sobelx = cv2.Sobel(img_resized, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(img_resized, cv2.CV_64F, 0, 1, ksize=3)
    
    magnitude = np.sqrt(sobelx**2 + sobely**2)
    angles = np.arctan2(sobely, sobelx) * 180 / np.pi
    angles = np.mod(angles, 180) # 0-180 degrees
    
    thresh_mag = 0.1 * np.max(magnitude) if np.max(magnitude) > 0 else 1.0
    valid_angles = angles[magnitude > thresh_mag]
    
    if len(valid_angles) == 0:
        return np.ones(18) / 18.0
        
    hist, _ = np.histogram(valid_angles, bins=18, range=(0, 180), density=True)
    norm = np.linalg.norm(hist)
    return hist / (norm if norm > 0 else 1.0)

def calculate_character_spacing(img):
    """
    Calculate vertical projections to measure character spacing distributions.
    """
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    profile = np.sum(thresh, axis=0)
    threshold_val = 0.01 * np.max(profile) if np.max(profile) > 0 else 1.0
    gaps = profile < threshold_val
    
    gap_lengths = []
    current_gap = 0
    for val in gaps:
        if val:
            current_gap += 1
        else:
            if current_gap > 0:
                gap_lengths.append(current_gap)
                current_gap = 0
    if current_gap > 0:
        gap_lengths.append(current_gap)
        
    if len(gap_lengths) == 0:
        return 0.0, 0.0
    return float(np.mean(gap_lengths)), float(np.std(gap_lengths) if len(gap_lengths) > 1 else 0.0)

def calculate_component_aspect_ratios(img):
    """
    Measure average aspect ratios (width/height) of connected ink blobs.
    """
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh)
    ratios = []
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        
        # Filter out noise blobs or global boundary containers
        if area > 15 and w < img.shape[1] * 0.9 and h < img.shape[0] * 0.9:
            ratios.append(float(w) / float(h))
            
    if len(ratios) == 0:
        return 1.0, 0.0
    return float(np.mean(ratios)), float(np.std(ratios) if len(ratios) > 1 else 0.0)

def calculate_stroke_jitter(img):
    """
    Measure tremor/shakiness of contours as deviation from a smoothed outline.
    """
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if len(contours) == 0:
        return 0.0
        
    large_contours = sorted(contours, key=cv2.contourArea, reverse=True)
    main_contour = large_contours[0]
    pts = main_contour.reshape(-1, 2)
    if len(pts) < 10:
        return 0.0
        
    window = 5
    smoothed_pts = np.zeros_like(pts)
    for i in range(len(pts)):
        indices = np.arange(i - window // 2, i + window // 2 + 1) % len(pts)
        smoothed_pts[i] = np.mean(pts[indices], axis=0)
        
    deviations = np.linalg.norm(pts - smoothed_pts, axis=1)
    return float(np.mean(deviations))

def match_handwriting(sample_path, handwriting_path, mode="handwriting"):
    """
    Main entry point for handwriting or signature specimen comparison.
    Uses a hybrid Deep Learning Siamese model + handcrafted stylometrics:
    - stroke style
    - character spacing (if handwriting mode)
    - writing style (slant + aspect ratio)
    Also runs stroke contour tremor checks to detect genuine vs simulated/traced forgery.
    """
    g1 = cv2.imread(sample_path, cv2.IMREAD_GRAYSCALE)
    g2 = cv2.imread(handwriting_path, cv2.IMREAD_GRAYSCALE)
    
    if g1 is None or g2 is None:
        return {"error": "Failed to read image files."}
        
    # Apply Smart Enhancement
    e1 = enhance_image(g1)
    e2 = enhance_image(g2)
    
    # 1. Deep Feature Embedding Similarity (MobileNetV2 Siamese Extractor)
    model = get_siamese_model()
    rgb1 = cv2.cvtColor(e1, cv2.COLOR_GRAY2RGB)
    rgb2 = cv2.cvtColor(e2, cv2.COLOR_GRAY2RGB)
    rgb1 = cv2.resize(rgb1, (224, 224))
    rgb2 = cv2.resize(rgb2, (224, 224))
    
    input1 = tf.keras.applications.mobilenet_v2.preprocess_input(rgb1)
    input2 = tf.keras.applications.mobilenet_v2.preprocess_input(rgb2)
    batch = np.array([input1, input2])
    embeddings = model.predict(batch)
    
    emb1, emb2 = embeddings[0], embeddings[1]
    cosine_sim = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    # Scale cosine similarity [0.95, 1.00] -> [0.0, 100.0]
    deep_sim = float((cosine_sim - 0.95) / (1.0 - 0.95) * 100.0)
    deep_sim = float(round(max(0.0, min(100.0, deep_sim)), 2))
    
    # 2. Stroke Similarity (Sobel angle orientations + ORB keypoint descriptor matching)
    hist1 = calculate_stroke_style(e1)
    hist2 = calculate_stroke_style(e2)
    edge_sim = np.dot(hist1, hist2) / (np.linalg.norm(hist1) * np.linalg.norm(hist2))
    edge_sim = max(0.0, min(1.0, edge_sim)) * 100.0
    
    orb = cv2.ORB_create(nfeatures=1000)
    kp1, desc1 = orb.detectAndCompute(e1, None)
    kp2, desc2 = orb.detectAndCompute(e2, None)
    orb_percentage = 0.0
    if desc1 is not None and desc2 is not None:
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = matcher.match(desc1, desc2)
        total_kps = max(len(kp1), len(kp2))
        if total_kps > 0:
            orb_percentage = (len(matches) / total_kps) * 100.0
            
    stroke_sim = float(round(0.6 * edge_sim + 0.4 * orb_percentage, 2))
    
    # 3. Writing Style Similarity (Aspect ratio consistency + slant angle difference)
    mean_asp1, _ = calculate_component_aspect_ratios(e1)
    mean_asp2, _ = calculate_component_aspect_ratios(e2)
    aspect_score = np.exp(-abs(mean_asp1 - mean_asp2) / (max(mean_asp1, mean_asp2) + 1e-5)) * 100.0
    
    dominant_angle1 = np.argmax(hist1)
    dominant_angle2 = np.argmax(hist2)
    slant_diff = abs(dominant_angle1 - dominant_angle2)
    slant_score = np.cos(slant_diff * (np.pi / 18.0)) * 100.0
    
    style_sim = float(round(0.6 * aspect_score + 0.4 * slant_score, 2))
    
    # 4. Character Spacing Similarity (projection whitespace intervals, omitted for signatures)
    spacing_sim = 0.0
    if mode == "handwriting":
        mean_sp1, std_sp1 = calculate_character_spacing(e1)
        mean_sp2, std_sp2 = calculate_character_spacing(e2)
        if mean_sp1 > 0.0 and mean_sp2 > 0.0:
            mean_score = np.exp(-abs(mean_sp1 - mean_sp2) / (max(mean_sp1, mean_sp2) + 1e-5)) * 100.0
            std_score = np.exp(-abs(std_sp1 - std_sp2) / (max(std_sp1, std_sp2) + 1e-5)) * 100.0
            spacing_sim = float(round(0.7 * mean_score + 0.3 * std_score, 2))
        else:
            spacing_sim = 50.0  # default neutral
            
    # Calculate overall match percentage based on weights
    if mode == "signature":
        overall = 0.4 * deep_sim + 0.3 * stroke_sim + 0.3 * style_sim
    else:
        overall = 0.4 * deep_sim + 0.25 * stroke_sim + 0.2 * style_sim + 0.15 * spacing_sim
        
    overall = float(round(max(0.0, min(100.0, overall)), 2))
    
    # Forgery & Tracing Detection
    c1 = preprocess_image_cropped(e1)
    c2 = preprocess_image_cropped(e2)
    ssim_score = float(ssim(c1, c2, full=False))
    
    j1 = calculate_stroke_jitter(e1)
    j2 = calculate_stroke_jitter(e2)
    
    is_tremor = False
    if j2 > 0.22 and (j2 / (j1 + 1e-5)) > 1.4:
        is_tremor = True
        
    status = "Genuine"
    confidence = overall
    
    if overall < 65.0:
        status = "Forged"
        confidence = float(round(100.0 - overall, 2))
    elif ssim_score > 0.81 and is_tremor:
        status = "Traced"
        confidence = float(round(ssim_score * 100.0, 2))
    elif overall >= 80.0:
        status = "Genuine"
        confidence = overall
    else:
        if is_tremor:
            status = "Forged"
            confidence = float(round(95.0 - overall, 2))
        else:
            status = "Genuine"
            confidence = overall
            
    return {
        "match": overall,
        "stroke_similarity": stroke_sim,
        "character_spacing": spacing_sim if mode == "handwriting" else None,
        "writing_style": style_sim,
        "deep_similarity": deep_sim,
        "forgery_status": status,
        "forgery_confidence": confidence
    }