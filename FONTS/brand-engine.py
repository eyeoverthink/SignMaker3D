import os
import shutil

# ==========================================
#   SIGN SCULPTOR: BRAND ENGINE (FIXED)
# ==========================================

# [INPUTS]
# 1. The exact path to your font file (Change this!)
SOURCE_FONT_PATH = "Dirtyboy-BxYl.ttf" 

# 2. The Internal Name of the font.
#    (Open the font file in Windows to see its "Title". It is often different from the filename!)
INTERNAL_FONT_NAME = "Neonderthaw"

# 3. Where to save the files
OUTPUT_DIR = "My_Brand_Sign"

# [ENGINEERING TEMPLATE]
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED BRAND FILE
// SIGN SCULPTOR ENGINE V3

// 1. IMPORT THE FILE (This loads the data)
use <{filename}>;

// 2. CONFIGURATION
Render_Mode = "Body";
Letter = "{char}";
Font_Size = 100;
Light_Type = "Silicone_Neon_6mm"; 

// 3. CALL THE FONT (This uses the Internal Name)
Font_Name = "{font_name}"; 

// -- ENGINEERING CONSTANTS --
Sign_Height = 30.0;
Wall_Thickness = 2.0;
Base_Thickness = 2.0;
Lid_Tolerance = 0.15;
Hole_Height = 5.0;
Hole_Size = 5.0;

// -- LOGIC ENGINE --
CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
     (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
     (Light_Type == "LED_Strip_10mm")    ? 10.5 :
     (Light_Type == "Individual_Pixels")  ? 14.0 : 6.0;

Lip_Overhang = (Light_Type == "Silicone_Neon_6mm" || Light_Type == "Silicone_Neon_8mm") ? 0.4 : 0.0;

$fn = 60;

module letter_shape() {{
    // The Critical Link: Using the Internal Name
    text(text=Letter, size=Font_Size, font=Font_Name, halign="center", valign="center");
}}

module body_geometry() {{
    difference() {{
        // Positive Extrusion
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            letter_shape();

        // Negative Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            letter_shape();

        // Friction Lip (For Neon)
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

        // Wire Tunnels
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

def generate_brand_assets():
    # 1. Create Directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"--- FOLDER CREATED: {OUTPUT_DIR} ---")

    # 2. THE FIX: Copy the Font File to the Output Directory
    if not os.path.exists(SOURCE_FONT_PATH):
        print(f"ERROR: Cannot find {SOURCE_FONT_PATH}. Please put it in this folder.")
        return

    font_filename = os.path.basename(SOURCE_FONT_PATH)
    destination = os.path.join(OUTPUT_DIR, font_filename)
    
    try:
        shutil.copyfile(SOURCE_FONT_PATH, destination)
        print(f">> SUCCESS: Font copied to {destination}")
    except Exception as e:
        print(f"Error copying font: {e}")
        return

    # 3. Generate Alphabet
    print(">> Generating Manufacturing Files...")
    for i in range(65, 91): # A-Z
        char = chr(i)
        filename = f"Letter_{char}.scad"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        # Inject Data
        file_content = SCAD_TEMPLATE.format(
            filename=font_filename,   # The file to use<>
            font_name=INTERNAL_FONT_NAME, # The name to text()
            char=char
        )
        
        with open(filepath, "w") as f:
            f.write(file_content)
            
    print(f"--- COMPLETE. Open 'Letter_A.scad' inside '{OUTPUT_DIR}' ---")

if __name__ == "__main__":
    generate_brand_assets()