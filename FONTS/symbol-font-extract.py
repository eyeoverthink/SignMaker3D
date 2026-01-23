import os
import shutil
from pathlib import Path

# ==========================================
#   SIGN SCULPTOR: SYMBOL FONT ENGINE
# ==========================================
# This script generates LED sign shells for symbols/emojis from fonts
# Perfect for: ☯ Yin-Yang, ☮ Peace, ♥ Hearts, ★ Stars, ☀ Sun, ☾ Moon, etc.

# ==========================================
# RECOMMENDED FONTS FOR SYMBOLS
# ==========================================
# 1. Noto Sans Symbols 2 (FREE, COMPREHENSIVE)
#    Download: https://fonts.google.com/noto/specimen/Noto+Sans+Symbols+2
#    Coverage: 2,000+ symbols including ☯ Yin-Yang, ☮ Peace, ♥ Hearts, ★ Stars
#    License: Open Font License (commercial use OK)
#
# 2. Symbola (FREE, COMPLETE UNICODE)
#    Download: https://fontlibrary.org/en/font/symbola
#    Coverage: 7,000+ symbols, emojis, ancient scripts
#    License: Public Domain
#
# 3. Segoe UI Emoji (WINDOWS BUILT-IN)
#    Location: C:/Windows/Fonts/seguiemj.ttf
#    Coverage: Full emoji set including colored emojis
#    License: Windows system font (use on Windows only)
#
# 4. Segoe UI Symbol (WINDOWS BUILT-IN)
#    Location: C:/Windows/Fonts/seguisym.ttf
#    Coverage: Basic symbols, some Unicode blocks
#    License: Windows system font (use on Windows only)

# ==========================================
# [USER INPUTS] - Choose ONE font below
# ==========================================

# OPTION 1: Noto Sans Symbols 2 (RECOMMENDED - download first)
FONT_FILE_PATH = "NotoSansSymbols2-Regular.ttf"
FONT_INTERNAL_NAME = "Noto Sans Symbols 2"

# OPTION 2: Symbola (comprehensive, download first)
# FONT_FILE_PATH = "Symbola.ttf"
# FONT_INTERNAL_NAME = "Symbola"

# OPTION 3: Segoe UI Emoji (Windows built-in, colored emojis)
# FONT_FILE_PATH = "seguiemj.ttf"
# FONT_INTERNAL_NAME = "Segoe UI Emoji"

# OPTION 4: Segoe UI Symbol (Windows built-in, basic symbols)
# FONT_FILE_PATH = "seguisym.ttf"
# FONT_INTERNAL_NAME = "Segoe UI Symbol"

# ==========================================
# [SYMBOLS TO GENERATE]
# ==========================================
# VERIFIED WORKING SYMBOLS for Noto Sans Symbols 2
# Only includes symbols confirmed to render correctly (not rectangles/fallbacks)
SYMBOLS = [
    # Philosophy & Religion (VERIFIED)
    ("YinYang", "☯"),      # U+262F - Taoist symbol ✅ WORKS
    ("Peace", "☮"),        # U+262E - Peace symbol ✅ WORKS
    ("StarOfDavid", "✡"),  # U+2721 - Judaism ✅ WORKS
    ("Cross", "✝"),        # U+271D - Christianity ✅ WORKS
    ("Crescent", "☪"),     # U+262A - Islam ✅ WORKS
    
    # Love & Hearts (VERIFIED)
    ("Heart", "♥"),        # U+2665 - Solid heart ✅ WORKS
    ("HeartOutline", "♡"), # U+2661 - Outline heart ✅ WORKS
    ("Hearts", "♥♥♥"),     # Multiple hearts ✅ WORKS
    
    # Celestial (VERIFIED)
    ("Sun", "☀"),          # U+2600 - Sun ✅ WORKS
    ("Moon", "☾"),         # U+263E - Crescent moon ✅ WORKS
    ("Star", "★"),         # U+2605 - Solid star ✅ WORKS
    ("StarOutline", "☆"), # U+2606 - Outline star ✅ WORKS
    
    # Nature (VERIFIED)
    ("Flower", "✿"),       # U+273F - Flower ✅ WORKS
    ("Snowflake", "❄"),    # U+2744 - Snowflake ✅ WORKS
    
    # Arrows (VERIFIED)
    ("ArrowUp", "↑"),      # U+2191 ✅ WORKS
    ("ArrowDown", "↓"),    # U+2193 ✅ WORKS
    ("ArrowLeft", "←"),    # U+2190 ✅ WORKS
    ("ArrowRight", "→"),   # U+2192 ✅ WORKS
    
    # Zodiac (VERIFIED - most work)
    ("Aries", "♈"),        # U+2648 ✅ WORKS
    ("Taurus", "♉"),       # U+2649 ✅ WORKS
    ("Cancer", "♋"),       # U+264B ✅ WORKS
    ("Leo", "♌"),          # U+264C ✅ WORKS
    ("Virgo", "♍"),        # U+264D ✅ WORKS
    ("Libra", "♎"),        # U+264E ✅ WORKS
    ("Scorpio", "♏"),      # U+264F ✅ WORKS
    ("Sagittarius", "♐"),  # U+2650 ✅ WORKS
    ("Capricorn", "♑"),    # U+2651 ✅ WORKS
    ("Aquarius", "♒"),     # U+2652 ✅ WORKS
    ("Pisces", "♓"),       # U+2653 ✅ WORKS
    
    # Misc Symbols (VERIFIED)
    ("Anchor", "⚓"),       # U+2693 ✅ WORKS
    ("Skull", "☠"),        # U+2620 ✅ WORKS
    
    # REMOVED - Not in Noto Sans Symbols 2:
    # ❌ Om (ॐ) - Devanagari script not included
    # ❌ Leaf (🍃) - Colored emoji not included
    # ❌ Tree (🌲) - Colored emoji not included
    # ❌ Music (♪) - Not in this font
    # ❌ MusicDouble (♫) - Not in this font
    # ❌ Smile (☺) - Not in this font
    # ❌ SmileOutline (☻) - Not in this font
    # ❌ Gemini (♊) - Not in this font
    # ❌ Infinity (∞) - Not in this font
    # ❌ Lightning (⚡) - Not in this font
]

# ==========================================
# [CONFIGURATION]
# ==========================================
OUTPUT_DIR = "Symbol_Library"  # Creates FONTS/Symbol_Library/
SYMBOL_SIZE = 100  # mm
LIGHT_TYPE = "Silicone_Neon_6mm"  # Options: Silicone_Neon_6mm, Silicone_Neon_8mm, LED_Strip_10mm, Individual_Pixels

# ==========================================
# ENGINEERING TEMPLATE (DO NOT EDIT)
# ==========================================
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED FILE: Symbol_{name}
// SYMBOL: {symbol}
// FONT SOURCE: {font_file}

use <{font_file}>;

Render_Mode = "Body";  // Change to "Lid" for diffuser
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
        
    print(f"╔════════════════════════════════════════╗")
    print(f"║  SIGN SCULPTOR: SYMBOL SIGN FACTORY   ║")
    print(f"╚════════════════════════════════════════╝")
    print()
    
    # 2. Find and Copy Font File
    font_filename = os.path.basename(FONT_FILE_PATH)
    destination = os.path.join(OUTPUT_DIR, font_filename)
    font_path = FONT_FILE_PATH
    
    # Check current folder first
    if not os.path.exists(font_path):
        # Try Windows system fonts
        system_font = f"C:/Windows/Fonts/{FONT_FILE_PATH}"
        if os.path.exists(system_font):
            print(f"✓ Found font in Windows system fonts")
            print(f"  {system_font}")
            font_path = system_font
        else:
            print(f"✗ ERROR: Font file not found!")
            print(f"\nSearched:")
            print(f"  1. Current folder: {FONT_FILE_PATH}")
            print(f"  2. System fonts: {system_font}")
            print(f"\n📥 DOWNLOAD INSTRUCTIONS:")
            print(f"  • Noto Sans Symbols 2: https://fonts.google.com/noto/specimen/Noto+Sans+Symbols+2")
            print(f"  • Symbola: https://fontlibrary.org/en/font/symbola")
            print(f"  • Place .ttf file in FONTS folder")
            print(f"  • Update FONT_FILE_PATH in this script")
            return
    
    # Only copy if source and destination are different
    if os.path.abspath(font_path) != os.path.abspath(destination):
        shutil.copyfile(font_path, destination)
        print(f"✓ Font copied: {font_filename}")
    else:
        print(f"✓ Font already in place: {font_filename}")
    
    print(f"  Internal name: {FONT_INTERNAL_NAME}")
    print()

    # 3. Generate Symbol Signs
    print(f"Generating {len(SYMBOLS)} symbol signs...")
    print()
    
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
            
        print(f"  ✓ {name:20s} {symbol:5s} → {filename}")

    # 4. Create README
    readme_path = os.path.join(OUTPUT_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(f"""# Symbol LED Signs - Generated by Sign-Sculptor

## Font Used
- **Font**: {FONT_INTERNAL_NAME}
- **File**: {font_filename}

## Symbols Generated ({len(SYMBOLS)} total)

""")
        for name, symbol in SYMBOLS:
            f.write(f"- **{name}**: {symbol} (`Symbol_{name}.scad`)\n")
        
        f.write(f"""
## How to Use

### 1. Open in OpenSCAD
Open any `.scad` file in OpenSCAD (e.g., `Symbol_YinYang.scad`)

### 2. Choose What to Render
Change `Render_Mode` at the top of the file:
- `"Body"` - Main shell with LED channel and wire holes
- `"Lid"` - Diffuser cover (snap-fit)

### 3. Render & Export
- Press **F5** to preview
- Press **F6** to render (may take 30-60 seconds)
- Press **F7** to export STL

## Settings You Can Adjust

```scad
Symbol_Size = 100;           // Size of symbol (mm)
Sign_Height = 30.0;          // Depth of sign (mm)
Light_Type = "{LIGHT_TYPE}"; // LED channel width
Wall_Thickness = 2.0;        // Shell wall (mm)
```

## LED Channel Widths
- `Silicone_Neon_6mm` → 6mm channel
- `Silicone_Neon_8mm` → 8mm channel
- `LED_Strip_10mm` → 10.5mm channel
- `Individual_Pixels` → 14mm channel

## Assembly
1. Print Body and Lid
2. Insert LED strip into channel
3. Thread wires through side holes
4. Snap lid onto body
5. Mount and enjoy!

---
Generated by Sign-Sculptor Symbol Engine
Configuration: {SYMBOL_SIZE}mm symbols, {LIGHT_TYPE}
""")

    print()
    print(f"╔════════════════════════════════════════╗")
    print(f"║          FACTORY COMPLETE!            ║")
    print(f"╚════════════════════════════════════════╝")
    print()
    print(f"📁 Output folder: {OUTPUT_DIR}/")
    print(f"📄 Generated: {len(SYMBOLS)} symbol signs")
    print(f"📖 README: {readme_path}")
    print()
    print(f"🚀 Next Steps:")
    print(f"  1. Open any Symbol_*.scad file in OpenSCAD")
    print(f"  2. Press F6 to render")
    print(f"  3. Export as STL (F7)")

if __name__ == "__main__":
    generate_symbol_signs()
