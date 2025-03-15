import cv2
import numpy as np

def match_handwriting(sample_path, handwriting_path):
    img1 = cv2.imread(sample_path, cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(handwriting_path, cv2.IMREAD_GRAYSCALE)

    if img1 is None or img2 is None:
        return 0  # Return 0 if images couldn't be loaded

    # Use ORB feature matching
    orb = cv2.ORB_create()
    keypoints1, descriptors1 = orb.detectAndCompute(img1, None)
    keypoints2, descriptors2 = orb.detectAndCompute(img2, None)

    if descriptors1 is None or descriptors2 is None:
        return 0  # If no keypoints found, return 0 match

    # FLANN-based Matcher
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(descriptors1, descriptors2)

    match_percentage = (len(matches) / max(len(keypoints1), len(keypoints2))) * 100
    return round(match_percentage, 2)  # Return match percentage