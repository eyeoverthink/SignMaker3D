import os
import shutil
from pathlib import Path

# ==========================================
#   SIGN SCULPTOR: SYMBOL/EMOJI ENGINE
# ==========================================
# This script generates LED sign shells for symbols and emojis from fonts
# Perfect for: ☯ Yin-Yang, ☮ Peace, ♥ Hearts, ★ Stars, ☀ Sun, ☾ Moon, etc.

# [USER INPUTS]
# 1. The font file you want to use (must contain symbols/emojis)
FONT_FILE_PATH = "Segoe UI Symbol.ttf"  # Windows default symbol font
# 2. The internal name of the font
FONT_INTERNAL_NAME = "Segoe UI Symbol"

# 3. List of symbols to generate (Unicode characters)
SYMBOLS = [
    ("YinYang", "☯"),      # U+262F
    ("Peace", "☮"),        # U+262E
    ("Heart", "♥"),        # U+2665
    ("Star", "★"),         # U+2605
    ("Sun", "☀"),          # U+2600
    ("Moon", "☾"),         # U+263E
    ("Flower", "✿"),       # U+273F
    ("Snowflake", "❄"),    # U+2744
    ("Music", "♪"),        # U+266A
    ("Smile", "☺"),        # U+263A
]

# [CONFIGURATION]
OUTPUT_DIR = "Symbol_Signs"
SYMBOL_SIZE = 100
LIGHT_TYPE = "Silicone_Neon_6mm"

# The Engineering Template (Updated for Symbols)
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED FILE: Symbol_{name}
// SYMBOL: {symbol}
// FONT SOURCE: {font_file}

// 1. Load the Symbol Font
use <{font_file}>;

Render_Mode = "Body"; 
Symbol = "{symbol}";
Symbol_Size = {size};
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

module symbol_shape() {{
    text(text=Symbol, size=Symbol_Size, font=Font_Name, halign="center", valign="center");
}}

module body_geometry() {{
    difference() {{
        // Positive Block
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            symbol_shape();

        // Light Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            symbol_shape();

        // Friction Lip
        if (Lip_Overhang > 0) {{
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {{
                    offset(r = CW/2 + 5) symbol_shape();
                    offset(r = CW/2 - Lip_Overhang) symbol_shape();
                }}
        }}
        
        // Lid Shelf
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            symbol_shape();

        // Side Holes for LED wiring
        translate([-Symbol_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, 90, 0]) cylinder(h = Symbol_Size, r = Hole_Size/2);
            
        translate([Symbol_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, -90, 0]) cylinder(h = Symbol_Size, r = Hole_Size/2);
    }}
}}

module lid_geometry() {{
    color("White")
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        symbol_shape();
}}

if (Render_Mode == "Body") {{ body_geometry(); }}
else if (Render_Mode == "Lid") {{ lid_geometry(); }}
"""

def generate_symbol_signs():
    # 1. Setup Directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"--- INITIATING SYMBOL SIGN FACTORY ---")
    
    # 2. Copy the Font File to the Output Directory
    font_filename = os.path.basename(FONT_FILE_PATH)
    destination = os.path.join(OUTPUT_DIR, font_filename)
    
    # Check if font exists
    if not os.path.exists(FONT_FILE_PATH):
        print(f"ERROR: Font file not found: {FONT_FILE_PATH}")
        print("\nTrying Windows system font path...")
        # Try Windows system fonts
        system_font = f"C:/Windows/Fonts/{font_filename}"
        if os.path.exists(system_font):
            shutil.copyfile(system_font, destination)
            print(f">> Font Found in System: {system_font}")
        else:
            print(f"ERROR: Could not find font anywhere")
            print("\nAvailable options:")
            print("1. Download Noto Sans Symbols font (free, has all symbols)")
            print("2. Use Segoe UI Symbol (Windows) or Apple Symbols (Mac)")
            print("3. Download Symbola font (comprehensive symbol coverage)")
            return
    else:
        shutil.copyfile(FONT_FILE_PATH, destination)
        print(f">> Font Implanted: {destination}")

    # 3. Manufacture Symbol Signs
    for name, symbol in SYMBOLS:
        filename = f"Symbol_{name}.scad"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        file_content = SCAD_TEMPLATE.format(
            name=name,
            symbol=symbol,
            size=SYMBOL_SIZE,
            font_file=font_filename,
            font_name=FONT_INTERNAL_NAME,
            light=LIGHT_TYPE
        )
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(file_content)
            
        print(f">> Generated: {filename} ({symbol})")

    # 4. Create README
    readme_path = os.path.join(OUTPUT_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(f"""# Symbol LED Signs - Generated by Sign-Sculptor

## What's Inside
This folder contains OpenSCAD files for {len(SYMBOLS)} symbol LED signs.

Each symbol has:
- **Body shell** with LED channel and wire holes
- **Diffuser lid** (snap-fit)
- Optimized for {LIGHT_TYPE}

## Symbols Generated
""")
        for name, symbol in SYMBOLS:
            f.write(f"- **{name}**: {symbol} (`Symbol_{name}.scad`)\n")
        
        f.write(f"""
## How to Use
1. Open any `.scad` file in OpenSCAD
2. Change `Render_Mode` to:
   - `"Body"` - Main shell with LED channel
   - `"Lid"` - Diffuser cover
3. Press F6 to render
4. Export as STL (F7)

## Settings You Can Adjust
- `Symbol_Size` - Size of the symbol (default: {SYMBOL_SIZE}mm)
- `Sign_Height` - Depth of the sign (default: 30mm)
- `Light_Type` - LED type (changes channel width)
- `Wall_Thickness` - Shell wall thickness (default: 2mm)

## Font Used
- **Font**: {FONT_INTERNAL_NAME}
- **File**: {font_filename}

---
Generated by Sign-Sculptor Symbol Engine
""")

    print(f"\n--- FACTORY COMPLETE: {OUTPUT_DIR} ---")
    print(f"Generated {len(SYMBOLS)} symbol signs")
    print(f"To render: Open any .scad file in OpenSCAD")
    print(f"\nREADME created: {readme_path}")

if __name__ == "__main__":
    generate_symbol_signs()
