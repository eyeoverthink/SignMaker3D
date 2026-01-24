import cv2
import numpy as np
import sys
import os

# ==========================================
# THE SCOTT ENGINE: IMAGE-TO-3D CONVERSION
# Implementation of Technical Validation Doc
# Section 3.1: Image-to-Sign Tab
# ==========================================

class ScottSignGenerator:
    def __init__(self, image_path):
        self.image_path = image_path
        self.phi = 1.618033
        
        # Section 6: Configurable Parameters
        self.epsilon_factor = 0.002 # Tolerance factor for Douglas-Peucker
        self.min_area = 100         # Filter small noise (Section 6.2)
        self.channel_width = 6.5    # 6mm Neon
        self.wall_thickness = 2.0
        self.sign_height = 30.0

    def process(self):
        # 1. Load & Preprocess (Section 3.1, Steps 1-3)
        img = cv2.imread(self.image_path)
        if img is None:
            print(f"Error: Could not load {self.image_path}")
            return

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Auto-invert if background is dark (Simple heuristic)
        if np.mean(gray) < 127:
            gray = cv2.bitwise_not(gray)
            
        # Binary Threshold
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

        # 2. Connected Component Labeling & Boundary Tracing (Section 2.1 & 2.2)
        # cv2.findContours utilizes a topological structural analysis equivalent 
        # to the Moore-Neighbor tracing described in the doc.
        contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        manifest_data = []
        total_original_points = 0
        total_simplified_points = 0

        print(f"--- SCOTT ALGORITHM EXECUTION ---")
        print(f"Input: {self.image_path}")
        print(f"Components Detected: {len(contours)}")

        for i, cnt in enumerate(contours):
            area = cv2.contourArea(cnt)
            if area < self.min_area:
                continue # Filter noise

            # 3. Geodesic Distillation / Douglas-Peucker (Section 2.3)
            # epsilon calculation based on perimeter (arcLength)
            perimeter = cv2.arcLength(cnt, True)
            epsilon = self.epsilon_factor * perimeter
            
            # This is the reduction function
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            original_pts = len(cnt)
            simplified_pts = len(approx)
            
            total_original_points += original_pts
            total_simplified_points += simplified_pts

            # Convert to standard list of [x, y]
            points_list = []
            for p in approx:
                # Flip Y for OpenSCAD coordinate system
                points_list.append([float(p[0][0]), float(-p[0][1])])
            
            manifest_data.append(points_list)

        # 4. Empirical Result Calculation
        reduction_percent = (1 - (total_simplified_points / total_original_points)) * 100
        print(f"Original Points: {total_original_points}")
        print(f"Distilled Points: {total_simplified_points}")
        print(f"Reduction: {reduction_percent:.2f}% (Target: >90%)")
        
        return manifest_data

    def generate_scad(self, components):
        # Section 3.1 Output Generation
        output_filename = os.path.splitext(self.image_path)[0] + ".scad"
        
        scad_content = f"""
// ==========================================
// SIGNCRAFT 3D - SCOTT ENGINE OUTPUT
// Source: {self.image_path}
// Logic: O(P) Boundary Intelligence
// ==========================================

$fn = 60;
channel_width = {self.channel_width};
sign_height = {self.sign_height};
wall = {self.wall_thickness};

module component_shape(pts) {{
    polygon(points=pts);
}}

module manifest_sign() {{
    union() {{
"""
        # Generate Geometry for each component
        for i, pts in enumerate(components):
            pts_str = str(pts).replace("'", "")
            scad_content += f"""
        // Component {i+1}
        translate([0,0,0]) {{
            difference() {{
                // Positive Body
                linear_extrude(sign_height) 
                    offset(r=wall + channel_width/2) 
                    component_shape({pts_str});
                
                // LED Channel
                translate([0,0,2]) 
                linear_extrude(sign_height) 
                    offset(r=channel_width/2) 
                    component_shape({pts_str});
            }}
        }}
"""
        
        scad_content += """
    }
}

// EXECUTE
scale([1, 1, 1]) manifest_sign();
"""
        with open(output_filename, "w") as f:
            f.write(scad_content)
        print(f"--- MANIFEST COMPLETE: {output_filename} ---")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scott_engine.py <image_file>")
    else:
        engine = ScottSignGenerator(sys.argv[1])
        data = engine.process()
        if data:
            engine.generate_scad(data)