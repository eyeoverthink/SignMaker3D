import cv2
import numpy as np
import sys
import os

def fractal_dimension(Z, threshold=0.9):
    # Only for 2d image
    assert(len(Z.shape) == 2)

    def boxcount(Z, k):
        S = np.add.reduceat(
            np.add.reduceat(Z, np.arange(0, Z.shape[0], k), axis=0),
                               np.arange(0, Z.shape[1], k), axis=1)

        # We count non-empty (0) and non-full (k*k) boxes
        return len(np.where((S > 0) & (S < k*k))[0])

    # Transform Z into a binary array
    Z = (Z < threshold)

    # Minimal dimension of image
    p = min(Z.shape)

    # Greatest power of 2 less than or equal to p
    n = 2**np.floor(np.log(p)/np.log(2))

    # Extract the exponent
    n = int(np.log(n)/np.log(2))

    # Build successive box sizes (from 2^n down to 2^1)
    sizes = 2**np.arange(n, 1, -1)

    # Actual box counting with decreasing size
    counts = []
    for size in sizes:
        counts.append(boxcount(Z, size))

    # Fit the successive log(sizes) with log (counts)
    coeffs = np.polyfit(np.log(sizes), np.log(counts), 1)
    return -coeffs[0]

def analyze_fractal_geometry(image_path):
    print(f"--- FRACTAL ANALYSIS: {os.path.basename(image_path)} ---")
    
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("Error: Could not load image.")
        return

    # Use Canny Edge Detection (The "Structure")
    edges = cv2.Canny(img, 100, 200)
    
    # Calculate Fractal Dimension (D)
    # D ranges from 1.0 (Simple Line) to 2.0 (Complex Plane)
    D = fractal_dimension(edges)
    
    print(f"Fractal Dimension (D): {D:.5f}")
    
    # NEW HYPOTHESIS:
    # Biology is usually D > 1.3 (High Complexity)
    # Artificial geometry is usually D < 1.3 (Lower Complexity)
    if D > 1.35:
        print(">> VERDICT: ORGANIC (High Fractal Complexity)")
    else:
        print(">> VERDICT: SYNTHETIC (Low Geometric Depth)")
    print("-" * 40 + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scott_fractal.py <image_file>")
    else:
        analyze_fractal_geometry(sys.argv[1])