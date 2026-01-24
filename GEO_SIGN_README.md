# 🗺️ GEOGRAPHIC SIGN GENERATOR

**The Ultimate Addition to Sign-Sculptor**  
Convert real-world locations from Map2Model into illuminated LED relief maps.

---

## 🎯 What This Does

Transforms **any location on Earth** into a **3D-printable LED sign**:
- **Your neighborhood** → Glowing street map
- **Paris skyline** → Illuminated Eiffel Tower relief
- **Mountain ranges** → Backlit topographic art
- **Coastlines** → LED-lit geographic features

---

## 📦 Installation

### 1. Install Python Dependencies
```bash
cd Sign-Sculptor
pip install -r requirements-geo.txt
```

This installs:
- `numpy-stl` - STL file processing
- `scipy` - Advanced interpolation
- `Pillow` - Image generation
- `numpy` - Math operations

### 2. Get Your Map from Map2Model

1. Visit **https://map2model.com/**
2. Search for any location (city, landmark, neighborhood)
3. Select the area you want
4. Click **"Export"** → Download as **STL**
5. Save the file (e.g., `paris_eiffel.stl`)

---

## 🚀 Quick Start

### Method 1: GUI Application (Recommended)

```bash
python geo-sign-generator.py
```

**Workflow:**
1. **Load STL** - Import your Map2Model file
2. **Generate Heightmap** - Convert 3D → 2D depth map
3. **Configure LED System** - Choose shell style, power, patterns
4. **Generate Sign** - Creates complete OpenSCAD assembly

### Method 2: Command Line (Advanced)

```bash
# Convert STL to heightmap
python stl-to-heightmap.py paris_eiffel.stl --resolution 1024 --invert

# Output: paris_eiffel_heightmap.png
```

**Options:**
- `--resolution 256|512|1024|2048` - Detail level (higher = slower)
- `--invert` - For lithophane mode (light through thin areas)
- `--output filename.png` - Custom output name

---

## 🎨 How It Works

### The Pipeline

```
Map2Model STL
    ↓
[stl-to-heightmap.py]
    ↓
Grayscale PNG (Depth Map)
    ↓
[geo-sign-generator.py]
    ↓
OpenSCAD File (LED Shell + Base)
    ↓
3D Print → Assemble → Light Up!
```

### The Magic

1. **STL Import** - Loads 3D city model (buildings, terrain, roads)
2. **Z-Projection** - Flattens 3D mesh into 2D heightmap
3. **Interpolation** - Fills gaps, smooths surface
4. **Inversion** - Converts to lithophane (optional)
5. **Shell Generation** - Wraps heightmap in LED-ready housing
6. **Power Integration** - Adds magnetic base or wired system

---

## 🔧 Configuration Options

### Shell Styles

**Flat Panel (Wall Mount)**
- Thin profile (8mm)
- Magnetic or screw mounting
- Best for: Street maps, cityscapes

**Curved Shell (Freestanding)**
- Domed top for 3D effect
- Self-standing base
- Best for: Landmarks, monuments

**Deep Frame (Shadow Box)**
- 16mm depth for dramatic relief
- Recessed lighting
- Best for: Mountains, coastlines

### Diffusion Patterns

- **Clear** - Maximum detail visibility
- **Phi-Ribs** - Subtle light scattering (Golden Angle)
- **Hex-Lattice** - Geometric diffusion
- **Frosted** - Soft, even glow

### Power Systems

- **Magnetic Base (CR2032)** - Wireless, removable
- **Wired (USB)** - Permanent installation
- **Scott Lock Module** - Modular battery system (V18+)

---

## 📐 Technical Specs

### Heightmap Resolution Guide

| Resolution | File Size | Detail Level | Use Case |
|------------|-----------|--------------|----------|
| 256px | ~65KB | Low | Quick tests, small signs |
| 512px | ~260KB | Good | Standard signs (6-12") |
| 1024px | ~1MB | High | Large signs (12-24") |
| 2048px | ~4MB | Ultra | Museum quality (24"+) |

### STL Mesh Limits

- **Recommended:** 10K-100K triangles
- **Maximum:** 500K triangles (may take 2-5 minutes)
- **Tip:** Use Map2Model's "Low Detail" export for faster processing

---

## 🎓 Examples

### Example 1: Eiffel Tower Sign

```bash
# 1. Download from Map2Model (Paris, zoom to Eiffel Tower)
# 2. Convert to heightmap
python stl-to-heightmap.py eiffel_tower.stl --resolution 1024 --invert

# 3. Generate sign (or use GUI)
python geo-sign-generator.py
# Load eiffel_tower.stl → Generate Heightmap → Generate Sign

# 4. Print parts:
#    - eiffel_tower_Sign_Shell.stl (Vase mode, 0.2mm layer)
#    - eiffel_tower_Sign_Backing.stl (Standard, 0.3mm layer)
#    - Power module (CR2032 holder)

# 5. Assembly:
#    - Insert LED strips into backing channels
#    - Snap shell onto backing
#    - Add magnets to base
#    - Mount on wall
```

### Example 2: Your Home Street

```bash
# 1. Map2Model: Search your address
# 2. Select 2-3 block radius
# 3. Export as STL
# 4. Run GUI, select "Flat Panel" style
# 5. Print and gift to family!
```

---

## 🔗 Integration with Existing Systems

### Compatible with Sign-Sculptor Modules

✅ **Bulb Architect V14-V21** - Use Scott Lock threading  
✅ **Luminary V22** - Photon Weaver lattice shells  
✅ **Phrase Designer** - Combine text + geography  
✅ **Font Alphabet Factory** - Add location labels

### Workflow: Text + Map Combo

```
1. Generate geographic base (this tool)
2. Generate text overlay (phrase-designer.tsx)
3. Combine in OpenSCAD:
   union() {
       geographic_shell();
       translate([x,y,z]) text_sign();
   }
```

---

## 🐛 Troubleshooting

### "Module not found: stl"
```bash
pip install numpy-stl
```

### "Heightmap is all black/white"
- Check STL orientation (Z-axis should be "up")
- Try toggling `--invert` flag
- Verify STL has actual height variation (not flat)

### "Processing takes forever"
- Reduce resolution: `--resolution 256`
- Use Map2Model's "Low Detail" export
- Close other programs (RAM intensive)

### "OpenSCAD crashes on render"
- Reduce heightmap resolution
- Increase OpenSCAD memory limit
- Use F5 (preview) instead of F6 (render) initially

---

## 🎨 Advanced: Custom Modifications

### Add Color Zones (Multi-Material)

```scad
// In generated .scad file, add:
if (z_height > 5) {
    color("Blue") geographic_shell();  // Water
} else {
    color("Green") geographic_shell(); // Land
}
```

### Animated LED Patterns

Use addressable LEDs (WS2812) in backing channels:
- Pulse from center outward
- Highlight specific streets/buildings
- Sunrise/sunset simulation

### Multi-Layer Relief

Stack multiple heightmaps at different scales:
```scad
translate([0,0,0]) surface(file="macro_terrain.png");
translate([0,0,5]) surface(file="micro_buildings.png");
```

---

## 📊 Performance Benchmarks

**Test System:** i5-8400, 16GB RAM, Python 3.9

| STL Size | Triangles | Resolution | Time | RAM |
|----------|-----------|------------|------|-----|
| 2MB | 25K | 512px | 8s | 450MB |
| 5MB | 75K | 1024px | 35s | 1.2GB |
| 15MB | 250K | 2048px | 180s | 3.8GB |

---

## 🌟 Gallery Ideas

**Urban Collection:**
- Manhattan skyline
- Tokyo street grid
- London Thames curve

**Natural Wonders:**
- Grand Canyon layers
- Hawaiian islands
- Swiss Alps relief

**Personal:**
- Childhood home
- Wedding venue
- Favorite hiking trail

---

## 📝 Credits

- **Map2Model** - https://map2model.com/ (STL generation)
- **Scott Protocol** - Threading system (Bulb Architect V18+)
- **Sign-Sculptor** - LED manufacturing pipeline
- **OpenStreetMap** - Geographic data source (via Map2Model)

---

## 🚀 What's Next?

**Planned Features:**
- [ ] Auto-scale detection (optimize size from STL bounds)
- [ ] Multi-color lithophane (RGB LED zones)
- [ ] Batch processing (generate multiple locations)
- [ ] Integration with phrase-designer (text overlays)
- [ ] Real-time preview (3D viewer in GUI)

---

## 💡 Pro Tips

1. **Start small** - Test with 256px resolution first
2. **Check orientation** - Rotate STL in Map2Model if needed
3. **Use landmarks** - Buildings/towers create dramatic relief
4. **Layer height** - 0.12mm for ultra-smooth lithophanes
5. **LED spacing** - 30mm between strips for even lighting
6. **Magnet strength** - Use N52 neodymium (10mm x 3mm)

---

**Ready to turn the world into light?** 🌍✨

Run: `python geo-sign-generator.py`
