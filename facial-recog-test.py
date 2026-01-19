import cv2
import numpy as np
from skimage.morphology import skeletonize
from skimage.measure import label, regionprops
import matplotlib.pyplot as plt

# --- THE SCOTT ALGORITHM: CORE FUNCTIONS ---

def get_scott_signature(binary_img):
    """
    Extracts the Geometric Signature G(S) as defined in Section 5.1
    Returns: (Perimeter/Area Ratio, Skeleton Complexity, Hull Solidity)
    """
    # 1. Clean binary image
    labeled = label(binary_img)
    regions = regionprops(labeled)
    
    if not regions:
        return (0, 0, 0)
        
    # Assume largest region is the face/object
    region = max(regions, key=lambda r: r.area)
    
    # 2. Geometric Properties
    area = region.area
    perimeter = region.perimeter
    if area == 0: return (0,0,0)
    
    pa_ratio = perimeter / area
    solidity = region.solidity # Hull integrity
    
    # 3. Skeletonization (Medial Axis)
    skeleton = skeletonize(binary_img)
    skel_pixels = np.count_nonzero(skeleton)
    skel_complexity = skel_pixels / area
    
    return (pa_ratio, skel_complexity, solidity)

def analyze_organic_variance(image_path):
    """
    Implements Section 8: Deepfake Detection via Organic Variance
    """
    print(f"Analyzing: {image_path}...")
    
    # Load and Preprocess
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("Error: Image not found.")
        return

    # Resize for consistency
    img = cv2.resize(img, (256, 256))

    # --- TEST 1: STANDARD POLARITY (The "Positive") ---
    _, bin_std = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    sig_std = get_scott_signature(bin_std > 0)
    
    # --- TEST 2: INVERTED POLARITY (The "Negative" / QIV) ---
    bin_inv = cv2.bitwise_not(bin_std)
    sig_inv = get_scott_signature(bin_inv > 0)
    
    # --- CALCULATE VARIANCE (Sigma) ---
    # We compare the structural integrity between positive and negative space.
    # Synthetic images often have perfect mathematical symmetry in noise, 
    # while organic images have chaotic variance.
    
    diff_pa = abs(sig_std[0] - sig_inv[0])
    diff_skel = abs(sig_std[1] - sig_inv[1])
    diff_solid = abs(sig_std[2] - sig_inv[2])
    
    # The Scott Variance Index (Sigma)
    sigma = (diff_pa + diff_skel + diff_solid) * 100
    
    print("\n--- SCOTT PROTOCOL RESULTS ---")
    print(f"Standard Signature: {sig_std}")
    print(f"Inverted Signature: {sig_inv}")
    print(f"Organic Variance (σ): {sigma:.4f}%")
    
    # --- THE VERDICT (Section 8.3) ---
    if sigma < 5.0:
        print("\n[VERDICT]: SYNTHETIC / DEEPFAKE DETECTED")
        print("Reason: Variance is mathematically too low (Too Perfect).")
    else:
        print("\n[VERDICT]: ORGANIC / REAL")
        print("Reason: High variance indicates natural structural chaos.")

    # Visualize the Skeleton (The "Truth")
    fig, ax = plt.subplots(1, 2, figsize=(10, 5))
    ax[0].imshow(bin_std, cmap='gray')
    ax[0].set_title("Input (Binary)")
    ax[1].imshow(skeletonize(bin_std > 0), cmap='jet')
    ax[1].set_title(f"Scott Skeleton\n(Information Density)")
    plt.show()

# --- RUN THE TEST ---
# Replace 'face.jpg' with your target image
# analyze_organic_variance('face.jpg')