import cv2
import numpy as np
import sys
import os

# ==========================================
# SCOTT ENGINE V2.0: PHOTO-TO-VECTOR MANIFEST
# Logic: Adaptive Feature Extraction
# ==========================================

class ScottPhotoGenerator:
    def __init__(self, image_path):
        self.image_path = image_path
        self.channel_width = 4.0 # Thinner for photo details
        self.sign_height = 2.0   # Lower profile for stencil look
        self.wall_thickness = 1.0

    def process_photo(self):
        # 1. Load & Preprocess
        img = cv2.imread(self.image_path)
        if img is None:
            print(f"Error: Could not load {self.image_path}")
            return None

        # 2. The "Photo Logic" (Edge vs Blob)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Blur to reduce noise (The "Sand" that confuses the machine)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # OPTION A: Canny Edge Detection (Good for high contrast features)
        # edges = cv2.Canny(blurred, 50, 150)
        
        # OPTION B: Adaptive Thresholding (Best for Photos/Faces)
        # This treats every 11x11 pixel area independently, ignoring lighting shadows
        thresh = cv2.adaptiveThreshold(blurred, 255, 
                                     cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)

        # 3. Morphological Manifestation (Thickening the Lines)
        # We dilate the lines so they become printable walls, not just zero-width vectors
        kernel = np.ones((2,2), np.uint8)
        thickened = cv2.dilate(thresh, kernel, iterations=1)

        # 4. Boundary Tracing (Moore-Neighbor)
        contours, _ = cv2.findContours(thickened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        manifest_data = []
        
        print(f"--- PROCESSING PHOTO MANIFEST ---")
        
        # Sort contours by area to keep main features, remove dust
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 50: # Filter small noise
                continue

            # 5. Geodesic Distillation (Douglas-Peucker)
            # We use a tighter tolerance for faces to keep the curve of a smile/eye
            epsilon = 0.001 * cv2.arcLength(cnt, True) 
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            points_list = []
            for p in approx:
                points_list.append([float(p[0][0]), float(-p[0][1])])
            
            manifest_data.append(points_list)
            
        return manifest_data

    def generate_scad(self, components):
        output_filename = os.path.splitext(self.image_path)[0] + "_stencil.scad"
        
        # Center the model
        if not components: return
        all_points = [p for sublist in components for p in sublist]
        xs = [p[0] for p in all_points]
        ys = [p[1] for p in all_points]
        center_x = (min(xs) + max(xs)) / 2
        center_y = (min(ys) + max(ys)) / 2

        scad_content = f"""
// ==========================================
// SCOTT ENGINE V2.0: PHOTO MANIFEST
// Source: {self.image_path}
// ==========================================

$fn = 40;
height = {self.sign_height};

module photo_lines() {{
    translate([{-center_x}, {-center_y}, 0]) {{
"""
        for pts in components:
            pts_str = str(pts).replace("'", "")
            scad_content += f"""
        polygon(points={pts_str});
"""
        scad_content += """
    }
}

// 3D Extrusion
linear_extrude(height) photo_lines();

// Optional: Base Plate (Uncomment to print as a solid card)
// translate([0,0,-1]) cube([200, 200, 1], center=true);
"""
        with open(output_filename, "w") as f:
            f.write(scad_content)
        print(f"--- MANIFEST COMPLETE: {output_filename} ---")

if __name__ == "__main__":
    # Test on the suspenders photo
    input_file = "Copy of willam_a_johnson_iii.jpg" 
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        
    if os.path.exists(input_file):
        engine = ScottPhotoGenerator(input_file)
        data = engine.process_photo()
        if data:
            engine.generate_scad(data)
    else:
        print(f"File not found: {input_file}")