/**
 * HOLOGRAPHIC PANEL GENERATOR
 * Creates multi-layer 3D depth effect panels with LED backlighting
 * 
 * Features:
 * - Multiple stacked layers (1-5 layers)
 * - Independent pattern control per layer
 * - Adjustable layer spacing for depth effect
 * - LED backlighting channels
 * - Frame with mounting system
 * - Spacer clips for layer alignment
 * 
 * Inspired by Art Nouveau patterns and holographic displays
 */

import * as THREE from "three";

interface Point2D {
  x: number;
  y: number;
}

/**
 * Holographic Panel Settings
 */
export interface HolographicPanelSettings {
  // Panel Dimensions
  panelWidth: number; // mm
  panelHeight: number; // mm
  
  // Layer Configuration
  numberOfLayers: number; // 1-5
  layerSpacing: number; // mm between layers
  totalDepth: number; // calculated from layers + spacing
  
  // Layer Patterns (array of layer configs)
  layers: LayerConfig[];
  
  // Frame
  frameWidth: number; // mm
  frameThickness: number; // mm
  includeFrame: boolean;
  frameMountingHoles: boolean;
  
  // LED System
  ledType: "ws2812b" | "simple_5v" | "none";
  ledChannelWidth: number; // mm
  ledChannelDepth: number; // mm
  backlightPosition: "back" | "between_layers" | "front";
  
  // Material
  materialType: "transparent_petg" | "white_pla" | "translucent_resin";
  layerThickness: number; // mm (0.5-2mm)
  
  // Assembly
  includeSpacerClips: boolean;
  spacerClipCount: number; // per edge
  alignmentPins: boolean;
  
  // Advanced
  includeScottTorsion: boolean;
  exportFormat: "stl" | "3mf";
}

/**
 * Individual Layer Configuration
 */
export interface LayerConfig {
  layerNumber: number;
  patternType: "floral" | "geometric" | "organic" | "text" | "custom" | "none";
  patternName: string; // e.g., "Floral / Vine"
  density: number; // 0-100% (pattern coverage)
  scale: number; // 0.5-3.0x (pattern size)
  rotation: number; // 0-360 degrees
  position: "front" | "middle" | "back";
  cutout: boolean; // true = cut through, false = embossed
}

/**
 * Default settings for holographic panel
 */
export const defaultHolographicPanelSettings: HolographicPanelSettings = {
  panelWidth: 200,
  panelHeight: 300,
  
  numberOfLayers: 3,
  layerSpacing: 8,
  totalDepth: 30.5,
  
  layers: [
    {
      layerNumber: 1,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 40,
      scale: 1.2,
      rotation: 0,
      position: "front",
      cutout: true,
    },
    {
      layerNumber: 2,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 30,
      scale: 1.2,
      rotation: 18,
      position: "middle",
      cutout: true,
    },
    {
      layerNumber: 3,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 20,
      scale: 1.4,
      rotation: 30,
      position: "back",
      cutout: true,
    },
  ],
  
  frameWidth: 20,
  frameThickness: 5,
  includeFrame: true,
  frameMountingHoles: true,
  
  ledType: "ws2812b",
  ledChannelWidth: 12,
  ledChannelDepth: 3,
  backlightPosition: "back",
  
  materialType: "transparent_petg",
  layerThickness: 1.5,
  
  includeSpacerClips: true,
  spacerClipCount: 4,
  alignmentPins: true,
  
  includeScottTorsion: true,
  exportFormat: "stl",
};

/**
 * Generate individual layer with pattern
 */
export function generateLayer(
  settings: HolographicPanelSettings,
  layerConfig: LayerConfig
): THREE.Group {
  const layer = new THREE.Group();
  layer.name = `Layer_${layerConfig.layerNumber}_${layerConfig.position}`;
  
  // Base panel
  const panelGeometry = new THREE.BoxGeometry(
    settings.panelWidth,
    settings.panelHeight,
    settings.layerThickness
  );
  
  const panelMesh = new THREE.Mesh(
    panelGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      transmission: 0.9,
    })
  );
  layer.add(panelMesh);
  
  // Generate pattern based on type
  const pattern = generatePattern(settings, layerConfig);
  layer.add(pattern);
  
  // Add alignment pins if first or last layer
  if (settings.alignmentPins && (layerConfig.layerNumber === 1 || layerConfig.layerNumber === settings.numberOfLayers)) {
    const pins = generateAlignmentPins(settings);
    layer.add(pins);
  }
  
  return layer;
}

/**
 * Generate pattern for layer
 */
function generatePattern(
  settings: HolographicPanelSettings,
  layerConfig: LayerConfig
): THREE.Group {
  const pattern = new THREE.Group();
  pattern.name = `Pattern_${layerConfig.patternType}`;
  
  switch (layerConfig.patternType) {
    case "floral":
      return generateFloralPattern(settings, layerConfig);
    case "geometric":
      return generateGeometricPattern(settings, layerConfig);
    case "organic":
      return generateOrganicPattern(settings, layerConfig);
    case "text":
      return generateTextPattern(settings, layerConfig);
    case "none":
      return pattern; // Empty pattern
    default:
      return generateFloralPattern(settings, layerConfig);
  }
}

/**
 * Generate Art Nouveau inspired floral pattern
 */
function generateFloralPattern(
  settings: HolographicPanelSettings,
  layerConfig: LayerConfig
): THREE.Group {
  const pattern = new THREE.Group();
  
  const width = settings.panelWidth;
  const height = settings.panelHeight;
  const density = layerConfig.density / 100;
  const scale = layerConfig.scale;
  const rotation = (layerConfig.rotation * Math.PI) / 180;
  
  // Calculate number of pattern elements based on density
  const elementCount = Math.floor((width * height) / 1000 * density);
  
  for (let i = 0; i < elementCount; i++) {
    // Random position within panel
    const x = (Math.random() - 0.5) * width * 0.9;
    const y = (Math.random() - 0.5) * height * 0.9;
    
    // Create floral element (vine with leaves)
    const element = createFloralElement(scale);
    element.position.set(x, y, 0);
    element.rotation.z = rotation + Math.random() * Math.PI * 0.2;
    
    pattern.add(element);
  }
  
  return pattern;
}

/**
 * Create single floral element (Art Nouveau vine)
 */
function createFloralElement(scale: number): THREE.Group {
  const element = new THREE.Group();
  
  // Vine curve (S-shape)
  const vineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(2 * scale, 5 * scale, 0),
    new THREE.Vector3(-1 * scale, 10 * scale, 0),
    new THREE.Vector3(1 * scale, 15 * scale, 0),
  ]);
  
  const vineGeometry = new THREE.TubeGeometry(vineCurve, 20, 0.3 * scale, 8, false);
  const vineMesh = new THREE.Mesh(
    vineGeometry,
    new THREE.MeshStandardMaterial({ color: 0x404040 })
  );
  element.add(vineMesh);
  
  // Leaves along vine
  const leafPositions = [0.25, 0.5, 0.75];
  leafPositions.forEach((t) => {
    const point = vineCurve.getPoint(t);
    const leaf = createLeaf(scale);
    leaf.position.copy(point);
    leaf.rotation.z = Math.random() * Math.PI * 0.5;
    element.add(leaf);
  });
  
  return element;
}

/**
 * Create leaf shape
 */
function createLeaf(scale: number): THREE.Mesh {
  const leafShape = new THREE.Shape();
  
  // Leaf outline (teardrop)
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(
    2 * scale, 1 * scale,
    2 * scale, 4 * scale,
    0, 5 * scale
  );
  leafShape.bezierCurveTo(
    -2 * scale, 4 * scale,
    -2 * scale, 1 * scale,
    0, 0
  );
  
  const leafGeometry = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.5 * scale,
    bevelEnabled: true,
    bevelThickness: 0.1 * scale,
    bevelSize: 0.1 * scale,
    bevelSegments: 3,
  });
  
  const leafMesh = new THREE.Mesh(
    leafGeometry,
    new THREE.MeshStandardMaterial({ color: 0x606060 })
  );
  
  return leafMesh;
}

/**
 * Generate geometric pattern (Islamic/Celtic inspired)
 */
function generateGeometricPattern(
  settings: HolographicPanelSettings,
  layerConfig: LayerConfig
): THREE.Group {
  const pattern = new THREE.Group();
  
  const width = settings.panelWidth;
  const height = settings.panelHeight;
  const scale = layerConfig.scale;
  const rotation = (layerConfig.rotation * Math.PI) / 180;
  
  // Grid of geometric shapes
  const gridSize = 20 * scale;
  const cols = Math.floor(width / gridSize);
  const rows = Math.floor(height / gridSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col - cols / 2) * gridSize;
      const y = (row - rows / 2) * gridSize;
      
      // Alternating pattern
      const shapeType = (row + col) % 2;
      const shape = shapeType === 0 
        ? createGeometricCircle(scale)
        : createGeometricStar(scale);
      
      shape.position.set(x, y, 0);
      shape.rotation.z = rotation;
      
      pattern.add(shape);
    }
  }
  
  return pattern;
}

/**
 * Create geometric circle
 */
function createGeometricCircle(scale: number): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(5 * scale, 0.5 * scale, 8, 32);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x505050 })
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

/**
 * Create geometric star
 */
function createGeometricStar(scale: number): THREE.Mesh {
  const starShape = new THREE.Shape();
  const outerRadius = 5 * scale;
  const innerRadius = 2 * scale;
  const spikes = 6;
  
  for (let i = 0; i <= spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      starShape.moveTo(x, y);
    } else {
      starShape.lineTo(x, y);
    }
  }
  
  const geometry = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.5 * scale,
    bevelEnabled: false,
  });
  
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x505050 })
  );
  
  return mesh;
}

/**
 * Generate organic pattern (Voronoi/cellular)
 */
function generateOrganicPattern(
  settings: HolographicPanelSettings,
  layerConfig: LayerConfig
): THREE.Group {
  const pattern = new THREE.Group();
  
  const width = settings.panelWidth;
  const height = settings.panelHeight;
  const density = layerConfig.density / 100;
  const scale = layerConfig.scale;
  
  // Generate random seed points for Voronoi
  const seedCount = Math.floor(50 * density);
  const seeds: Point2D[] = [];
  
  for (let i = 0; i < seedCount; i++) {
    seeds.push({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
    });
  }
  
  // Create organic cells around seeds
  seeds.forEach((seed) => {
    const cellSize = 10 * scale * (0.5 + Math.random() * 0.5);
    const cell = createOrganicCell(cellSize);
    cell.position.set(seed.x, seed.y, 0);
    pattern.add(cell);
  });
  
  return pattern;
}

/**
 * Create organic cell shape
 */
function createOrganicCell(size: number): THREE.Mesh {
  const points: THREE.Vector2[] = [];
  const segments = 8;
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const radius = size * (0.8 + Math.random() * 0.4);
    points.push(new THREE.Vector2(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ));
  }
  
  const shape = new THREE.Shape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.3,
    bevelEnabled: false,
  });
  
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x606060 })
  );
  
  return mesh;
}

/**
 * Generate text pattern
 */
function generateTextPattern(
  settings: HolographicPanelSettings,
  layerConfig: LayerConfig
): THREE.Group {
  const pattern = new THREE.Group();
  
  // Text pattern would use font rendering
  // Placeholder for now - would integrate with existing font system
  
  return pattern;
}

/**
 * Generate frame for panel
 */
export function generateFrame(settings: HolographicPanelSettings): THREE.Group {
  const frame = new THREE.Group();
  frame.name = "Frame";
  
  const outerWidth = settings.panelWidth + settings.frameWidth * 2;
  const outerHeight = settings.panelHeight + settings.frameWidth * 2;
  const depth = settings.totalDepth + settings.frameThickness * 2;
  
  // Frame outer box
  const frameGeometry = new THREE.BoxGeometry(
    outerWidth,
    outerHeight,
    depth
  );
  
  // Cut out center for panel
  const cutoutGeometry = new THREE.BoxGeometry(
    settings.panelWidth,
    settings.panelHeight,
    depth + 2
  );
  
  const frameMesh = new THREE.Mesh(
    frameGeometry,
    new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.8 })
  );
  
  const cutoutMesh = new THREE.Mesh(
    cutoutGeometry,
    new THREE.MeshStandardMaterial({ color: 0xFF0000 })
  );
  
  // CSG subtraction would happen here in actual implementation
  frame.add(frameMesh);
  
  // Mounting holes
  if (settings.frameMountingHoles) {
    const holes = generateMountingHoles(settings);
    frame.add(holes);
  }
  
  return frame;
}

/**
 * Generate mounting holes in frame
 */
function generateMountingHoles(settings: HolographicPanelSettings): THREE.Group {
  const holes = new THREE.Group();
  
  const holeRadius = 3; // M3 screw
  const holeDepth = settings.frameThickness;
  const offset = settings.frameWidth / 2;
  
  const positions = [
    { x: -settings.panelWidth / 2 - offset, y: settings.panelHeight / 2 + offset },
    { x: settings.panelWidth / 2 + offset, y: settings.panelHeight / 2 + offset },
    { x: -settings.panelWidth / 2 - offset, y: -settings.panelHeight / 2 - offset },
    { x: settings.panelWidth / 2 + offset, y: -settings.panelHeight / 2 - offset },
  ];
  
  positions.forEach((pos) => {
    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 16);
    const holeMesh = new THREE.Mesh(
      holeGeometry,
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    holeMesh.position.set(pos.x, pos.y, 0);
    holeMesh.rotation.x = Math.PI / 2;
    holes.add(holeMesh);
  });
  
  return holes;
}

/**
 * Generate LED channel for backlighting
 */
export function generateLEDChannel(settings: HolographicPanelSettings): THREE.Group {
  const channel = new THREE.Group();
  channel.name = "LED_Channel";
  
  const channelWidth = settings.ledChannelWidth;
  const channelDepth = settings.ledChannelDepth;
  const panelPerimeter = (settings.panelWidth + settings.panelHeight) * 2;
  
  // U-channel around panel perimeter
  const channelPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-settings.panelWidth / 2, -settings.panelHeight / 2, 0),
    new THREE.Vector3(settings.panelWidth / 2, -settings.panelHeight / 2, 0),
    new THREE.Vector3(settings.panelWidth / 2, settings.panelHeight / 2, 0),
    new THREE.Vector3(-settings.panelWidth / 2, settings.panelHeight / 2, 0),
    new THREE.Vector3(-settings.panelWidth / 2, -settings.panelHeight / 2, 0),
  ]);
  
  // Channel cross-section (U-shape)
  const channelShape = new THREE.Shape();
  channelShape.moveTo(0, 0);
  channelShape.lineTo(channelWidth, 0);
  channelShape.lineTo(channelWidth, channelDepth);
  channelShape.lineTo(channelWidth - 1, channelDepth);
  channelShape.lineTo(channelWidth - 1, 1);
  channelShape.lineTo(1, 1);
  channelShape.lineTo(1, channelDepth);
  channelShape.lineTo(0, channelDepth);
  channelShape.lineTo(0, 0);
  
  const extrudeSettings = {
    steps: 100,
    bevelEnabled: false,
    extrudePath: channelPath,
  };
  
  const channelGeometry = new THREE.ExtrudeGeometry(channelShape, extrudeSettings);
  const channelMesh = new THREE.Mesh(
    channelGeometry,
    new THREE.MeshStandardMaterial({ color: 0x202020 })
  );
  
  channel.add(channelMesh);
  
  return channel;
}

/**
 * Generate spacer clips for layer alignment
 */
export function generateSpacerClips(settings: HolographicPanelSettings): THREE.Group {
  const clips = new THREE.Group();
  clips.name = "Spacer_Clips";
  
  const clipHeight = settings.layerSpacing;
  const clipWidth = 10;
  const clipDepth = 5;
  
  // Generate clips around perimeter
  const clipsPerEdge = settings.spacerClipCount;
  const edges = [
    { start: { x: -settings.panelWidth / 2, y: -settings.panelHeight / 2 }, end: { x: settings.panelWidth / 2, y: -settings.panelHeight / 2 } }, // Bottom
    { start: { x: settings.panelWidth / 2, y: -settings.panelHeight / 2 }, end: { x: settings.panelWidth / 2, y: settings.panelHeight / 2 } }, // Right
    { start: { x: settings.panelWidth / 2, y: settings.panelHeight / 2 }, end: { x: -settings.panelWidth / 2, y: settings.panelHeight / 2 } }, // Top
    { start: { x: -settings.panelWidth / 2, y: settings.panelHeight / 2 }, end: { x: -settings.panelWidth / 2, y: -settings.panelHeight / 2 } }, // Left
  ];
  
  edges.forEach((edge) => {
    for (let i = 0; i < clipsPerEdge; i++) {
      const t = (i + 1) / (clipsPerEdge + 1);
      const x = edge.start.x + (edge.end.x - edge.start.x) * t;
      const y = edge.start.y + (edge.end.y - edge.start.y) * t;
      
      const clip = createSpacerClip(clipWidth, clipHeight, clipDepth);
      clip.position.set(x, y, 0);
      clips.add(clip);
    }
  });
  
  return clips;
}

/**
 * Create individual spacer clip
 */
function createSpacerClip(width: number, height: number, depth: number): THREE.Mesh {
  const clipGeometry = new THREE.BoxGeometry(width, depth, height);
  const clipMesh = new THREE.Mesh(
    clipGeometry,
    new THREE.MeshStandardMaterial({ color: 0x404040 })
  );
  
  return clipMesh;
}

/**
 * Generate alignment pins
 */
function generateAlignmentPins(settings: HolographicPanelSettings): THREE.Group {
  const pins = new THREE.Group();
  
  const pinRadius = 2;
  const pinHeight = settings.layerSpacing * 0.8;
  
  const positions = [
    { x: -settings.panelWidth / 2 + 20, y: -settings.panelHeight / 2 + 20 },
    { x: settings.panelWidth / 2 - 20, y: -settings.panelHeight / 2 + 20 },
    { x: -settings.panelWidth / 2 + 20, y: settings.panelHeight / 2 - 20 },
    { x: settings.panelWidth / 2 - 20, y: settings.panelHeight / 2 - 20 },
  ];
  
  positions.forEach((pos) => {
    const pinGeometry = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 16);
    const pinMesh = new THREE.Mesh(
      pinGeometry,
      new THREE.MeshStandardMaterial({ color: 0x606060 })
    );
    pinMesh.position.set(pos.x, pos.y, pinHeight / 2);
    pins.add(pinMesh);
  });
  
  return pins;
}

/**
 * Generate assembly instructions
 */
export function generateHolographicPanelInstructions(settings: HolographicPanelSettings): string {
  return `# Holographic Panel Assembly Instructions

## Panel Specifications:
- **Size**: ${settings.panelWidth}mm × ${settings.panelHeight}mm
- **Layers**: ${settings.numberOfLayers}
- **Total Depth**: ${settings.totalDepth}mm
- **Layer Spacing**: ${settings.layerSpacing}mm
- **LED Type**: ${settings.ledType.toUpperCase()}

## Parts List:
${settings.layers.map((layer) => `${layer.layerNumber}. Layer ${layer.layerNumber} (${layer.position}) - ${layer.patternName}`).join('\n')}
${settings.numberOfLayers + 1}. Frame
${settings.includeSpacerClips ? `${settings.numberOfLayers + 2}. Spacer Clips (${settings.spacerClipCount * 4}×)` : ''}
${settings.ledType !== 'none' ? `${settings.numberOfLayers + 3}. LED Channel` : ''}

## Materials Needed:
- ${settings.materialType === 'transparent_petg' ? 'Clear PETG filament' : settings.materialType === 'white_pla' ? 'White PLA filament' : 'Translucent Resin'}
- ${settings.ledType === 'ws2812b' ? 'WS2812B LED strip (60 LEDs/meter)' : 'Standard 5V LED strip'}
- M3×8mm screws (4×) for frame mounting
- Hot glue or clear silicone

## Assembly Steps:

### Step 1: Print All Parts (8-12 hours total)
- **Material**: ${settings.materialType === 'transparent_petg' ? 'Clear PETG' : settings.materialType}
- **Layer Height**: 0.2mm
- **Infill**: 10% for layers, 20% for frame
- **Supports**: None (design is support-free)
- **Print Time**: ~2-3 hours per layer

### Step 2: Clean Parts (30 minutes)
1. Remove any stringing or blobs
2. Sand edges with 220-grit sandpaper
3. Clean with isopropyl alcohol
4. Polish transparent layers for clarity

### Step 3: Install LED Strip (20 minutes)
${settings.ledType !== 'none' ? `
1. Measure LED strip to panel perimeter
2. Cut strip at designated cut points
3. Solder corner connections (data line continuous)
4. Insert strip into LED channel
5. Secure with hot glue every 50mm
6. Route power wires to controller
` : 'No LED installation required'}

### Step 4: Assemble Layers (45 minutes)
1. Start with back layer (Layer ${settings.numberOfLayers})
2. Place spacer clips at marked positions
3. Add next layer, aligning with pins
4. Repeat for all ${settings.numberOfLayers} layers
5. Ensure even spacing (${settings.layerSpacing}mm between layers)

### Step 5: Install Frame (15 minutes)
1. Place assembled layers into frame
2. Align mounting holes
3. Secure with M3 screws (4 corners)
4. Check that layers are level
5. Tighten screws evenly

### Step 6: Wire Electronics (30 minutes)
${settings.ledType === 'ws2812b' ? `
**WS2812B Wiring:**
- LED Data → Controller Pin 3
- LED 5V → Power supply +
- LED GND → Power supply -
- Add 220Ω resistor on data line
` : settings.ledType === 'simple_5v' ? `
**Simple LED Wiring:**
- LED + → 5V power
- LED - → Ground
- Optional: Add dimmer switch
` : 'No wiring required'}

### Step 7: Testing (10 minutes)
1. Power on LED system
2. Check all LEDs illuminate
3. Verify even backlighting
4. Test from multiple viewing angles
5. Adjust brightness if needed

### Step 8: Wall Mounting (15 minutes)
1. Mark wall mounting positions
2. Install wall anchors (if drywall)
3. Hang panel using frame holes
4. Level with spirit level
5. Secure power cable

## Depth Effect Optimization:
- **Viewing Distance**: 1-3 meters optimal
- **Lighting**: Best in dim ambient light
- **Angle**: 30-60° viewing angle for maximum depth
- **Backlight Color**: Warm white (2700K) or RGB for color effects

## Troubleshooting:
- **Layers not aligned**: Check spacer clips, adjust pins
- **LEDs uneven**: Verify strip is centered in channel
- **No depth effect**: Increase layer spacing or viewing distance
- **Frame loose**: Tighten mounting screws

## Maintenance:
- Clean with microfiber cloth
- Avoid harsh chemicals
- Check LED connections monthly
- Replace LEDs if dimming (50,000 hour lifespan)

---
Generated by Sign-Sculptor Holographic Panel Designer
`;
}

/**
 * Generate BOM for holographic panel
 */
export function generateHolographicPanelBOM(settings: HolographicPanelSettings): string {
  const layerCost = settings.numberOfLayers * 2.5;
  const frameCost = 1.8;
  const ledCost = settings.ledType === 'ws2812b' ? 15 : settings.ledType === 'simple_5v' ? 8 : 0;
  const hardwareCost = 1.2;
  const totalCost = layerCost + frameCost + ledCost + hardwareCost;
  
  return `# Bill of Materials - Holographic Panel

## 3D Printed Parts:
${settings.layers.map((layer, i) => `- **Layer ${layer.layerNumber}** (${settings.panelWidth}×${settings.panelHeight}mm) - $${(2.5).toFixed(2)} (${settings.materialType})`).join('\n')}
- **Frame** (${settings.panelWidth + settings.frameWidth * 2}×${settings.panelHeight + settings.frameWidth * 2}mm) - $${frameCost.toFixed(2)} (PLA)
${settings.includeSpacerClips ? `- **Spacer Clips** (${settings.spacerClipCount * 4}×) - $0.50 (PLA)` : ''}

## Electronic Components:
${settings.ledType === 'ws2812b' ? `- **WS2812B LED Strip** (${Math.ceil((settings.panelWidth + settings.panelHeight) * 2 / 1000)}m) - $${ledCost.toFixed(2)}
- **Microcontroller** (Arduino Nano or ESP32) - $3.00
- **220Ω Resistor** (1×) - $0.10
- **5V Power Supply** (2A) - $5.00` : settings.ledType === 'simple_5v' ? `- **5V LED Strip** (${Math.ceil((settings.panelWidth + settings.panelHeight) * 2 / 1000)}m) - $${ledCost.toFixed(2)}
- **5V Power Supply** (1A) - $3.00` : '- No electronics required'}

## Hardware:
- **M3×8mm Screws** (4×) - $0.40
- **Wall Anchors** (4×) - $0.80
- **Hot Glue Sticks** (2×) - $0.20

## Total Cost: $${totalCost.toFixed(2)}

## Print Settings:
- **Material**: ${settings.materialType === 'transparent_petg' ? 'Clear PETG (layers), PLA (frame)' : settings.materialType}
- **Layer Height**: 0.2mm
- **Infill**: 10% (layers), 20% (frame)
- **Print Time**: ${settings.numberOfLayers * 2.5 + 3} hours total
- **Material Used**: ~${settings.numberOfLayers * 40 + 60}g

---
Generated by Sign-Sculptor Holographic Panel Designer
`;
}
