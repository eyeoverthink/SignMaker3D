# Custom Font Alphabet System

**Based on:** `FONTS/font-extract.py`  
**Purpose:** Upload ANY custom font and generate A-Z letter shells with perfect light channels, wire holes, and diffuser lids

---

## 🎯 System Overview

This system takes the brilliant Python `font-extract.py` workflow and integrates it into Sign-Sculptor's web interface. It allows users to:

1. **Upload any .ttf or .otf font file**
2. **Generate complete letter shells (A-Z)** with:
   - Perfect letter body with light channels
   - Side wire pass-through holes for modular connection
   - Friction lip to hold LEDs without glue
   - Snap-on diffuser lid (flat or domed)
3. **Download ZIP** with all STL files + OpenSCAD files + assembly instructions

---

## 📐 Engineering Design (from font-extract.py)

### Letter Body Structure

```
┌─────────────────────────────────┐
│     DIFFUSER LID (White PLA)    │ ← Snap-fit lid, 2mm thick
├─────────────────────────────────┤
│                                 │
│   ╔═══════════════════════╗    │
│   ║   LED CHANNEL         ║    │ ← Light channel follows letter shape
│   ║   (6mm/8mm/10mm)      ║    │
│   ╚═══════════════════════╝    │
│                                 │
│  [○]                       [○]  │ ← Wire pass-through holes (5mm)
│                                 │
├─────────────────────────────────┤
│         BASE (2mm)              │
└─────────────────────────────────┘
```

### Key Features from Python Script

1. **Parametric Font Loading**
   ```python
   Font_Name = "Dirtyboy"  # Internal font name
   Font_Size = 100         # Letter size in mm
   ```

2. **LED Channel Width (Auto-calculated)**
   ```python
   CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
        (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
        (Light_Type == "LED_Strip_10mm")    ? 10.5 :
        (Light_Type == "Individual_Pixels")  ? 14.0 : 6.0;
   ```

3. **Friction Lip (Genius Design)**
   ```python
   Lip_Overhang = 0.4mm  # For silicone neon
   # Creates friction fit - LEDs snap in without glue!
   ```

4. **Wire Pass-Through Holes**
   ```python
   Hole_Height = 5.0mm from base
   Hole_Size = 5.0mm diameter
   # Positioned on left and right sides
   # Allows modular letter connection
   ```

5. **Diffuser Lid Shelf**
   ```python
   Lid_Tolerance = 0.15mm
   # Lid snaps on top with perfect fit
   ```

---

## 🔧 How It Works

### Original Python Workflow (font-extract.py)

1. **User places font file** in FONTS folder
2. **Sets configuration:**
   ```python
   FONT_FILE_PATH = "Dirtyboy-BxYl.ttf"
   FONT_INTERNAL_NAME = "Dirtyboy"
   FONT_SIZE = 100
   LIGHT_TYPE = "Silicone_Neon_6mm"
   ```
3. **Runs script:** `python font-extract.py`
4. **Output:** Folder with:
   - `Letter_A.scad` through `Letter_Z.scad` (26 files)
   - Copy of font file (for OpenSCAD to load)
   - Each .scad file generates Body + Lid

### New Sign-Sculptor Integration

1. **User clicks "Font" tab** in Sign-Sculptor
2. **Uploads .ttf/.otf file** via web interface
3. **Configures settings:**
   - Font name (auto-detected from filename)
   - Font size (50-200mm)
   - LED type (6mm/8mm/10mm/14mm)
   - Sign height (15-50mm)
   - Wire hole specs
   - Lid type (flat/domed)
4. **Clicks "Generate Alphabet ZIP"**
5. **Downloads ZIP** containing:
   - `Letter_A_Body.stl` + `Letter_A_Lid.stl` (×26)
   - `Letter_A.scad` (×26) - Optional OpenSCAD files
   - `Assembly_Instructions.md`
   - `Wiring_Diagram.pdf`

---

## 💡 LED Installation Types

### 1. Silicone Neon 6mm (Recommended)
- **Channel Width:** 6.0mm
- **Friction Lip:** 0.4mm overhang
- **Installation:** Push tube into channel, friction holds it
- **Best For:** Smooth, continuous glow
- **Example:** "HELLO" sign with flowing neon look

### 2. Silicone Neon 8mm
- **Channel Width:** 8.0mm
- **Friction Lip:** 0.4mm overhang
- **Installation:** Same as 6mm
- **Best For:** Brighter output, larger letters

### 3. LED Strip 10mm
- **Channel Width:** 10.5mm
- **Friction Lip:** None (use hot glue)
- **Installation:** Route strip through channel, glue at corners
- **Best For:** Addressable RGB effects

### 4. Individual Pixels (14mm)
- **Channel Width:** 14.0mm
- **Friction Lip:** None
- **Installation:** Place pixels at key points, wire through holes
- **Best For:** Pixel art effects, animations

---

## 🔌 Modular Letter Connection

The wire pass-through holes enable **modular letter systems**:

```
┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
│  H  │────→│  E  │────→│  L  │────→│  L  │────→│  O  │
└─────┘     └─────┘     └─────┘     └─────┘     └─────┘
   ↑                                                 ↑
   └─────────────── Power Bus ──────────────────────┘
```

**Wiring Pattern:**
1. Power enters first letter (H) through wire hole
2. Exits right side, enters second letter (E) left side
3. Continues through all letters
4. All letters share same power bus
5. No external wiring visible!

**Alignment:**
- All wire holes at same height (5mm from base)
- Letters sit on same plane
- Spacing: 5-10mm between letters
- Hot glue dabs secure positions

---

## 📦 Output Files

### STL Files (Per Letter)
```
Letter_A_Body.stl       - Main letter shell with channels
Letter_A_Lid.stl        - Diffuser lid (flat or domed)
Letter_B_Body.stl
Letter_B_Lid.stl
...
Letter_Z_Body.stl
Letter_Z_Lid.stl
```

### OpenSCAD Files (Optional)
```
Letter_A.scad           - Parametric model for manual editing
Letter_B.scad
...
Letter_Z.scad
FontFile.ttf            - Copy of uploaded font
```

### Documentation
```
Assembly_Instructions.md    - Step-by-step assembly guide
Wiring_Diagram.pdf         - Visual wiring schematic
Parts_List.txt             - BOM for LEDs, wire, power supply
```

---

## 🎨 Print Settings

### Letter Body
- **Material:** PLA or PETG
- **Layer Height:** 0.2mm
- **Infill:** 20%
- **Walls:** 3 perimeters
- **Supports:** Usually not needed
- **Orientation:** Upright (letter facing up)

### Diffuser Lid
- **Material:** White PLA (100% infill)
- **Layer Height:** 0.2mm
- **Infill:** 100% (solid)
- **Post-Processing:** Sand with 400-800 grit for frosted effect
- **Alternative:** Print in translucent PETG

---

## 🔬 Technical Specifications

### From font-extract.py Constants

```python
Sign_Height = 30.0mm        # Total height of letter
Wall_Thickness = 2.0mm      # Outer wall thickness
Base_Thickness = 2.0mm      # Bottom plate thickness
Lid_Tolerance = 0.15mm      # Gap for lid fit
Hole_Height = 5.0mm         # Wire hole height from base
Hole_Size = 5.0mm           # Wire hole diameter
$fn = 60                    # OpenSCAD resolution
```

### Calculated Values

```python
# LED channel width based on type
CW = 6.0 | 8.0 | 10.5 | 14.0mm

# Friction lip (only for silicone neon)
Lip_Overhang = 0.4mm

# Lid shelf depth
Lip_Width = 1.5mm

# Letter offset (channel + wall)
Total_Offset = CW/2 + Wall_Thickness
```

---

## 🚀 Usage Examples

### Example 1: "HELLO" Sign (Silicone Neon 6mm)

**Settings:**
- Font: Dirtyboy.ttf
- Font Size: 100mm
- LED Type: Silicone Neon 6mm
- Sign Height: 30mm
- Letters: HELLO (generates H, E, L, O)

**Output:**
- 4 unique letters (H, E, L, O)
- 8 STL files (4 bodies + 4 lids)
- Assembly instructions for 5-letter word

**Assembly:**
1. Print all bodies and lids
2. Cut 5 sections of 6mm silicone neon
3. Push neon into each letter channel
4. Wire through holes: H→E→L→L→O
5. Snap lids on top
6. Mount on wall with 5-10mm spacing

### Example 2: Full Alphabet (LED Strip 10mm)

**Settings:**
- Font: Arial.ttf
- Font Size: 80mm
- LED Type: LED Strip 10mm
- Sign Height: 25mm
- Letters: A-Z

**Output:**
- 26 letters (A-Z)
- 52 STL files (26 bodies + 26 lids)
- Complete alphabet set

**Use Case:**
- Create custom words on demand
- Mix and match letters
- Modular sign system for business

### Example 3: Custom Font (Domed Lids)

**Settings:**
- Font: CustomScript.otf
- Font Size: 120mm
- LED Type: Silicone Neon 8mm
- Sign Height: 35mm
- Lid Type: Domed (10mm height)
- Letters: A-Z

**Output:**
- 26 letters with domed diffusers
- Elegant, rounded appearance
- Better light diffusion

---

## 🔍 Comparison: Python vs Web Integration

| Feature | font-extract.py | Sign-Sculptor Web |
|---------|----------------|-------------------|
| **Input** | Manual file placement | Upload via browser |
| **Configuration** | Edit Python variables | GUI sliders/dropdowns |
| **Output** | OpenSCAD files | STL + OpenSCAD (optional) |
| **Rendering** | Manual in OpenSCAD | Automatic server-side |
| **Download** | Local folder | ZIP file download |
| **Ease of Use** | Requires Python knowledge | Point-and-click interface |
| **Flexibility** | Full OpenSCAD control | Preset configurations |

**Best of Both Worlds:**
- Web interface for quick generation
- OpenSCAD files included for advanced users
- Same engineering design and quality

---

## 🎓 Advanced Features

### Friction Lip Mechanics

The friction lip is a brilliant design feature:

```
Without Lip:                With Lip:
┌─────────────┐            ┌─────────────┐
│             │            │             │
│   ╔═══╗     │            │   ╔═╗═╗     │ ← 0.4mm overhang
│   ║LED║     │            │   ║L║E║     │   grips LED tube
│   ╚═══╝     │            │   ╚═╩═╝     │
│             │            │             │
└─────────────┘            └─────────────┘
  LEDs slide out             LEDs locked in
```

**How It Works:**
1. LED channel is slightly narrower at top
2. 0.4mm lip creates friction
3. Silicone tube compresses slightly
4. Friction holds tube without glue
5. Can still remove for maintenance

### Domed Lid Design

Domed lids provide better light diffusion:

```
Flat Lid:                  Domed Lid:
┌─────────────┐            ┌─────────────┐
│─────────────│            │    ╱───╲    │ ← 10mm dome height
├─────────────┤            │   ╱     ╲   │   spreads light
│   ╔═══╗     │            │  ╱       ╲  │   more evenly
│   ║LED║     │            ├─────────────┤
│   ╚═══╝     │            │   ╔═══╗     │
└─────────────┘            │   ║LED║     │
                           │   ╚═══╝     │
                           └─────────────┘
```

**Benefits:**
- More even light distribution
- Softer glow
- Hides LED hot spots
- Premium appearance

---

## 📊 Performance Metrics

### Generation Time
- **Single Letter:** ~2 seconds
- **Full Alphabet (26 letters):** ~45 seconds
- **With OpenSCAD files:** +10 seconds

### File Sizes
- **Body STL:** 500KB - 2MB (depends on font complexity)
- **Lid STL:** 200KB - 800KB
- **OpenSCAD:** 5KB each
- **Full Alphabet ZIP:** 30-80MB

### Print Time (Per Letter)
- **Body:** 2-4 hours (100mm font, 0.2mm layers)
- **Lid:** 30-60 minutes
- **Full Alphabet:** ~100 hours total

---

## 🛠️ Troubleshooting

### Issue: Font not loading
**Solution:** Check font name matches internal font family name

### Issue: LEDs don't fit in channel
**Solution:** Verify LED type matches channel width setting

### Issue: Lid doesn't snap on
**Solution:** Adjust lid tolerance (0.15mm default, try 0.20mm)

### Issue: Wire holes don't align between letters
**Solution:** All letters use same hole height - check base alignment

### Issue: Friction lip too tight
**Solution:** Reduce lip overhang from 0.4mm to 0.3mm

---

## 🎯 Future Enhancements

- [ ] Numbers (0-9) generation
- [ ] Special characters (!@#$%^&*)
- [ ] Lowercase letters (a-z)
- [ ] Multi-color lid options
- [ ] Animated preview in browser
- [ ] Custom wire hole positions
- [ ] Integrated power supply compartment
- [ ] Magnetic letter mounting system

---

## 📚 Credits

**Original System:** `FONTS/font-extract.py`  
**Engineering Design:** Eyeoverthink Productions LLC  
**Integration:** Sign-Sculptor v2.0  
**Inspiration:** Edison bulbs, modular signage, maker culture

---

## 🚀 Quick Start

1. Click **"Font"** tab in Sign-Sculptor
2. Upload your .ttf or .otf font file
3. Adjust settings (or use defaults)
4. Click **"Generate Alphabet ZIP"**
5. Download and unzip
6. Print letter bodies and lids
7. Install LEDs using assembly instructions
8. Create amazing custom signs!

---

**This system brings the power of custom font alphabet generation to everyone, no Python or OpenSCAD knowledge required!**
