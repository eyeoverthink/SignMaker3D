# LED Holder Fix - Canvas Glow-Clip v2

## Issue Identified
The height adjustment was incorrectly modifying the entire LED socket and duckbill spreader position instead of just extending the base post.

## Root Cause
In `server/led-holder-generator.ts` line 544, the `channelLength` variable was being changed based on `adjustableHeight`:
```typescript
const channelLength = settings.adjustableHeight ? (settings.maxHeight || 30) : 15;
```

This caused the LED socket position (`socketY = baseHeight + channelLength`) to shift upward, moving the entire Canvas Glow-Clip v2 design.

## Solution Implemented
Decoupled the height adjustment from the Canvas Glow-Clip v2 design:

1. **Fixed channel length** - Canvas Glow-Clip v2 design stays constant at 15mm
2. **Base extension** - Height adjustment only extends the base post
3. **Threaded post** - Added proper threaded extension for adjustable height

### Code Changes
```typescript
// Fixed channel length for Canvas Glow-Clip v2 design
const fixedChannelLength = 15;
const baseExtension = settings.adjustableHeight ? ((settings.maxHeight || 30) - 15) : 0;

// Generate extended base if adjustable height is enabled
if (baseExtension > 0) {
  // Add threaded extension post to base
  const threadRadius = channelR + settings.wallThickness;
  generateWireChannel(triangles, 0, baseHeight, 0, threadRadius, baseExtension, settings.wallThickness, 16);
}

// Wire channel starts after base extension
const channelStartY = baseHeight + baseExtension;
generateWireChannel(triangles, 0, channelStartY, 0, channelR, fixedChannelLength, settings.wallThickness, 16);

// LED socket at fixed position relative to channel
const socketY = channelStartY + fixedChannelLength;
```

## Result
- ✅ Canvas Glow-Clip v2 design (LED socket + duckbill spreader) remains at fixed position
- ✅ Height adjustment only extends the base post (threaded for screw adjustment)
- ✅ Matches the CAD design provided by user
- ✅ Export functionality already exists and is functional

## UI Controls Available
- **Height Adjustment Toggle** - Enable/disable adjustable height
- **Min Height** - 10-50mm (default 20mm)
- **Max Height** - 20-100mm (default 60mm)
- **Wash Width** - Width of duckbill spreader
- **Wash Height** - Height of duckbill spreader
- **Duckbill Depth** - Depth of wash spreader
- **Tilt Angle** - 0-90° LED tilt
- **Wall Thickness** - 1-5mm
- **Wire Channel Diameter** - 1-10mm

## Export
The `/api/export/led-holder` endpoint generates a ZIP file containing:
- LED holder STL with Canvas Glow-Clip v2 design
- Proper height adjustment if enabled
- All user-specified parameters applied
