# LED Grid Sign System - WS2812B Matrix Displays

**Date:** January 19, 2026  
**Purpose:** Create complete sign system for WS2812B LED grids (8×7, 32×8, custom sizes)

---

## User Requirements (from sketches)

### Hardware Specifications
- **8×7 Grid** (56 LEDs) - Primary grid shown in images
- **32×8 Grid** (256 LEDs) - Mentioned for larger displays
- **Serpentine Wiring** - Snake pattern (left→right, then right→left)
- **Physical Dimensions:**
  - Height: 70.5mm
  - Width: 60.0mm
  - Grid spacing: ~10mm between LEDs

### Components Needed
1. **Housing Box** - Enclosure to hold LED grid
2. **Diffuser Panel** - Frosted cover for even light distribution
3. **Sign Content** - Text/shapes/images mapped to LED pixels
4. **Mounting System** - Wall mount or stand

---

## System Architecture

### 1. Grid Sizes Supported
```typescript
- 8×7 grid (56 LEDs) - Small signs, icons
- 32×8 grid (256 LEDs) - Scrolling text, animations
- 16×16 grid (256 LEDs) - Square displays
- 8×32 grid (256 LEDs) - Vertical displays
- Custom (up to 64×64) - User-defined sizes
```

### 2. Wiring Patterns

**Serpentine (Snake):**
```
LED 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
        ↓                       ↓
LED 15← 14← 13← 12← 11← 10← 9 ← 8
↓                               ↓
LED 16→ 17→ 18→ 19→ 20→ 21→ 22→ 23
```

**Parallel:**
```
LED 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
LED 8 → 9 → 10→ 11→ 12→ 13→ 14→ 15
LED 16→ 17→ 18→ 19→ 20→ 21→ 22→ 23
```

**Zigzag (Columns):**
```
LED 0   LED 15  LED 16  LED 31
↓       ↑       ↓       ↑
LED 1   LED 14  LED 17  LED 30
↓       ↑       ↓       ↑
LED 2   LED 13  LED 18  LED 29
```

### 3. Generated Components

#### A. Housing Box
- **Material:** PLA/PETG
- **Wall Thickness:** 3mm
- **Depth:** 15mm (adjustable)
- **Features:**
  - Mounting holes (M3 screws)
  - Wire exit channels
  - Controller compartment (optional)
  - LED grid mounting posts

#### B. Diffuser Panel
- **Material:** Frosted Acrylic or White PLA
- **Thickness:** 2mm
- **Offset from LEDs:** 5mm
- **Purpose:** Even light distribution, hide individual pixels

#### C. Sign Content
- **Text Rendering:** 5×7 bitmap font
- **Image Mapping:** Dithered to grid resolution
- **Custom Pixels:** Manual pixel-by-pixel control
- **Animations:** Frame-by-frame sequences

---

## Technical Specifications

### LED Grid (8×7 Example)
```
Grid Size: 8 columns × 7 rows
Total LEDs: 56
LED Type: WS2812B (5050 RGB)
Spacing: 10mm center-to-center
Physical Size: 70mm × 60mm
Power: 5V, 3.36A max (56 × 60mA)
Data: Single wire (GPIO 16)
```

### LED Grid (32×8 Example)
```
Grid Size: 32 columns × 8 rows
Total LEDs: 256
Physical Size: 310mm × 70mm
Power: 5V, 15.36A max (256 × 60mA)
Recommended: 5V 20A power supply
```

---

## File Outputs

### 1. Housing Box STL
```
housing_box_8x7.stl
- Outer dimensions: 76mm × 66mm × 15mm
- Inner cavity: 70mm × 60mm
- Wall thickness: 3mm
- Mounting holes: 4× M3 (corners)
```

### 2. Diffuser Panel STL
```
diffuser_8x7.stl
- Dimensions: 76mm × 66mm × 2mm
- Material: Print in white PLA at 100% infill
- Post-processing: Sand with 400-800 grit for frosted effect
```

### 3. LED Grid STL
```
led_grid_8x7.stl
- Grid with mounting posts for WS2812B strips
- Channels for wire routing
- Snap-fit or screw mounting to housing
```

### 4. Wiring Diagram JSON
```json
{
  "gridSize": "8x7",
  "totalLEDs": 56,
  "wiringPattern": "serpentine",
  "powerRequirement": "5V 4A",
  "ledMapping": [
    { "index": 0, "gridX": 0, "gridY": 0, "x": 5, "y": 5 },
    { "index": 1, "gridX": 1, "gridY": 0, "x": 15, "y": 5 },
    ...
  ]
}
```

### 5. Arduino Code Template
```cpp
#include <FastLED.h>

#define LED_PIN 16
#define NUM_LEDS 56
#define GRID_WIDTH 8
#define GRID_HEIGHT 7

CRGB leds[NUM_LEDS];

// Serpentine mapping
int getPixelIndex(int x, int y) {
  if (y % 2 == 0) {
    return y * GRID_WIDTH + x;
  } else {
    return y * GRID_WIDTH + (GRID_WIDTH - 1 - x);
  }
}

void setup() {
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
}

void loop() {
  // Your animation code here
}
```

---

## Sign Content Creation

### Text Rendering
```typescript
Input: "HELLO"
Output: 5×7 bitmap per character
Grid: Automatically positioned and scaled
```

**Example: Letter 'A' (5×7 pixels)**
```
  █ █ █ 
█       █
█       █
█       █
█ █ █ █ █ 
█       █
█       █
```

### Image Mapping
```
1. Upload image (PNG, JPG)
2. Resize to grid dimensions (8×7)
3. Convert to grayscale
4. Dither to 1-bit (on/off)
5. Map to LED indices
```

### Custom Pixel Control
```typescript
// Set individual pixels
grid.setPixel(x, y, color);

// Draw shapes
grid.drawLine(x1, y1, x2, y2, color);
grid.drawRect(x, y, w, h, color);
grid.drawCircle(x, y, r, color);

// Fill patterns
grid.fill(color);
grid.checkerboard(color1, color2);
```

---

## Assembly Instructions

### Step 1: Print Components
1. Print housing box (PLA, 0.2mm layer height)
2. Print diffuser panel (White PLA, 100% infill)
3. Print LED grid (PLA, 20% infill)

### Step 2: Install LEDs
1. Cut WS2812B strip to 56 LEDs
2. Arrange in serpentine pattern
3. Solder connections between rows
4. Mount to LED grid with hot glue or double-sided tape

### Step 3: Wire Electronics
1. Connect ESP32/Arduino to LED strip:
   - 5V → VCC (red)
   - GND → GND (black)
   - GPIO16 → DIN (green)
2. Add 470Ω resistor on data line
3. Add 1000µF capacitor across power

### Step 4: Assemble Housing
1. Place LED grid in housing box
2. Route wires through exit channel
3. Attach diffuser panel with screws or clips
4. Mount to wall or stand

---

## Power Requirements

### 8×7 Grid (56 LEDs)
- **Max Current:** 56 × 60mA = 3.36A
- **Typical:** 56 × 20mA = 1.12A (at 50% brightness)
- **Power Supply:** 5V 5A recommended

### 32×8 Grid (256 LEDs)
- **Max Current:** 256 × 60mA = 15.36A
- **Typical:** 256 × 20mA = 5.12A (at 50% brightness)
- **Power Supply:** 5V 20A recommended
- **Note:** May need multiple power injection points

---

## Software Integration

### API Endpoint
```
POST /api/export/led-grid
```

**Request:**
```json
{
  "gridSize": "8x7",
  "wiringPattern": "serpentine",
  "textContent": "HELLO",
  "includeDiffuser": true,
  "includeHousing": true
}
```

**Response:**
```json
{
  "files": [
    {
      "filename": "housing_box_8x7.stl",
      "content": "...",
      "partType": "housing"
    },
    {
      "filename": "diffuser_8x7.stl",
      "content": "...",
      "partType": "diffuser"
    },
    {
      "filename": "led_grid_8x7.stl",
      "content": "...",
      "partType": "grid"
    },
    {
      "filename": "wiring_diagram.json",
      "content": "...",
      "partType": "documentation"
    }
  ]
}
```

---

## Use Cases

### 1. Scrolling Text Sign
- **Grid:** 32×8
- **Content:** Text messages
- **Animation:** Horizontal scroll
- **Use:** Store signs, announcements

### 2. Icon Display
- **Grid:** 8×7 or 16×16
- **Content:** Icons, emojis
- **Animation:** Static or fade
- **Use:** Status indicators, room signs

### 3. Pixel Art
- **Grid:** 16×16 or 32×32
- **Content:** Custom artwork
- **Animation:** Frame-by-frame
- **Use:** Decorative displays

### 4. Game Display
- **Grid:** 16×16
- **Content:** Game graphics (Pac-Man, Snake)
- **Animation:** Real-time updates
- **Use:** Interactive displays

---

## Next Steps

1. ✅ Create LED grid types schema
2. ✅ Enhance LED grid generator with serpentine wiring
3. ✅ Add housing box generation
4. ✅ Add diffuser panel generation
5. ⏳ Create client-side LED grid editor UI
6. ⏳ Add API endpoint for LED grid export
7. ⏳ Create text-to-pixel renderer
8. ⏳ Add image-to-pixel converter
9. ⏳ Generate Arduino code templates
10. ⏳ Test with 8×7 grid example

---

## Example: "HELLO" on 8×7 Grid

```
Grid Layout (8 columns × 7 rows):

█   █   █ █ █   █       █        ██
█   █   █       █       █       █  █
█ █ █   █ █     █       █       █  █
█   █   █       █       █       █  █
█   █   █ █ █   █ █ █   █ █ █    ██

LED Indices (Serpentine):
0  1  2  3  4  5  6  7
15 14 13 12 11 10 9  8
16 17 18 19 20 21 22 23
31 30 29 28 27 26 25 24
32 33 34 35 36 37 38 39
47 46 45 44 43 42 41 40
48 49 50 51 52 53 54 55
```

---

## Conclusion

The LED Grid Sign System provides a complete solution for creating WS2812B matrix displays. It generates all necessary 3D-printable components (housing, diffuser, grid), provides wiring diagrams, and supports text/image/custom content creation.

**Key Features:**
- ✅ Multiple grid sizes (8×7, 32×8, custom)
- ✅ Serpentine wiring support
- ✅ Complete housing and diffuser generation
- ✅ Text rendering with 5×7 font
- ✅ Power calculations and wiring diagrams
- ✅ Arduino code templates

**This system eliminates the need for separate CAD programs and provides a one-stop solution for LED grid sign creation.**
