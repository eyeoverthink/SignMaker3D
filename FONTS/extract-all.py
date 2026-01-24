import cv2
import numpy as np
import sys
import os

# ==========================================
# SCOTT ENGINE V3.0: HYBRID MANIFEST
# Logic: Canny Edges + Adaptive Threshold Mix
# ==========================================

class ScottHybridGenerator:
    def __init__(self, image_path):
        self.image_path = image_path
        self.sign_height = 2.0
        # Tweak this to filter "dust" vs "features"
        self.min_area = 30 

    def process_hybrid(self):
        img = cv2.imread(self.image_path)
        if img is None:
            print(f"Error: Could not load {self.image_path}")
            return None

        # 1. Preprocessing (Signal Boost)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # CLAHE (Night Vision Mode) - Essential for the dark suits
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Denoise slightly to stop Canny from freaking out
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)

        # 2. THE MIX (This is the "This and This" Logic)
        
        # A. Canny Edge Detection (Structure)
        # Catches the lapels and shoulders in the dark
        edges = cv2.Canny(blurred, 30, 100)
        
        # B. Adaptive Threshold (Texture)
        # Catches the smiles, ties, and patterns
        thresh = cv2.adaptiveThreshold(blurred, 255, 
                                     cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)
                                     
        # C. The Hybrid Merge
        # We combine specific structural lines with general texture
        combined = cv2.bitwise_or(edges, thresh)

        # 3. Morphological Manifestation (Thickening)
        # We dilate to turn 1px lines into printable walls
        kernel = np.ones((2,2), np.uint8)
        thickened = cv2.dilate(combined, kernel, iterations=1)
        
        # Close gaps (connect broken lines)
        closed = cv2.morphologyEx(thickened, cv2.MORPH_CLOSE, kernel)

        # 4. Boundary Tracing
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        manifest_data = []
        print(f"--- PROCESSING HYBRID MANIFEST ---")
        
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < self.min_area: 
                continue

            # Geodesic Distillation
            # Tighter tolerance (0.001) for facial details
            epsilon = 0.001 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            points_list = []
            for p in approx:
                points_list.append([float(p[0][0]), float(-p[0][1])])
            
            manifest_data.append(points_list)
            
        return manifest_data

    def generate_scad(self, components):
        output_filename = os.path.splitext(self.image_path)[0] + "_hybrid.scad"
        
        if not components: return
        all_points = [p for sublist in components for p in sublist]
        xs = [p[0] for p in all_points]
        ys = [p[1] for p in all_points]
        center_x = (min(xs) + max(xs)) / 2
        center_y = (min(ys) + max(ys)) / 2

        scad_content = f"""
// ==========================================
// SCOTT ENGINE V3.0: HYBRID MANIFEST
// Source: {self.image_path}
// Logic: Canny + Adaptive Mix
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

// Optional Base for printing
// translate([0,0,-0.8]) cube([200, 200, 0.8], center=true);
"""
        with open(output_filename, "w") as f:
            f.write(scad_content)
        print(f"--- HYBRID MANIFEST COMPLETE: {output_filename} ---")

if __name__ == "__main__":
    input_file = "me_vale_seans_wedding.jpg"
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        
    engine = ScottHybridGenerator(input_file)
    data = engine.process_hybrid()
    if data:
        engine.generate_scad(data)