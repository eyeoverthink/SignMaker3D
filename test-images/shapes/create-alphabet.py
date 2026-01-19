import os

# ==========================================
#   SIGN SCULPTOR: ALPHABET FACTORY
# ==========================================

# Configuration
OUTPUT_DIR = "Alphabet_SCAD"
FONT_SIZE = 100
FONT_NAME = "Arial:style=Black"
LIGHT_TYPE = "Silicone_Neon_6mm" # Options: Silicone_Neon_6mm, Individual_Pixels, etc.

# The Engineering Logic (The "SCAD Template")
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED FILE: Letter_{char}
// SIGN SCULPTOR ENGINE V2

Render_Mode = "Body"; // Set to "Lid" to export the cover
Letter = "{char}";
Font_Size = {size};
Font_Name = "{font}";
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
    text(text=Letter, size=Font_Size, font=Font_Name, halign="center", valign="center");
}}

module body_geometry() {{
    difference() {{
        // 1. Positive Block
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            letter_shape();

        // 2. Light Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            letter_shape();

        // 3. Friction Lip
        if (Lip_Overhang > 0) {{
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {{
                    offset(r = CW/2 + 5) letter_shape();
                    offset(r = CW/2 - Lip_Overhang) letter_shape();
                }}
        }}
        
        // 4. Lid Shelf
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            letter_shape();

        // 5. WIRE CHANNELS (Dynamic Side Holes)
        // Left Hole
        translate([-Font_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, 90, 0])
            cylinder(h = Font_Size, r = Hole_Size/2);
            
        // Right Hole
        translate([Font_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, -90, 0])
            cylinder(h = Font_Size, r = Hole_Size/2);
    }}
}}

module lid_geometry() {{
    color("White")
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        letter_shape();
}}

// Render Controller
if (Render_Mode == "Body") {{
    body_geometry();
}} else if (Render_Mode == "Lid") {{
    lid_geometry();
}}
"""

def generate_alphabet():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"--- INITIATING ALPHABET FACTORY ---")
    print(f"Target: {OUTPUT_DIR}")
    print(f"Hardware: {LIGHT_TYPE}")

    # ASCII A-Z is 65-90
    for i in range(65, 91):
        char = chr(i)
        filename = f"Letter_{char}.scad"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        # Inject the specific letter into the template
        file_content = SCAD_TEMPLATE.format(
            char=char,
            size=FONT_SIZE,
            font=FONT_NAME,
            light=LIGHT_TYPE
        )
        
        with open(filepath, "w") as f:
            f.write(file_content)
            
        print(f">> Manufactured: {filename}")

    print(f"--- BATCH COMPLETE: 26 FILES GENERATED ---")

if __name__ == "__main__":
    generate_alphabet()