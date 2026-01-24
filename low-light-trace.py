import cv2
import numpy as np
import sys
import os

# ==========================================
# SCOTT ENGINE V2.1: LOW-LIGHT MANIFEST
# Logic: CLAHE + Bilateral Denoising
# ==========================================

class ScottPhotoGenerator:
    def __init__(self, image_path):
        self.image_path = image_path
        self.channel_width = 4.0
        self.sign_height = 2.0
        self.min_area = 100 # Increased to ignore noise specs

    def process_photo(self):
        img = cv2.imread(self.image_path)
        if img is None:
            print(f"Error: Could not load {self.image_path}")
            return None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # --- V2.1 UPGRADE: SIGNAL BOOST ---
        
        # 1. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        # This pulls structure out of the shadows
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 2. Bilateral Filter (The "Shard" Killer)
        # Smooths noise but keeps edges sharp
        filtered = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        # ----------------------------------

        # Adaptive Threshold (Now working on clean data)
        thresh = cv2.adaptiveThreshold(filtered, 255, 
                                     cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)

        # Morphological Closing to connect lines
        kernel = np.ones((2,2), np.uint8)
        thickened = cv2.dilate(thresh, kernel, iterations=1)

        # Boundary Tracing
        contours, _ = cv2.findContours(thickened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        manifest_data = []
        print(f"--- PROCESSING LOW-LIGHT MANIFEST ---")
        
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < self.min_area: # Filter noise
                continue

            epsilon = 0.0015 * cv2.arcLength(cnt, True) # Slightly looser for noisy images
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            points_list = []
            for p in approx:
                points_list.append([float(p[0][0]), float(-p[0][1])])
            
            manifest_data.append(points_list)
            
        return manifest_data

    def generate_scad(self, components):
        output_filename = os.path.splitext(self.image_path)[0] + "_v2.scad"
        
        if not components: return
        all_points = [p for sublist in components for p in sublist]
        xs = [p[0] for p in all_points]
        ys = [p[1] for p in all_points]
        center_x = (min(xs) + max(xs)) / 2
        center_y = (min(ys) + max(ys)) / 2

        scad_content = f"""
// ==========================================
// SCOTT ENGINE V2.1: LOW-LIGHT MANIFEST
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

linear_extrude(height) photo_lines();
// translate([0,0,-1]) cube([200, 200, 1], center=true); // Base plate
"""
        with open(output_filename, "w") as f:
            f.write(scad_content)
        print(f"--- MANIFEST COMPLETE: {output_filename} ---")

if __name__ == "__main__":
    input_file = "me_vale_seans_wedding.jpg"
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        
    engine = ScottPhotoGenerator(input_file)
    data = engine.process_photo()
    if data:
        engine.generate_scad(data)