/**
 * NEON BULB GENERATOR
 * Creates self-contained decorative LED bulbs with shaped filaments
 * 
 * Based on user's modular bulb concept:
 * - Standard E26/E27 screw base with integrated battery/electronics
 * - Clear bulb envelope (standard shapes or bottle adapter)
 * - Shaped LED filament (text, symbols, custom paths)
 * - Touch or switch control
 * 
 * Key Features:
 * - Portable (battery powered)
 * - Modular (swap bulbs)
 * - Decorative (shelf/desk display)
 * - Gift-ready (self-contained)
 */

import * as THREE from "three";

interface Point2D {
  x: number;
  y: number;
}

/**
 * Neon Bulb Settings
 */
export interface NeonBulbSettings {
  // Filament Design
  filamentType: "text" | "shape" | "custom";
  filamentText: string;
  filamentShape: "heart" | "star" | "wine_glass" | "cursive_h" | "lightning" | "infinity" | "custom";
  filamentHeight: number; // mm, fits within bulb envelope
  filamentWidth: number; // mm
  
  // Bulb Envelope
  envelopeType: "standard_a19" | "globe_g25" | "edison_st64" | "bottle_adapter" | "fairy_light" | "custom";
  envelopeDiameter: number; // mm (lampsize in OpenSCAD)
  envelopeHeight: number; // mm
  wallThickness: number; // mm (0.4mm = single nozzle width for fast printing)
  diffuserStyle: "clear" | "frosted" | "tinted";
  bulbShape: number; // 0.7-1.7 (0.7=diamond, 1.0=balanced, 1.7=round base)
  facetCount: number; // 6=hexagonal, 32=smooth, 100=round
  tipDiameter: number; // mm (diameter of bulb tip)
  
  // Screw Base
  baseType: "e26" | "e27" | "fairy_light"; // US vs EU standard, or fairy light string
  baseDiameter: number; // mm (outside diameter, 9.8mm for fairy lights)
  baseHeight: number; // mm (baselip in OpenSCAD)
  includeBatteryCompartment: boolean;
  includeInternalRidge: boolean; // Snap-fit retention ridge
  batteryType: "cr2032_stack" | "aa_holder" | "touch_motherboard";
  batteryCount: number; // for CR2032 stacks
  
  // Switch/Control
  switchType: "twist_base" | "coin_slot" | "touch_sensor" | "none";
  includeDimmer: boolean;
  
  // Filament Support
  supportStyle: "center_post" | "wire_clips" | "mounting_posts" | "suspended";
  wireChannelWidth: number; // mm
  
  // Assembly
  splitBulb: boolean; // Top + bottom halves for LED insertion
  snapFitTolerance: number; // mm
  includeThreadedCap: boolean; // For bottle adapter
  
  // Advanced
  includeScottTorsion: boolean;
  printOrientation: "upright" | "inverted";
}

/**
 * Default settings for neon bulb
 */
export const defaultNeonBulbSettings: NeonBulbSettings = {
  filamentType: "text",
  filamentText: "NEON",
  filamentShape: "heart",
  filamentHeight: 40,
  filamentWidth: 30,
  
  envelopeType: "standard_a19",
  envelopeDiameter: 60,
  envelopeHeight: 110,
  wallThickness: 0.4, // Single nozzle width for fast printing
  diffuserStyle: "clear",
  bulbShape: 1.7, // Round base (0.7=diamond, 1.7=round)
  facetCount: 100, // Smooth sphere
  tipDiameter: 5, // Small tip
  
  baseType: "e26",
  baseDiameter: 26.05, // E26 standard
  baseHeight: 30,
  includeBatteryCompartment: true,
  includeInternalRidge: true, // Snap-fit retention
  batteryType: "cr2032_stack",
  batteryCount: 3,
  
  switchType: "coin_slot",
  includeDimmer: false,
  
  supportStyle: "mounting_posts",
  wireChannelWidth: 2,
  
  splitBulb: true,
  snapFitTolerance: 0.2,
  includeThreadedCap: false,
  
  includeScottTorsion: true,
  printOrientation: "upright",
};

/**
 * Generate E26/E27 screw base with battery compartment
 */
export function generateScrewBase(settings: NeonBulbSettings): THREE.Group {
  const base = new THREE.Group();
  base.name = "ScrewBase";
  
  // Base dimensions
  const baseType = settings.baseType;
  const outerDiameter = baseType === "e26" ? 26.05 : 27; // mm (E26 = 1.025", E27 = 27mm)
  const threadPitch = baseType === "e26" ? (25.4 / 26) : 1.0; // TPI to mm
  const baseHeight = settings.baseHeight;
  const threadDepth = 0.8; // mm
  
  // Thread profile (simplified helix)
  const threadSegments = 64;
  const threadTurns = Math.floor(baseHeight / threadPitch);
  
  const threadGeometry = new THREE.CylinderGeometry(
    outerDiameter / 2,
    outerDiameter / 2,
    baseHeight,
    threadSegments,
    threadTurns * 4,
    false
  );
  
  // Modify vertices to create thread spiral
  const positions = threadGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const angle = (y / baseHeight) * threadTurns * Math.PI * 2;
    const radius = outerDiameter / 2 + Math.sin(angle * threadSegments / 8) * threadDepth;
    
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const currentRadius = Math.sqrt(x * x + z * z);
    
    if (currentRadius > 0) {
      positions.setX(i, x * (radius / currentRadius));
      positions.setZ(i, z * (radius / currentRadius));
    }
  }
  positions.needsUpdate = true;
  threadGeometry.computeVertexNormals();
  
  const threadMesh = new THREE.Mesh(
    threadGeometry,
    new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.3, roughness: 0.7 })
  );
  base.add(threadMesh);
  
  // Battery compartment (if enabled)
  if (settings.includeBatteryCompartment) {
    const compartment = generateBatteryCompartment(settings);
    compartment.position.y = -baseHeight / 2 - 5;
    base.add(compartment);
  }
  
  // Center contact (bottom of base)
  const contactGeometry = new THREE.CylinderGeometry(3, 3, 1, 16);
  const contactMesh = new THREE.Mesh(
    contactGeometry,
    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 })
  );
  contactMesh.position.y = -baseHeight / 2 - 0.5;
  base.add(contactMesh);
  
  // Switch cutout (if coin slot)
  if (settings.switchType === "coin_slot") {
    const slotGeometry = new THREE.BoxGeometry(1, 8, outerDiameter + 2);
    const slotMesh = new THREE.Mesh(
      slotGeometry,
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    slotMesh.position.y = -baseHeight / 2 + 4;
    slotMesh.position.x = outerDiameter / 2;
    base.add(slotMesh);
  }
  
  return base;
}

/**
 * Generate battery compartment inside screw base
 */
function generateBatteryCompartment(settings: NeonBulbSettings): THREE.Group {
  const compartment = new THREE.Group();
  compartment.name = "BatteryCompartment";
  
  if (settings.batteryType === "cr2032_stack") {
    // CR2032 dimensions: 20mm diameter, 3.2mm height each
    const batteryDiameter = 20;
    const batteryHeight = 3.2 * settings.batteryCount;
    const compartmentHeight = batteryHeight + 2; // 1mm clearance each side
    
    // Cylindrical housing
    const housingGeometry = new THREE.CylinderGeometry(
      batteryDiameter / 2 + 1, // 1mm wall
      batteryDiameter / 2 + 1,
      compartmentHeight,
      32
    );
    const housingMesh = new THREE.Mesh(
      housingGeometry,
      new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.8 })
    );
    compartment.add(housingMesh);
    
    // Battery contacts (spring clips)
    const contactGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
    const contactMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8 });
    
    const topContact = new THREE.Mesh(contactGeometry, contactMaterial);
    topContact.position.y = compartmentHeight / 2 + 1;
    compartment.add(topContact);
    
    const bottomContact = new THREE.Mesh(contactGeometry, contactMaterial);
    bottomContact.position.y = -compartmentHeight / 2 - 1;
    compartment.add(bottomContact);
    
  } else if (settings.batteryType === "touch_motherboard") {
    // Touch motherboard PCB housing
    const pcbWidth = 40;
    const pcbLength = 20;
    const pcbHeight = 10;
    
    const pcbHousingGeometry = new THREE.BoxGeometry(pcbWidth, pcbHeight, pcbLength);
    const pcbHousingMesh = new THREE.Mesh(
      pcbHousingGeometry,
      new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.6 })
    );
    compartment.add(pcbHousingMesh);
    
    // USB port cutout
    const usbCutoutGeometry = new THREE.BoxGeometry(10, 4, 3);
    const usbCutoutMesh = new THREE.Mesh(
      usbCutoutGeometry,
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    usbCutoutMesh.position.x = pcbWidth / 2;
    usbCutoutMesh.position.y = -2;
    compartment.add(usbCutoutMesh);
  }
  
  return compartment;
}

/**
 * Generate bulb envelope (top half)
 */
export function generateBulbEnvelopeTop(settings: NeonBulbSettings): THREE.Group {
  const envelope = new THREE.Group();
  envelope.name = "BulbEnvelopeTop";
  
  const diameter = settings.envelopeDiameter;
  const height = settings.envelopeHeight;
  const wallThickness = settings.wallThickness;
  
  let envelopeGeometry: THREE.BufferGeometry;
  
  switch (settings.envelopeType) {
    case "standard_a19":
      // Classic bulb shape (sphere + neck)
      envelopeGeometry = generateA19BulbShape(diameter, height, wallThickness);
      break;
    
    case "globe_g25":
      // Perfect sphere
      envelopeGeometry = new THREE.SphereGeometry(diameter / 2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      break;
    
    case "edison_st64":
      // Teardrop Edison shape
      envelopeGeometry = generateEdisonBulbShape(diameter, height, wallThickness);
      break;
    
    case "bottle_adapter":
      // Threaded cap for standard bottles
      envelopeGeometry = generateBottleCapAdapter(settings);
      break;
    
    default:
      // Default to A19
      envelopeGeometry = generateA19BulbShape(diameter, height, wallThickness);
  }
  
  const envelopeMesh = new THREE.Mesh(
    envelopeGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: settings.diffuserStyle === "clear" ? 0.15 : 0.4,
      roughness: settings.diffuserStyle === "frosted" ? 0.8 : 0.1,
      transmission: 0.9,
      thickness: wallThickness,
    })
  );
  envelope.add(envelopeMesh);
  
  // Snap-fit rim (if split bulb)
  if (settings.splitBulb) {
    const rimGeometry = new THREE.TorusGeometry(diameter / 2 - 2, 1, 8, 32);
    const rimMesh = new THREE.Mesh(
      rimGeometry,
      new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = -height / 4;
    envelope.add(rimMesh);
  }
  
  return envelope;
}

/**
 * Generate bulb envelope (bottom half)
 */
export function generateBulbEnvelopeBottom(settings: NeonBulbSettings): THREE.Group {
  const envelope = new THREE.Group();
  envelope.name = "BulbEnvelopeBottom";
  
  const diameter = settings.envelopeDiameter;
  const height = settings.envelopeHeight;
  const wallThickness = settings.wallThickness;
  
  // Bottom hemisphere
  const bottomGeometry = new THREE.SphereGeometry(
    diameter / 2,
    32,
    32,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2
  );
  
  const bottomMesh = new THREE.Mesh(
    bottomGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: settings.diffuserStyle === "clear" ? 0.15 : 0.4,
      roughness: settings.diffuserStyle === "frosted" ? 0.8 : 0.1,
      transmission: 0.9,
      thickness: wallThickness,
    })
  );
  envelope.add(bottomMesh);
  
  // Neck connecting to screw base
  const neckGeometry = new THREE.CylinderGeometry(
    diameter / 4,
    settings.baseType === "e26" ? 13 : 13.5,
    height / 4,
    32
  );
  const neckMesh = new THREE.Mesh(
    neckGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      roughness: 0.2,
    })
  );
  neckMesh.position.y = -height / 4 - height / 8;
  envelope.add(neckMesh);
  
  // Snap-fit groove (if split bulb)
  if (settings.splitBulb) {
    const grooveGeometry = new THREE.TorusGeometry(diameter / 2 - 2.5, 0.8, 8, 32);
    const grooveMesh = new THREE.Mesh(
      grooveGeometry,
      new THREE.MeshStandardMaterial({ color: 0x606060 })
    );
    grooveMesh.rotation.x = Math.PI / 2;
    grooveMesh.position.y = -height / 4;
    envelope.add(grooveMesh);
  }
  
  return envelope;
}

/**
 * Generate A19 standard bulb shape
 */
function generateA19BulbShape(diameter: number, height: number, wallThickness: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  
  // Profile curve for A19 bulb
  const radius = diameter / 2;
  const segments = 32;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI;
    
    // Bulb profile (slightly elongated sphere)
    const x = Math.sin(angle) * radius;
    const y = (Math.cos(angle) * radius * 0.9) + (height / 2 - radius);
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  
  const extrudeSettings = {
    steps: 1,
    depth: wallThickness,
    bevelEnabled: false,
  };
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  return geometry;
}

/**
 * Generate Edison ST64 teardrop bulb shape
 */
function generateEdisonBulbShape(diameter: number, height: number, wallThickness: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  
  const radius = diameter / 2;
  const segments = 32;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI;
    
    // Teardrop profile
    const x = Math.sin(angle) * radius * (1 - t * 0.3);
    const y = Math.cos(angle) * radius * 1.2 + (height / 2 - radius);
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  
  const geometry = new THREE.LatheGeometry(
    shape.getPoints(32).map(p => new THREE.Vector2(p.x, p.y)),
    32
  );
  
  return geometry;
}

/**
 * Generate bottle cap adapter (fits standard bottles)
 */
function generateBottleCapAdapter(settings: NeonBulbSettings): THREE.BufferGeometry {
  // Standard bottle neck: 28mm diameter, PCO-1881 threads
  const capDiameter = 30;
  const capHeight = 15;
  const threadPitch = 2.7; // mm
  
  const capGeometry = new THREE.CylinderGeometry(
    capDiameter / 2,
    capDiameter / 2,
    capHeight,
    32,
    8,
    false
  );
  
  // Add internal threads (simplified)
  const positions = capGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const angle = (y / capHeight) * (capHeight / threadPitch) * Math.PI * 2;
    const threadDepth = 0.5;
    
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const currentRadius = Math.sqrt(x * x + z * z);
    
    if (currentRadius > capDiameter / 2 - 2) {
      const newRadius = currentRadius - Math.sin(angle * 8) * threadDepth;
      positions.setX(i, x * (newRadius / currentRadius));
      positions.setZ(i, z * (newRadius / currentRadius));
    }
  }
  positions.needsUpdate = true;
  capGeometry.computeVertexNormals();
  
  return capGeometry;
}

/**
 * Generate filament support structure
 */
export function generateFilamentSupport(settings: NeonBulbSettings, filamentPath: Point2D[]): THREE.Group {
  const support = new THREE.Group();
  support.name = "FilamentSupport";
  
  switch (settings.supportStyle) {
    case "center_post":
      // Single vertical post in center
      const postGeometry = new THREE.CylinderGeometry(1, 1, settings.envelopeHeight * 0.6, 8);
      const postMesh = new THREE.Mesh(
        postGeometry,
        new THREE.MeshStandardMaterial({ color: 0x404040 })
      );
      support.add(postMesh);
      break;
    
    case "mounting_posts":
      // Multiple posts at key points along filament path
      const postCount = Math.min(filamentPath.length, 6);
      const postSpacing = Math.floor(filamentPath.length / postCount);
      
      for (let i = 0; i < postCount; i++) {
        const point = filamentPath[i * postSpacing];
        const mountPost = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 3, 8),
          new THREE.MeshStandardMaterial({ color: 0x606060 })
        );
        mountPost.position.set(point.x, 0, point.y);
        support.add(mountPost);
      }
      break;
    
    case "wire_clips":
      // Small clips along filament path
      filamentPath.forEach((point, index) => {
        if (index % 5 === 0) {
          const clip = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.5, 1),
            new THREE.MeshStandardMaterial({ color: 0x808080 })
          );
          clip.position.set(point.x, 0, point.y);
          support.add(clip);
        }
      });
      break;
  }
  
  // Wire channels from base to filament
  const channelGeometry = new THREE.CylinderGeometry(
    settings.wireChannelWidth / 2,
    settings.wireChannelWidth / 2,
    settings.envelopeHeight / 2,
    8
  );
  const channelMesh = new THREE.Mesh(
    channelGeometry,
    new THREE.MeshStandardMaterial({ color: 0x303030 })
  );
  channelMesh.position.y = -settings.envelopeHeight / 4;
  support.add(channelMesh);
  
  return support;
}

/**
 * Generate filament path based on text or shape
 */
export function generateFilamentPath(settings: NeonBulbSettings): Point2D[] {
  const points: Point2D[] = [];
  
  if (settings.filamentType === "shape") {
    // Use predefined shapes
    switch (settings.filamentShape) {
      case "heart":
        return generateHeartPath(settings.filamentWidth, settings.filamentHeight);
      case "star":
        return generateStarPath(settings.filamentWidth, settings.filamentHeight);
      case "wine_glass":
        return generateWineGlassPath(settings.filamentWidth, settings.filamentHeight);
      case "cursive_h":
        return generateCursiveHPath(settings.filamentWidth, settings.filamentHeight);
      case "lightning":
        return generateLightningPath(settings.filamentWidth, settings.filamentHeight);
      case "infinity":
        return generateInfinityPath(settings.filamentWidth, settings.filamentHeight);
      default:
        return generateHeartPath(settings.filamentWidth, settings.filamentHeight);
    }
  }
  
  // Default: simple circle
  const segments = 32;
  const radius = Math.min(settings.filamentWidth, settings.filamentHeight) / 2;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  
  return points;
}

/**
 * Generate wine glass filament path
 */
function generateWineGlassPath(width: number, height: number): Point2D[] {
  const points: Point2D[] = [];
  const hw = width / 2;
  const hh = height / 2;
  
  // Bowl (U-shape)
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const angle = Math.PI * t + Math.PI;
    const x = Math.cos(angle) * hw * 0.6;
    const y = Math.sin(angle) * hh * 0.4 + hh * 0.3;
    points.push({ x, y });
  }
  
  // Stem
  points.push({ x: 0, y: -hh * 0.5 });
  
  // Base
  points.push({ x: -hw * 0.4, y: -hh });
  points.push({ x: hw * 0.4, y: -hh });
  
  return points;
}

/**
 * Generate cursive H filament path
 */
function generateCursiveHPath(width: number, height: number): Point2D[] {
  const points: Point2D[] = [];
  const hw = width / 2;
  const hh = height / 2;
  
  // Left vertical stroke
  points.push({ x: -hw * 0.6, y: -hh });
  points.push({ x: -hw * 0.6, y: hh });
  
  // Curved crossbar
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const x = -hw * 0.6 + t * hw * 1.2;
    const y = Math.sin(t * Math.PI) * hh * 0.2;
    points.push({ x, y });
  }
  
  // Right vertical stroke
  points.push({ x: hw * 0.6, y: hh });
  points.push({ x: hw * 0.6, y: -hh });
  
  return points;
}

/**
 * Generate heart filament path
 */
function generateHeartPath(width: number, height: number): Point2D[] {
  const points: Point2D[] = [];
  const segments = 32;
  
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    points.push({
      x: (x / 16) * (width / 2),
      y: -(y / 16) * (height / 2),
    });
  }
  
  return points;
}

/**
 * Generate star filament path
 */
function generateStarPath(width: number, height: number): Point2D[] {
  const points: Point2D[] = [];
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius * 0.4;
  const spikes = 5;
  
  for (let i = 0; i <= spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  
  return points;
}

/**
 * Generate lightning filament path
 */
function generateLightningPath(width: number, height: number): Point2D[] {
  const points: Point2D[] = [];
  const hw = width / 2;
  const hh = height / 2;
  
  points.push({ x: 0, y: hh });
  points.push({ x: -hw * 0.2, y: hh * 0.3 });
  points.push({ x: hw * 0.15, y: hh * 0.35 });
  points.push({ x: -hw * 0.1, y: -hh * 0.2 });
  points.push({ x: hw * 0.2, y: -hh * 0.15 });
  points.push({ x: 0, y: -hh });
  
  return points;
}

/**
 * Generate infinity symbol filament path
 */
function generateInfinityPath(width: number, height: number): Point2D[] {
  const points: Point2D[] = [];
  const segments = 64;
  const a = width / 4;
  const b = height / 4;
  
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = a * Math.cos(t) / (1 + Math.pow(Math.sin(t), 2));
    const y = b * Math.sin(t) * Math.cos(t) / (1 + Math.pow(Math.sin(t), 2));
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Generate assembly instructions for neon bulb
 */
export function generateBulbAssemblyInstructions(settings: NeonBulbSettings): string {
  return `# Neon Bulb Assembly Instructions

## Parts List:
1. Bulb Envelope Top (clear PETG)
2. Bulb Envelope Bottom (clear PETG)
3. Screw Base E${settings.baseType === "e26" ? "26" : "27"} (PLA/PETG)
4. Filament Support Structure (PLA)
5. LED Filament (COB LED strip or WS2812B)
6. ${settings.batteryType === "cr2032_stack" ? `CR2032 Batteries (${settings.batteryCount}×)` : "Touch Motherboard PCB"}
7. 22 AWG Wire (red/black)
8. ${settings.switchType === "coin_slot" ? "Slide Switch" : "Touch Sensor"}

## Tools Required:
- Soldering iron
- Wire strippers
- Hot glue gun
- Isopropyl alcohol (cleaning)

## Assembly Steps:

### Step 1: Prepare LED Filament
1. Cut LED filament to match your design path
2. Shape filament according to template (use bending jig if available)
3. Test LED strip before installation
4. Solder power wires (red = +, black = -)

### Step 2: Install Filament Support
1. Insert support structure into bottom bulb half
2. Secure with small dabs of hot glue at base
3. Route wires through wire channels
4. Leave 50mm wire length for connections

### Step 3: Mount LED Filament
1. Attach LED filament to support posts using:
   - Wire clips (for wire_clips style)
   - Hot glue dots (for mounting_posts style)
   - Zip ties (for center_post style)
2. Ensure filament is centered and level
3. Avoid putting stress on LED connections

### Step 4: Wire Electronics
${settings.batteryType === "cr2032_stack" ? `
**CR2032 Battery Stack:**
1. Insert batteries into compartment (+ up)
2. Connect red wire to top contact
3. Connect black wire to bottom contact
4. Add switch inline with red wire
` : `
**Touch Motherboard:**
1. Mount PCB in base compartment
2. Connect LED + to PCB output +
3. Connect LED - to PCB output -
4. Ensure USB port aligns with base cutout
`}

### Step 5: Assemble Bulb
1. Route wires through neck opening
2. Align top and bottom bulb halves
3. Press together until snap-fit clicks
4. Check for light leaks at seam
5. Seal with clear silicone if needed

### Step 6: Attach Screw Base
1. Thread wires through base opening
2. Connect to battery/PCB terminals
3. Secure base to bulb neck with:
   - Snap fit (if designed)
   - Hot glue (permanent)
   - Threaded connection (if bottle adapter)

### Step 7: Testing
1. ${settings.switchType === "coin_slot" ? "Slide switch to ON position" : "Touch sensor to activate"}
2. LED filament should illuminate
3. Check for even brightness
4. Test dimmer if included
5. Verify no short circuits

### Step 8: Final Assembly
1. Clean fingerprints from bulb with isopropyl alcohol
2. Install switch cover/knob if applicable
3. Screw bulb into display base or lamp socket
4. Enjoy your custom neon bulb!

## Troubleshooting:
- **LEDs don't light**: Check battery polarity, switch position, solder joints
- **Dim LEDs**: Replace batteries, check voltage (should be ${settings.batteryCount * 3}V)
- **Flickering**: Loose connection, re-solder wires
- **Bulb won't snap together**: Check tolerance, sand edges if too tight

## Safety Notes:
- Use low voltage LEDs only (3-12V max)
- Do not use with AC power
- Keep away from water
- Do not exceed LED current rating
- Dispose of batteries properly

## Maintenance:
- Battery life: ${settings.batteryType === "cr2032_stack" ? "20-40 hours" : "Rechargeable via USB"}
- Clean bulb with soft cloth
- Store in cool, dry place
- Replace batteries when dim

---
Generated by Sign-Sculptor Neon Bulb Designer
`;
}

/**
 * Generate BOM for neon bulb
 */
export function generateBulbBOM(settings: NeonBulbSettings): string {
  const batterySection = settings.batteryType === "cr2032_stack" 
    ? `- **CR2032 Batteries** (${settings.batteryCount}×) - $${(settings.batteryCount * 1.5).toFixed(2)}`
    : `- **Touch Motherboard PCB** (1×) - $8.00
- **USB Cable** (charging) - $1.50`;

  return `# Bill of Materials - Neon Bulb

## 3D Printed Parts:
- **Bulb Envelope Top** (1×) - $${(settings.envelopeHeight * 0.015).toFixed(2)} (clear PETG)
- **Bulb Envelope Bottom** (1×) - $${(settings.envelopeHeight * 0.015).toFixed(2)} (clear PETG)
- **Screw Base E${settings.baseType === "e26" ? "26" : "27"}** (1×) - $0.80 (PLA)
- **Filament Support** (1×) - $0.30 (PLA)

## Electronic Components:
- **COB LED Filament Strip** (${settings.filamentHeight}mm) - $${(settings.filamentHeight * 0.08).toFixed(2)}
${batterySection}
- **${settings.switchType === "coin_slot" ? "Slide Switch" : "Touch Sensor"}** (1×) - $${settings.switchType === "coin_slot" ? "0.50" : "2.00"}
- **22 AWG Wire** (red/black, 200mm) - $0.50

## Hardware:
- **Hot Glue Sticks** (2×) - $0.20
- **Solder** (small amount) - $0.10

## Optional:
- **Diffuser Spray** (frosted finish) - $5.00
- **Display Base** (wooden or 3D printed) - $3.00

## Total Cost: $${calculateTotalCost(settings)}

## Where to Buy:
- **LED Filament**: AliExpress, Amazon (search "COB LED strip warm white")
- **Batteries**: Local electronics store, Amazon
- **Touch Motherboard**: AliExpress (search "USB touch LED controller")
- **3D Printing Filament**: 
  - Clear PETG: Overture, eSUN, Prusament
  - PLA: Hatchbox, eSUN, Polymaker

## Print Settings:
- **Material**: Clear PETG (bulb), PLA (base)
- **Layer Height**: 0.2mm
- **Infill**: 15% (base), 0% (bulb - vase mode)
- **Supports**: None (print upright)
- **Print Time**: ~3-4 hours total
- **Material Used**: ~40g PETG, ~20g PLA

---
Generated by Sign-Sculptor Neon Bulb Designer
`;
}

/**
 * Calculate total cost for BOM
 */
function calculateTotalCost(settings: NeonBulbSettings): string {
  let cost = 0;
  
  // 3D printed parts
  cost += settings.envelopeHeight * 0.03; // PETG bulb
  cost += 1.10; // Base + support
  
  // Electronics
  cost += settings.filamentHeight * 0.08; // LED filament
  
  if (settings.batteryType === "cr2032_stack") {
    cost += settings.batteryCount * 1.5; // CR2032 batteries
  } else {
    cost += 9.5; // Touch motherboard + USB cable
  }
  
  cost += settings.switchType === "coin_slot" ? 0.5 : 2.0; // Switch
  cost += 0.8; // Wire, glue, solder
  
  return cost.toFixed(2);
}

/**
 * Main wrapper function for API endpoint
 * Generates complete neon bulb package with all STL files and documentation
 */
export async function generateNeonBulb(settings: NeonBulbSettings) {
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
  const exporter = new STLExporter();
  
  // Generate all components
  const envelopeTop = generateBulbEnvelopeTop(settings);
  const envelopeBottom = generateBulbEnvelopeBottom(settings);
  const base = generateScrewBase(settings);
  const filamentPath = generateFilamentPath(settings);
  const filamentSupport = generateFilamentSupport(settings, filamentPath);
  
  // Export to STL strings
  const envelopeTopSTL = exporter.parse(envelopeTop, { binary: false });
  const envelopeBottomSTL = exporter.parse(envelopeBottom, { binary: false });
  const baseSTL = exporter.parse(base, { binary: false });
  const filamentSTL = exporter.parse(filamentSupport, { binary: false });
  
  // Generate documentation
  const assemblyInstructions = generateBulbAssemblyInstructions(settings);
  const bom = generateBulbBOM(settings);
  
  return {
    envelopeSTL: envelopeTopSTL + '\n' + envelopeBottomSTL,
    filamentSTL,
    baseSTL,
    batteryCompartmentSTL: settings.batteryType === "cr2032_stack" ? baseSTL : null,
    assemblyInstructions,
    bom
  };
}
