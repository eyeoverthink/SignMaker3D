import os
import shutil
from pathlib import Path

# ==========================================
#   SIGN SCULPTOR: CUSTOM FONT ENGINE
# ==========================================

# [USER INPUTS]
# 1. The font file you want to use
FONT_FILE_PATH = "Segoe-UI-Symbol.ttf" 
# 2. The internal name of the font (Open file to check, or guess. Usually "Family Name")
#    If unsure, leave it matching the filename without extension.
FONT_INTERNAL_NAME = "Segoe-UI-Symbol" 

# [CONFIGURATION]
OUTPUT_DIR = "Custom_Font_Alphabet-Segoe"
FONT_SIZE = 100
LIGHT_TYPE = "Silicone_Neon_6mm" 

# The Engineering Template (Updated for Custom Fonts)
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED FILE: Letter_{char}
// FONT SOURCE: {font_file}

// 1. Load the Custom Font
use <{font_file}>;

Render_Mode = "Body"; 
Letter = "{char}";
Font_Size = {size};
// 2. Reference the Loaded Font
Font_Name = "{font_name}"; 
Light_Type = "{light}";

// -- Engineering Constants --
Sign_Height = 30.0;
Wall_Thickness = 2.0;
Base_Thickness = 2.0;
Lid_Tolerance = 0.15;
Hole_Height = 5.0;
Hole_Size = 5.0;

// -- Logic Engine --
CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
     (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
     (Light_Type == "LED_Strip_10mm")    ? 10.5 :
     (Light_Type == "Individual_Pixels")  ? 14.0 : 6.0;

Lip_Overhang = (Light_Type == "Silicone_Neon_6mm" || Light_Type == "Silicone_Neon_8mm") ? 0.4 : 0.0;

$fn = 60;

module letter_shape() {{
    // Note: We use the specific Font Name here
    text(text=Letter, size=Font_Size, font=Font_Name, halign="center", valign="center");
}}

module body_geometry() {{
    difference() {{
        // Positive Block
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            letter_shape();

        // Light Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            letter_shape();

        // Friction Lip
        if (Lip_Overhang > 0) {{
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {{
                    offset(r = CW/2 + 5) letter_shape();
                    offset(r = CW/2 - Lip_Overhang) letter_shape();
                }}
        }}
        
        // Lid Shelf
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            letter_shape();

        // Side Holes
        translate([-Font_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, 90, 0]) cylinder(h = Font_Size, r = Hole_Size/2);
            
        translate([Font_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, -90, 0]) cylinder(h = Font_Size, r = Hole_Size/2);
    }}
}}

module lid_geometry() {{
    color("White")
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        letter_shape();
}}

if (Render_Mode == "Body") {{ body_geometry(); }}
else if (Render_Mode == "Lid") {{ lid_geometry(); }}
"""

def generate_custom_alphabet():
    # 1. Setup Directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"--- INITIATING CUSTOM FONT FACTORY ---")
    
    # 2. Copy the Font File to the Output Directory
    # OpenSCAD needs the font file in the SAME folder to "use <font.otf>"
    font_filename = os.path.basename(FONT_FILE_PATH)
    destination = os.path.join(OUTPUT_DIR, font_filename)
    shutil.copyfile(FONT_FILE_PATH, destination)
    print(f">> Font Implanted: {destination}")

    # 3. Manufacture the Alphabet
    for i in range(65, 91):
        char = chr(i)
        filename = f"Letter_{char}.scad"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        file_content = SCAD_TEMPLATE.format(
            char=char,
            size=FONT_SIZE,
            font_file=font_filename,
            font_name=FONT_INTERNAL_NAME,
            light=LIGHT_TYPE
        )
        
        with open(filepath, "w") as f:
            f.write(file_content)
            
        print(f">> Generated Model: {filename}")

    print(f"--- FACTORY COMPLETE: {OUTPUT_DIR} ---")
    print(f"To Render: Open any .scad file in OpenSCAD. It will auto-load {font_filename}.")

if __name__ == "__main__":
    # Check if font exists before running
    font_path = FONT_FILE_PATH
    
    if not os.path.exists(font_path):
        # Try Windows system fonts
        system_font = f"C:/Windows/Fonts/{FONT_FILE_PATH}"
        if os.path.exists(system_font):
            print(f"Found font in Windows system fonts: {system_font}")
            font_path = system_font
        else:
            print(f"ERROR: Could not find font file '{FONT_FILE_PATH}'")
            print("Tried:")
            print(f"  1. Current folder: {FONT_FILE_PATH}")
            print(f"  2. System fonts: {system_font}")
            print("\nPlease either:")
            print("  - Place the .ttf file in the FONTS folder")
            print("  - Use the exact filename from C:/Windows/Fonts/")
            exit(1)
    
    # Update FONT_FILE_PATH to the found location
    FONT_FILE_PATH = font_path
    generate_custom_alphabet()