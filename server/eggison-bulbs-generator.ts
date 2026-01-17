// Eggison Bulbs Generator - Custom 3D-printed light bulb shells
// Generates hollow shells with screw bases for DIY LED filament bulbs

import type { EggisonBulbsSettings } from "../shared/eggison-bulbs-types";

interface Triangle {
  vertices: [number, number, number][];
  normal?: [number, number, number];
}

interface ExportedPart {
  name: string;
  stl: string;
  description?: string;
  slicingNotes?: string;
}

// Generate shell profile based on shape type
function generateShellProfile(
  shape: string,
  height: number,
  width: number,
  segments: number = 32
): { x: number; y: number }[] {
  const profile: { x: number; y: number }[] = [];
  const halfWidth = width / 2;
  
  switch (shape) {
    case "egg":
      // Egg shape - wider at bottom, tapered at top
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI;
        const radius = halfWidth * Math.sin(angle) * (1 - t * 0.3);
        const y = -height / 2 + t * height;
        profile.push({ x: radius, y });
      }
      break;
      
    case "sphere":
      // Perfect sphere
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI;
        const radius = halfWidth * Math.sin(angle);
        const y = -height / 2 + halfWidth * (1 - Math.cos(angle));
        profile.push({ x: radius, y });
      }
      break;
      
    case "teardrop":
      // Teardrop - pointed at top
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI;
        const radius = halfWidth * Math.sin(angle) * (1 - t * 0.6);
        const y = -height / 2 + t * height;
        profile.push({ x: radius, y });
      }
      break;
      
    case "pear":
      // Pear shape - bulbous bottom, narrow top
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI;
        const bulge = 1 + 0.3 * Math.sin(t * Math.PI);
        const radius = halfWidth * Math.sin(angle) * bulge * (1 - t * 0.4);
        const y = -height / 2 + t * height;
        profile.push({ x: radius, y });
      }
      break;
      
    case "tube":
      // Cylindrical tube with rounded ends
      const capHeight = halfWidth;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = -height / 2 + t * height;
        
        if (y < -height / 2 + capHeight) {
          // Bottom cap
          const localT = (y + height / 2) / capHeight;
          const angle = localT * Math.PI / 2;
          const radius = halfWidth * Math.sin(angle);
          profile.push({ x: radius, y });
        } else if (y > height / 2 - capHeight) {
          // Top cap
          const localT = (y - (height / 2 - capHeight)) / capHeight;
          const angle = Math.PI / 2 + localT * Math.PI / 2;
          const radius = halfWidth * Math.sin(angle);
          profile.push({ x: radius, y });
        } else {
          // Straight section
          profile.push({ x: halfWidth, y });
        }
      }
      break;
      
    case "dome":
      // Dome - flat bottom, rounded top
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        if (t < 0.2) {
          // Flat bottom
          profile.push({ x: halfWidth, y: -height / 2 + t * height });
        } else {
          // Rounded dome
          const domeT = (t - 0.2) / 0.8;
          const angle = domeT * Math.PI / 2;
          const radius = halfWidth * Math.cos(angle);
          const y = -height / 2 + 0.2 * height + domeT * 0.8 * height;
          profile.push({ x: radius, y });
        }
      }
      break;
      
    default:
      // Default to egg shape
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI;
        const radius = halfWidth * Math.sin(angle);
        const y = -height / 2 + t * height;
        profile.push({ x: radius, y });
      }
  }
  
  return profile;
}

// Generate hollow shell with inner and outer walls
function generateHollowShell(
  profile: { x: number; y: number }[],
  wallThickness: number,
  radialSegments: number = 32
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // Create outer surface
  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const angle1 = (j / radialSegments) * Math.PI * 2;
      const angle2 = ((j + 1) / radialSegments) * Math.PI * 2;
      
      const p1 = profile[i];
      const p2 = profile[i + 1];
      
      // Outer surface vertices
      const v1: [number, number, number] = [p1.x * Math.cos(angle1), p1.y, p1.x * Math.sin(angle1)];
      const v2: [number, number, number] = [p1.x * Math.cos(angle2), p1.y, p1.x * Math.sin(angle2)];
      const v3: [number, number, number] = [p2.x * Math.cos(angle2), p2.y, p2.x * Math.sin(angle2)];
      const v4: [number, number, number] = [p2.x * Math.cos(angle1), p2.y, p2.x * Math.sin(angle1)];
      
      triangles.push({ vertices: [v1, v2, v3] });
      triangles.push({ vertices: [v1, v3, v4] });
    }
  }
  
  // Create inner surface (offset by wall thickness)
  const innerProfile = profile.map(p => ({
    x: Math.max(0, p.x - wallThickness),
    y: p.y
  }));
  
  for (let i = 0; i < innerProfile.length - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const angle1 = (j / radialSegments) * Math.PI * 2;
      const angle2 = ((j + 1) / radialSegments) * Math.PI * 2;
      
      const p1 = innerProfile[i];
      const p2 = innerProfile[i + 1];
      
      // Inner surface vertices (reversed winding)
      const v1: [number, number, number] = [p1.x * Math.cos(angle1), p1.y, p1.x * Math.sin(angle1)];
      const v2: [number, number, number] = [p1.x * Math.cos(angle2), p1.y, p1.x * Math.sin(angle2)];
      const v3: [number, number, number] = [p2.x * Math.cos(angle2), p2.y, p2.x * Math.sin(angle2)];
      const v4: [number, number, number] = [p2.x * Math.cos(angle1), p2.y, p2.x * Math.sin(angle1)];
      
      triangles.push({ vertices: [v1, v3, v2] });
      triangles.push({ vertices: [v1, v4, v3] });
    }
  }
  
  return triangles;
}

// Generate E26/E27 screw base
function generateScrewBase(
  baseDiameter: number,
  baseHeight: number,
  threadPitch: number,
  conductiveGroove: boolean,
  grooveWidth: number,
  grooveDepth: number,
  radialSegments: number = 32
): Triangle[] {
  const triangles: Triangle[] = [];
  const radius = baseDiameter / 2;
  const threadHeight = 1.5; // Thread height in mm
  const threads = Math.floor(baseHeight / threadPitch);
  
  for (let t = 0; t < threads; t++) {
    const yStart = -baseHeight + t * threadPitch;
    const yEnd = yStart + threadPitch;
    
    for (let j = 0; j < radialSegments; j++) {
      const angle1 = (j / radialSegments) * Math.PI * 2;
      const angle2 = ((j + 1) / radialSegments) * Math.PI * 2;
      
      // Thread profile
      const r1 = radius;
      const r2 = radius + threadHeight;
      
      const v1: [number, number, number] = [r1 * Math.cos(angle1), yStart, r1 * Math.sin(angle1)];
      const v2: [number, number, number] = [r2 * Math.cos(angle1), yStart + threadPitch / 2, r2 * Math.sin(angle1)];
      const v3: [number, number, number] = [r1 * Math.cos(angle2), yEnd, r1 * Math.sin(angle2)];
      
      triangles.push({ vertices: [v1, v2, v3] });
    }
  }
  
  // Add conductive groove if enabled
  if (conductiveGroove) {
    const grooveY = -baseHeight / 2;
    for (let j = 0; j < radialSegments; j++) {
      const angle1 = (j / radialSegments) * Math.PI * 2;
      const angle2 = ((j + 1) / radialSegments) * Math.PI * 2;
      
      const r1 = radius - grooveDepth;
      const r2 = radius;
      
      const v1: [number, number, number] = [r1 * Math.cos(angle1), grooveY - grooveWidth / 2, r1 * Math.sin(angle1)];
      const v2: [number, number, number] = [r1 * Math.cos(angle2), grooveY - grooveWidth / 2, r1 * Math.sin(angle2)];
      const v3: [number, number, number] = [r2 * Math.cos(angle2), grooveY + grooveWidth / 2, r2 * Math.sin(angle2)];
      const v4: [number, number, number] = [r2 * Math.cos(angle1), grooveY + grooveWidth / 2, r2 * Math.sin(angle1)];
      
      triangles.push({ vertices: [v1, v2, v3] });
      triangles.push({ vertices: [v1, v3, v4] });
    }
  }
  
  return triangles;
}

// Generate filament guide (internal structure for shaping LEDs)
function generateFilamentGuide(
  guideType: string,
  guideHeight: number,
  guideThickness: number,
  mountPoints: number
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // For now, generate simple mounting posts
  // TODO: Add actual shaped guides (heart, infinity, etc.)
  const postRadius = guideThickness / 2;
  const postHeight = guideHeight;
  
  for (let i = 0; i < mountPoints; i++) {
    const angle = (i / mountPoints) * Math.PI * 2;
    const x = 15 * Math.cos(angle);
    const z = 15 * Math.sin(angle);
    
    // Simple cylindrical post
    for (let j = 0; j < 8; j++) {
      const a1 = (j / 8) * Math.PI * 2;
      const a2 = ((j + 1) / 8) * Math.PI * 2;
      
      const v1: [number, number, number] = [x + postRadius * Math.cos(a1), -postHeight / 2, z + postRadius * Math.sin(a1)];
      const v2: [number, number, number] = [x + postRadius * Math.cos(a2), -postHeight / 2, z + postRadius * Math.sin(a2)];
      const v3: [number, number, number] = [x + postRadius * Math.cos(a2), postHeight / 2, z + postRadius * Math.sin(a2)];
      const v4: [number, number, number] = [x + postRadius * Math.cos(a1), postHeight / 2, z + postRadius * Math.sin(a1)];
      
      triangles.push({ vertices: [v1, v2, v3] });
      triangles.push({ vertices: [v1, v3, v4] });
    }
  }
  
  return triangles;
}

// Convert triangles to STL format
function trianglesToSTL(triangles: Triangle[], name: string): string {
  let stl = `solid ${name}\n`;
  
  for (const triangle of triangles) {
    const [v1, v2, v3] = triangle.vertices;
    
    // Calculate normal
    const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
    const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    if (len > 0) {
      normal[0] /= len;
      normal[1] /= len;
      normal[2] /= len;
    }
    
    stl += `  facet normal ${normal[0].toExponential(6)} ${normal[1].toExponential(6)} ${normal[2].toExponential(6)}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v1[0].toExponential(6)} ${v1[1].toExponential(6)} ${v1[2].toExponential(6)}\n`;
    stl += `      vertex ${v2[0].toExponential(6)} ${v2[1].toExponential(6)} ${v2[2].toExponential(6)}\n`;
    stl += `      vertex ${v3[0].toExponential(6)} ${v3[1].toExponential(6)} ${v3[2].toExponential(6)}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }
  
  stl += `endsolid ${name}\n`;
  return stl;
}

// Main generator function
export function generateEggisonBulb(settings: EggisonBulbsSettings): ExportedPart[] {
  const parts: ExportedPart[] = [];
  
  // Generate shell profile
  const profile = generateShellProfile(
    settings.shellShape,
    settings.shellHeight,
    settings.shellWidth
  );
  
  // Generate hollow shell
  const shellTriangles = generateHollowShell(profile, settings.shellWallThickness);
  
  // Generate screw base if not "none"
  let baseTriangles: Triangle[] = [];
  if (settings.screwBase !== "none") {
    baseTriangles = generateScrewBase(
      settings.baseDiameter,
      settings.baseHeight,
      settings.threadPitch,
      settings.conductivePathGroove,
      settings.grooveWidth,
      settings.grooveDepth
    );
  }
  
  // Generate filament guide if not "none"
  let guideTriangles: Triangle[] = [];
  if (settings.filamentGuide !== "none") {
    guideTriangles = generateFilamentGuide(
      settings.filamentGuide,
      settings.guideHeight,
      settings.guideThickness,
      settings.guideMountPoints
    );
  }
  
  // Combine all triangles for complete bulb
  const allTriangles = [...shellTriangles, ...baseTriangles, ...guideTriangles];
  
  if (settings.splitHorizontal) {
    // Split into top and bottom halves
    const topTriangles = allTriangles.filter(t => 
      t.vertices.some(v => v[1] > settings.splitHeight)
    );
    const bottomTriangles = allTriangles.filter(t => 
      t.vertices.some(v => v[1] <= settings.splitHeight)
    );
    
    parts.push({
      name: `eggison_${settings.shellShape}_top`,
      stl: trianglesToSTL(topTriangles, "eggison_top"),
      description: "Top half of Eggison bulb shell",
      slicingNotes: "⚠️ IMPORTANT: Enable SPIRAL VASE MODE (vase mode) in your slicer for glass-like clarity with clear PETG!"
    });
    
    parts.push({
      name: `eggison_${settings.shellShape}_bottom`,
      stl: trianglesToSTL(bottomTriangles, "eggison_bottom"),
      description: "Bottom half with screw base",
      slicingNotes: "Print with normal settings (NOT vase mode) - needs solid screw threads"
    });
  } else {
    // Export as single piece
    parts.push({
      name: `eggison_${settings.shellShape}_complete`,
      stl: trianglesToSTL(allTriangles, "eggison_bulb"),
      description: "Complete Eggison bulb shell",
      slicingNotes: "⚠️ IMPORTANT: Enable SPIRAL VASE MODE (vase mode) in your slicer for glass-like clarity with clear PETG!"
    });
  }
  
  return parts;
}
