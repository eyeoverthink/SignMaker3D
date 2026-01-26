import os
import shutil
from pathlib import Path

# ==========================================
#   GEO-SIGN GENERATOR PRO: 3D ARCHITECT EDITION
# ==========================================
#  Generate printable 3D signs with LED lighting channels.
#  Now supports:
#   1. 3D Text & Emojis (via fonts)
#   2. TRUE 3D Models (via .stl import) - Buildings, trees, etc.
#   3. 2D Images as 3D Reliefs (via .png/.jpg heightmaps)

# ==========================================
# [USER INPUTS]
# ==========================================

# --- MAIN SETTINGS ---
# SIGN_TEXT: The text for the sign. Emojis work if you use a supporting font.
SIGN_TEXT = "🏛️ CITY HALL"

# FONT_FILE: Path to your font file (.ttf or .otf).
# For Emojis on Windows: "C:/Windows/Fonts/seguiemj.ttf"
# For Google Noto Emoji: Download and provide path to "NotoColorEmoji.ttf"
FONT_FILE = "C:/Windows/Fonts/arialbd.ttf"  # Using Arial Bold for a clean look

# --- NEW: CONTENT TYPE SELECTION ---
# "Text"          -> Use SIGN_TEXT and FONT_FILE to generate 3D text/emojis.
# "External_STL"  -> Import a true 3D model file (e.g., "building.stl").
# "Image_Surface" -> Import an image file to create a 3D relief (lithophane style).
CONTENT_TYPE = "Text"

# --- PATHS FOR EXTERNAL CONTENT (If CONTENT_TYPE is not "Text") ---
# Put your .stl or .png/.jpg files in the same directory as this script.
EXTERNAL_STL_FILE = "my_building_model.stl"
IMAGE_SURFACE_FILE = "my_logo.png"

# --- GEOMETRY & LIGHTING SETTINGS ---
TEXT_SIZE = 50.0          # Height of the text/content in mm
SIGN_DEPTH = 30.0         # Total depth of the sign body
LIGHT_TYPE = "LED_Strip_10mm" # Options: Silicone_Neon_6mm, Silicone_Neon_8mm, LED_Strip_10mm

# ==========================================
# [CONFIGURATION]
# ==========================================
OUTPUT_DIR = "GeoSigns_Pro_Output"

# ==========================================
# OPENSCAD ENGINEERING TEMPLATE (DO NOT EDIT)
# ==========================================
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED FILE: GeoSign_Pro_{safe_text}
// CONTENT TYPE: {content_type}
// SOURCE: {source_file}

{font_use_statement}

// --- RENDER MODE SELECTOR ---
// Change to "Lid" to generate the back cover diffuser.
Render_Mode = "Body"; // Options: "Body", "Lid"

// --- USER PARAMETERS ---
Text_String = "{text_string}";
Font_Name = "{font_name}";
Content_Size = {text_size}; // Base size for text or scaling factor for models
Sign_Height = {sign_depth};
Light_Type = "{light_type}";

// --- ENGINEERING CONSTANTS ---
Wall_Thickness = 2.0;
Base_Thickness = 2.0;
Lid_Tolerance = 0.15;
Hole_Diameter = 5.0;
Hole_Height_Offset = 5.0;

// --- LOGIC ENGINE ---
// Determine Channel Width (CW) based on Light_Type
CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
     (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
     (Light_Type == "LED_Strip_10mm")    ? 10.5 : 6.0; // Default

// Determine Lip Overhang for friction fit neon
Lip_Overhang = (Light_Type == "Silicone_Neon_6mm" || Light_Type == "Silicone_Neon_8mm") ? 0.4 : 0.0;

// Resolution for curves
$fn = 60;

// --- CONTENT GENERATION MODULES ---

module content_text() {{
    text(text=Text_String, size=Content_Size, font=Font_Name, halign="center", valign="center");
}}

module content_stl() {{
    // Import an external STL model.
    // Scale it to fit reasonably within the Content_Size box.
    // You may need to adjust the scale manually in OpenSCAD for perfect sizing.
    scale([Content_Size/100, Content_Size/100, Content_Size/100]) // Rough scaling
    import("{source_file}", convexity=10);
}}

module content_image_surface() {{
    // Create a 3D surface from an image's brightness.
    // Ideally, use a high-contrast, grayscale image.
    // Scale Z to a reasonable height for the relief.
    scale([Content_Size/100, Content_Size/100, 5.0/100]) // Scale X, Y, and Z height
    surface(file = "{source_file}", center = true, invert = true);
}}

// --- MAIN GEOMETRY SELECTOR ---
module base_2d_shape() {{
    if ("{content_type}" == "Text") {{
        content_text();
    }} else if ("{content_type}" == "External_STL") {{
        // For STL, we need a 2D base outline. projection() creates this.
        projection(cut = false) content_stl();
    }} else if ("{content_type}" == "Image_Surface") {{
        // For image surface, projection creates the 2D outline.
        projection(cut = false) content_image_surface();
    }}
}}

module base_3d_content() {{
    if ("{content_type}" == "Text") {{
        // For text, we extrude the 2D shape.
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            base_2d_shape();
    }} else if ("{content_type}" == "External_STL") {{
        // For STL, we place the true 3D model on top of a base block.
        union() {{
            // Base Block
            linear_extrude(Base_Thickness)
                offset(r = CW/2 + Wall_Thickness)
                base_2d_shape();
            // Place 3D Model on top
            translate([0, 0, Base_Thickness])
                content_stl();
            // Create walls around the 3D model for the light channel
            difference() {{
                 linear_extrude(Sign_Height)
                    offset(r = CW/2 + Wall_Thickness)
                    base_2d_shape();
                 translate([0,0,Base_Thickness])
                 linear_extrude(Sign_Height)
                    offset(r = CW/2)
                    base_2d_shape();
            }}
        }}
    }} else if ("{content_type}" == "Image_Surface") {{
        // For image surface, similar to STL, place it on a base.
        union() {{
            // Base Block
            linear_extrude(Base_Thickness)
                 offset(r = CW/2 + Wall_Thickness)
                 base_2d_shape();
            // Place 3D Surface on top
            translate([0, 0, Base_Thickness])
                content_image_surface();
             // Create walls around the 3D model for the light channel
            difference() {{
                 linear_extrude(Sign_Height)
                    offset(r = CW/2 + Wall_Thickness)
                    base_2d_shape();
                 translate([0,0,Base_Thickness])
                 linear_extrude(Sign_Height)
                    offset(r = CW/2)
                    base_2d_shape();
            }}
        }}
    }}
}}


module body_geometry() {{
    difference() {{
        // 1. Positive Body Shape
        base_3d_content();

        // 2. Light Channel (Carve out)
        // Only needed for Text mode, as STL/Image modes build walls around the content.
        if ("{content_type}" == "Text") {{
            translate([0,0, Base_Thickness])
                linear_extrude(Sign_Height + 1)
                offset(r = CW/2)
                base_2d_shape();
        }}

        // 3. Friction Lip for Neon (if applicable)
        if (Lip_Overhang > 0 && "{content_type}" == "Text") {{
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {{
                    offset(r = CW/2 + 5) base_2d_shape();
                    offset(r = CW/2 - Lip_Overhang) base_2d_shape();
                }}
        }}
        
        // 4. Lid Shelf (Recess for the back cover)
        // Calculated from the outer wall boundary.
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            base_2d_shape();

        // 5. Wiring/Mounting Holes
        // Positioned relative to the approximate center.
        // You might need to adjust these for complex STL shapes.
        translate([-Content_Size/2, 0, Hole_Height_Offset + Base_Thickness])
            rotate([0, 90, 0]) cylinder(h = Content_Size, d = Hole_Diameter, center=true);
            
        translate([Content_Size/2, 0, Hole_Height_Offset + Base_Thickness])
            rotate([0, -90, 0]) cylinder(h = Content_Size, d = Hole_Diameter, center=true);
    }}
}}

module lid_geometry() {{
    // Generates the back cover diffuser.
    color("White", 0.5)
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        base_2d_shape();
}}

// --- MAIN RENDER CALL ---
if (Render_Mode == "Body") {{ body_geometry(); }}
else if (Render_Mode == "Lid") {{ lid_geometry(); }}
"""

def setup_font(font_path, output_dir):
    """Copies font file to output directory and returns font name."""
    if not os.path.exists(font_path):
        print(f"⚠️ Warning: Font file not found: {font_path}")
        print("   Using OpenSCAD default font.")
        return "", ""

    font_filename = os.path.basename(font_path)
    dest_path = os.path.join(output_dir, font_filename)
    
    if not os.path.exists(dest_path):
         try:
            shutil.copy(font_path, dest_path)
            print(f"✅ Font copied: {font_filename}")
         except Exception as e:
             print(f"❌ Error copying font: {e}")
             return "", ""
    else:
        print(f"ℹ️  Font already exists in output folder: {font_filename}")

    # OpenSCAD needs the file to be in the same directory or referenced via 'use <>'
    use_statement = f'use <{font_filename}>;'
    
    # Try to get the internal font name using external libraries if available.
    # For simplicity in this script, we'll try a common convention or let the user specify.
    # A robust solution would use fonttools or freetype-py.
    # For now, we'll assume the filename without extension is a good guess,
    # but for specific fonts like Segoe UI Emoji, you must use the exact internal name.
    
    # IMPORTANT: For Segoe UI Emoji, the internal name is "Segoe UI Emoji"
    # For Noto Color Emoji, it is "Noto Color Emoji"
    # For Arial Bold, it is "Arial:style=Bold"
    
    # Simple heuristic for this script's demonstration:
    font_name = os.path.splitext(font_filename)[0]
    if "seguiemj" in font_filename.lower():
        font_name = "Segoe UI Emoji"
    elif "arialbd" in font_filename.lower():
        font_name = "Arial:style=Bold"
    elif "notocoloremoji" in font_filename.lower():
        font_name = "Noto Color Emoji"

    print(f"   Internal Font Name assumed: '{font_name}' (You may need to correct this in the SCAD file)")
    
    return use_statement, font_name

def setup_external_file(source_path, output_dir):
    """Copies an external STL or image file to the output directory."""
    if not os.path.exists(source_path):
        print(f"❌ Error: External file not found: {source_path}")
        return None
    
    filename = os.path.basename(source_path)
    dest_path = os.path.join(output_dir, filename)
    
    if not os.path.exists(dest_path):
        try:
            shutil.copy(source_path, dest_path)
            print(f"✅ External file copied: {filename}")
        except Exception as e:
            print(f"❌ Error copying external file: {e}")
            return None
    else:
        print(f"ℹ️  External file already exists in output folder: {filename}")
        
    return filename

def generate_sign():
    # 1. Setup Output Directory
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"📂 Output Directory: {OUTPUT_DIR}/")
    
    # 2. Prepare Content based on CONTENT_TYPE
    font_use_statement = ""
    font_name_internal = ""
    source_file_name = ""
    safe_text_for_filename = "Custom_Content"
    
    if CONTENT_TYPE == "Text":
        print(f"📝 Processing Text Content: '{SIGN_TEXT}'")
        font_use_statement, font_name_internal = setup_font(FONT_FILE, OUTPUT_DIR)
        safe_text_for_filename = "".join(c for c in SIGN_TEXT if c.isalnum() or c in (' ', '_', '-')).strip().replace(" ", "_")
        source_file_name = "N/A (Using Text)"
        
    elif CONTENT_TYPE == "External_STL":
        print(f"🗿 Processing External STL: '{EXTERNAL_STL_FILE}'")
        source_file_name = setup_external_file(EXTERNAL_STL_FILE, OUTPUT_DIR)
        if not source_file_name: return
        safe_text_for_filename = os.path.splitext(source_file_name)[0]
        
    elif CONTENT_TYPE == "Image_Surface":
        print(f"🖼️ Processing Image Surface: '{IMAGE_SURFACE_FILE}'")
        source_file_name = setup_external_file(IMAGE_SURFACE_FILE, OUTPUT_DIR)
        if not source_file_name: return
        safe_text_for_filename = os.path.splitext(source_file_name)[0]

    # 3. Fill the OpenSCAD Template
    scad_content = SCAD_TEMPLATE.format(
        safe_text=safe_text_for_filename,
        content_type=CONTENT_TYPE,
        source_file=source_file_name,
        font_use_statement=font_use_statement,
        text_string=SIGN_TEXT.replace('"', '\\"'), # Escape quotes in text
        font_name=font_name_internal,
        text_size=TEXT_SIZE,
        sign_depth=SIGN_DEPTH,
        light_type=LIGHT_TYPE
    )
    
    # 4. Write the SCAD file
    output_filename = f"GeoSign_Pro_{safe_text_for_filename}.scad"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(scad_content)
    
    print(f"\n🎉 Successfully generated OpenSCAD file!")
    print(f"👉 File: {output_path}")
    print("\n[NEXT STEPS]")
    print("1. Open this file in OpenSCAD.")
    print("2. Press F5 to preview. If using an external file, you may need to adjust scale/rotation in the SCAD code.")
    print("3. Press F6 to render the 'Body'.")
    print("4. File -> Export -> Export as STL.")
    print("5. Change 'Render_Mode' to \"Lid\" at the top of the SCAD file.")
    print("6. Repeat F6 and Export for the lid.")

if __name__ == "__main__":
    print("--- Geo-Sign Generator Pro ---")
    # Create dummy external files for demonstration if they don't exist
    if CONTENT_TYPE == "External_STL" and not os.path.exists(EXTERNAL_STL_FILE):
        print(f"⚠️ Demo Info: Please place your '{EXTERNAL_STL_FILE}' in this folder.")
        print("   (For now, the script will fail to copy it, but show the logic.)")
    if CONTENT_TYPE == "Image_Surface" and not os.path.exists(IMAGE_SURFACE_FILE):
         print(f"⚠️ Demo Info: Please place your '{IMAGE_SURFACE_FILE}' in this folder.")

    generate_sign()