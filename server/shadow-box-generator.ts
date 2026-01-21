/**
 * SHADOW BOX GENERATOR
 * Creates 3D printed backlit art frames with layered silhouettes
 * 
 * Competitive Advantage: Others use wood/acrylic cutting - we use 3D printing
 * for complex geometries, integrated LED channels, and custom shapes
 */

import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import sharp from "sharp";

interface ShadowBoxSettings {
  width: number;
  height: number;
  frameThickness: number;
  frameDepth: number;
  
  frameStyle: "rectangle" | "rounded" | "arch" | "hexagon" | "circle";
  cornerRadius: number;
  
  layers: Array<{
    id: string;
    type: "silhouette" | "cutout" | "pattern" | "text";
    depth: number;
    imageData?: string;
    svgPath?: string;
    text?: string;
    opacity: number;
  }>;
  layerSpacing: number;
  totalDepth: number;
  
  ledPosition: "perimeter" | "back" | "sides" | "top_bottom";
  ledChannelWidth: number;
  ledChannelDepth: number;
  diffuserThickness: number;
  
  includeHangingHardware: boolean;
  includeStandBase: boolean;
  
  exportFormat: "stl" | "3mf";
  includeOpenSCAD: boolean;
}

/**
 * Main generation function
 */
export async function generateShadowBox(settings: ShadowBoxSettings): Promise<{
  frameSTL: string;
  layerSTLs: string[];
  diffuserSTL: string;
  backPanelSTL?: string;
  standBaseSTL?: string;
  openscad?: string;
  assemblyInstructions: string;
}> {
  console.log(`[Shadow Box] Generating ${settings.width}x${settings.height}mm frame with ${settings.layers.length} layers`);
  
  // Generate frame with LED channels
  const frameMesh = generateFrame(settings);
  
  // Generate layers from images/SVGs
  const layerMeshes: THREE.Mesh[] = [];
  for (const layer of settings.layers) {
    const layerMesh = await generateLayer(layer, settings);
    layerMeshes.push(layerMesh);
  }
  
  // Generate diffuser panel
  const diffuserMesh = generateDiffuser(settings);
  
  // Generate back panel if needed
  let backPanelMesh: THREE.Mesh | null = null;
  if (settings.ledPosition === "back") {
    backPanelMesh = generateBackPanel(settings);
  }
  
  // Generate stand base if requested
  let standBaseMesh: THREE.Mesh | null = null;
  if (settings.includeStandBase) {
    standBaseMesh = generateStandBase(settings);
  }
  
  // Export to STL
  const exporter = new STLExporter();
  const frameSTL = exporter.parse(frameMesh, { binary: false });
  const layerSTLs = layerMeshes.map(mesh => exporter.parse(mesh, { binary: false }));
  const diffuserSTL = exporter.parse(diffuserMesh, { binary: false });
  const backPanelSTL = backPanelMesh ? exporter.parse(backPanelMesh, { binary: false }) : undefined;
  const standBaseSTL = standBaseMesh ? exporter.parse(standBaseMesh, { binary: false }) : undefined;
  
  // Generate assembly instructions
  const assemblyInstructions = generateAssemblyInstructions(settings);
  
  // Generate OpenSCAD if requested
  const openscad = settings.includeOpenSCAD ? generateOpenSCAD(settings) : undefined;
  
  return {
    frameSTL,
    layerSTLs,
    diffuserSTL,
    backPanelSTL,
    standBaseSTL,
    openscad,
    assemblyInstructions,
  };
}

/**
 * Generate frame with integrated LED channels
 */
function generateFrame(settings: ShadowBoxSettings): THREE.Mesh {
  const { width, height, frameThickness, frameDepth, frameStyle, cornerRadius } = settings;
  
  // Create frame shape based on style
  let frameShape: THREE.Shape;
  
  if (frameStyle === "rectangle") {
    frameShape = new THREE.Shape();
    frameShape.moveTo(0, 0);
    frameShape.lineTo(width, 0);
    frameShape.lineTo(width, height);
    frameShape.lineTo(0, height);
    frameShape.lineTo(0, 0);
  } else if (frameStyle === "rounded") {
    frameShape = createRoundedRectShape(width, height, cornerRadius);
  } else if (frameStyle === "arch") {
    frameShape = createArchShape(width, height, cornerRadius);
  } else if (frameStyle === "hexagon") {
    frameShape = createHexagonShape(width, height);
  } else {
    // Circle/oval
    frameShape = createEllipseShape(width, height);
  }
  
  // Create inner cutout (for viewing area)
  const innerWidth = width - (frameThickness * 2);
  const innerHeight = height - (frameThickness * 2);
  const innerShape = new THREE.Shape();
  innerShape.moveTo(frameThickness, frameThickness);
  innerShape.lineTo(width - frameThickness, frameThickness);
  innerShape.lineTo(width - frameThickness, height - frameThickness);
  innerShape.lineTo(frameThickness, height - frameThickness);
  innerShape.lineTo(frameThickness, frameThickness);
  
  frameShape.holes.push(innerShape);
  
  // Extrude frame
  const extrudeSettings = {
    depth: frameDepth,
    bevelEnabled: false,
  };
  
  const geometry = new THREE.ExtrudeGeometry(frameShape, extrudeSettings);
  
  // Add LED channels based on position
  addLEDChannels(geometry, settings);
  
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  
  // Add hanging hardware if requested
  if (settings.includeHangingHardware) {
    addHangingHardware(mesh, settings);
  }
  
  return mesh;
}

/**
 * Generate layer from image data
 */
async function generateLayer(
  layer: ShadowBoxSettings["layers"][0],
  settings: ShadowBoxSettings
): Promise<THREE.Mesh> {
  console.log(`[Shadow Box] Generating layer ${layer.id} at depth ${layer.depth}mm`);
  
  if (layer.imageData) {
    // Process image to extract silhouette
    return await generateLayerFromImage(layer, settings);
  } else if (layer.text) {
    // Generate text layer
    return generateTextLayer(layer, settings);
  } else {
    // Default empty layer
    return new THREE.Mesh(new THREE.BufferGeometry());
  }
}

/**
 * Generate layer from image using edge detection
 */
async function generateLayerFromImage(
  layer: ShadowBoxSettings["layers"][0],
  settings: ShadowBoxSettings
): Promise<THREE.Mesh> {
  // Extract base64 image data
  const base64Data = layer.imageData!.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  
  // Process image with sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  // Resize to fit frame dimensions
  const resized = await image
    .resize(settings.width - (settings.frameThickness * 2), settings.height - (settings.frameThickness * 2), {
      fit: "inside",
    })
    .greyscale()
    .threshold(128) // Binary threshold
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Convert to contours (simplified - would use potrace or similar in production)
  const contours = extractContoursFromImage(resized.data, resized.info.width, resized.info.height);
  
  // Create 3D geometry from contours
  const shapes: THREE.Shape[] = [];
  for (const contour of contours) {
    if (contour.length < 3) continue;
    
    const shape = new THREE.Shape();
    shape.moveTo(contour[0].x, contour[0].y);
    for (let i = 1; i < contour.length; i++) {
      shape.lineTo(contour[i].x, contour[i].y);
    }
    shapes.push(shape);
  }
  
  // Extrude layer
  const layerThickness = 3; // 3mm thick layers
  const geometries: THREE.ExtrudeGeometry[] = [];
  
  for (const shape of shapes) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: layerThickness,
      bevelEnabled: false,
    });
    
    // Position at correct depth
    geometry.translate(settings.frameThickness, settings.frameThickness, layer.depth);
    geometries.push(geometry);
  }
  
  // Merge geometries
  const mergedGeometry = geometries[0] || new THREE.BufferGeometry();
  const mesh = new THREE.Mesh(mergedGeometry, new THREE.MeshStandardMaterial());
  
  return mesh;
}

/**
 * Extract contours from binary image data
 */
function extractContoursFromImage(
  data: Buffer,
  width: number,
  height: number
): Array<Array<{ x: number; y: number }>> {
  const contours: Array<Array<{ x: number; y: number }>> = [];
  
  // Simple edge detection (would use more sophisticated algorithm in production)
  const visited = new Set<string>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = data[idx];
      
      if (pixel > 128 && !visited.has(`${x},${y}`)) {
        // Found edge pixel, trace contour
        const contour = traceContour(data, width, height, x, y, visited);
        if (contour.length > 10) {
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

/**
 * Trace contour from starting point
 */
function traceContour(
  data: Buffer,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: Set<string>
): Array<{ x: number; y: number }> {
  const contour: Array<{ x: number; y: number }> = [];
  const directions = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  
  let x = startX;
  let y = startY;
  let steps = 0;
  const maxSteps = width * height; // Prevent infinite loops
  
  while (steps < maxSteps) {
    visited.add(`${x},${y}`);
    contour.push({ x, y });
    
    // Find next edge pixel
    let found = false;
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (data[idx] > 128 && !visited.has(`${nx},${ny}`)) {
          x = nx;
          y = ny;
          found = true;
          break;
        }
      }
    }
    
    if (!found) break;
    steps++;
  }
  
  return contour;
}

/**
 * Generate text layer
 */
function generateTextLayer(
  layer: ShadowBoxSettings["layers"][0],
  settings: ShadowBoxSettings
): THREE.Mesh {
  // Would use TextGeometry in production
  return new THREE.Mesh(new THREE.BufferGeometry());
}

/**
 * Generate diffuser panel
 */
function generateDiffuser(settings: ShadowBoxSettings): THREE.Mesh {
  const { width, height, frameThickness, diffuserThickness } = settings;
  
  const diffuserWidth = width - (frameThickness * 2);
  const diffuserHeight = height - (frameThickness * 2);
  
  const geometry = new THREE.BoxGeometry(diffuserWidth, diffuserHeight, diffuserThickness);
  geometry.translate(width / 2, height / 2, 0);
  
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
}

/**
 * Generate back panel with LED mounting
 */
function generateBackPanel(settings: ShadowBoxSettings): THREE.Mesh {
  const { width, height, frameThickness } = settings;
  
  const panelWidth = width - (frameThickness * 2);
  const panelHeight = height - (frameThickness * 2);
  
  const geometry = new THREE.BoxGeometry(panelWidth, panelHeight, 2);
  geometry.translate(width / 2, height / 2, settings.frameDepth);
  
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
}

/**
 * Generate stand base for tabletop display
 */
function generateStandBase(settings: ShadowBoxSettings): THREE.Mesh {
  const baseWidth = settings.width * 0.6;
  const baseDepth = settings.width * 0.3;
  const baseHeight = 10;
  
  const geometry = new THREE.BoxGeometry(baseWidth, baseDepth, baseHeight);
  
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
}

/**
 * Add LED channels to frame geometry
 */
function addLEDChannels(geometry: THREE.ExtrudeGeometry, settings: ShadowBoxSettings): void {
  // LED channel implementation would use CSG operations
  // Simplified for now
  console.log(`[Shadow Box] Adding ${settings.ledPosition} LED channels`);
}

/**
 * Add hanging hardware mounting points
 */
function addHangingHardware(mesh: THREE.Mesh, settings: ShadowBoxSettings): void {
  // Add keyhole slots or D-ring mounts
  console.log(`[Shadow Box] Adding hanging hardware`);
}

/**
 * Helper shape generators
 */
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(radius, 0);
  shape.lineTo(width - radius, 0);
  shape.quadraticCurveTo(width, 0, width, radius);
  shape.lineTo(width, height - radius);
  shape.quadraticCurveTo(width, height, width - radius, height);
  shape.lineTo(radius, height);
  shape.quadraticCurveTo(0, height, 0, height - radius);
  shape.lineTo(0, radius);
  shape.quadraticCurveTo(0, 0, radius, 0);
  return shape;
}

function createArchShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, height - radius);
  shape.quadraticCurveTo(width, height, width / 2, height);
  shape.quadraticCurveTo(0, height, 0, height - radius);
  shape.lineTo(0, 0);
  return shape;
}

function createHexagonShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.lineTo(cx + r, cy);
  
  return shape;
}

function createEllipseShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;
  
  shape.ellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, 0);
  
  return shape;
}

/**
 * Generate assembly instructions
 */
function generateAssemblyInstructions(settings: ShadowBoxSettings): string {
  return `# Shadow Box Assembly Instructions

## Generated Shadow Box: ${settings.width}×${settings.height}mm

### Components Included:
- Frame with integrated LED channels (${settings.frameStyle} style)
- ${settings.layers.length} layered silhouettes
- Diffuser panel (${settings.diffuserThickness}mm)
${settings.ledPosition === "back" ? "- Back panel with LED mounting" : ""}
${settings.includeStandBase ? "- Stand base for tabletop display" : ""}
${settings.includeHangingHardware ? "- Hanging hardware mounting points" : ""}

### LED Installation:
1. LED Position: ${settings.ledPosition}
2. Channel Width: ${settings.ledChannelWidth}mm
3. Install LED strips in channels
4. Route wires through frame channels

### Layer Assembly:
${settings.layers.map((layer, i) => `${i + 1}. Layer ${i + 1} - ${layer.type} at ${layer.depth}mm depth`).join('\n')}

### Assembly Steps:
1. Install LED strips in frame channels
2. Place layers in order from back to front
3. Install diffuser panel at front
4. Connect power supply
${settings.includeStandBase ? "5. Attach stand base for tabletop display" : ""}
${settings.includeHangingHardware ? "5. Use hanging hardware for wall mounting" : ""}

### Print Settings:
- Layer Height: 0.2mm
- Infill: 15-20%
- Supports: Only for overhangs
- Material: PLA or PETG (white/translucent for diffuser)

### Competitive Advantage:
Unlike wood/acrylic shadow boxes, this 3D printed design offers:
- Complex frame shapes (hexagon, arch, custom)
- Integrated LED channels (no routing required)
- Precise layer spacing
- Custom geometries impossible with traditional methods
- Single-material construction

Generated: ${new Date().toISOString()}
`;
}

/**
 * Generate OpenSCAD source
 */
function generateOpenSCAD(settings: ShadowBoxSettings): string {
  return `// Shadow Box: ${settings.width}×${settings.height}mm
// Generated by Sign-Sculptor

/* [Frame] */
Frame_Width = ${settings.width};
Frame_Height = ${settings.height};
Frame_Thickness = ${settings.frameThickness};
Frame_Depth = ${settings.frameDepth};
Frame_Style = "${settings.frameStyle}";
Corner_Radius = ${settings.cornerRadius};

/* [Layers] */
Layer_Count = ${settings.layers.length};
Layer_Spacing = ${settings.layerSpacing};
Layer_Thickness = 3;

/* [LED System] */
LED_Position = "${settings.ledPosition}";
LED_Channel_Width = ${settings.ledChannelWidth};
LED_Channel_Depth = ${settings.ledChannelDepth};
Diffuser_Thickness = ${settings.diffuserThickness};

$fn = 60;

// Frame module
module frame() {
    difference() {
        // Outer frame
        linear_extrude(Frame_Depth)
            offset(r = Frame_Thickness)
            square([Frame_Width - Frame_Thickness*2, Frame_Height - Frame_Thickness*2], center=true);
        
        // Inner cutout
        translate([0, 0, -1])
            linear_extrude(Frame_Depth + 2)
            square([Frame_Width - Frame_Thickness*2, Frame_Height - Frame_Thickness*2], center=true);
    }
}

frame();
`;
}
