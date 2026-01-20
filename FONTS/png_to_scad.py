import cv2
import numpy as np
import os
import tkinter as tk
from tkinter import filedialog

def generate_scad_from_image(image_path, output_filename):
    # 1. Read Image
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    # 2. Threshold (Make it strictly Black and White)
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    
    # 3. Find Contours (Trace the lines)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # 4. Write SCAD File
    with open(output_filename, 'w') as f:
        # --- SCAD HEADER (The Neon Logic) ---
        f.write('// AUTOMATIC NEON GENERATOR\n')
        f.write('// Generated from: ' + os.path.basename(image_path) + '\n\n')
        f.write('$fn = 60;\n\n')
        f.write('wall_thickness = 2;\n')
        f.write('tube_height = 10;\n')
        f.write('tube_width = 8;\n\n')
        
        f.write('// RENDER COMMANDS\n')
        f.write('translate([0,0,0]) color("white") NeonTop();\n')
        f.write('translate([0,0,-15]) color("gray") BackPlate();\n\n')

        # --- THE SHAPE MODULE ---
        f.write('module IconShape() {\n')
        
        # Convert Contours to SCAD Polygons
        for i, cnt in enumerate(contours):
            # Simplify line (epsilon factor) to reduce jagged edges
            epsilon = 0.005 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            if len(approx) > 2: # Need at least 3 points for a shape
                points_str = ""
                # Flip Y because Images and SCAD have opposite coordinates
                for p in approx:
                    x, y = p[0]
                    points_str += f"[{x}, {-y}], "
                
                # Write the polygon
                f.write(f'    polygon(points=[{points_str}]);\n')
                
        f.write('}\n\n')

        # --- THE NEON LOGIC (Sandwich Method) ---
        f.write('''
module NeonTop() {
    difference() {
        // Outer Shell (Minkowski Rounding)
        minkowski() {
            linear_extrude(tube_height - 2) IconShape();
            sphere(r=2); // Creates the rounded "Tubular" look
        }
        
        // Inner Hollow (The Channel)
        translate([0,0,-5])
        linear_extrude(tube_height + 10)
            offset(r=-wall_thickness) IconShape();
            
        // Cut Bottom Flat
        translate([0,0,-10]) cube([10000, 10000, 20], center=true);
    }
}

module BackPlate() {
    difference() {
        linear_extrude(3)
            offset(r=-0.2) // Tolerance gap
            offset(r=-wall_thickness) IconShape();
            
        // Screw Holes?
    }
}
''')

    print(f"Success! Created {output_filename}")

# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    # Hide main window
    root = tk.Tk()
    root.withdraw()

    print("Select your PNG/JPG Drawing...")
    file_path = filedialog.askopenfilename(
        title="Select Line Art Image",
        filetypes=[("Images", "*.png *.jpg *.jpeg *.bmp")]
    )

    if file_path:
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        output_scad = f"{base_name}_neon.scad"
        
        generate_scad_from_image(file_path, output_scad)
        print(f"Done. Open '{output_scad}' in OpenSCAD.")
    else:
        print("No file selected.")