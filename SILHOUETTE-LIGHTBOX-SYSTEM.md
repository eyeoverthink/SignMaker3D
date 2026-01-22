# Silhouette Light Box System - Complete Documentation

## 🎨 **Overview**

The Silhouette Light Box Designer transforms Sign-Sculptor into a complete creative platform for multi-layer illuminated art. Create stunning backlit displays with image tracing, stock templates, freehand drawing, and per-layer LED control.

---

## ✨ **Key Features**

### **1. Design Modes**

#### **Image Tracing**
- **Auto-Trace**: Upload any image and automatically detect edges
  - Adjustable edge threshold (0-255)
  - Path simplification for clean geometry
  - Multiple contour detection
- **Manual Trace**: Point-by-point tracing for precise control
  - Click to add points
  - Real-time path preview
  - Automatic path closing

#### **Freehand Drawing**
- Click-to-draw custom silhouettes
- Bezier curve support
- Snap-to-grid option
- Symmetry tools

#### **Stock Templates** (50+ Pre-designed)
- 🎮 **Gaming**: Pac-Man, Mario, Sonic, Game Boy, Rubik's Cube
- 🎬 **Pop Culture**: Pulp Fiction, Star Wars, Simpsons, Pac-Man Ghosts
- 🔬 **Science**: DNA Helix, Atom Model, Periodic Elements, Neural Networks
- ✌️ **Symbols**: Peace Sign, Heart Hands, Middle Finger, Balloons, Dice
- 🌀 **Abstract**: Fractal Nodes, Expanding Cubes, Binary Data, Bouncing Balls

### **2. Multi-Layer System**

Each layer is **independent** with its own:
- **Depth** (0-30mm from back panel)
- **LED Type** (6 options)
- **Color** (for RGB LEDs)
- **Visibility** toggle
- **SVG Path** (editable)

**Layer Stack** (back to front):
```
Layer 1 (Back) → Backlight (standard 5V)
Layer 2 → Silhouette (backlit)
Layer 3 → Detail (EL wire)
Layer 4 → Accent (WS2812B RGB)
Layer 5 (Front) → Highlight (NeoPixel)
```

### **3. LED Types Per Layer**

| LED Type | Use Case | Channel Width | Color Control |
|----------|----------|---------------|---------------|
| **Backlit** | General illumination | N/A | Static white |
| **EL Wire** | Thin line details (cigarette, outlines) | 3-6mm | Static color |
| **WS2812B** | Addressable RGB animations | 5mm | Full RGB |
| **NeoPixel** | High-density RGB | 5mm | Full RGB |
| **Standard Strip** | Simple colored accents | 10mm | Static color |
| **None** | Opaque silhouette (no light) | N/A | N/A |

### **4. Clamshell Diffuser**

Three diffuser styles:

#### **Flat Diffuser**
- Standard 2mm acrylic/PETG
- Uniform light distribution
- Snap-fit mounting

#### **Clamshell Raised** ⭐ (Recommended)
- Raised channels follow layer contours
- 5-15mm height adjustment
- Creates 3D depth effect
- CNC-style routing

#### **CNC Routed**
- Precision-milled channels
- 2-5mm routing depth
- Professional finish
- Requires CNC router

---

## 🎮 **Stock Template Library**

### **Gaming Templates**

#### **Pac-Man Chase**
- **Layers**: 2
  - Pac-Man (WS2812B, yellow)
  - Red Ghost (standard strip, red)
- **Size**: 200×200mm
- **Depth**: 30mm
- **Use Case**: Retro gaming room decor

#### **Mario Mushroom**
- **Layers**: 2
  - Red Cap (backlit, red)
  - White Spots (none, opaque)
- **Size**: 150×200mm
- **Depth**: 25mm
- **Use Case**: Nintendo fan art

#### **Game Boy**
- **Layers**: 2
  - Body (backlit)
  - Screen (WS2812B, green)
- **Size**: 150×250mm
- **Depth**: 30mm
- **Use Case**: Retro gaming display

### **Pop Culture Templates**

#### **Pulp Fiction Silhouette**
- **Layers**: 3
  - Head (backlit)
  - Hat (backlit)
  - Cigarette (EL wire, orange)
- **Size**: 200×300mm
- **Depth**: 35mm
- **Use Case**: Movie memorabilia

#### **Star Wars Helmet**
- **Layers**: 1
  - Stormtrooper helmet (backlit)
- **Size**: 200×200mm
- **Depth**: 25mm
- **Use Case**: Sci-fi collection

### **Science Templates**

#### **DNA Double Helix**
- **Layers**: 2
  - Helix Strand 1 (WS2812B, cyan)
  - Helix Strand 2 (WS2812B, magenta)
- **Size**: 150×300mm
- **Depth**: 30mm
- **Use Case**: Science lab decor

#### **Atom Model**
- **Layers**: 2
  - Nucleus (WS2812B, yellow)
  - Electron Orbit (EL wire, cyan)
- **Size**: 200×200mm
- **Depth**: 30mm
- **Use Case**: Educational display

### **Symbol Templates**

#### **Peace Sign**
- **Layers**: 1
  - Peace symbol (backlit)
- **Size**: 200×200mm
- **Depth**: 25mm
- **Use Case**: Hippie/retro decor

#### **Heart Hands**
- **Layers**: 1
  - Heart shape (WS2812B, pink)
- **Size**: 200×200mm
- **Depth**: 25mm
- **Use Case**: Love/romance theme

---

## 🔑 **Lithophane Keychain Mode**

Create **portable illuminated keychains** with integrated battery and LED.

### **Specifications**
- **Size**: 40×50mm (compact)
- **Thickness**: 3mm lithophane + 5mm battery compartment
- **Battery Options**:
  - CR2032 (3V, 20mm diameter) - 10 hour runtime
  - CR2016 (3V, 16mm diameter) - 6 hour runtime
  - AG13 (1.5V, 11mm diameter) - 4 hour runtime
- **LED Insert**: 3mm or 5mm LED
- **Features**:
  - Keyring hole (6mm)
  - Snap-fit assembly
  - No tools required

### **Use Cases**
- Photo lithophane keychains
- Logo/brand keychains
- Memorial keychains
- Gift items
- Event souvenirs

---

## 🛠️ **Assembly Guide**

### **Standard Light Box Assembly**

#### **Parts List**
- Light box shell (3D printed)
- Clamshell diffuser (3D printed or acrylic)
- Layer silhouettes (×N, 3D printed)
- LED strips/wires (per layer specification)
- Power supply (5V, 2A minimum)
- Controller (if using WS2812B)
- Mounting hardware

#### **Step-by-Step**

1. **Install Backlight**
   - Attach LED strip to back panel
   - Route wires through side channel
   - Connect to power

2. **Layer Installation** (back to front)
   - Position each layer at specified depth
   - Use spacers for precise alignment
   - Install LED strips/wires per layer
   - Test each layer independently

3. **Diffuser Installation**
   - Align clamshell diffuser with raised channels
   - Snap into place (0.2mm tolerance)
   - Ensure all layers visible through routing

4. **Wiring**
   - Connect all LED layers to power
   - Install controller (if WS2812B)
   - Test full illumination
   - Secure wires with clips

5. **Final Assembly**
   - Close light box shell
   - Secure with clips/screws
   - Mount on wall or stand

### **Keychain Assembly**

1. Insert 5mm LED into front hole (long leg = positive)
2. Place CR2032 battery in compartment (+ side up)
3. Connect LED legs to battery contacts
4. Snap front and back together
5. Attach keyring through top hole

---

## 💡 **LED Wiring Diagrams**

### **Backlit Only (Simple)**
```
5V Power Supply
    │
    ├─── LED Strip (+)
    │
    └─── LED Strip (-)
```

### **Multi-Layer with WS2812B**
```
5V Power Supply
    │
    ├─── Backlight Strip (+/-)
    │
    ├─── Layer 1 WS2812B (5V, GND, Data)
    │         │
    │         └─── Arduino/ESP32 (Pin D6)
    │
    ├─── Layer 2 EL Wire (Inverter)
    │
    └─── Layer 3 Standard Strip (+/-)
```

### **Controller Housing**
- Arduino Nano: 45×18mm
- ESP32: 55×28mm
- XIAO SAMD21: 21×18mm

---

## 📊 **Power Requirements**

### **LED Current Draw**
| LED Type | Current per Meter | Voltage |
|----------|-------------------|---------|
| Standard 5V Strip | 400mA | 5V |
| WS2812B (60 LED/m) | 3.6A | 5V |
| NeoPixel (60 LED/m) | 3.6A | 5V |
| EL Wire (3m) | 200mA | 110V AC |

### **Power Supply Sizing**
```
Total Current = Backlight + Layer 1 + Layer 2 + ... + Layer N
Recommended PSU = Total Current × 1.5 (safety margin)
```

**Example** (3 layers):
- Backlight: 400mA
- Layer 1 (WS2812B, 1m): 3600mA
- Layer 2 (EL Wire): 200mA
- **Total**: 4200mA × 1.5 = **6.3A power supply needed**

---

## 🎨 **Design Tips**

### **Image Tracing**
1. Use **high-contrast images** (black/white works best)
2. Adjust **edge threshold** to capture details
3. Increase **simplify tolerance** for cleaner paths
4. Trace **multiple times** for complex images

### **Layer Depth**
- **Back layers**: 5-10mm (general illumination)
- **Mid layers**: 10-20mm (main subject)
- **Front layers**: 20-30mm (fine details)

### **LED Selection**
- **Backlit**: Uniform glow, simple wiring
- **EL Wire**: Thin details (cigarettes, outlines)
- **WS2812B**: Animations, color changes
- **Standard Strip**: Colored accents, low cost

### **Clamshell Routing**
- **Raised height**: 5mm for subtle, 15mm for dramatic
- **Routing depth**: 2mm for light etch, 5mm for deep channels
- **Snap-fit tolerance**: 0.2mm for tight fit, 0.5mm for easy assembly

---

## 📦 **Export Options**

### **Complete ZIP Package**
```
silhouette-lightbox-pacman.zip
├── shell.stl
├── diffuser_clamshell.stl
├── layer_1_pacman.stl
├── layer_2_ghost.stl
├── assembly_instructions.md
├── wiring_diagram.png
├── bom.csv
└── README.md
```

### **Bill of Materials (BOM)**
| Part | Quantity | Cost | Supplier |
|------|----------|------|----------|
| 3D Printed Shell | 1 | $8.50 | Self-print |
| Clamshell Diffuser | 1 | $6.20 | Self-print |
| Layer Silhouettes | 2 | $4.00 | Self-print |
| WS2812B Strip (1m) | 1 | $12.00 | Amazon |
| Standard Strip (1m) | 1 | $8.00 | Amazon |
| 5V Power Supply | 1 | $10.00 | Amazon |
| Arduino Nano | 1 | $5.00 | Amazon |
| **Total** | | **$53.70** | |

---

## 🚀 **Use Cases**

### **Home Decor**
- Gaming room wall art
- Movie memorabilia displays
- Science lab decoration
- Kids' room nightlights

### **Commercial**
- Retail store displays
- Restaurant signage
- Event decorations
- Trade show booths

### **Gifts**
- Personalized photo lithophanes
- Custom logo keychains
- Memorial tributes
- Wedding favors

### **Education**
- Science demonstrations
- Art projects
- STEM learning
- Maker spaces

---

## 🎯 **Next Steps**

1. **Choose Design Mode**: Image trace, freehand, or template
2. **Add Layers**: Build your multi-layer composition
3. **Configure LEDs**: Select LED type per layer
4. **Set Diffuser**: Choose clamshell or flat style
5. **Export**: Download complete package
6. **Print & Assemble**: Follow assembly guide
7. **Enjoy**: Display your illuminated art!

---

## 📚 **Technical Specifications**

### **File Formats**
- **Input**: JPG, PNG, SVG, BMP
- **Output**: STL, 3MF, SVG, OpenSCAD

### **Dimensions**
- **Min Size**: 50×50mm (keychain)
- **Max Size**: 500×500mm (wall art)
- **Depth Range**: 10-50mm
- **Wall Thickness**: 1-5mm

### **Print Settings**
- **Layer Height**: 0.2mm
- **Infill**: 15% (shell), 0% (diffuser)
- **Material**: PLA, PETG, or Acrylic
- **Supports**: Minimal (optimized orientation)

---

**Transform your ideas into illuminated reality with the Silhouette Light Box Designer!** 🎨✨

Generated by Sign-Sculptor v2.0
