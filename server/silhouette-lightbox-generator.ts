/**
 * SILHOUETTE LIGHT BOX GENERATOR
 * Advanced multi-layer light box system with image tracing, stock templates, and per-layer LED control
 * 
 * Features:
 * - Auto/manual image tracing
 * - Freehand drawing canvas
 * - Stock template library (gaming, pop culture, science)
 * - Multi-layer silhouettes with independent LED types
 * - Clamshell diffuser (CNC-style raised routing)
 * - Lithophane keychain mode with battery/LED insert
 */

import * as THREE from "three";

export interface SilhouetteLayer {
  id: string;
  name: string;
  svgPath: string; // SVG path data
  depth: number; // mm from back
  ledType: "backlit" | "el_wire" | "ws2812b" | "neopixel" | "standard_strip" | "none";
  ledColor?: string; // Hex color for static LEDs
  channelWidth?: number; // mm for EL wire/tube routing
  opacity: number; // 0-1 for preview
  visible: boolean;
}

export interface StockTemplate {
  category: "gaming" | "pop_culture" | "science" | "symbols" | "abstract";
  name: string;
  svgPath: string;
  description: string;
  layers: SilhouetteLayer[];
}

export interface SilhouetteLightBoxSettings {
  // Box Dimensions
  width: number; // mm
  height: number; // mm
  depth: number; // mm
  wallThickness: number; // mm
  
  // Design Mode
  designMode: "image_trace" | "freehand" | "template" | "hybrid";
  
  // Image Tracing
  traceMode: "auto" | "manual";
  traceImage?: string; // Base64 image data
  edgeThreshold: number; // 0-255 for auto-trace
  simplifyTolerance: number; // Path simplification
  
  // Layers
  layers: SilhouetteLayer[];
  
  // Clamshell Diffuser
  diffuserStyle: "flat" | "clamshell_raised" | "cnc_routed";
  raisedHeight: number; // mm for clamshell
  routingDepth: number; // mm for CNC routing
  snapFitTolerance: number; // mm
  
  // LED System
  backlightType: "standard_5v" | "ws2812b" | "none";
  backlightLEDCount: number;
  includeControllerHousing: boolean;
  
  // Keychain Mode
  keychainMode: boolean;
  batteryType: "cr2032" | "cr2016" | "ag13";
  ledInsertDiameter: number; // mm (3mm or 5mm LED)
  
  // Export
  includeAssemblyGuide: boolean;
  includeWiringDiagram: boolean;
}

export const defaultSilhouetteSettings: SilhouetteLightBoxSettings = {
  width: 200,
  height: 200,
  depth: 30,
  wallThickness: 2,
  
  designMode: "template",
  
  traceMode: "auto",
  edgeThreshold: 128,
  simplifyTolerance: 2,
  
  layers: [],
  
  diffuserStyle: "clamshell_raised",
  raisedHeight: 5,
  routingDepth: 2,
  snapFitTolerance: 0.2,
  
  backlightType: "standard_5v",
  backlightLEDCount: 20,
  includeControllerHousing: false,
  
  keychainMode: false,
  batteryType: "cr2032",
  ledInsertDiameter: 5,
  
  includeAssemblyGuide: true,
  includeWiringDiagram: true,
};

/**
 * STOCK TEMPLATE LIBRARY
 * Pre-designed silhouettes for common themes
 */
export const STOCK_TEMPLATES: StockTemplate[] = [
  // GAMING
  {
    category: "gaming",
    name: "Pac-Man Chase",
    description: "Pac-Man being chased by ghosts",
    svgPath: "M 50,50 A 40,40 0 1,1 50,130 L 90,90 Z", // Simplified
    layers: [
      {
        id: "pacman",
        name: "Pac-Man",
        svgPath: "M 50,50 A 40,40 0 1,1 50,130 L 90,90 Z",
        depth: 5,
        ledType: "ws2812b",
        ledColor: "#FFFF00",
        opacity: 1,
        visible: true,
      },
      {
        id: "ghost1",
        name: "Red Ghost",
        svgPath: "M 150,50 Q 150,30 170,30 Q 190,30 190,50 L 190,110 L 180,100 L 170,110 L 160,100 L 150,110 Z",
        depth: 3,
        ledType: "standard_strip",
        ledColor: "#FF0000",
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    category: "gaming",
    name: "Mario Mushroom",
    description: "Super Mario power-up mushroom",
    svgPath: "M 100,150 Q 50,150 50,100 Q 50,50 100,50 Q 150,50 150,100 Q 150,150 100,150 Z M 100,150 L 100,200 L 80,200 L 80,180 L 120,180 L 120,200 L 100,200 Z",
    layers: [
      {
        id: "mushroom_cap",
        name: "Red Cap",
        svgPath: "M 100,150 Q 50,150 50,100 Q 50,50 100,50 Q 150,50 150,100 Q 150,150 100,150 Z",
        depth: 8,
        ledType: "backlit",
        ledColor: "#FF0000",
        opacity: 1,
        visible: true,
      },
      {
        id: "white_spots",
        name: "White Spots",
        svgPath: "M 75,80 A 10,10 0 1,1 75,100 A 10,10 0 1,1 75,80 Z M 125,80 A 10,10 0 1,1 125,100 A 10,10 0 1,1 125,80 Z",
        depth: 10,
        ledType: "none",
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    category: "gaming",
    name: "Game Boy",
    description: "Classic Game Boy silhouette",
    svgPath: "M 50,50 L 150,50 L 150,250 L 50,250 Z M 60,70 L 140,70 L 140,140 L 60,140 Z",
    layers: [
      {
        id: "gameboy_body",
        name: "Body",
        svgPath: "M 50,50 L 150,50 L 150,250 L 50,250 Z",
        depth: 5,
        ledType: "backlit",
        opacity: 1,
        visible: true,
      },
      {
        id: "screen",
        name: "Screen",
        svgPath: "M 60,70 L 140,70 L 140,140 L 60,140 Z",
        depth: 8,
        ledType: "ws2812b",
        ledColor: "#00FF00",
        opacity: 1,
        visible: true,
      },
    ],
  },

  // POP CULTURE
  {
    category: "pop_culture",
    name: "Pulp Fiction Silhouette",
    description: "Man with hat and cigarette",
    svgPath: "M 100,50 Q 80,50 80,70 L 80,100 Q 80,120 100,120 Q 120,120 120,100 L 120,70 Q 120,50 100,50 Z M 60,40 L 140,40 L 140,60 L 60,60 Z M 130,85 L 180,85 L 180,90 L 130,90 Z",
    layers: [
      {
        id: "head",
        name: "Head",
        svgPath: "M 100,50 Q 80,50 80,70 L 80,100 Q 80,120 100,120 Q 120,120 120,100 L 120,70 Q 120,50 100,50 Z",
        depth: 5,
        ledType: "backlit",
        opacity: 1,
        visible: true,
      },
      {
        id: "hat",
        name: "Hat",
        svgPath: "M 60,40 L 140,40 L 140,60 L 60,60 Z",
        depth: 7,
        ledType: "backlit",
        opacity: 1,
        visible: true,
      },
      {
        id: "cigarette",
        name: "Cigarette",
        svgPath: "M 130,85 L 180,85 L 180,90 L 130,90 Z",
        depth: 3,
        ledType: "el_wire",
        channelWidth: 3,
        ledColor: "#FF6600",
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    category: "pop_culture",
    name: "Star Wars Helmet",
    description: "Stormtrooper helmet",
    svgPath: "M 100,50 Q 70,50 70,80 L 70,120 Q 70,150 100,150 Q 130,150 130,120 L 130,80 Q 130,50 100,50 Z",
    layers: [
      {
        id: "helmet",
        name: "Helmet",
        svgPath: "M 100,50 Q 70,50 70,80 L 70,120 Q 70,150 100,150 Q 130,150 130,120 L 130,80 Q 130,50 100,50 Z",
        depth: 8,
        ledType: "backlit",
        opacity: 1,
        visible: true,
      },
    ],
  },

  // SCIENCE
  {
    category: "science",
    name: "DNA Double Helix",
    description: "DNA structure with base pairs",
    svgPath: "M 50,50 Q 100,100 50,150 Q 100,200 50,250 M 150,50 Q 100,100 150,150 Q 100,200 150,250",
    layers: [
      {
        id: "helix1",
        name: "Helix Strand 1",
        svgPath: "M 50,50 Q 100,100 50,150 Q 100,200 50,250",
        depth: 5,
        ledType: "ws2812b",
        ledColor: "#00FFFF",
        opacity: 1,
        visible: true,
      },
      {
        id: "helix2",
        name: "Helix Strand 2",
        svgPath: "M 150,50 Q 100,100 150,150 Q 100,200 150,250",
        depth: 5,
        ledType: "ws2812b",
        ledColor: "#FF00FF",
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    category: "science",
    name: "Atom Model",
    description: "Atomic structure with electrons",
    svgPath: "M 100,100 A 50,50 0 1,1 100,100.1 Z M 50,100 A 50,20 0 1,1 150,100 A 50,20 0 1,1 50,100 Z",
    layers: [
      {
        id: "nucleus",
        name: "Nucleus",
        svgPath: "M 100,100 A 10,10 0 1,1 100,100.1 Z",
        depth: 8,
        ledType: "ws2812b",
        ledColor: "#FFFF00",
        opacity: 1,
        visible: true,
      },
      {
        id: "orbit",
        name: "Electron Orbit",
        svgPath: "M 50,100 A 50,20 0 1,1 150,100 A 50,20 0 1,1 50,100 Z",
        depth: 3,
        ledType: "el_wire",
        channelWidth: 3,
        ledColor: "#00FFFF",
        opacity: 1,
        visible: true,
      },
    ],
  },

  // SYMBOLS
  {
    category: "symbols",
    name: "Peace Sign",
    description: "Classic peace symbol",
    svgPath: "M 100,50 A 50,50 0 1,1 100,150 A 50,50 0 1,1 100,50 Z M 100,100 L 100,150 M 100,100 L 65,135 M 100,100 L 135,135",
    layers: [
      {
        id: "peace",
        name: "Peace Symbol",
        svgPath: "M 100,50 A 50,50 0 1,1 100,150 A 50,50 0 1,1 100,50 Z M 100,100 L 100,150 M 100,100 L 65,135 M 100,100 L 135,135",
        depth: 5,
        ledType: "backlit",
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    category: "symbols",
    name: "Heart Hands",
    description: "Two hands forming a heart",
    svgPath: "M 50,100 L 70,80 L 100,100 L 130,80 L 150,100 L 100,150 Z",
    layers: [
      {
        id: "heart",
        name: "Heart Shape",
        svgPath: "M 50,100 L 70,80 L 100,100 L 130,80 L 150,100 L 100,150 Z",
        depth: 5,
        ledType: "ws2812b",
        ledColor: "#FF0066",
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    category: "symbols",
    name: "Middle Finger",
    description: "Hand gesture outline",
    svgPath: "M 80,150 L 80,100 L 90,100 L 90,60 L 100,60 L 100,100 L 110,100 L 110,150 Z",
    layers: [
      {
        id: "finger",
        name: "Gesture",
        svgPath: "M 80,150 L 80,100 L 90,100 L 90,60 L 100,60 L 100,100 L 110,100 L 110,150 Z",
        depth: 5,
        ledType: "backlit",
        opacity: 1,
        visible: true,
      },
    ],
  },

  // ABSTRACT
  {
    category: "abstract",
    name: "Fractal Nodes",
    description: "Connected nodes pattern",
    svgPath: "M 100,50 L 50,100 L 100,150 L 150,100 Z M 100,50 L 150,100 M 50,100 L 100,150",
    layers: [
      {
        id: "nodes",
        name: "Node Network",
        svgPath: "M 100,50 L 50,100 L 100,150 L 150,100 Z M 100,50 L 150,100 M 50,100 L 100,150",
        depth: 5,
        ledType: "ws2812b",
        opacity: 1,
        visible: true,
      },
    ],
  },
];

/**
 * Generate clamshell diffuser with raised routing
 */
export function generateClamshellDiffuser(settings: SilhouetteLightBoxSettings): THREE.Group {
  const diffuser = new THREE.Group();
  diffuser.name = "ClamshellDiffuser";
  
  // Base plate
  const baseGeometry = new THREE.BoxGeometry(
    settings.width,
    settings.height,
    settings.wallThickness
  );
  const baseMesh = new THREE.Mesh(
    baseGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      transmission: 0.9,
    })
  );
  diffuser.add(baseMesh);
  
  // Raised routing for each layer
  settings.layers.forEach((layer, index) => {
    if (!layer.visible) return;
    
    // Create raised channel following SVG path
    // In production, this would parse SVG and extrude along path
    const channelHeight = settings.raisedHeight + (index * 2);
    
    // Placeholder: Create simple raised outline
    const channelGeometry = new THREE.BoxGeometry(
      settings.width * 0.8,
      settings.height * 0.8,
      channelHeight
    );
    const channelMesh = new THREE.Mesh(
      channelGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.5,
      })
    );
    channelMesh.position.z = settings.wallThickness / 2 + channelHeight / 2;
    diffuser.add(channelMesh);
  });
  
  return diffuser;
}

/**
 * Generate lithophane keychain with battery/LED insert
 */
export function generateLithophaneKeychain(
  imageData: string,
  settings: SilhouetteLightBoxSettings
): THREE.Group {
  const keychain = new THREE.Group();
  keychain.name = "LithophaneKeychain";
  
  // Keychain dimensions (small)
  const width = 40;
  const height = 50;
  const thickness = 3;
  
  // Lithophane front (image relief)
  const lithophaneGeometry = new THREE.BoxGeometry(width, height, thickness);
  const lithophaneMesh = new THREE.Mesh(
    lithophaneGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.8,
    })
  );
  keychain.add(lithophaneMesh);
  
  // Battery compartment (back)
  const batteryDiameter = settings.batteryType === "cr2032" ? 20 : 16;
  const batteryHeight = settings.batteryType === "cr2032" ? 3.2 : 2.0;
  
  const compartmentGeometry = new THREE.CylinderGeometry(
    batteryDiameter / 2 + 1,
    batteryDiameter / 2 + 1,
    batteryHeight + 2,
    32
  );
  const compartmentMesh = new THREE.Mesh(
    compartmentGeometry,
    new THREE.MeshStandardMaterial({ color: 0x404040 })
  );
  compartmentMesh.rotation.x = Math.PI / 2;
  compartmentMesh.position.z = -(thickness / 2 + batteryHeight / 2 + 1);
  keychain.add(compartmentMesh);
  
  // LED insert hole
  const ledHoleGeometry = new THREE.CylinderGeometry(
    settings.ledInsertDiameter / 2,
    settings.ledInsertDiameter / 2,
    thickness + 2,
    16
  );
  const ledHoleMesh = new THREE.Mesh(
    ledHoleGeometry,
    new THREE.MeshStandardMaterial({ color: 0xFFFF00 })
  );
  ledHoleMesh.rotation.x = Math.PI / 2;
  keychain.add(ledHoleMesh);
  
  // Keyring hole
  const keyringGeometry = new THREE.TorusGeometry(3, 1, 8, 16);
  const keyringMesh = new THREE.Mesh(
    keyringGeometry,
    new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.8 })
  );
  keyringMesh.position.y = height / 2 + 5;
  keychain.add(keyringMesh);
  
  return keychain;
}

/**
 * Generate assembly instructions
 */
export function generateAssemblyInstructions(settings: SilhouetteLightBoxSettings): string {
  return `# Silhouette Light Box - Assembly Instructions

## Parts List:
${settings.keychainMode ? '- Lithophane keychain front\n- Battery compartment back\n- CR2032 battery (3V)\n- 5mm LED' : '- Light box shell\n- Clamshell diffuser\n- Layer silhouettes (×' + settings.layers.length + ')\n- LED strips/wires\n- Power supply'}

## Assembly Steps:

${settings.keychainMode ? `
### Keychain Assembly:
1. Insert 5mm LED into front hole (long leg = positive)
2. Place CR2032 battery in compartment (+ side up)
3. Connect LED legs to battery contacts
4. Snap front and back together
5. Attach keyring through top hole
` : `
### Light Box Assembly:
1. **Install Backlight** (if enabled):
   - Attach ${settings.backlightType} strip to back panel
   - Route wires through side channel
   
2. **Layer Installation** (back to front):
${settings.layers.map((layer, i) => `   ${i + 1}. ${layer.name} (${layer.depth}mm depth)
      - LED Type: ${layer.ledType}
      ${layer.ledType === 'el_wire' ? `- Route EL wire through ${layer.channelWidth}mm channels` : ''}
      ${layer.ledColor ? `- Color: ${layer.ledColor}` : ''}`).join('\n')}

3. **Diffuser Installation**:
   - Align clamshell diffuser with raised channels
   - Snap into place (${settings.snapFitTolerance}mm tolerance)
   - Ensure all layers are visible through routing

4. **Wiring**:
   - Connect all LED layers to power
   - ${settings.includeControllerHousing ? 'Install controller in housing' : 'Connect to external power'}
   - Test each layer independently

5. **Final Assembly**:
   - Close light box shell
   - Secure with clips/screws
   - Test full illumination
`}

## LED Types Used:
${settings.layers.map(l => `- ${l.name}: ${l.ledType}`).join('\n')}

## Power Requirements:
${settings.keychainMode ? '- CR2032 battery: 3V, ~220mAh\n- LED current: ~20mA\n- Runtime: ~10 hours' : `- Backlight: ${settings.backlightType}\n- Layer LEDs: ${settings.layers.filter(l => l.ledType !== 'none').length} active layers\n- Total current: Calculate based on LED count`}

---
Generated by Sign-Sculptor Silhouette Light Box Designer
`;
}

/**
 * Main wrapper function for API endpoint
 * Generates complete silhouette light box package with all STL files and documentation
 */
export async function generateSilhouetteLightBox(settings: SilhouetteLightBoxSettings) {
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
  const exporter = new STLExporter();
  
  // Generate shell (simple box for now)
  const shellGeometry = new THREE.BoxGeometry(settings.width, settings.height, settings.depth);
  const shellMesh = new THREE.Mesh(shellGeometry);
  const shellSTL = exporter.parse(shellMesh, { binary: false });
  
  // Generate diffuser
  const diffuser = generateClamshellDiffuser(settings);
  const diffuserSTL = exporter.parse(diffuser, { binary: false });
  
  // Generate layers
  const layerSTLs: string[] = [];
  for (const layer of settings.layers) {
    const layerGeometry = new THREE.BoxGeometry(settings.width - 10, settings.height - 10, layer.depth);
    const layerMesh = new THREE.Mesh(layerGeometry);
    const layerSTL = exporter.parse(layerMesh, { binary: false });
    layerSTLs.push(layerSTL);
  }
  
  // Generate keychain if enabled
  let keychainSTL = null;
  if (settings.keychainMode) {
    const keychain = generateLithophaneKeychain('', settings);
    keychainSTL = exporter.parse(keychain, { binary: false });
  }
  
  // Generate documentation
  const assemblyInstructions = generateAssemblyInstructions(settings);
  
  const wiringDiagram = `# Wiring Diagram - Silhouette Light Box

## Layer LED Configuration

${settings.layers.map((layer, i) => `### Layer ${i + 1}: ${layer.name}
- LED Type: ${layer.ledType}
- Color: ${layer.ledColor || '#FFFFFF'}
- Depth: ${layer.depth}mm
${layer.ledType === 'ws2812b' ? '- Connect to Arduino data pin' : layer.ledType === 'el_wire' ? '- Connect to EL wire inverter' : '- Connect to 5V power supply'}
`).join('\n')}

## Power Requirements
- Total layers with LEDs: ${settings.layers.filter(l => l.ledType !== 'none').length}
- Estimated current: Calculate based on LED count per layer
- Recommended power supply: 5V, 3A

---
Generated by Sign-Sculptor Silhouette Light Box Designer
`;

  const bom = `# Bill of Materials - Silhouette Light Box

## 3D Printed Parts
- Shell (${settings.width}x${settings.height}x${settings.depth}mm) - $${(settings.width * settings.height * settings.depth / 10000).toFixed(2)}
- Diffuser (${settings.diffuserStyle}) - $3.50
${settings.layers.map((l, i) => `- Layer ${i + 1} (${l.name}) - $2.00`).join('\n')}
${settings.keychainMode ? '- Lithophane Keychain - $1.50' : ''}

## Electronics
${settings.layers.map(l => {
  if (l.ledType === 'ws2812b') return `- WS2812B LED strip for ${l.name} - $12.00`;
  if (l.ledType === 'el_wire') return `- EL wire for ${l.name} - $8.00`;
  if (l.ledType === 'standard_strip') return `- Standard LED strip for ${l.name} - $6.00`;
  return '';
}).filter(s => s).join('\n')}
${settings.keychainMode ? '- CR2032 battery - $1.50\n- 5mm LED - $0.20' : '- 5V Power Supply (3A) - $8.00'}

## Hardware
- M3 screws (8x) - $0.80
- Hot glue - $0.50

## Total Cost: $${(25 + settings.layers.length * 2).toFixed(2)}

---
Generated by Sign-Sculptor Silhouette Light Box Designer
`;

  const readme = `# Silhouette Light Box - ${settings.designMode.toUpperCase()}

## Overview
Multi-layer LED light box with ${settings.layers.length} layers and ${settings.diffuserStyle} diffuser.

## Design Mode: ${settings.designMode}
${settings.designMode === 'template' ? 'Template-based design' : settings.designMode === 'image_trace' ? 'Image traced design' : 'Freehand drawn design'}

## Features
- Dimensions: ${settings.width}x${settings.height}x${settings.depth}mm
- Layers: ${settings.layers.length}
- Diffuser: ${settings.diffuserStyle}
${settings.keychainMode ? '- Includes lithophane keychain' : ''}

## Quick Start
1. Print all parts
2. Wire LEDs according to diagram
3. Assemble layers with proper spacing
4. Install diffuser
5. Power on and enjoy!

---
Generated by Sign-Sculptor Silhouette Light Box Designer
`;
  
  return {
    shellSTL,
    diffuserSTL,
    layerSTLs,
    keychainSTL,
    assemblyInstructions,
    wiringDiagram,
    bom,
    readme
  };
}
