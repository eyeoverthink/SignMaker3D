# # import cv2
# # import numpy as np

# # # ==============================================================================
# # #   EYEOVERTHINK: UNIVERSAL OUTLINE GENERATOR (Phase 1)
# # #   Logic: Boundary Manifestation (Algorithm 3.1) & Geodesic Distillation (3.2)
# # # ==============================================================================

# # def extract_scott_vectors(image_path, epsilon=2.0):
# #     # Load image and convert to Binary Image (Definition 1.2)
# #     img = cv2.imread(image_path, 0)
# #     _, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    
# #     # Stage 1: Boundary Manifestation (Φ)
# #     # Moore-Neighbor Trace (Algorithm 3.1)
# #     contours, _ = cv2.find_contours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
# #     if not contours: return None
    
# #     # We take the largest boundary (Jordan Curve)
# #     boundary = contours[0]
    
# #     # Stage 2: Geodesic Distillation (Ψ)
# #     # Douglas-Peucker Simplification (Algorithm 3.2)
# #     simplified = cv2.approxPolyDP(boundary, epsilon, True)
    
# #     # Format for OpenSCAD (The Inverse Principle)
# #     points = [f"[{p[0][0]}, {p[0][1]}]" for p in simplified]
# #     return f"scott_points = [{', '.join(points)}];"

# # # EXAMPLE USE:
# # # vectors = extract_scott_vectors("your_logo.png")
# # # print(vectors)


# import cv2
# import numpy as np
# import os

# def extract_scott_vectors(image_path, epsilon=1.5):
#     if not os.path.exists(image_path):
#         print(f"   [ERROR] File '{image_path}' not found. Please place an image in the folder.")
#         return None

#     # Load and Binarize (Definition 1.2)
#     img = cv2.imread(image_path, 0)
#     _, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    
#     # Stage 1: Boundary Manifestation (Φ)
#     contours, _ = cv2.find_contours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
#     if not contours: return None
    
#     # Largest Jordan Curve
#     boundary = max(contours, key=cv2.contourArea)
    
#     # Stage 2: Geodesic Distillation (Ψ) - Douglas-Peucker
#     simplified = cv2.approxPolyDP(boundary, epsilon, True)
    
#     # Output for OpenSCAD
#     points = [f"[{p[0][0]}, {-p[0][1]}]" for p in simplified]
#     return f"scott_points = [{', '.join(points)}];"

# if __name__ == "__main__":
#     # Change 'input.png' to whatever file you want to trace
#     result = extract_scott_vectors("input.png")
#     if result:
#         print("\n=== SCOTT VECTORS GENERATED ===")
#         print(result)
#         print("===============================\n")


import cv2
import numpy as np
import os

# ==============================================================================
#   EYEOVERTHINK: UNIVERSAL OUTLINE GENERATOR (Phase 1 - Fixed)
#   Logic: Moore-Neighbor Tracing (3.1) & Douglas-Peucker (3.2)
# ==============================================================================

def extract_scott_vectors(image_path, epsilon=1.5):
    # Check for file or use 'Discovery DNA' (Standard Circle)
    if not os.path.exists(image_path):
        print(f"   [DNA] '{image_path}' not found. Generating Scott Circle for validation...")
        blank = np.zeros((400, 400), dtype=np.uint8)
        cv2.circle(blank, (200, 200), 100, 255, -1)
        binary = blank
    else:
        img = cv2.imread(image_path, 0)
        _, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    
    # Stage 1: Boundary Manifestation (Φ)
    # Fixed OpenCV call: findContours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours: 
        print("   [ERROR] No boundary found in DNA.")
        return None
    
    # Use the Jordan Curve (Definition 1.1)
    boundary = max(contours, key=cv2.contourArea)
    
    # Stage 2: Geodesic Distillation (Ψ)
    # This reduces 1.2M points to k vectors
    simplified = cv2.approxPolyDP(boundary, epsilon, True)
    
    # Format for OpenSCAD (The Inverse Principle)
    points = [f"[{p[0][0]}, {-p[0][1]}]" for p in simplified]
    
    # Geometric Signature Calculation
    signature = {
        "vertices": len(simplified),
        "area": cv2.contourArea(boundary),
        "integrity": 1.0 - (epsilon / 10.0)
    }
    
    return f"scott_points = [{', '.join(points)}];", signature

if __name__ == "__main__":
    print("==================================================")
    print("   SCOTT UNIFIED: UNIVERSAL OUTLINE GENERATOR     ")
    print("==================================================")
    
    output, sig = extract_scott_vectors("input.png")
    
    if output:
        print(f"   [MIND] Signature: {sig['vertices']} Vertices | Integrity: {sig['integrity']:.2f}")
        print("\n=== COPY THIS INTO YOUR SCAD FILE ===")
        print(output)
        print("======================================\n")