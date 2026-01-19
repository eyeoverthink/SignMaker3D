import cv2
import numpy as np
from skimage.morphology import skeletonize
import sys
import os

def scott_variance_test(image_path):
    print(f"--- ANALYZING: {os.path.basename(image_path)} ---")
    
    # 1. Load and Normalize
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("Error: Could not load image.")
        return
    
    # Resize to standard "Cognitive Field" (256x256)
    img = cv2.resize(img, (256, 256))

    # 2. Polarity Split (The Scott Transform)
    # We analyze the object (White) and the Void (Black) separately.
    _, bin_pos = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    bin_neg = cv2.bitwise_not(bin_pos)

    # 3. Geometric Skeletonization (Medial Axis)
    # This strips away the "pixels" and leaves only the "truth" (structure)
    skel_pos = skeletonize(bin_pos // 255)
    skel_neg = skeletonize(bin_neg // 255)

    # 4. Measure Information Density (Entropy)
    # How complex is the skeleton in positive vs negative space?
    density_pos = np.sum(skel_pos) / (256*256)
    density_neg = np.sum(skel_neg) / (256*256)
    
    # 5. Calculate Organic Variance (Sigma)
    # Real things have a gap between matter and void. Fakes are balanced.
    delta = abs(density_pos - density_neg)
    sigma = delta * 100.0  # Convert to percentage

    print(f"Positive Density: {density_pos:.5f}")
    print(f"Negative Density: {density_neg:.5f}")
    print(f"SCOTT VARIANCE (σ): {sigma:.4f}%")

    # 6. The Verdict
    if sigma < 1.5:
        print(">> VERDICT: SYNTHETIC (Mathematically Perfect)")
    else:
        print(">> VERDICT: ORGANIC (Natural Variance Detected)")
    print("-" * 40 + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scott_protocol.py <image_file>")
    else:
        scott_variance_test(sys.argv[1])