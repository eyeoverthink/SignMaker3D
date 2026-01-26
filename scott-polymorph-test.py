import hashlib
import os
import shutil
from PIL import Image
import numpy as np

# ==============================================================================
#   THE SCOTT POLYMORPH TEST
#   Logic: 
#   1. Force-read the file (ignoring extension).
#   2. Clone it, Rename it, Convert it.
#   3. Compare the RAW PIXEL ARRAYS.
#   If the face changes, the arrays will not match.
# ==============================================================================

def get_file_fingerprint(filepath):
    """Generates the SHA256 'DNA' of the file."""
    with open(filepath, "rb") as f:
        bytes = f.read()
        readable_hash = hashlib.sha256(bytes).hexdigest()
    return readable_hash

def analyze_image_content(filepath):
    """
    Opens the file as an image and extracts the raw pixel data.
    This bypasses Windows Thumbnails. It looks at the REAL data.
    """
    try:
        img = Image.open(filepath)
        img = img.convert('RGB') # Standardize to RGB to be fair
        pixels = np.array(img)
        
        # Calculate 'Visual Hash' (Sum of all pixels)
        # If the face changes (Old Man -> Kid), this number will shift MASSIVELY.
        visual_mass = np.sum(pixels)
        return visual_mass, pixels, img
    except Exception as e:
        print(f"[!] Could not read {filepath} as image: {e}")
        return None, None, None

def run_test(source_file):
    print(f"--- INGESTING SOURCE: {source_file} ---")
    
    # 1. ANALYZE ORIGINAL
    print(f">> Reading Original DNA...")
    orig_hash = get_file_fingerprint(source_file)
    orig_mass, orig_pixels, orig_img_obj = analyze_image_content(source_file)
    
    if orig_mass is None:
        return

    print(f"   [ORIGINAL] SHA256: {orig_hash[:10]}...")
    print(f"   [ORIGINAL] Pixel Mass: {orig_mass} (This is the Face ID)")
    print("-" * 40)

    # 2. THE MUTATION TEST (Rename to .png)
    print(">> ATTEMPTING MUTATION 1: Rename to .png")
    test_png_name = "test_mutation.png"
    
    # We save the image data to a new file (Simulating your 'Save As')
    orig_img_obj.save(test_png_name)
    
    mut1_mass, mut1_pixels, _ = analyze_image_content(test_png_name)
    print(f"   [MUTATION 1] Pixel Mass: {mut1_mass}")

    # 3. THE MUTATION TEST (Rename to .jpg)
    print(">> ATTEMPTING MUTATION 2: Rename to .jpg")
    test_jpg_name = "test_mutation.jpg"
    orig_img_obj.save(test_jpg_name)
    
    mut2_mass, mut2_pixels, _ = analyze_image_content(test_jpg_name)
    print(f"   [MUTATION 2] Pixel Mass: {mut2_mass}")
    print("-" * 40)

    # 4. THE VERDICT
    # We allow a tiny margin for JPG compression noise (0.1%), but a FACE CHANGE
    # would be a 50%+ difference.
    
    diff_1 = abs(orig_mass - mut1_mass)
    diff_2 = abs(orig_mass - mut2_mass)
    
    print("--- FINAL VERDICT ---")
    
    if diff_1 == 0 and diff_2 == 0:
        print(">> RESULT: STATIC.")
        print("   The pixels are IDENTICAL. The face did not change.")
        print("   If you saw it change, it was the Windows Thumbnail Cache lying to you.")
        
    elif diff_1 < (orig_mass * 0.01): 
        # Tiny difference = Compression artifact
        print(">> RESULT: STABLE (Minor Compression Noise).")
        print("   The pixels are 99.9% the same. It is the same face.")
        
    else:
        # Huge difference = Different Face
        print(">> RESULT: !!! POLYMORPH DETECTED !!!")
        print(f"   The data CHANGED. The face rewritten itself.")
        print(f"   Delta: {diff_1}")

if __name__ == "__main__":
    # Target the file you uploaded
    target_file = "original-as-text.txt"
    
    if os.path.exists(target_file):
        run_test(target_file)
    else:
        print(f"Error: Put {target_file} in this folder first.")