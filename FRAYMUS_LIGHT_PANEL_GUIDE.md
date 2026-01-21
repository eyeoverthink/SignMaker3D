# FRAYMUS Light Panel System - Complete Guide

## Overview

The **FRAYMUS Light Panel System** creates decorative wall panels with intricate phi-based cutout patterns for ambient lighting. Inspired by the designs shown in your reference image, these panels combine mathematical precision with artistic beauty using your FRAYMUS principles.

## System Architecture

### Frontend: Sign-Sculptor UI Tab
- **Location**: `client/src/components/editor/light-panel-controls.tsx`
- **Integration**: New "Panel" tab in editor sidebar
- **Icon**: Sparkles ✨
- **Features**: 
  - 12 FRAYMUS pattern types
  - Real-time phi calculations
  - Full parametric control
  - Material recommendations

### Backend: Python Generator
- **Location**: `FRAYMUS_Light_Panel_Generator.py`
- **Engine**: Phi-based pattern algorithms
- **Output**: STL files for 3D printing or CNC routing
- **Patterns**: All use φ (1.618...) and golden angle (137.507764°)

## 12 FRAYMUS Pattern Types

### 1. **Phi Spiral** (Golden Ratio Spiral)
```python
pattern_type="phi_spiral"
```
- Classic Fibonacci/golden spiral
- Logarithmic growth at φ rate
- Perfect for circular/organic designs
- **Use Case**: Modern minimalist panels, nature-inspired art

### 2. **Phi Vortex Lattice**
```python
pattern_type="phi_vortex"
```
- Multi-scale vortex structure
- Combines rotation + radial patterns
- Creates complex light diffusion
- **Use Case**: Psychedelic/trippy effects, meditation spaces

### 3. **Tree of Life**
```python
pattern_type="tree_of_life"
```
- Branching structure using L-system
- Golden angle branching (137.5°)
- Organic tree silhouette
- **Use Case**: Nature themes, spiritual spaces, living rooms

### 4. **Sacred Geometry**
```python
pattern_type="sacred_geometry"
```
- Flower of Life, Metatron's Cube inspired
- Overlapping circles at φ-scaled radii
- Symmetrical mandala-like patterns
- **Use Case**: Yoga studios, meditation rooms, spiritual art

### 5. **Fibonacci Flower**
```python
pattern_type="fibonacci_flower"
```
- Sunflower/daisy phyllotaxis pattern
- Vogel's model for optimal seed packing
- Natural spiral arrangement
- **Use Case**: Botanical themes, children's rooms, nature centers

### 6. **Golden Mandala**
```python
pattern_type="golden_mandala"
```
- Concentric rings at φ proportions
- Rotational symmetry with golden angle
- Meditative circular design
- **Use Case**: Zen spaces, galleries, focal wall art

### 7. **Voronoi Organic**
```python
pattern_type="voronoi_organic"
```
- Organic cell-like structure
- Seeds distributed via golden angle
- Natural tessellation
- **Use Case**: Modern architecture, biomorphic designs

### 8. **Islamic Geometric**
```python
pattern_type="islamic_geometric"
```
- Traditional Islamic tessellation
- Star patterns with φ-based scaling
- Intricate symmetry
- **Use Case**: Cultural spaces, mosques, Middle Eastern decor

### 9. **Celtic Knot**
```python
pattern_type="celtic_knot"
```
- Interlacing curves
- Phi-based wave functions
- Continuous flowing lines
- **Use Case**: Irish/Celtic themes, pubs, cultural centers

### 10. **Nature Leaves**
```python
pattern_type="nature_leaves"
```
- Leaf venation patterns
- Branching veins with golden angle
- Organic botanical structure
- **Use Case**: Garden rooms, conservatories, nature-inspired spaces

### 11. **DNA Helix**
```python
pattern_type="dna_helix"
```
- Double helix structure
- Phi-based helical twist
- Biological inspiration
- **Use Case**: Science labs, biotech offices, educational spaces

### 12. **Fractal Branches**
```python
pattern_type="fractal_branches"
```
- Recursive tree branching
- Self-similar at multiple scales
- Natural fractal geometry
- **Use Case**: Mathematical art, tech offices, modern galleries

## Mathematical Foundation

### Golden Ratio (φ)
```
φ = 1.6180339887...
φ² = φ + 1 = 2.618...
φ⁻¹ = φ - 1 = 0.618...
```

### Golden Angle
```
θ_golden = 2π / φ² = 137.507764°
         = 2.39996323 radians
```

### Phi Iterations
The `phi_iterations` parameter controls recursive depth:
```
φ^3 = 4.24
φ^5 = 11.09
φ^8 = 46.98
φ^10 = 122.99
φ^15 = 1364.00
```

Higher iterations = more intricate patterns

## Usage Examples

### Example 1: Classic Phi Spiral Panel
```python
from FRAYMUS_Light_Panel_Generator import FRAYMUSLightPanelGenerator

panel = FRAYMUSLightPanelGenerator("MyPanel.stl")
panel.generate_light_panel(
    pattern_type="phi_spiral",
    width=300,              # 300mm wide
    height=400,             # 400mm tall
    depth=6,                # 6mm thick
    frame_thickness=20,     # 20mm border
    pattern_density=60,     # 60% cutout coverage
    cutout_depth=6,         # Full through-cut
    phi_iterations=10,      # φ^10 recursion
    symmetry=1,             # Asymmetric spiral
    resolution=3            # 3mm grid resolution
)
panel.save()
```

### Example 2: Sacred Geometry Mandala
```python
panel = FRAYMUSLightPanelGenerator("Mandala.stl")
panel.generate_light_panel(
    pattern_type="sacred_geometry",
    width=400,
    height=400,             # Square panel
    depth=6,
    pattern_density=50,
    phi_iterations=8,
    symmetry=6,             # 6-fold symmetry
    resolution=2            # Higher detail
)
panel.save()
```

### Example 3: Tree of Life Wall Art
```python
panel = FRAYMUSLightPanelGenerator("TreeOfLife.stl")
panel.generate_light_panel(
    pattern_type="tree_of_life",
    width=300,
    height=600,             # Tall vertical panel
    depth=8,                # Thicker for durability
    frame_thickness=30,
    pattern_density=55,
    phi_iterations=12,      # More branching
    resolution=3
)
panel.save()
```

## Parameter Guide

### Panel Dimensions
| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `width` | 150-600mm | 300mm | Panel width |
| `height` | 150-800mm | 400mm | Panel height |
| `depth` | 3-15mm | 6mm | Panel thickness |

### Pattern Control
| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `pattern_density` | 10-90% | 50% | Cutout coverage |
| `phi_iterations` | 3-15 | 8 | Recursion depth (φⁿ) |
| `symmetry` | 1-12 | 6 | Rotational symmetry |
| `cutout_depth` | 0-depth | depth | Cut depth (0=relief, depth=through) |

### Structure
| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `frame_thickness` | 10-50mm | 20mm | Border width |
| `resolution` | 1-5mm | 2mm | Grid detail (smaller=finer) |

## Manufacturing Guide

### 3D Printing

**Recommended Settings:**
- **Material**: PLA, PETG, Wood-filled PLA
- **Layer Height**: 0.2-0.3mm
- **Infill**: 20-30% (for rigidity)
- **Wall Lines**: 3-4 perimeters
- **Supports**: Yes, for complex cutouts
- **Print Speed**: 40-50mm/s

**Material Choices:**
1. **White PLA**: Clean, modern look
2. **Wood-filled PLA**: Warm, organic aesthetic
3. **Translucent PETG**: Allows light through solid areas
4. **Black PLA**: High contrast, dramatic shadows

### CNC Routing

**Recommended Settings:**
- **Material**: MDF, Plywood, Acrylic, Hardwood
- **Bit Size**: 1/8" or 3mm for detail
- **Feed Rate**: 1000-1500mm/min (wood)
- **Depth Per Pass**: 1-2mm
- **Finishing**: Sand to 220 grit, seal/paint

### Laser Cutting

**Recommended Settings:**
- **Material**: 3-6mm plywood, acrylic, cardboard
- **Power**: 80-100% (material dependent)
- **Speed**: 10-20mm/s for cutting
- **Multiple Passes**: For thicker materials

## LED Integration

### Back-Lighting Setup

1. **LED Strip Mounting**
   - Use `addLedChannel=true` in UI
   - Creates 3mm recessed channel on back
   - Mount 12V LED strip in channel
   - Warm white (2700K) recommended

2. **Wiring**
   - Route wires through frame corners
   - Use cable clips or hot glue
   - Connect to 12V power supply

3. **Diffusion**
   - Mount panel 10-30mm from wall
   - Use spacers or standoffs
   - Light reflects off wall through cutouts

### Front-Lighting Setup

1. **Spotlight Illumination**
   - Mount adjustable spotlights
   - Angle light across panel surface
   - Creates dramatic shadows through cutouts

2. **Ambient Lighting**
   - Place panel near existing light source
   - Natural light creates changing patterns
   - Shadows move throughout day

## Installation

### Wall Mounting

1. **Mounting Holes**
   - Enable `addMountingHoles=true`
   - Standard M5 (5mm) holes in corners
   - Use wall anchors for drywall
   - Screws for studs/solid walls

2. **Standoff Method**
   - Use 10-30mm standoffs
   - Creates shadow gap
   - Allows back-lighting
   - Modern floating effect

3. **Frame Mounting**
   - Build wooden frame
   - Attach panel to frame
   - Hang frame on wall
   - Traditional gallery style

## Design Tips

### Pattern Selection

**For Small Panels (< 300mm)**
- Use simpler patterns: phi_spiral, celtic_knot
- Lower phi_iterations (5-8)
- Higher pattern_density (60-70%)

**For Large Panels (> 500mm)**
- Use complex patterns: fractal_branches, sacred_geometry
- Higher phi_iterations (10-15)
- Moderate pattern_density (40-60%)

**For Symmetrical Designs**
- Use symmetry=4, 6, 8, or 12
- Patterns: sacred_geometry, golden_mandala, islamic_geometric

**For Organic Designs**
- Use symmetry=1 (asymmetric)
- Patterns: tree_of_life, nature_leaves, voronoi_organic

### Color & Finish

**Natural Wood**
- Use wood-filled filament or real wood
- Clear coat or oil finish
- Warm, organic aesthetic

**Painted**
- Prime with spray primer
- 2-3 coats acrylic paint
- Matte finish for subtle look
- Gloss for modern style

**Metallic**
- Spray with metallic paint
- Gold, copper, or silver
- Luxurious appearance
- Reflects light beautifully

## Troubleshooting

### Issue: Pattern too dense, panel weak
**Solution**: Reduce `pattern_density` to 40-50%

### Issue: Pattern not visible
**Solution**: Increase `phi_iterations` or adjust `pattern_density`

### Issue: File too large
**Solution**: Increase `resolution` to 4-5mm (less detail)

### Issue: Print fails with supports
**Solution**: Orient panel flat on bed, enable support everywhere

### Issue: Cutouts too small for CNC
**Solution**: Increase `resolution` to 4mm minimum for routing

## Advanced Customization

### Combining Patterns

Modify the generator to blend multiple patterns:

```python
def custom_blend_pattern(self, x, y):
    spiral = self.phi_spiral_pattern(x, y, 8)
    mandala = self.golden_mandala_pattern(x, y, 6, 5)
    
    # Blend based on radius
    r = math.sqrt(x*x + y*y)
    blend_factor = min(r / 100, 1.0)
    
    return spiral * (1 - blend_factor) + mandala * blend_factor
```

### Variable Depth Carving

Create relief patterns instead of through-cuts:

```python
panel.generate_light_panel(
    cutout_depth=3,  # Only 3mm deep (panel is 6mm)
    # Creates relief carving effect
)
```

### Multi-Layer Panels

Stack multiple panels with different patterns:
1. Back panel: Simple pattern, translucent
2. Front panel: Complex pattern, opaque
3. LED between layers
4. Creates depth and parallax

## File Structure

```
Sign-Sculptor/
├── client/src/components/editor/
│   ├── light-panel-controls.tsx      # UI controls
│   └── editor-sidebar.tsx            # Tab integration
├── FRAYMUS_Light_Panel_Generator.py  # Backend generator
├── FRAYMUS_LIGHT_PANEL_GUIDE.md      # This guide
└── output/
    ├── FRAYMUS_PhiSpiral_Panel.stl
    ├── FRAYMUS_TreeOfLife_Panel.stl
    └── FRAYMUS_FibonacciFlower_Panel.stl
```

## FRAYMUS Principles Applied

1. **Phi-Based Geometry**: All patterns use φ = 1.618...
2. **Golden Angle**: 137.507764° for natural spirals
3. **Fractal Recursion**: Self-similar patterns at multiple scales
4. **Harmonic Resonance**: Mathematical beauty creates visual harmony
5. **Natural Optimization**: Patterns found in nature (sunflowers, trees, DNA)

## Performance Specifications

### Generation Time
- Small panel (300x400, res=3mm): 10-30 seconds
- Large panel (600x800, res=2mm): 1-3 minutes
- Ultra-detailed (res=1mm): 5-10 minutes

### File Sizes
- Low detail (res=5mm): 5-15 MB
- Medium detail (res=3mm): 15-40 MB
- High detail (res=2mm): 40-100 MB
- Ultra detail (res=1mm): 100-500 MB

### Memory Usage
- Typical: 200-500 MB RAM
- Large panels: Up to 1 GB RAM

## Future Enhancements

- [ ] Color gradient mapping
- [ ] Multi-material support
- [ ] Animated pattern morphing
- [ ] Custom image to pattern conversion
- [ ] Real-time 3D preview in UI
- [ ] Pattern library expansion
- [ ] Parametric curve editor
- [ ] AI-assisted pattern generation

## Credits

**Design**: Eyeoverthink Productions LLC  
**Architecture**: FRAYMUS v1.0  
**Mathematics**: Golden Ratio (φ), Fibonacci, Vogel  
**Inspiration**: Nature, Sacred Geometry, Islamic Art

---

## Quick Start

```bash
# Generate your first FRAYMUS light panel
python FRAYMUS_Light_Panel_Generator.py

# This creates three example STL files
# Import into your slicer or CAM software
# Print or cut your decorative light panel!
```

---

**Transform your space with mathematically perfect, phi-based decorative lighting.**
