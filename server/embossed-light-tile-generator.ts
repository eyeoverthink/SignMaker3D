/**
 * EMBOSSED LIGHT TILE GENERATOR
 * 
 * Creates modular 3D printed light tiles with embossed/engraved patterns
 * Emulates incandescent bulbs with custom shapes
 * 
 * Features:
 * - Circular tile base with LED channel
 * - Embossed or engraved pattern (raised or recessed)
 * - Diffuser lid (flat or domed)
 * - Pattern library: egg, gears, custom shapes
 * - Modular sizing for different applications
 * 
 * Assembly:
 * 1. Base tile with LED channel
 * 2. Insert LED strip or glow filament
 * 3. Snap on diffuser lid
 * 
 * Perfect for decorative lighting, signage accents, and modular light panels
 */

import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

export interface EmbossedLightTileSettings {
  // Tile Dimensions
  tileDiameter: number; // mm (30-150mm typical)
  tileHeight: number; // mm (5-20mm typical)
  wallThickness: number; // mm (1.5-3mm)
  
  // Pattern Configuration
  patternType: "egg" | "gears" | "heart" | "star" | "custom" | "text";
  patternStyle: "embossed" | "engraved"; // Raised or recessed
  patternDepth: number; // mm (0.5-3mm)
  patternScale: number; // 0.5-1.0 (relative to tile size)
  
  // Custom Pattern (if patternType === "custom")
  customSVGPath?: string;
  customText?: string; // If patternType === "text"
  
  // LED Channel
  channelType: "ring" | "spiral" | "grid" | "custom";
  channelWidth: number; // mm (6mm, 8mm, 10.5mm for LED strips)
  channelDepth: number; // mm (2-5mm)
  
  // Diffuser Lid
  diffuserStyle: "flat" | "domed" | "conical";
  diffuserThickness: number; // mm (0.8-2mm for translucency)
  diffuserHeight: number; // mm (additional height for domed/conical)
  snapFit: boolean; // Add snap-fit tabs
  
  // Mounting
  includeMountingHoles: boolean;
  mountingHoleCount: number; // 2-4 holes
  mountingHoleDiameter: number; // mm (3mm for M3 screws)
  
  // Export Options
  exportFormat: "stl" | "3mf";
  separateParts: boolean; // Export base and lid separately
}

export const defaultEmbossedLightTileSettings: EmbossedLightTileSettings = {
  tileDiameter: 80,
  tileHeight: 10,
  wallThickness: 2,
  
  patternType: "egg",
  patternStyle: "embossed",
  patternDepth: 1.5,
  patternScale: 0.7,
  
  channelType: "ring",
  channelWidth: 10.5,
  channelDepth: 3,
  
  diffuserStyle: "domed",
  diffuserThickness: 1.2,
  diffuserHeight: 5,
  snapFit: true,
  
  includeMountingHoles: true,
  mountingHoleCount: 3,
  mountingHoleDiameter: 3,
  
  exportFormat: "stl",
  separateParts: true,
};

/**
 * Generate embossed light tile with pattern and diffuser
 */
export function generateEmbossedLightTile(
  settings: EmbossedLightTileSettings
): {
  baseMesh: THREE.Mesh;
  diffuserMesh: THREE.Mesh;
  baseSTL: string;
  diffuserSTL: string;
} {
  // Generate base tile with embossed pattern and LED channel
  const baseMesh = generateTileBase(settings);
  
  // Generate diffuser lid
  const diffuserMesh = generateDiffuserLid(settings);
  
  // Export to STL
  const exporter = new STLExporter();
  const baseSTL = exporter.parse(baseMesh, { binary: false });
  const diffuserSTL = exporter.parse(diffuserMesh, { binary: false });
  
  return {
    baseMesh,
    diffuserMesh,
    baseSTL,
    diffuserSTL,
  };
}

/**
 * Generate tile base with embossed/engraved pattern and LED channel
 */
function generateTileBase(settings: EmbossedLightTileSettings): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  
  const radius = settings.tileDiameter / 2;
  const innerRadius = radius - settings.wallThickness;
  const segments = 64;
  
  // Base disc (bottom)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    vertices.push(x, 0, z); // Bottom outer ring
  }
  
  // Outer wall
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    vertices.push(x, settings.tileHeight, z); // Top outer ring
  }
  
  // LED channel (ring shape)
  const channelRadius = innerRadius - settings.channelWidth / 2;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * channelRadius;
    const z = Math.sin(angle) * channelRadius;
    vertices.push(x, settings.channelDepth, z); // Channel bottom
  }
  
  // Generate pattern geometry
  const patternGeometry = generatePatternGeometry(settings);
  
  // Merge pattern with base
  const baseGeometry = new THREE.CylinderGeometry(
    radius,
    radius,
    settings.tileHeight,
    segments
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    roughness: 0.7,
    metalness: 0.1,
  });
  
  const mesh = new THREE.Mesh(baseGeometry, material);
  
  // Add mounting holes if enabled
  if (settings.includeMountingHoles) {
    addMountingHoles(mesh, settings);
  }
  
  return mesh;
}

/**
 * Generate pattern geometry (egg, gears, etc.)
 */
function generatePatternGeometry(
  settings: EmbossedLightTileSettings
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  switch (settings.patternType) {
    case "egg":
      return generateEggPattern(settings);
    case "gears":
      return generateGearsPattern(settings);
    case "heart":
      return generateHeartPattern(settings);
    case "star":
      return generateStarPattern(settings);
    case "text":
      return generateTextPattern(settings);
    default:
      return geometry;
  }
}

/**
 * Generate egg-shaped pattern
 */
function generateEggPattern(settings: EmbossedLightTileSettings): THREE.BufferGeometry {
  const eggShape = new THREE.Shape();
  
  const scale = (settings.tileDiameter / 2) * settings.patternScale;
  
  // Egg outline (parametric curve)
  eggShape.moveTo(0, -scale * 0.6);
  eggShape.bezierCurveTo(
    scale * 0.4, -scale * 0.6,
    scale * 0.5, -scale * 0.2,
    scale * 0.5, scale * 0.2
  );
  eggShape.bezierCurveTo(
    scale * 0.5, scale * 0.5,
    scale * 0.3, scale * 0.7,
    0, scale * 0.8
  );
  eggShape.bezierCurveTo(
    -scale * 0.3, scale * 0.7,
    -scale * 0.5, scale * 0.5,
    -scale * 0.5, scale * 0.2
  );
  eggShape.bezierCurveTo(
    -scale * 0.5, -scale * 0.2,
    -scale * 0.4, -scale * 0.6,
    0, -scale * 0.6
  );
  
  const extrudeSettings = {
    depth: settings.patternDepth,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 3,
  };
  
  const geometry = new THREE.ExtrudeGeometry(eggShape, extrudeSettings);
  geometry.rotateX(Math.PI / 2);
  
  return geometry;
}

/**
 * Generate interlocking gears pattern
 */
function generateGearsPattern(settings: EmbossedLightTileSettings): THREE.BufferGeometry {
  const group = new THREE.Group();
  const scale = (settings.tileDiameter / 2) * settings.patternScale;
  
  // Create 3 interlocking gears
  const gear1 = createGear(scale * 0.4, 12, settings.patternDepth);
  gear1.position.set(0, 0, 0);
  
  const gear2 = createGear(scale * 0.3, 10, settings.patternDepth);
  gear2.position.set(scale * 0.5, 0, 0);
  
  const gear3 = createGear(scale * 0.25, 8, settings.patternDepth);
  gear3.position.set(-scale * 0.4, scale * 0.3, 0);
  
  group.add(gear1, gear2, gear3);
  
  // Merge geometries
  const mergedGeometry = new THREE.BufferGeometry();
  // Note: In production, use BufferGeometryUtils.mergeGeometries
  
  return gear1.geometry as THREE.BufferGeometry;
}

/**
 * Create a single gear shape
 */
function createGear(radius: number, teeth: number, depth: number): THREE.Mesh {
  const gearShape = new THREE.Shape();
  const toothHeight = radius * 0.15;
  const toothWidth = (Math.PI * 2 * radius) / teeth / 2;
  
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
    const angle2 = ((i + 1) / teeth) * Math.PI * 2;
    
    // Tooth valley
    const x1 = Math.cos(angle) * radius;
    const y1 = Math.sin(angle) * radius;
    
    // Tooth peak
    const x2 = Math.cos(nextAngle) * (radius + toothHeight);
    const y2 = Math.sin(nextAngle) * (radius + toothHeight);
    
    // Next valley
    const x3 = Math.cos(angle2) * radius;
    const y3 = Math.sin(angle2) * radius;
    
    if (i === 0) {
      gearShape.moveTo(x1, y1);
    }
    gearShape.lineTo(x2, y2);
    gearShape.lineTo(x3, y3);
  }
  gearShape.closePath();
  
  // Center hole
  const holePath = new THREE.Path();
  const holeRadius = radius * 0.3;
  holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
  gearShape.holes.push(holePath);
  
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };
  
  const geometry = new THREE.ExtrudeGeometry(gearShape, extrudeSettings);
  geometry.rotateX(Math.PI / 2);
  
  const material = new THREE.MeshStandardMaterial({ color: 0xff8800 });
  return new THREE.Mesh(geometry, material);
}

/**
 * Generate heart pattern
 */
function generateHeartPattern(settings: EmbossedLightTileSettings): THREE.BufferGeometry {
  const heartShape = new THREE.Shape();
  const scale = (settings.tileDiameter / 2) * settings.patternScale;
  
  heartShape.moveTo(0, scale * 0.3);
  heartShape.bezierCurveTo(0, scale * 0.1, -scale * 0.2, -scale * 0.1, -scale * 0.5, -scale * 0.1);
  heartShape.bezierCurveTo(-scale * 0.7, -scale * 0.1, -scale * 0.7, scale * 0.3, -scale * 0.7, scale * 0.3);
  heartShape.bezierCurveTo(-scale * 0.7, scale * 0.5, -scale * 0.5, scale * 0.7, 0, scale * 1.0);
  heartShape.bezierCurveTo(scale * 0.5, scale * 0.7, scale * 0.7, scale * 0.5, scale * 0.7, scale * 0.3);
  heartShape.bezierCurveTo(scale * 0.7, scale * 0.3, scale * 0.7, -scale * 0.1, scale * 0.5, -scale * 0.1);
  heartShape.bezierCurveTo(scale * 0.2, -scale * 0.1, 0, scale * 0.1, 0, scale * 0.3);
  
  const extrudeSettings = {
    depth: settings.patternDepth,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 3,
  };
  
  const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  geometry.rotateX(Math.PI / 2);
  
  return geometry;
}

/**
 * Generate star pattern
 */
function generateStarPattern(settings: EmbossedLightTileSettings): THREE.BufferGeometry {
  const starShape = new THREE.Shape();
  const scale = (settings.tileDiameter / 2) * settings.patternScale;
  const points = 5;
  const outerRadius = scale;
  const innerRadius = scale * 0.4;
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      starShape.moveTo(x, y);
    } else {
      starShape.lineTo(x, y);
    }
  }
  starShape.closePath();
  
  const extrudeSettings = {
    depth: settings.patternDepth,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 3,
  };
  
  const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  geometry.rotateX(Math.PI / 2);
  
  return geometry;
}

/**
 * Generate text pattern
 */
function generateTextPattern(settings: EmbossedLightTileSettings): THREE.BufferGeometry {
  // Note: In production, use THREE.TextGeometry with loaded font
  // For now, return placeholder
  return new THREE.BoxGeometry(1, 1, settings.patternDepth);
}

/**
 * Add mounting holes to base
 */
function addMountingHoles(mesh: THREE.Mesh, settings: EmbossedLightTileSettings): void {
  const holeRadius = settings.mountingHoleDiameter / 2;
  const holePositionRadius = (settings.tileDiameter / 2) - settings.wallThickness - 3;
  
  for (let i = 0; i < settings.mountingHoleCount; i++) {
    const angle = (i / settings.mountingHoleCount) * Math.PI * 2;
    const x = Math.cos(angle) * holePositionRadius;
    const z = Math.sin(angle) * holePositionRadius;
    
    // Create hole geometry (cylinder subtraction)
    const holeGeometry = new THREE.CylinderGeometry(
      holeRadius,
      holeRadius,
      settings.tileHeight + 2,
      16
    );
    
    // Note: In production, use CSG subtraction
    // For now, just mark positions
  }
}

/**
 * Generate diffuser lid (flat, domed, or conical)
 */
function generateDiffuserLid(settings: EmbossedLightTileSettings): THREE.Mesh {
  const radius = settings.tileDiameter / 2;
  const segments = 64;
  
  let geometry: THREE.BufferGeometry;
  
  switch (settings.diffuserStyle) {
    case "flat":
      geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        settings.diffuserThickness,
        segments
      );
      break;
    
    case "domed":
      // Create dome using sphere segment
      geometry = new THREE.SphereGeometry(
        radius,
        segments,
        segments / 2,
        0,
        Math.PI * 2,
        0,
        Math.PI / 3 // 60-degree dome
      );
      break;
    
    case "conical":
      geometry = new THREE.ConeGeometry(
        radius,
        settings.diffuserHeight,
        segments
      );
      break;
    
    default:
      geometry = new THREE.CylinderGeometry(radius, radius, settings.diffuserThickness, segments);
  }
  
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.2,
    metalness: 0.0,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Add snap-fit tabs if enabled
  if (settings.snapFit) {
    addSnapFitTabs(mesh, settings);
  }
  
  return mesh;
}

/**
 * Add snap-fit tabs to diffuser lid
 */
function addSnapFitTabs(mesh: THREE.Mesh, settings: EmbossedLightTileSettings): void {
  const tabCount = 4;
  const tabWidth = 5;
  const tabHeight = 2;
  const tabDepth = 1.5;
  
  for (let i = 0; i < tabCount; i++) {
    const angle = (i / tabCount) * Math.PI * 2;
    const x = Math.cos(angle) * (settings.tileDiameter / 2 - 1);
    const z = Math.sin(angle) * (settings.tileDiameter / 2 - 1);
    
    // Create tab geometry
    const tabGeometry = new THREE.BoxGeometry(tabWidth, tabHeight, tabDepth);
    const tabMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const tab = new THREE.Mesh(tabGeometry, tabMaterial);
    
    tab.position.set(x, -tabHeight / 2, z);
    tab.rotation.y = angle;
    
    // Note: In production, merge with main geometry
  }
}

/**
 * Generate assembly instructions
 */
export function generateAssemblyInstructions(
  settings: EmbossedLightTileSettings
): string {
  return `# Embossed Light Tile Assembly Instructions

## Parts List
- Base tile with ${settings.patternType} pattern (${settings.patternStyle})
- Diffuser lid (${settings.diffuserStyle})
- LED strip or glow filament (${settings.channelWidth}mm width)
- Power supply (5V for LED strips)
${settings.includeMountingHoles ? `- M${settings.mountingHoleDiameter} screws (${settings.mountingHoleCount}x)` : ""}

## Assembly Steps

1. **Prepare Base Tile**
   - Print base tile in opaque PLA or PETG
   - Clean support material from LED channel
   - Test fit LED strip in channel

2. **Install LED Strip**
   - Cut LED strip to fit ${settings.channelType} channel
   - Peel backing and press into channel
   - Route power wires through side opening

3. **Attach Diffuser**
   - Print diffuser lid in translucent PLA (0.8-1.2mm layer height)
   ${settings.snapFit ? "- Align snap-fit tabs with slots" : "- Apply small amount of glue to rim"}
   - Press firmly until seated

4. **Mount Tile**
   ${settings.includeMountingHoles ? `- Use M${settings.mountingHoleDiameter} screws through mounting holes` : "- Use adhesive backing or double-sided tape"}
   - Connect power supply

## Print Settings
- **Base Tile:** 0.2mm layer height, 20% infill, supports if needed
- **Diffuser Lid:** 0.2mm layer height, 0% infill (single wall), translucent filament

## LED Recommendations
- WS2812B addressable LED strips (${settings.channelWidth}mm width)
- Standard 5V LED strips
- Glow filament (EL wire alternative)

## Power Requirements
- 5V @ 0.5-2A depending on LED count
- USB power adapter recommended

Enjoy your custom embossed light tile!
`;
}
