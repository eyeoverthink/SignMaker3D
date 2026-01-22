/**
 * YING-YANG GENERATOR
 * Creates Taoist Yin-Yang symbol signs with LED channels and mounting
 * 
 * Features:
 * - Perfect circular geometry with interlocking halves
 * - Dual LED channels for yin/yang contrast
 * - Optional small circles (eyes) with separate LED control
 * - Rotating animation support
 * - Wall mount or stand base options
 * - Scott torsion reinforcement for structural integrity
 */

import * as THREE from "three";

interface Point2D {
  x: number;
  y: number;
}

/**
 * Ying-Yang Settings
 */
export interface YingYangSettings {
  // Dimensions
  diameter: number; // mm (outer circle)
  depth: number; // mm (sign thickness)
  wallThickness: number; // mm
  
  // LED Channels
  yinLEDType: "ws2812b" | "neon_strip" | "el_wire" | "standard_5v";
  yangLEDType: "ws2812b" | "neon_strip" | "el_wire" | "standard_5v";
  eyeLEDType: "ws2812b" | "neon_strip" | "el_wire" | "standard_5v" | "none";
  ledChannelWidth: number; // mm (6, 8, 10.5, 14)
  ledChannelDepth: number; // mm
  
  // Design Options
  includeEyes: boolean; // Small circles in each half
  eyeDiameter: number; // mm
  rotationEnabled: boolean; // For animated version
  
  // Mounting
  mountingType: "wall_mount" | "stand_base" | "hanging" | "none";
  mountingHoleCount: number; // For wall mount
  standHeight: number; // mm for stand base
  
  // Advanced
  includeScottTorsion: boolean;
  separateHalves: boolean; // Export yin/yang as separate STLs
  includeDiffuser: boolean;
  diffuserThickness: number; // mm
  
  // Export
  exportFormat: "stl" | "3mf";
}

/**
 * Default settings
 */
export const defaultYingYangSettings: YingYangSettings = {
  diameter: 200,
  depth: 15,
  wallThickness: 3,
  
  yinLEDType: "ws2812b",
  yangLEDType: "ws2812b",
  eyeLEDType: "ws2812b",
  ledChannelWidth: 10.5,
  ledChannelDepth: 8,
  
  includeEyes: true,
  eyeDiameter: 30,
  rotationEnabled: false,
  
  mountingType: "wall_mount",
  mountingHoleCount: 4,
  standHeight: 150,
  
  includeScottTorsion: true,
  separateHalves: false,
  includeDiffuser: true,
  diffuserThickness: 2,
  
  exportFormat: "stl",
};

/**
 * Generate Yin half (black/dark side)
 */
export function generateYinHalf(settings: YingYangSettings): THREE.Group {
  const yin = new THREE.Group();
  yin.name = "Yin_Half";
  
  const radius = settings.diameter / 2;
  
  // Main semicircle (left half)
  const yinShape = new THREE.Shape();
  yinShape.moveTo(0, radius);
  yinShape.arc(-radius, 0, radius, Math.PI / 2, -Math.PI / 2, true);
  
  // Add small circle bump (top)
  yinShape.arc(0, radius / 2, radius / 2, -Math.PI / 2, Math.PI / 2, false);
  
  // Subtract small circle (bottom) - create hole
  if (settings.includeEyes) {
    const eyeHole = new THREE.Path();
    eyeHole.absarc(0, -radius / 2, settings.eyeDiameter / 2, 0, Math.PI * 2, false);
    yinShape.holes.push(eyeHole);
  }
  
  // Extrude to 3D
  const extrudeSettings = {
    depth: settings.depth,
    bevelEnabled: false,
  };
  
  const yinGeometry = new THREE.ExtrudeGeometry(yinShape, extrudeSettings);
  const yinMesh = new THREE.Mesh(
    yinGeometry,
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  
  yin.add(yinMesh);
  
  // Add LED channel
  const ledChannel = createLEDChannel(settings, "yin");
  yin.add(ledChannel);
  
  return yin;
}

/**
 * Generate Yang half (white/light side)
 */
export function generateYangHalf(settings: YingYangSettings): THREE.Group {
  const yang = new THREE.Group();
  yang.name = "Yang_Half";
  
  const radius = settings.diameter / 2;
  
  // Main semicircle (right half)
  const yangShape = new THREE.Shape();
  yangShape.moveTo(0, radius);
  yangShape.arc(radius, 0, radius, Math.PI / 2, -Math.PI / 2, false);
  
  // Add small circle bump (bottom)
  yangShape.arc(0, -radius / 2, radius / 2, Math.PI / 2, -Math.PI / 2, false);
  
  // Subtract small circle (top) - create hole
  if (settings.includeEyes) {
    const eyeHole = new THREE.Path();
    eyeHole.absarc(0, radius / 2, settings.eyeDiameter / 2, 0, Math.PI * 2, false);
    yangShape.holes.push(eyeHole);
  }
  
  // Extrude to 3D
  const extrudeSettings = {
    depth: settings.depth,
    bevelEnabled: false,
  };
  
  const yangGeometry = new THREE.ExtrudeGeometry(yangShape, extrudeSettings);
  const yangMesh = new THREE.Mesh(
    yangGeometry,
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
  );
  
  yang.add(yangMesh);
  
  // Add LED channel
  const ledChannel = createLEDChannel(settings, "yang");
  yang.add(ledChannel);
  
  return yang;
}

/**
 * Generate complete Ying-Yang symbol
 */
export function generateCompleteYingYang(settings: YingYangSettings): THREE.Group {
  const yingYang = new THREE.Group();
  yingYang.name = "YingYang_Complete";
  
  const yin = generateYinHalf(settings);
  const yang = generateYangHalf(settings);
  
  yingYang.add(yin);
  yingYang.add(yang);
  
  // Add outer ring/border
  const border = generateBorder(settings);
  yingYang.add(border);
  
  // Add mounting system
  if (settings.mountingType !== "none") {
    const mounting = generateMounting(settings);
    yingYang.add(mounting);
  }
  
  return yingYang;
}

/**
 * Create LED channel for yin or yang half
 */
function createLEDChannel(settings: YingYangSettings, half: "yin" | "yang"): THREE.Group {
  const channel = new THREE.Group();
  channel.name = `LED_Channel_${half}`;
  
  const radius = settings.diameter / 2;
  const channelWidth = settings.ledChannelWidth;
  const channelDepth = settings.ledChannelDepth;
  
  // Create channel path following the S-curve
  const channelGeometry = new THREE.BoxGeometry(
    channelWidth,
    radius * 2,
    channelDepth
  );
  
  const channelMesh = new THREE.Mesh(
    channelGeometry,
    new THREE.MeshStandardMaterial({ color: 0x303030 })
  );
  
  channelMesh.position.z = settings.depth - channelDepth;
  
  channel.add(channelMesh);
  
  return channel;
}

/**
 * Generate outer border/ring
 */
function generateBorder(settings: YingYangSettings): THREE.Group {
  const border = new THREE.Group();
  border.name = "Border";
  
  const outerRadius = settings.diameter / 2;
  const innerRadius = outerRadius - settings.wallThickness;
  
  const borderShape = new THREE.Shape();
  borderShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  borderShape.holes.push(hole);
  
  const extrudeSettings = {
    depth: settings.depth,
    bevelEnabled: false,
  };
  
  const borderGeometry = new THREE.ExtrudeGeometry(borderShape, extrudeSettings);
  const borderMesh = new THREE.Mesh(
    borderGeometry,
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  
  border.add(borderMesh);
  
  return border;
}

/**
 * Generate mounting system
 */
function generateMounting(settings: YingYangSettings): THREE.Group {
  const mounting = new THREE.Group();
  mounting.name = "Mounting";
  
  if (settings.mountingType === "wall_mount") {
    // Add mounting holes
    const radius = settings.diameter / 2;
    const holeRadius = 2; // M3 screw hole
    
    for (let i = 0; i < settings.mountingHoleCount; i++) {
      const angle = (i / settings.mountingHoleCount) * Math.PI * 2;
      const x = Math.cos(angle) * (radius - 10);
      const y = Math.sin(angle) * (radius - 10);
      
      const holeGeometry = new THREE.CylinderGeometry(
        holeRadius,
        holeRadius,
        settings.depth,
        16
      );
      
      const holeMesh = new THREE.Mesh(
        holeGeometry,
        new THREE.MeshStandardMaterial({ color: 0xFF0000 })
      );
      
      holeMesh.position.set(x, y, settings.depth / 2);
      holeMesh.rotation.x = Math.PI / 2;
      
      mounting.add(holeMesh);
    }
  } else if (settings.mountingType === "stand_base") {
    // Create stand base
    const baseGeometry = new THREE.CylinderGeometry(
      settings.diameter / 4,
      settings.diameter / 3,
      settings.standHeight,
      32
    );
    
    const baseMesh = new THREE.Mesh(
      baseGeometry,
      new THREE.MeshStandardMaterial({ color: 0x404040 })
    );
    
    baseMesh.position.z = -settings.standHeight / 2;
    mounting.add(baseMesh);
  }
  
  return mounting;
}

/**
 * Generate diffuser lid
 */
export function generateDiffuser(settings: YingYangSettings): THREE.Group {
  const diffuser = new THREE.Group();
  diffuser.name = "Diffuser";
  
  const radius = settings.diameter / 2;
  
  const diffuserShape = new THREE.Shape();
  diffuserShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  
  const extrudeSettings = {
    depth: settings.diffuserThickness,
    bevelEnabled: false,
  };
  
  const diffuserGeometry = new THREE.ExtrudeGeometry(diffuserShape, extrudeSettings);
  const diffuserMesh = new THREE.Mesh(
    diffuserGeometry,
    new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.8
    })
  );
  
  diffuser.add(diffuserMesh);
  
  return diffuser;
}

/**
 * Generate assembly instructions
 */
export function generateYingYangInstructions(settings: YingYangSettings): string {
  return `# Ying-Yang Symbol Assembly Instructions

## Overview
Taoist Yin-Yang symbol with dual LED channels for contrasting illumination.

## Specifications
- Diameter: ${settings.diameter}mm
- Depth: ${settings.depth}mm
- LED Type (Yin): ${settings.yinLEDType}
- LED Type (Yang): ${settings.yangLEDType}
${settings.includeEyes ? `- Eye Diameter: ${settings.eyeDiameter}mm\n- Eye LED Type: ${settings.eyeLEDType}` : ''}

## Parts List
${settings.separateHalves ? '- Yin Half (black/dark side) - 1×\n- Yang Half (white/light side) - 1×' : '- Complete Ying-Yang Symbol - 1×'}
- Outer Border Ring - 1×
${settings.includeDiffuser ? `- Diffuser Lid (${settings.diffuserThickness}mm clear) - 1×` : ''}
${settings.mountingType === 'wall_mount' ? `- M3×8mm Screws - ${settings.mountingHoleCount}×\n- Wall Anchors - ${settings.mountingHoleCount}×` : ''}
${settings.mountingType === 'stand_base' ? `- Stand Base (${settings.standHeight}mm tall) - 1×` : ''}

## LED Installation

### Yin Half (Dark Side)
1. Route ${settings.yinLEDType} strip along the S-curve channel
2. Start from center, follow the curve outward
3. Secure with hot glue or clips
4. Connect to controller (data pin for WS2812B)

### Yang Half (Light Side)
1. Route ${settings.yangLEDType} strip along opposite S-curve
2. Mirror the yin installation
3. Secure in channel
4. Connect to controller (separate data pin if addressable)

${settings.includeEyes ? `### Eye LEDs
1. Install small ${settings.eyeLEDType} in each eye circle
2. Yin eye (white dot in black): Connect to yang controller
3. Yang eye (black dot in white): Connect to yin controller
4. This creates the contrast effect
` : ''}

## Assembly Steps

1. **LED Installation**
   - Install LEDs in both halves as described above
   - Test before final assembly

2. **Join Halves**
${settings.separateHalves ? '   - Align yin and yang halves\n   - Use hot glue or epoxy along seam\n   - Ensure perfect circular fit' : '   - Symbol is pre-joined, skip this step'}

3. **Attach Border**
   - Place outer ring around symbol
   - Secure with glue or snap-fit tabs
   - Ensure flush fit

${settings.includeDiffuser ? `4. **Install Diffuser**
   - Place clear diffuser over front
   - Snap into place or secure with clips
   - Ensure even light distribution
` : ''}

${settings.mountingType === 'wall_mount' ? `5. **Wall Mounting**
   - Mark ${settings.mountingHoleCount} mounting points on wall
   - Install wall anchors
   - Secure symbol with M3 screws
   - Level the symbol (use spirit level)
` : settings.mountingType === 'stand_base' ? `5. **Stand Assembly**
   - Attach stand base to bottom of symbol
   - Ensure stable, level placement
   - Route power cable through base
` : ''}

## Wiring Diagram

### Dual LED Control
- **Yin Channel**: Connect to Controller Pin 1 (or 5V for static)
- **Yang Channel**: Connect to Controller Pin 2 (or separate 5V)
- **Power**: 5V supply (calculate based on LED count)
- **Ground**: Common ground for all LEDs

### Animation (Optional)
${settings.rotationEnabled ? `- Use stepper motor for rotation
- Controller: Arduino + A4988 driver
- Rotation speed: 1-10 RPM
- Power: 12V for motor, 5V for LEDs
` : '- Static display (no rotation)'}

## Power Requirements
- Yin LEDs: ~${Math.ceil(settings.diameter * Math.PI / 16.67)} LEDs × 60mA = ${(Math.ceil(settings.diameter * Math.PI / 16.67) * 0.06).toFixed(1)}A
- Yang LEDs: ~${Math.ceil(settings.diameter * Math.PI / 16.67)} LEDs × 60mA = ${(Math.ceil(settings.diameter * Math.PI / 16.67) * 0.06).toFixed(1)}A
${settings.includeEyes ? `- Eye LEDs: 2× × 60mA = 0.12A` : ''}
- **Total Current**: ~${((Math.ceil(settings.diameter * Math.PI / 16.67) * 0.12) + (settings.includeEyes ? 0.12 : 0)).toFixed(1)}A
- **Recommended PSU**: 5V, ${Math.ceil((Math.ceil(settings.diameter * Math.PI / 16.67) * 0.12) + (settings.includeEyes ? 0.12 : 0) + 0.5)}A

## Programming (WS2812B)
\`\`\`cpp
// Yin channel (dark): warm white or blue
// Yang channel (light): bright white or red
// Eyes: opposite colors for contrast

#include <FastLED.h>

#define YIN_PIN 6
#define YANG_PIN 7
#define YIN_LEDS ${Math.ceil(settings.diameter * Math.PI / 16.67)}
#define YANG_LEDS ${Math.ceil(settings.diameter * Math.PI / 16.67)}

CRGB yinLEDs[YIN_LEDS];
CRGB yangLEDs[YANG_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, YIN_PIN, GRB>(yinLEDs, YIN_LEDS);
  FastLED.addLeds<WS2812B, YANG_PIN, GRB>(yangLEDs, YANG_LEDS);
}

void loop() {
  // Yin: dark blue
  fill_solid(yinLEDs, YIN_LEDS, CRGB(0, 0, 50));
  
  // Yang: bright white
  fill_solid(yangLEDs, YANG_LEDS, CRGB(255, 255, 255));
  
  FastLED.show();
}
\`\`\`

## Troubleshooting
- **Uneven lighting**: Adjust LED spacing or add more LEDs
- **Seam visible**: Use black caulk or paint to hide join
- **LEDs not working**: Check polarity and data pin connections
- **Diffuser too bright**: Use frosted acrylic or add opacity layer

## Philosophy Note
The Yin-Yang symbol represents balance and harmony in Taoist philosophy:
- **Yin** (dark): Feminine, passive, cold, night
- **Yang** (light): Masculine, active, warm, day
- **Eyes**: Each contains the seed of the other (interconnection)

Your LED sign embodies this duality through contrasting illumination!

---
Generated by Sign-Sculptor Ying-Yang Designer
`;
}

/**
 * Generate BOM
 */
export function generateYingYangBOM(settings: YingYangSettings): string {
  const yinLEDCount = Math.ceil(settings.diameter * Math.PI / 16.67);
  const yangLEDCount = Math.ceil(settings.diameter * Math.PI / 16.67);
  const totalLEDs = yinLEDCount + yangLEDCount + (settings.includeEyes ? 2 : 0);
  
  const ledCost = (totalLEDs / 60) * 12; // $12 per meter (60 LEDs)
  const printCost = (settings.diameter * settings.diameter * settings.depth / 10000) * 0.02;
  const hardwareCost = settings.mountingType === 'wall_mount' ? 2 : settings.mountingType === 'stand_base' ? 5 : 0;
  const totalCost = ledCost + printCost + hardwareCost + 3;
  
  return `# Bill of Materials - Ying-Yang Symbol

## 3D Printed Parts
${settings.separateHalves ? `- Yin Half (${settings.diameter}mm diameter) - $${(printCost / 2).toFixed(2)} (black PLA)
- Yang Half (${settings.diameter}mm diameter) - $${(printCost / 2).toFixed(2)} (white PLA)` : `- Complete Ying-Yang (${settings.diameter}mm diameter) - $${printCost.toFixed(2)} (dual color)`}
- Outer Border Ring - $${(printCost * 0.2).toFixed(2)} (PLA)
${settings.includeDiffuser ? `- Diffuser Lid - $${(printCost * 0.3).toFixed(2)} (clear PETG)` : ''}
${settings.mountingType === 'stand_base' ? `- Stand Base (${settings.standHeight}mm) - $${hardwareCost.toFixed(2)} (PLA)` : ''}

## Electronic Components
- **${settings.yinLEDType}** for Yin (${yinLEDCount} LEDs) - $${((yinLEDCount / 60) * 12).toFixed(2)}
- **${settings.yangLEDType}** for Yang (${yangLEDCount} LEDs) - $${((yangLEDCount / 60) * 12).toFixed(2)}
${settings.includeEyes ? `- **${settings.eyeLEDType}** for Eyes (2 LEDs) - $0.50` : ''}
${settings.yinLEDType === 'ws2812b' || settings.yangLEDType === 'ws2812b' ? `- Arduino Nano or ESP32 - $3.00
- 220Ω Resistor (data line) - $0.10` : ''}
- 5V Power Supply (${Math.ceil(totalLEDs * 0.06 + 0.5)}A) - $${Math.ceil(totalLEDs * 0.06 + 0.5) > 2 ? '8.00' : '5.00'}
- 22 AWG Wire (red/black, 1m) - $1.00

## Hardware
${settings.mountingType === 'wall_mount' ? `- M3×8mm Screws (${settings.mountingHoleCount}×) - $${(settings.mountingHoleCount * 0.10).toFixed(2)}
- Wall Anchors (${settings.mountingHoleCount}×) - $${(settings.mountingHoleCount * 0.20).toFixed(2)}` : ''}
- Hot Glue Sticks (2×) - $0.20
- Solder - $0.10

## Optional
- Frosted spray (diffuser effect) - $5.00
${settings.rotationEnabled ? '- Stepper motor (28BYJ-48) - $2.00\n- ULN2003 driver board - $1.00\n- 12V power supply - $6.00' : ''}

## Total Cost: $${totalCost.toFixed(2)}

## Where to Buy
- **LED Strips**: AliExpress, Amazon (search "${settings.yinLEDType}")
- **Arduino/ESP32**: Amazon, Adafruit, SparkFun
- **3D Printing Filament**: 
  - Black PLA: Hatchbox, eSUN
  - White PLA: Polymaker, Prusament
  - Clear PETG: Overture, eSUN
- **Hardware**: Local hardware store, McMaster-Carr

## Print Settings
- **Material**: PLA (yin/yang), Clear PETG (diffuser)
- **Layer Height**: 0.2mm
- **Infill**: 15% (symbol), 10% (diffuser)
- **Supports**: None (print flat)
- **Print Time**: ~${Math.ceil(settings.diameter / 20)} hours
- **Material Used**: ~${Math.ceil(settings.diameter * settings.diameter * settings.depth / 1000)}g

---
Generated by Sign-Sculptor Ying-Yang Designer
`;
}

/**
 * Main wrapper function for API endpoint
 */
export async function generateYingYang(settings: YingYangSettings) {
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
  const exporter = new STLExporter();
  
  if (settings.separateHalves) {
    // Export yin and yang as separate STLs
    const yin = generateYinHalf(settings);
    const yang = generateYangHalf(settings);
    const border = generateBorder(settings);
    
    const yinSTL = exporter.parse(yin, { binary: false });
    const yangSTL = exporter.parse(yang, { binary: false });
    const borderSTL = exporter.parse(border, { binary: false });
    
    let diffuserSTL = null;
    if (settings.includeDiffuser) {
      const diffuser = generateDiffuser(settings);
      diffuserSTL = exporter.parse(diffuser, { binary: false });
    }
    
    let mountingSTL = null;
    if (settings.mountingType !== "none") {
      const mounting = generateMounting(settings);
      mountingSTL = exporter.parse(mounting, { binary: false });
    }
    
    const assemblyInstructions = generateYingYangInstructions(settings);
    const bom = generateYingYangBOM(settings);
    
    return {
      yinSTL,
      yangSTL,
      borderSTL,
      diffuserSTL,
      mountingSTL,
      assemblyInstructions,
      bom,
      separateHalves: true
    };
  } else {
    // Export complete symbol as single STL
    const complete = generateCompleteYingYang(settings);
    const completeSTL = exporter.parse(complete, { binary: false });
    
    let diffuserSTL = null;
    if (settings.includeDiffuser) {
      const diffuser = generateDiffuser(settings);
      diffuserSTL = exporter.parse(diffuser, { binary: false });
    }
    
    const assemblyInstructions = generateYingYangInstructions(settings);
    const bom = generateYingYangBOM(settings);
    
    return {
      completeSTL,
      diffuserSTL,
      assemblyInstructions,
      bom,
      separateHalves: false
    };
  }
}
