import os
import shutil
from pathlib import Path

# ==========================================
#   SIGN SCULPTOR: TEXT MESSAGE EMOJI ENGINE
# ==========================================
# Create LED signs from the emojis people actually send in text messages!
# Perfect for: 😂 LOL, 🙏 Praying Hands, 🔥 Fire, ❤️ Hearts, 💯 100, etc.

# ==========================================
# RECOMMENDED EMOJI FONTS
# ==========================================
# 1. Noto Color Emoji (GOOGLE - BEST, 3,600+ emojis)
#    Download: https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf
#    Coverage: Every emoji from text messages
#    License: Apache 2.0 (commercial use OK)
#
# 2. Segoe UI Emoji (WINDOWS BUILT-IN - EASIEST)
#    Location: C:/Windows/Fonts/seguiemj.ttf
#    Coverage: Full emoji set
#    License: Windows system font (use on Windows only)
#
# 3. OpenMoji (OPEN SOURCE - CLEAN LINE ART)
#    Download: https://openmoji.org/
#    Coverage: 4,000+ emojis with clean outlines
#    License: CC-BY-SA 4.0 (free)

# ==========================================
# [USER INPUTS] - Choose ONE font below
# ==========================================

# OPTION 1: Segoe UI Emoji (Windows built-in - START HERE)
FONT_FILE_PATH = "seguiemj.ttf"
FONT_INTERNAL_NAME = "Segoe UI Emoji"

# OPTION 2: Noto Color Emoji (Google - download first)
# FONT_FILE_PATH = "NotoColorEmoji.ttf"
# FONT_INTERNAL_NAME = "Noto Color Emoji"

# OPTION 3: OpenMoji (download first)
# FONT_FILE_PATH = "OpenMoji-Color.ttf"
# FONT_INTERNAL_NAME = "OpenMoji"

# ==========================================
# [TEXT MESSAGE EMOJIS TO GENERATE]
# ==========================================
# The most popular emojis people actually send in texts
EMOJIS = [
    # Top 10 Most Used
    ("LOL", "😂"),              # Face with tears of joy - #1 most used
    ("Heart", "❤️"),            # Red heart
    ("Fire", "🔥"),             # Fire - "That's fire!"
    ("Crying", "😭"),           # Loudly crying
    ("PrayingHands", "🙏"),     # Praying hands / Thank you
    ("HeartEyes", "😍"),        # Heart eyes / Love it
    ("ThumbsUp", "👍"),         # Thumbs up / Like
    ("Hundred", "💯"),          # 100 / Keep it 100
    ("Thinking", "🤤"),         # Thinking face
    ("Skull", "💀"),            # Skull / I'm dead (laughing)
    
    # Faces & Emotions
    ("Smile", "😊"),            # Smiling face
    ("Grin", "😁"),             # Grinning face
    ("Cool", "😎"),             # Cool sunglasses
    ("Wink", "😉"),             # Winking face
    ("Kiss", "😘"),             # Blowing kiss
    ("Shocked", "😱"),          # Face screaming in fear
    ("Angry", "😠"),            # Angry face
    ("Sad", "😢"),              # Crying face
    ("Sleepy", "😴"),           # Sleeping face
    ("Party", "🥳"),            # Partying face
    
    # Hands & Gestures
    ("OK", "👌"),               # OK hand
    ("Peace", "✌️"),            # Peace sign
    ("PointUp", "☝️"),          # Pointing up
    ("PointRight", "👉"),       # Pointing right
    ("Clap", "👏"),             # Clapping hands
    ("Fist", "✊"),             # Raised fist
    ("Wave", "👋"),             # Waving hand
    ("Muscle", "💪"),           # Flexed bicep
    
    # Hearts & Love
    ("HeartBroken", "💔"),      # Broken heart
    ("TwoHearts", "💕"),        # Two hearts
    ("Sparkling", "💖"),        # Sparkling heart
    ("HeartGrow", "💗"),        # Growing heart
    ("HeartBeat", "💓"),        # Beating heart
    
    # Popular Objects
    ("Rocket", "🚀"),           # Rocket / To the moon
    ("Star", "⭐"),             # Star
    ("Lightning", "⚡"),        # Lightning bolt
    ("Crown", "👑"),            # Crown
    ("Trophy", "🏆"),           # Trophy
    ("Gift", "🎁"),             # Gift
    ("Balloon", "🎈"),          # Balloon
    ("Confetti", "🎉"),         # Party popper
    ("Cake", "🎂"),             # Birthday cake
    ("Pizza", "🍕"),            # Pizza
    ("Beer", "🍺"),             # Beer mug
    ("Coffee", "☕"),           # Coffee
    
    # Nature & Weather
    ("Rainbow", "🌈"),          # Rainbow
    ("Sunflower", "🌻"),        # Sunflower
    ("Rose", "🌹"),             # Rose
    ("Cactus", "🌵"),           # Cactus
    ("Palm", "🌴"),             # Palm tree
    ("Cloud", "☁️"),            # Cloud
    ("Sun", "☀️"),              # Sun
    ("Moon", "🌙"),             # Crescent moon
    
    # Animals
    ("Dog", "🐶"),              # Dog face
    ("Cat", "🐱"),              # Cat face
    ("Unicorn", "🦄"),          # Unicorn
    ("Butterfly", "🦋"),        # Butterfly
    
    # Symbols
    ("Check", "✅"),            # Check mark
    ("X", "❌"),                # X mark
    ("Warning", "⚠️"),          # Warning
    ("Question", "❓"),         # Question mark
    ("Exclamation", "❗"),      # Exclamation mark
]

# ==========================================
# [CONFIGURATION]
# ==========================================
OUTPUT_DIR = "Emoji_Signs"  # Creates FONTS/Emoji_Signs/
EMOJI_SIZE = 100  # mm
LIGHT_TYPE = "Silicone_Neon_6mm"  # Options: Silicone_Neon_6mm, Silicone_Neon_8mm, LED_Strip_10mm, Individual_Pixels

# ==========================================
# ENGINEERING TEMPLATE (DO NOT EDIT)
# ==========================================
SCAD_TEMPLATE = """
// AUTOMATICALLY GENERATED FILE: Emoji_{name}
// EMOJI: {emoji}
// FONT SOURCE: {font_file}

use <{font_file}>;

Render_Mode = "Body";  // Change to "Lid" for diffuser
Emoji = "{emoji}";
Emoji_Size = {size};
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

module emoji_shape() {{
    text(text=Emoji, size=Emoji_Size, font=Font_Name, halign="center", valign="center");
}}

module body_geometry() {{
    difference() {{
        // Positive Block
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            emoji_shape();

        // Light Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            emoji_shape();

        // Friction Lip
        if (Lip_Overhang > 0) {{
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {{
                    offset(r = CW/2 + 5) emoji_shape();
                    offset(r = CW/2 - Lip_Overhang) emoji_shape();
                }}
        }}
        
        // Lid Shelf
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            emoji_shape();

        // Side Holes for LED wiring
        translate([-Emoji_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, 90, 0]) cylinder(h = Emoji_Size, r = Hole_Size/2);
            
        translate([Emoji_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, -90, 0]) cylinder(h = Emoji_Size, r = Hole_Size/2);
    }}
}}

module lid_geometry() {{
    color("White")
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        emoji_shape();
}}

if (Render_Mode == "Body") {{ body_geometry(); }}
else if (Render_Mode == "Lid") {{ lid_geometry(); }}
"""

def generate_emoji_signs():
    # 1. Setup Directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"╔════════════════════════════════════════╗")
    print(f"║   TEXT MESSAGE EMOJI SIGN FACTORY     ║")
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
            print(f"  • Noto Color Emoji: https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf")
            print(f"  • OpenMoji: https://openmoji.org/")
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

    # 3. Generate Emoji Signs
    print(f"Generating {len(EMOJIS)} emoji signs...")
    print()
    
    for name, emoji in EMOJIS:
        filename = f"Emoji_{name}.scad"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        file_content = SCAD_TEMPLATE.format(
            name=name,
            emoji=emoji,
            size=EMOJI_SIZE,
            font_file=font_filename,
            font_name=FONT_INTERNAL_NAME,
            light=LIGHT_TYPE
        )
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(file_content)
            
        print(f"  ✓ {name:20s} {emoji:5s} → {filename}")

    # 4. Create README
    readme_path = os.path.join(OUTPUT_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(f"""# Text Message Emoji LED Signs - Generated by Sign-Sculptor

## 🚀 GROUNDBREAKING CONCEPT
Create LED signs from the emojis people actually send in text messages!
First-ever system to turn text conversations into physical light displays.

## Font Used
- **Font**: {FONT_INTERNAL_NAME}
- **File**: {font_filename}

## Emojis Generated ({len(EMOJIS)} total)

### Top 10 Most Used
""")
        for name, emoji in EMOJIS[:10]:
            f.write(f"- **{name}**: {emoji} (`Emoji_{name}.scad`)\n")
        
        f.write(f"""
### All Emojis
""")
        for name, emoji in EMOJIS:
            f.write(f"- {emoji} {name}\n")
        
        f.write(f"""
## How to Use

### 1. Open in OpenSCAD
Open any `.scad` file in OpenSCAD (e.g., `Emoji_LOL.scad`)

### 2. Choose What to Render
Change `Render_Mode` at the top of the file:
- `"Body"` - Main shell with LED channel and wire holes
- `"Lid"` - Diffuser cover (snap-fit)

### 3. Render & Export
- Press **F5** to preview
- Press **F6** to render (may take 30-60 seconds)
- Press **F7** to export STL

## Popular Use Cases

### Text Message Recreations
- 😂 "LOL" sign for comedy clubs
- 🔥 "Fire" sign for restaurants/bars
- 💯 "100" sign for gyms/motivation
- 🙏 "Thank You" sign for businesses

### Social Media
- ❤️ Heart for Instagram walls
- 👍 Thumbs up for like buttons
- 🚀 Rocket for startups

### Parties & Events
- 🎉 Party popper for celebrations
- 🎂 Cake for birthdays
- 🍕 Pizza for restaurants

## Settings You Can Adjust

```scad
Emoji_Size = 100;            // Size of emoji (mm)
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
5. Mount and enjoy your text message emoji sign!

---
Generated by Sign-Sculptor Emoji Engine
Configuration: {EMOJI_SIZE}mm emojis, {LIGHT_TYPE}
**World's First Text Message LED Sign System**
""")

    print()
    print(f"╔════════════════════════════════════════╗")
    print(f"║          FACTORY COMPLETE!            ║")
    print(f"╚════════════════════════════════════════╝")
    print()
    print(f"📁 Output folder: {OUTPUT_DIR}/")
    print(f"📄 Generated: {len(EMOJIS)} emoji signs")
    print(f"📖 README: {readme_path}")
    print()
    print(f"🚀 GROUNDBREAKING:")
    print(f"  You can now create LED signs from ANY emoji people send in texts!")
    print(f"  😂 LOL, 🔥 Fire, 💯 100, 🙏 Praying Hands, ❤️ Hearts, and more!")
    print()
    print(f"🎯 Next Steps:")
    print(f"  1. Open any Emoji_*.scad file in OpenSCAD")
    print(f"  2. Press F6 to render")
    print(f"  3. Export as STL (F7)")
    print(f"  4. Print and light up your text messages!")

if __name__ == "__main__":
    generate_emoji_signs()
