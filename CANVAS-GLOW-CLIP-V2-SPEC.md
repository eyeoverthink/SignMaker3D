# Canvas Glow-Clip v2 - OpenSCAD Specification

## Design Overview
Wide diffuser "wash" lighting for canvas illumination (not narrow "spot" beam).

## Key Dimensions (from OpenSCAD)

```openscad
magnet_diameter = 8.2;
magnet_depth = 3.2; 
led_diameter = 5.2; 
mount_w = 20;        // Base plate width
mount_h = 25;        // Base plate height
mount_d = 5;         // Base plate depth
```

## Duckbill Light Spreader Geometry

### LED Base (where light starts)
- Position: `translate([0, 5, 12.5])`
- Rotation: `rotate([45, 0, 0])`
- Diameter: 10mm
- Height: 1mm (thin slice)

### Wide Mouth (where light exits)
- Position: `translate([0, 20, 3])` - Moved further out and down
- Rotation: `rotate([45, 0, 0])`
- Size: `resize([30, 10, 1])` - **30mm wide, 10mm tall**
- Shape: Stretched oval (wide horizontal spread)

### Hull Operation
The duckbill is created using OpenSCAD's `hull()` to blend:
- Small circle (10mm) at LED base
- Wide oval (30mm × 10mm) at mouth

This creates a smooth transition from circular LED to wide rectangular output.

## Cutouts

### 1. Magnet Hole (Back)
```openscad
translate([0, -0.1, 12.5]) 
rotate([90, 0, 0]) 
cylinder(h=magnet_depth, d=magnet_diameter);
```
- Position: Back of base plate at LED height
- Depth: 3.2mm
- Diameter: 8.2mm

### 2. LED Chamber
```openscad
translate([0, 5, 12.5]) 
rotate([45, 0, 0]) 
cylinder(h=10, d=led_diameter);
```
- Position: Same as LED base
- Depth: 10mm (for LED legs)
- Diameter: 5.2mm
- Angle: 45° tilt

### 3. Light Cone (Hollow Interior)
```openscad
hull() {
    // Start at LED size
    translate([0, 6, 12.5]) 
    rotate([45, 0, 0]) 
    cylinder(h=0.1, d=led_diameter);
    
    // End at Wide size
    translate([0, 20.1, 3]) 
    rotate([45, 0, 0]) 
    resize([28, 8, 1])  // 28mm × 8mm (2mm smaller than outer)
    cylinder(h=0.1, d=10);
}
```
- Inner cavity is 2mm smaller than outer shell (1mm wall thickness on each side)
- Smooth taper from 5.2mm circle to 28mm × 8mm oval

### 4. Wire Channel (Top Exit)
```openscad
translate([-1.5, 2, 12.5])
cube([3, 10, 20]);
```
- Width: 3mm
- Depth: 10mm
- Height: 20mm (extends upward from LED position)

## Back Plate
- Same dimensions as front housing base: 20mm × 5mm × 25mm
- Magnet hole cutout at same position as front
- Sandwiches canvas between front and back

## Critical Design Notes

1. **45° Tilt** - LED is angled 45° forward for optimal canvas wash
2. **Wide Spread** - 30mm width provides broad, even illumination
3. **Thin Profile** - Only 5mm base depth for minimal canvas interference
4. **Hull Blending** - Smooth transition prevents light hotspots
5. **Wire Exit** - Top channel keeps wiring clean and hidden

## Server-Side Generator Mapping

Current implementation in `generateDuckbillWashSpreader()`:
- ✅ LED base position and size
- ✅ Wide mouth oval (30mm × 10mm)
- ✅ Hull-like interpolation between circle and oval
- ✅ Hollow interior with wall thickness
- ✅ 45° tilt angle support

Parameters to verify:
- `washWidth` should default to 30mm
- `washHeight` should default to 10mm
- `duckbillDepth` should be ~15mm (distance from LED to mouth)
- `ledBaseR` is 5mm (10mm diameter)
- Wall thickness is consistent (1-2mm)
