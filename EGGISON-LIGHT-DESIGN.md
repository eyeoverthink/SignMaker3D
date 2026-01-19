# Eggison Light Design - Complete Vision

## Current State
- Eggison bulb shell (egg-shaped Edison bulb)
- 3V battery holder integrated
- Basic shell geometry with split/cracked options
- E26/E27 base types
- **Problem**: Shell is opaque - not actually a functional light

## Core Challenge
**A 3D printed shell is NOT a light unless:**
1. Printed in vase mode with intentional diffusion patterns
2. Has internal light source (filament tube, RGB LEDs, etc.)
3. Shell material/design allows light transmission

## Illumination Options to Implement

### 1. **Filament Tube Insert**
- Flexible LED filament tubing (like real Edison bulbs)
- Spiral/coil pattern inside egg
- Warm white glow effect
- Requires: tube diameter, coil height, turns count

### 2. **RGB LED Strip**
- Addressable WS2812B or simple RGB strip
- Wraps inside shell in spiral or vertical pattern
- Color-changing capability
- Requires: strip width, LED count, power/data connections

### 3. **Central LED Cluster**
- Single high-power LED or LED cluster at center
- Omnidirectional light spread
- Simple wiring to battery holder
- Requires: LED mount, heat dissipation

### 4. **Vase Mode Shell with Diffusion**
- Print shell in vase mode (single wall, no infill)
- Intentional patterns for light diffusion:
  - Spiral grooves
  - Honeycomb texture
  - Wave patterns
  - Random organic texture
- Thin enough for light transmission (0.4-0.8mm)

## Advanced Feature: Lithophane Core

### Concept
Instead of flat lithophane, create a **3D lithophane insert** that sits inside the egg shell:
- Oval/egg-shaped lithophane surface
- Image carved into the inner surface
- Backlit from center LED
- Creates stunning 3D depth effect when lit

### Implementation
- Generate oval lithophane mesh from image
- Variable thickness for grayscale depth
- Mounts to central LED holder
- Shell acts as outer diffuser

## Animation Concept: Spinning Egg Lithophane

### Mechanical Design
- Small motor mount at base
- Lithophane core rotates inside static shell
- Creates animation effect as different angles are illuminated
- **For future implementation** - keep simple for now

## Shell Material Options

### Translucent Filaments
- Natural PLA (slightly translucent)
- PETG (better light transmission)
- Translucent/clear filaments
- Silk/satin finish filaments

### Vase Mode Settings
- Single perimeter wall
- 0% infill
- Layer height: 0.2-0.3mm
- Wall thickness: 0.4-0.8mm

## Implementation Plan - Step by Step

### Phase 1: Light Source Options (Current Priority)
1. Add "Light Source Type" selector:
   - None (decorative only)
   - Filament Tube
   - RGB LED Strip
   - Central LED
   - Vase Mode Shell

2. For each light source, add specific controls:
   - **Filament Tube**: diameter, coil turns, height
   - **RGB LED Strip**: width, LED count, pattern (spiral/vertical)
   - **Central LED**: mount type, LED size
   - **Vase Mode**: diffusion pattern, wall thickness

3. Generate appropriate geometry:
   - Internal mounting structures
   - Wire routing channels
   - Battery connection points

### Phase 2: Lithophane Integration
1. Add "Lithophane Core" option
2. Image upload for lithophane
3. Generate oval lithophane mesh
4. Mount to central LED holder
5. Export combined assembly

### Phase 3: Advanced Features (Future)
1. Rotating mechanism design
2. Animation frame sequencing
3. Motor mount and control
4. Multi-image lithophane carousel

## Technical Requirements

### 3D Model Generation
- Parametric filament coil geometry
- LED strip path calculation
- Lithophane mesh from image heightmap
- Vase mode shell with texture patterns

### Export Outputs
- Shell STL (with or without vase mode)
- Light source insert STL (filament holder, LED mount)
- Lithophane core STL (if enabled)
- Assembly instructions
- Wiring diagram
- Bill of materials (LEDs, wire, battery, etc.)

### UI Controls Needed
- Light source type dropdown
- Conditional controls based on selection
- Lithophane image upload
- Preview showing internal components
- Material/print settings recommendations

## Connection to Other Features

### Scott Algorithm Integration
- Zero-shot recognition could identify optimal lithophane subjects
- 4D prediction could simulate light animation effects
- Collision detection for internal component clearances

### Existing Features
- Uses same battery holder from LED grid system
- Similar export workflow to other 3D generators
- Leverages lithophane generation code

## Next Steps
1. Document current Eggison code structure
2. Design light source geometry generators
3. Add UI controls for light options
4. Implement lithophane core generation
5. Create assembly export system
6. Test print with real LEDs/batteries

---

**Goal**: Make Eggison bulbs into **actual functional lights**, not just decorative shells.
