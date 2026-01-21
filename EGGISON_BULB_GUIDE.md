# EGGISON BULB - Design & Manufacturing Guide

## Overview

The **Eggison Bulb** is a FRAYMUS-enhanced lighting product that combines phi-based geometric structures with practical 3D printing technology. Named as a tribute to Edison bulbs but with an egg-shaped design, these bulbs incorporate advanced light diffusion patterns and optional lithophane imaging.

## Architecture

### Core Principles

1. **Phi-Vortex Lattice Structure**
   - Base texture applied to all surfaces
   - Uses Golden Ratio (φ = 1.618...) for spiral patterns
   - Golden Angle (137.507764°) for rotational harmony
   - Creates natural light diffusion

2. **Dual-Shell Design**
   - **Outer Shell**: Structural integrity + primary diffusion
   - **Inner Shell**: Secondary diffusion or lithophane display
   - Adjustable wall thickness (default: 2mm)

3. **Parametric Egg Shape**
   ```
   x = width × (1 + 0.3×cos(φ)) × sin(φ) × cos(θ)
   y = width × (1 + 0.3×cos(φ)) × sin(φ) × sin(θ)
   z = height × (cos(φ) × 0.5 + 0.5)
   ```

## Pattern Options

### Outer Shell Patterns

1. **phi-spiral** (Default)
   - Fibonacci-based spiral diffusion
   - Optimal light scattering
   - Signature FRAYMUS aesthetic
   ```
   pattern = sin(angle × φ + radius × 0.1 + z × 0.1 × golden_angle)
   ```

2. **houndstooth**
   - Classic textile pattern
   - 3D grid-based (5mm cells)
   - Alternating raised/recessed surfaces

3. **checkers**
   - Simple checkerboard pattern
   - 8mm grid cells
   - High contrast diffusion

4. **dots**
   - Radial dot pattern
   - Varies with height and angle
   - Organic appearance

5. **dna**
   - Double helix structure
   - Rotates around vertical axis
   - Biomimetic design

### Inner Shell Options

#### Pattern Mode
- Same pattern options as outer shell
- Can mix patterns (e.g., houndstooth outer + DNA inner)
- Creates layered diffusion effect

#### Lithophane Mode
- Converts grayscale images to depth variations
- Darker areas = thinner walls = more light
- Lighter areas = thicker walls = less light
- Image wraps around egg surface using UV mapping

## Mathematical Foundation

### Phi-Vortex Texture
```python
angle = atan2(y, x)
radius = sqrt(x² + y²)

vortex = sin(angle × 5 + z × 0.1 × golden_angle)
spiral = sin(radius × 0.2 × φ + z × 0.15)

texture_depth = 0.5 × (vortex × 0.5 + spiral × 0.5)
```

### Pattern Application
Each pattern modifies the surface radius by a small scale factor:
```
scale = 1 + pattern_value × depth × 0.05
x_new = x × scale
y_new = y × scale
```

### Lithophane Depth Mapping
```
brightness = image_pixel / 255.0
depth_offset = (1 - brightness) × max_depth
scale = 1 - depth_offset × 0.02
```

## Usage Examples

### Example 1: Classic Eggison (Phi-Spiral + DNA)
```python
from Eggison_Bulb_Generator import EggisonBulbGenerator

bulb = EggisonBulbGenerator("My_Eggison.stl")
bulb.generate_eggison_bulb(
    height=70,
    width=50,
    outer_shell_pattern="phi-spiral",
    inner_shell_type="pattern",
    inner_pattern="dna",
    wall_thickness=2.0
)
bulb.save()
```

### Example 2: Lithophane Portrait Bulb
```python
bulb = EggisonBulbGenerator("Portrait_Bulb.stl")
bulb.generate_eggison_bulb(
    outer_shell_pattern="dots",
    inner_shell_type="lithophane",
    lithophane_image="portrait.jpg",
    wall_thickness=1.5
)
bulb.save()
```

### Example 3: Textile-Inspired Design
```python
bulb = EggisonBulbGenerator("Textile_Bulb.stl")
bulb.generate_eggison_bulb(
    outer_shell_pattern="houndstooth",
    inner_shell_type="pattern",
    inner_pattern="checkers",
    wall_thickness=2.5
)
bulb.save()
```

## 3D Printing Specifications

### Recommended Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Material | Translucent PLA/PETG | For light transmission |
| Layer Height | 0.15-0.2mm | Balance quality/speed |
| Infill | 10-15% | Allows light diffusion |
| Wall Thickness | 2-3 perimeters | Structural integrity |
| Print Speed | 40-60mm/s | Maintain detail |
| Nozzle Temp | 200-220°C (PLA) | Material dependent |
| Bed Temp | 60°C (PLA) | Material dependent |
| Supports | Yes (base only) | Egg shape needs support |

### Material Recommendations

1. **Translucent PLA**
   - Easiest to print
   - Good light diffusion
   - Available in many colors

2. **PETG (Clear/Translucent)**
   - More durable
   - Better heat resistance
   - Excellent light transmission

3. **Specialty Filaments**
   - Silk PLA: Pearlescent effect
   - Wood-filled: Warm, organic glow
   - Glow-in-the-dark: Unique aesthetic

### Post-Processing

1. **Sanding** (Optional)
   - Light sanding with 400-800 grit
   - Enhances light diffusion
   - Softens layer lines

2. **Vapor Smoothing** (PETG/ABS)
   - Creates glass-like finish
   - Maximum light transmission
   - Requires proper ventilation

3. **LED Integration**
   - E12/E14 candelabra base recommended
   - Warm white (2700K) for ambiance
   - RGB for color effects
   - Low wattage (3-5W) to prevent melting

## Design Variations

### Size Options

| Size | Height | Width | Use Case |
|------|--------|-------|----------|
| Small | 50mm | 35mm | Accent lighting |
| Medium | 70mm | 50mm | Standard (default) |
| Large | 100mm | 70mm | Statement piece |
| XL | 150mm | 100mm | Floor lamp |

### Custom Patterns

To add your own pattern, modify the `apply_pattern()` method:

```python
elif pattern_type == "my_pattern":
    # Your mathematical pattern here
    # Must return a value between -1 and 1
    pattern = your_calculation(x, y, z)
```

## File Structure

```
Sign-Sculptor/
├── Eggison_Bulb_Generator.py    # Main generator
├── EGGISON_BULB_GUIDE.md        # This file
├── Eggison_PhiSpiral_DNA.stl    # Example output
├── Eggison_Houndstooth_Checkers.stl
└── Eggison_Smooth_PhiSpiral.stl
```

## Technical Specifications

### STL Output
- **Format**: ASCII STL
- **Facet Count**: ~19,200 (80×120 segments × 2 shells × 2 triangles)
- **File Size**: ~15-25 MB (ASCII)
- **Manifold**: Yes (watertight mesh)

### Performance
- **Generation Time**: 5-15 seconds (depending on resolution)
- **Memory Usage**: ~100-200 MB
- **Recommended Resolution**: 80×120 segments (default)

## Troubleshooting

### Issue: Bulb won't slice properly
**Solution**: Ensure supports are enabled for the base

### Issue: Lithophane too thick/thin
**Solution**: Adjust `max_depth` parameter (default: 1.5mm)

### Issue: Patterns not visible
**Solution**: Increase `depth` parameter in pattern application

### Issue: Print fails partway through
**Solution**: 
- Check bed adhesion
- Reduce print speed
- Increase support density

## Advanced Customization

### Combining Multiple Patterns

```python
def custom_hybrid_pattern(self, x, y, z):
    phi_spiral = self.apply_pattern(x, y, z, "phi-spiral", 0.2)
    dna = self.apply_pattern(x, y, z, "dna", 0.15)
    
    # Blend based on height
    blend = z / 70.0
    x_final = phi_spiral[0] * (1-blend) + dna[0] * blend
    y_final = phi_spiral[1] * (1-blend) + dna[1] * blend
    
    return (x_final, y_final, z)
```

### Variable Wall Thickness

```python
# Thicker at base, thinner at top
wall_thickness = 3.0 - (z / height) * 1.5
```

## FRAYMUS Integration

The Eggison Bulb demonstrates several FRAYMUS principles:

1. **Phi-Based Geometry**: All patterns use φ and golden angle
2. **Harmonic Resonance**: Light diffusion follows natural patterns
3. **Fractal Structure**: Patterns repeat at multiple scales
4. **Organic Variance**: Each bulb is unique due to parametric generation

## Future Enhancements

- [ ] Multi-color lithophanes
- [ ] Animated patterns (for rotating displays)
- [ ] Smart bulb integration (WiFi/Bluetooth)
- [ ] Modular base system
- [ ] Pattern library expansion
- [ ] Real-time preview renderer

## Credits

**Design**: Eyeoverthink Productions LLC  
**Architecture**: FRAYMUS v1.0  
**Inspiration**: Thomas Edison, Fibonacci, Nature

---

## Quick Start

```bash
# Generate your first Eggison Bulb
python Eggison_Bulb_Generator.py

# This creates three example STL files:
# 1. Eggison_PhiSpiral_DNA.stl
# 2. Eggison_Houndstooth_Checkers.stl
# 3. Eggison_Smooth_PhiSpiral.stl

# Import any STL into your slicer and print!
```

---

**Remember**: Each Eggison Bulb is a unique piece of functional art, combining mathematics, nature, and light. Experiment with different patterns and materials to create your perfect illumination.
