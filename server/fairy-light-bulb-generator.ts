/**
 * FAIRY LIGHT BULB GENERATOR
 * Based on OpenSCAD fairy light cap generator script
 * 
 * Creates optimized bulb envelopes for fairy light strings and custom LED bulbs
 * 
 * Key Features from Original Script:
 * - Hull-based geometry for smooth transitions
 * - Thin wall optimization (0.4mm = single nozzle width)
 * - Internal snap-fit ridge for retention
 * - Parametric shape control (0.7=diamond, 1.7=round)
 * - Adjustable facets (6=hexagonal, 100=smooth)
 * - Fast printing optimized
 * 
 * Print Settings from Original:
 * - Wall thickness: 0.4mm (single nozzle)
 * - Minimum layer time: 0 (or reduce speed to 40mm/s)
 * - Print orientation: Upright (tip up)
 * - No supports needed
 */

import * as THREE from "three";

export interface FairyLightBulbSettings {
  // Base Fitting
  baseDiameter: number; // mm (9.8mm for standard fairy lights)
  baseLength: number; // mm (baselip, 8mm standard)
  
  // Globe Shape
  lampSize: number; // mm (diameter of main bulb body, 20mm standard)
  tipDiameter: number; // mm (5mm standard)
  bulbShape: number; // 0.7-1.7 (0.7=diamond, 1.0=balanced, 1.7=round base)
  
  // Geometry
  facets: number; // 6=hexagonal, 32=smooth, 100=round
  wallThickness: number; // mm (0.4mm = single nozzle width)
  
  // Internal Features
  includeInternalRidge: boolean; // Snap-fit retention
  ridgeHeight: number; // mm (1.2mm standard)
  ridgeOffset: number; // mm from base top (1.1mm standard)
  
  // Material & Printing
  material: "clear_petg" | "translucent_pla" | "transparent_resin";
  printSpeed: number; // mm/s (40mm/s recommended for thin walls)
  minimumLayerTime: number; // seconds (0 for fast print)
}

export const defaultFairyLightSettings: FairyLightBulbSettings = {
  baseDiameter: 9.8,
  baseLength: 8,
  lampSize: 20,
  tipDiameter: 5,
  bulbShape: 1.7, // Round base
  facets: 100, // Smooth
  wallThickness: 0.4, // Single nozzle
  includeInternalRidge: true,
  ridgeHeight: 1.2,
  ridgeOffset: 1.1,
  material: "clear_petg",
  printSpeed: 40,
  minimumLayerTime: 0,
};

/**
 * Generate fairy light bulb using hull-based geometry (OpenSCAD method)
 * 
 * This replicates the OpenSCAD script's approach:
 * 1. Create outer hull (base sphere + tip sphere + base cylinder)
 * 2. Subtract inner hull (same shapes, reduced by wall thickness)
 * 3. Add internal ridge for snap-fit
 */
export function generateFairyLightBulb(settings: FairyLightBulbSettings): THREE.Group {
  const bulb = new THREE.Group();
  bulb.name = "FairyLightBulb";
  
  // Calculate key positions (from OpenSCAD script)
  const baseSphereZ = (settings.lampSize / settings.bulbShape) + settings.baseLength;
  const tipSphereZ = (settings.lampSize * 2) + settings.baseLength;
  
  // OUTER SHELL
  const outerShell = createBulbHull(
    settings.baseDiameter,
    settings.baseLength,
    settings.lampSize,
    settings.tipDiameter,
    baseSphereZ,
    tipSphereZ,
    settings.facets
  );
  bulb.add(outerShell);
  
  // INNER HOLLOW (subtract this in actual CSG)
  const innerHollow = createBulbHull(
    settings.baseDiameter - (2 * settings.wallThickness) - 0.2, // Extra 0.2mm clearance
    settings.baseLength,
    settings.lampSize - (2 * settings.wallThickness),
    settings.tipDiameter - (2 * settings.wallThickness),
    baseSphereZ,
    tipSphereZ,
    settings.facets
  );
  innerHollow.material = new THREE.MeshStandardMaterial({ 
    color: 0xFF0000, 
    transparent: true, 
    opacity: 0.3 
  });
  // In actual implementation, this would be CSG subtracted
  
  // INTERNAL RIDGE (snap-fit retention)
  if (settings.includeInternalRidge) {
    const ridge = createInternalRidge(
      settings.baseDiameter - (2 * settings.wallThickness),
      settings.baseDiameter - (2 * settings.wallThickness) - 1,
      settings.ridgeHeight,
      settings.baseLength - settings.ridgeOffset,
      settings.facets
    );
    bulb.add(ridge);
  }
  
  return bulb;
}

/**
 * Create bulb hull using Three.js geometry
 * Approximates OpenSCAD's hull() operation
 */
function createBulbHull(
  baseDiameter: number,
  baseLength: number,
  lampSize: number,
  tipDiameter: number,
  baseSphereZ: number,
  tipSphereZ: number,
  facets: number
): THREE.Mesh {
  // Create a merged geometry approximating the hull
  // In production, this would use proper CSG hull operation
  
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Generate vertices for base cylinder
  const baseSegments = facets;
  for (let i = 0; i <= baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2;
    const x = Math.cos(angle) * (baseDiameter / 2);
    const z = Math.sin(angle) * (baseDiameter / 2);
    vertices.push(x, 0, z); // Bottom
    vertices.push(x, baseLength, z); // Top
  }
  
  // Generate vertices for base sphere
  const sphereSegments = Math.max(16, Math.floor(facets / 4));
  for (let lat = 0; lat <= sphereSegments; lat++) {
    const theta = (lat / sphereSegments) * Math.PI;
    for (let lon = 0; lon <= baseSegments; lon++) {
      const phi = (lon / baseSegments) * Math.PI * 2;
      const x = Math.sin(theta) * Math.cos(phi) * (lampSize / 2);
      const y = baseSphereZ + Math.cos(theta) * (lampSize / 2);
      const z = Math.sin(theta) * Math.sin(phi) * (lampSize / 2);
      vertices.push(x, y, z);
    }
  }
  
  // Generate vertices for tip sphere
  for (let lat = 0; lat <= sphereSegments; lat++) {
    const theta = (lat / sphereSegments) * Math.PI;
    for (let lon = 0; lon <= baseSegments; lon++) {
      const phi = (lon / baseSegments) * Math.PI * 2;
      const x = Math.sin(theta) * Math.cos(phi) * (tipDiameter / 2);
      const y = tipSphereZ + Math.cos(theta) * (tipDiameter / 2);
      const z = Math.sin(theta) * Math.sin(phi) * (tipDiameter / 2);
      vertices.push(x, y, z);
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    transmission: 0.95,
    thickness: 0.5,
  });
  
  return new THREE.Mesh(geometry, material);
}

/**
 * Create internal snap-fit ridge
 * From OpenSCAD: cylinder(h=1.2,d1=basedia-(2*wall),d2=basedia-(2*wall)-1)
 */
function createInternalRidge(
  topDiameter: number,
  bottomDiameter: number,
  height: number,
  zPosition: number,
  facets: number
): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(
    topDiameter / 2,
    bottomDiameter / 2,
    height,
    facets
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x606060,
    roughness: 0.8,
  });
  
  const ridge = new THREE.Mesh(geometry, material);
  ridge.position.y = zPosition;
  ridge.name = "InternalRidge";
  
  return ridge;
}

/**
 * Generate printing instructions based on original script comments
 */
export function generateFairyLightPrintInstructions(settings: FairyLightBulbSettings): string {
  return `# Fairy Light Bulb - Print Instructions

## Print Settings (Optimized for Fast Printing)

### Slicer Settings:
- **Layer Height**: 0.2mm
- **Wall Thickness**: ${settings.wallThickness}mm (${settings.wallThickness === 0.4 ? 'single nozzle width' : 'custom'})
- **Infill**: 0% (vase mode recommended)
- **Print Speed**: ${settings.printSpeed}mm/s
- **Minimum Layer Time**: ${settings.minimumLayerTime}s

### Material:
- **Type**: ${settings.material === 'clear_petg' ? 'Clear PETG' : settings.material === 'translucent_pla' ? 'Translucent PLA' : 'Transparent Resin'}
- **Temperature**: ${settings.material === 'clear_petg' ? '235-245°C' : '200-210°C'}
- **Bed**: ${settings.material === 'clear_petg' ? '80°C' : '60°C'}

### Orientation:
- **Print Upright** (tip pointing up)
- **No Supports** needed
- **No Brim** needed (base is wide enough)

### Important Notes:
⚠️ **If print goes floppy:**
1. Reduce print speed to 40mm/s or lower
2. Enable minimum layer time (5-10 seconds)
3. Increase cooling fan to 100%
4. Consider printing multiple bulbs at once (gives layer cooling time)

⚠️ **Wall Thickness:**
- ${settings.wallThickness}mm = ${settings.wallThickness / 0.4} nozzle widths
- Single nozzle (0.4mm) is fastest but most fragile
- Double nozzle (0.8mm) is stronger but slower

### Geometry Details:
- **Facets**: ${settings.facets} (${settings.facets <= 6 ? 'hexagonal' : settings.facets <= 32 ? 'faceted' : 'smooth'})
- **Shape**: ${settings.bulbShape.toFixed(1)} (${settings.bulbShape < 1.0 ? 'diamond' : settings.bulbShape > 1.5 ? 'round base' : 'balanced'})
- **Base Diameter**: ${settings.baseDiameter}mm (${settings.baseDiameter === 9.8 ? 'standard fairy light' : 'custom'})
- **Lamp Size**: ${settings.lampSize}mm
- **Tip Diameter**: ${settings.tipDiameter}mm

### Post-Processing:
1. Remove from bed carefully (thin walls!)
2. Clean any stringing with heat gun or lighter
3. Polish with acrylic polish for crystal clarity
4. Test fit on fairy light base before assembly

### Assembly:
1. Insert LED into bulb from base
2. Press bulb onto fairy light base
3. Internal ridge should click into place
4. Gentle twist to secure

---
Generated from OpenSCAD Fairy Light Cap Generator 2023
Optimized for fast printing with thin walls
`;
}

/**
 * Generate OpenSCAD source code for advanced users
 */
export function generateFairyLightOpenSCAD(settings: FairyLightBulbSettings): string {
  return `//Custom fairy light cap generator 2023
//Generated by Sign-Sculptor Fairy Light Bulb Designer

//This is a FAST print by default
//You may wish to make minimum layer time zero and
//print at a lower speed like ${settings.printSpeed}mm per second if it
//all goes a bit floppy.

//You can adjust these 3 variables to suit your application
//Make sure you leave the  = and ; intact on either side

basedia=${settings.baseDiameter}; //outside diameter of base
baselip=${settings.baseLength};   //length of base
lampsize=${settings.lampSize}; //diameter of globe

//Advanced variables
facets=${settings.facets};  //facets on bulb 6=hexagonal 100=round
wall=${settings.wallThickness};    //thickness of wall (multiple of print nozzle)
tip=${settings.tipDiameter};       //diameter of tip of bulb
shape=${settings.bulbShape};   //0.7-1.7  1=diamond 1.7=round base

//Do not make changes below here
$fn=facets;
difference(){
union(){
//Outside shell of globe
hull() {
//base of globe
translate([0,0,(lampsize/shape)+baselip])
sphere(d=lampsize);
//top of globe
translate([0,0,(lampsize*2)+baselip])
sphere(d=tip,$fn=100);
//base cylinder interface
translate([0,0,baselip-.1])
cylinder(h=.1,d=basedia,$fn=100);
}
//base cylinder
cylinder(h=baselip,d=basedia,$fn=100);
}
//Inside hollow of globe
hull() {
//base of globe
translate([0,0,(lampsize/shape)+baselip])
sphere(d=lampsize-(2*wall));
//top of globe
translate([0,0,(lampsize*2)+baselip])
sphere(d=tip-(2*wall),$fn=100);
//base cylinder interface
translate([0,0,baselip-.1])
cylinder(h=.1,d=basedia-(2*wall)-.2,$fn=100);
}
//base cylinder interior
translate([0,0,-1])
cylinder(h=baselip,d=basedia-(2*wall),$fn=100);
${settings.includeInternalRidge ? `//base internal ridge
translate([0,0,baselip-${settings.ridgeOffset}])
cylinder(h=${settings.ridgeHeight},d1=basedia-(2*wall),d2=basedia-(2*wall)-1,$fn=100);` : ''}
//x-ray cube (uncomment to see cross-section)
//translate([-50,-50,-40])
//cube([100,50,100]);
}
`;
}

/**
 * Generate shape variations based on original script examples
 */
export function generateShapePresets(): Array<{name: string; settings: Partial<FairyLightBulbSettings>}> {
  return [
    {
      name: "Standard Round (Original)",
      settings: {
        lampSize: 20,
        tipDiameter: 5,
        bulbShape: 1.7,
        facets: 100,
      }
    },
    {
      name: "Diamond Shape",
      settings: {
        lampSize: 20,
        tipDiameter: 5,
        bulbShape: 0.7,
        facets: 100,
      }
    },
    {
      name: "Balanced Teardrop",
      settings: {
        lampSize: 20,
        tipDiameter: 5,
        bulbShape: 1.0,
        facets: 100,
      }
    },
    {
      name: "Hexagonal Faceted",
      settings: {
        lampSize: 20,
        tipDiameter: 5,
        bulbShape: 1.7,
        facets: 6,
      }
    },
    {
      name: "Large Globe",
      settings: {
        lampSize: 30,
        tipDiameter: 8,
        bulbShape: 1.7,
        facets: 100,
      }
    },
    {
      name: "Flame Shape",
      settings: {
        lampSize: 18,
        tipDiameter: 3,
        bulbShape: 0.9,
        facets: 100,
      }
    },
    {
      name: "Candle Flicker",
      settings: {
        lampSize: 15,
        tipDiameter: 2,
        bulbShape: 0.8,
        facets: 32,
      }
    },
  ];
}
