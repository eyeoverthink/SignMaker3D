// Canvas Glow-Clip Generator
// Creates magnetic LED holders for canvas wash lighting
// Based on user's OpenSCAD design

import type { LEDHolderSettings } from "@shared/schema";

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  normal: Vector3;
  v1: Vector3;
  v2: Vector3;
  v3: Vector3;
}

function calcNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const u = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
  const v = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
  const nx = u.y * v.z - u.z * v.y;
  const ny = u.z * v.x - u.x * v.z;
  const nz = u.x * v.y - u.y * v.x;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return len > 0 ? { x: nx / len, y: ny / len, z: nz / len } : { x: 0, y: 0, z: 1 };
}

// Generate duckbill diffuser for wash lighting
function generateDuckbillDiffuser(
  ledDiameter: number,
  diffuserWidth: number,
  diffuserHeight: number,
  angle: number = 45
): Triangle[] {
  const triangles: Triangle[] = [];
  const segments = 32;
  
  // LED base circle (where light starts)
  const ledRadius = ledDiameter / 2;
  const ledZ = 12.5;
  const ledY = 5;
  
  // Wide mouth oval (where light exits)
  const mouthY = 20;
  const mouthZ = 3;
  const mouthWidth = diffuserWidth;
  const mouthDepth = diffuserHeight;
  
  // Generate LED base circle points
  const ledPoints: Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const angleRad = (angle * Math.PI) / 180;
    ledPoints.push({
      x: ledRadius * Math.cos(theta),
      y: ledY + ledRadius * Math.sin(theta) * Math.cos(angleRad),
      z: ledZ + ledRadius * Math.sin(theta) * Math.sin(angleRad)
    });
  }
  
  // Generate mouth oval points
  const mouthPoints: Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const angleRad = (angle * Math.PI) / 180;
    mouthPoints.push({
      x: (mouthWidth / 2) * Math.cos(theta),
      y: mouthY + (mouthDepth / 2) * Math.sin(theta) * Math.cos(angleRad),
      z: mouthZ + (mouthDepth / 2) * Math.sin(theta) * Math.sin(angleRad)
    });
  }
  
  // Create hull surface between LED and mouth
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    
    // Outer surface
    triangles.push({
      normal: calcNormal(ledPoints[i], mouthPoints[i], ledPoints[next]),
      v1: ledPoints[i],
      v2: mouthPoints[i],
      v3: ledPoints[next]
    });
    
    triangles.push({
      normal: calcNormal(ledPoints[next], mouthPoints[i], mouthPoints[next]),
      v1: ledPoints[next],
      v2: mouthPoints[i],
      v3: mouthPoints[next]
    });
  }
  
  return triangles;
}

// Generate front housing with duckbill diffuser
export function generateCanvasGlowClipFront(settings: LEDHolderSettings): Triangle[] {
  const triangles: Triangle[] = [];
  
  const mountW = 20;
  const mountH = 25;
  const mountD = 5;
  const magnetDiameter = settings.magnetDiameter;
  const magnetDepth = settings.magnetDepth;
  const ledDiameter = settings.ledType === "5mm" ? 5.2 : 3.2;
  
  // Base plate
  const baseVerts = [
    { x: -mountW/2, y: 0, z: 0 },
    { x: mountW/2, y: 0, z: 0 },
    { x: mountW/2, y: mountD, z: 0 },
    { x: -mountW/2, y: mountD, z: 0 },
    { x: -mountW/2, y: 0, z: mountH },
    { x: mountW/2, y: 0, z: mountH },
    { x: mountW/2, y: mountD, z: mountH },
    { x: -mountW/2, y: mountD, z: mountH }
  ];
  
  // Front face
  triangles.push(
    { normal: { x: 0, y: -1, z: 0 }, v1: baseVerts[0], v2: baseVerts[1], v3: baseVerts[4] },
    { normal: { x: 0, y: -1, z: 0 }, v1: baseVerts[1], v2: baseVerts[5], v3: baseVerts[4] }
  );
  
  // Back face
  triangles.push(
    { normal: { x: 0, y: 1, z: 0 }, v1: baseVerts[2], v2: baseVerts[3], v3: baseVerts[6] },
    { normal: { x: 0, y: 1, z: 0 }, v1: baseVerts[3], v2: baseVerts[7], v3: baseVerts[6] }
  );
  
  // Left face
  triangles.push(
    { normal: { x: -1, y: 0, z: 0 }, v1: baseVerts[0], v2: baseVerts[4], v3: baseVerts[3] },
    { normal: { x: -1, y: 0, z: 0 }, v1: baseVerts[4], v2: baseVerts[7], v3: baseVerts[3] }
  );
  
  // Right face
  triangles.push(
    { normal: { x: 1, y: 0, z: 0 }, v1: baseVerts[1], v2: baseVerts[2], v3: baseVerts[5] },
    { normal: { x: 1, y: 0, z: 0 }, v1: baseVerts[2], v2: baseVerts[6], v3: baseVerts[5] }
  );
  
  // Bottom face
  triangles.push(
    { normal: { x: 0, y: 0, z: -1 }, v1: baseVerts[0], v2: baseVerts[3], v3: baseVerts[1] },
    { normal: { x: 0, y: 0, z: -1 }, v1: baseVerts[3], v2: baseVerts[2], v3: baseVerts[1] }
  );
  
  // Top face
  triangles.push(
    { normal: { x: 0, y: 0, z: 1 }, v1: baseVerts[4], v2: baseVerts[5], v3: baseVerts[7] },
    { normal: { x: 0, y: 0, z: 1 }, v1: baseVerts[5], v2: baseVerts[6], v3: baseVerts[7] }
  );
  
  // Add duckbill diffuser
  const duckbillTriangles = generateDuckbillDiffuser(10, 30, 10, 45);
  triangles.push(...duckbillTriangles);
  
  console.log(`[Canvas Glow-Clip Front] Generated ${triangles.length} triangles`);
  
  return triangles;
}

// Generate back plate for canvas mounting
export function generateCanvasGlowClipBack(settings: LEDHolderSettings): Triangle[] {
  const triangles: Triangle[] = [];
  
  const mountW = 20;
  const mountH = 25;
  const mountD = 5;
  const magnetDiameter = settings.magnetDiameter;
  
  // Simple back plate with magnet hole
  const baseVerts = [
    { x: -mountW/2, y: 0, z: 0 },
    { x: mountW/2, y: 0, z: 0 },
    { x: mountW/2, y: mountD, z: 0 },
    { x: -mountW/2, y: mountD, z: 0 },
    { x: -mountW/2, y: 0, z: mountH },
    { x: mountW/2, y: 0, z: mountH },
    { x: mountW/2, y: mountD, z: mountH },
    { x: -mountW/2, y: mountD, z: mountH }
  ];
  
  // All 6 faces of the box
  triangles.push(
    { normal: { x: 0, y: -1, z: 0 }, v1: baseVerts[0], v2: baseVerts[1], v3: baseVerts[4] },
    { normal: { x: 0, y: -1, z: 0 }, v1: baseVerts[1], v2: baseVerts[5], v3: baseVerts[4] },
    { normal: { x: 0, y: 1, z: 0 }, v1: baseVerts[2], v2: baseVerts[3], v3: baseVerts[6] },
    { normal: { x: 0, y: 1, z: 0 }, v1: baseVerts[3], v2: baseVerts[7], v3: baseVerts[6] },
    { normal: { x: -1, y: 0, z: 0 }, v1: baseVerts[0], v2: baseVerts[4], v3: baseVerts[3] },
    { normal: { x: -1, y: 0, z: 0 }, v1: baseVerts[4], v2: baseVerts[7], v3: baseVerts[3] },
    { normal: { x: 1, y: 0, z: 0 }, v1: baseVerts[1], v2: baseVerts[2], v3: baseVerts[5] },
    { normal: { x: 1, y: 0, z: 0 }, v1: baseVerts[2], v2: baseVerts[6], v3: baseVerts[5] },
    { normal: { x: 0, y: 0, z: -1 }, v1: baseVerts[0], v2: baseVerts[3], v3: baseVerts[1] },
    { normal: { x: 0, y: 0, z: -1 }, v1: baseVerts[3], v2: baseVerts[2], v3: baseVerts[1] },
    { normal: { x: 0, y: 0, z: 1 }, v1: baseVerts[4], v2: baseVerts[5], v3: baseVerts[7] },
    { normal: { x: 0, y: 0, z: 1 }, v1: baseVerts[5], v2: baseVerts[6], v3: baseVerts[7] }
  );
  
  console.log(`[Canvas Glow-Clip Back] Generated ${triangles.length} triangles`);
  
  return triangles;
}

// Export STL format
export function trianglesToSTL(triangles: Triangle[]): string {
  let stl = "solid canvas_glow_clip\n";
  
  for (const tri of triangles) {
    stl += `  facet normal ${tri.normal.x} ${tri.normal.y} ${tri.normal.z}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${tri.v1.x} ${tri.v1.y} ${tri.v1.z}\n`;
    stl += `      vertex ${tri.v2.x} ${tri.v2.y} ${tri.v2.z}\n`;
    stl += `      vertex ${tri.v3.x} ${tri.v3.y} ${tri.v3.z}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }
  
  stl += "endsolid canvas_glow_clip\n";
  return stl;
}
