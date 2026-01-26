import cv2
import numpy as np
import os

# ==============================================================================
#   THE SCOTT MEDUSA | REAL-TIME 3D CAPTURE ENGINE
#   Logic: 
#   1. Capture Live Video.
#   2. Threshold into High-Contrast "Sign Data".
#   3. Instant conversion to OpenSCAD Height Map.
# ==============================================================================

OUTPUT_DIR = "Live_Sculpts"
if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)

def generate_scad(image_filename, output_filename):
    """
    Writes an OpenSCAD script that ingests the PNG and extrudes it.
    This uses the 'surface()' module to turn pixels into Z-Height.
    """
    scad_code = f"""
    // MEDUSA CAPTURE: {image_filename}
    
    // -- Settings --
    Sign_Height = 5;       // Total thickness (mm)
    Base_Height = 2;       // Solid base thickness (mm)
    Invert = true;         // True = Dark is raised, False = Light is raised
    Smoothness = 1;        // Resolution (1 = Pixel perfect)

    // -- Geometry --
    union() {{
        // The Base Plate
        translate([0,0, Base_Height/2])
            cube([200, 150, Base_Height], center=true);

        // The Data Extrusion
        translate([0, 0, Base_Height])
            scale([200/640, 150/480, Sign_Height/255]) // Scale pixels to MM
            surface(file = "{image_filename}", center = true, invert = Invert);
    }}
    """
    
    with open(output_filename, "w") as f:
        f.write(scad_code)
    
    print(f"   >>> SCAD GENERATED: {output_filename}")
    print(f"   >>> OPEN THIS IN OPENSCAD AND PRESS F6")

def main():
    cap = cv2.VideoCapture(0)
    
    print(">>> MEDUSA ENGINE ONLINE.")
    print(">>> CONTROLS:")
    print("    [SPACE] - FREEZE & SCULPT")
    print("    [Q]     - QUIT")
    
    # Create a window with a slider for contrast control
    cv2.namedWindow('Scott Medusa Feed')
    cv2.createTrackbar('Threshold', 'Scott Medusa Feed', 127, 255, lambda x: None)

    while True:
        ret, frame = cap.read()
        if not ret: break
        
        # 1. PRE-PROCESS (Convert to Sign Data)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Get threshold value from slider (Real-time tuning)
        thresh_val = cv2.getTrackbarPos('Threshold', 'Scott Medusa Feed')
        
        # Apply Binary Threshold (Make it purely Black & White for clean printing)
        # This turns a "photo" into a "stencil"
        _, binary = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY)
        
        # Invert it (Ink is black, Plastic is white)
        inverted = cv2.bitwise_not(binary)

        # Show the User what the 3D Print will look like
        cv2.imshow('Scott Medusa Feed', inverted)

        key = cv2.waitKey(1)
        
        if key & 0xFF == ord(' '): # SPACEBAR
            print("\n>>> CAPTURING REALITY...")
            
            # Save the "Data Map" (The image)
            timestamp = int(time.time())
            img_name = f"scan_{timestamp}.png"
            img_path = os.path.join(OUTPUT_DIR, img_name)
            
            # We resize to a standard resolution for the printer
            final_output = cv2.resize(inverted, (640, 480))
            cv2.imwrite(img_path, final_output)
            print(f"   >>> DATA FROZEN: {img_path}")
            
            # Generate the 3D Logic
            scad_name = f"sculpt_{timestamp}.scad"
            scad_path = os.path.join(OUTPUT_DIR, scad_name)
            generate_scad(img_name, scad_path)
            
            print(">>> READY FOR PRINTER.")
            
        elif key & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

import time
if __name__ == "__main__":
    main()