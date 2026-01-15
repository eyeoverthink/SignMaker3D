// Backing Plate Generator - Creates mounting plates with holes for neon signs

import type { BackingPlateSettings } from "@shared/schema";

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

function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 0.0001) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function trianglesToSTL(triangles: Triangle[], name: string): Buffer {
  const header = Buffer.alloc(80);
  header.write(`Backing Plate - ${name}`, 0, "ascii");
  
  const countBuffer = Buffer.alloc(4);
  countBuffer.writeUInt32LE(triangles.length, 0);
  
  const triangleBuffers: Buffer[] = [];
  
  for (const tri of triangles) {
    const buf = Buffer.alloc(50);
    let offset = 0;
    
    // Normal
    buf.writeFloatLE(tri.normal.x, offset); offset += 4;
    buf.writeFloatLE(tri.normal.y, offset); offset += 4;
    buf.writeFloatLE(tri.normal.z, offset); offset += 4;
    
    // Vertex 1
    buf.writeFloatLE(tri.v1.x, offset); offset += 4;
    buf.writeFloatLE(tri.v1.y, offset); offset += 4;
    buf.writeFloatLE(tri.v1.z, offset); offset += 4;
    
    // Vertex 2
    buf.writeFloatLE(tri.v2.x, offset); offset += 4;
    buf.writeFloatLE(tri.v2.y, offset); offset += 4;
    buf.writeFloatLE(tri.v2.z, offset); offset += 4;
    
    // Vertex 3
    buf.writeFloatLE(tri.v3.x, offset); offset += 4;
    buf.writeFloatLE(tri.v3.y, offset); offset += 4;
    buf.writeFloatLE(tri.v3.z, offset); offset += 4;
    
    // Attribute byte count (unused)
    buf.writeUInt16LE(0, offset);
    
    triangleBuffers.push(buf);
  }
  
  return Buffer.concat([header, countBuffer, ...triangleBuffers]);
}

// Generate a rectangular plate (always creates a box, cornerRadius handled by shape selection)
function generatePlate(width: number, height: number, thickness: number): Triangle[] {
  const triangles: Triangle[] = [];
  const w = width / 2;
  const h = height / 2;
  const t = thickness / 2;
  
  // Top face
  triangles.push(
    { normal: { x: 0, y: 0, z: 1 }, v1: { x: -w, y: -h, z: t }, v2: { x: w, y: -h, z: t }, v3: { x: w, y: h, z: t } },
    { normal: { x: 0, y: 0, z: 1 }, v1: { x: -w, y: -h, z: t }, v2: { x: w, y: h, z: t }, v3: { x: -w, y: h, z: t } }
  );
  
  // Bottom face
  triangles.push(
    { normal: { x: 0, y: 0, z: -1 }, v1: { x: -w, y: -h, z: -t }, v2: { x: w, y: h, z: -t }, v3: { x: w, y: -h, z: -t } },
    { normal: { x: 0, y: 0, z: -1 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: h, z: -t }, v3: { x: w, y: h, z: -t } }
  );
  
  // Front face
  triangles.push(
    { normal: { x: 0, y: 1, z: 0 }, v1: { x: -w, y: h, z: -t }, v2: { x: w, y: h, z: -t }, v3: { x: w, y: h, z: t } },
    { normal: { x: 0, y: 1, z: 0 }, v1: { x: -w, y: h, z: -t }, v2: { x: w, y: h, z: t }, v3: { x: -w, y: h, z: t } }
  );
  
  // Back face
  triangles.push(
    { normal: { x: 0, y: -1, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: w, y: -h, z: t }, v3: { x: w, y: -h, z: -t } },
    { normal: { x: 0, y: -1, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: -h, z: t }, v3: { x: w, y: -h, z: t } }
  );
  
  // Left face
  triangles.push(
    { normal: { x: -1, y: 0, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: h, z: -t }, v3: { x: -w, y: h, z: t } },
    { normal: { x: -1, y: 0, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: h, z: t }, v3: { x: -w, y: -h, z: t } }
  );
  
  // Right face
  triangles.push(
    { normal: { x: 1, y: 0, z: 0 }, v1: { x: w, y: -h, z: -t }, v2: { x: w, y: h, z: t }, v3: { x: w, y: h, z: -t } },
    { normal: { x: 1, y: 0, z: 0 }, v1: { x: w, y: -h, z: -t }, v2: { x: w, y: -h, z: t }, v3: { x: w, y: h, z: t } }
  );
  
  return triangles;
}

// Generate a circular plate
function generateCirclePlate(diameter: number, thickness: number, segments: number = 32): Triangle[] {
  const triangles: Triangle[] = [];
  const radius = diameter / 2;
  const t = thickness / 2;
  
  // Top and bottom faces
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;
    
    // Top face
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: { x: 0, y: 0, z: t },
      v2: { x: x1, y: y1, z: t },
      v3: { x: x2, y: y2, z: t }
    });
    
    // Bottom face
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: { x: 0, y: 0, z: -t },
      v2: { x: x2, y: y2, z: -t },
      v3: { x: x1, y: y1, z: -t }
    });
    
    // Side wall
    const nx = Math.cos((angle1 + angle2) / 2);
    const ny = Math.sin((angle1 + angle2) / 2);
    
    triangles.push(
      {
        normal: { x: nx, y: ny, z: 0 },
        v1: { x: x1, y: y1, z: -t },
        v2: { x: x1, y: y1, z: t },
        v3: { x: x2, y: y2, z: t }
      },
      {
        normal: { x: nx, y: ny, z: 0 },
        v1: { x: x1, y: y1, z: -t },
        v2: { x: x2, y: y2, z: t },
        v3: { x: x2, y: y2, z: -t }
      }
    );
  }
  
  return triangles;
}

// Generate a cylinder for holes
function generateHole(x: number, y: number, radius: number, thickness: number, segments: number = 16): Triangle[] {
  const triangles: Triangle[] = [];
  const t = thickness / 2;
  
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const x1 = x + Math.cos(angle1) * radius;
    const y1 = y + Math.sin(angle1) * radius;
    const x2 = x + Math.cos(angle2) * radius;
    const y2 = y + Math.sin(angle2) * radius;
    
    const nx1 = Math.cos(angle1);
    const ny1 = Math.sin(angle1);
    const nx2 = Math.cos(angle2);
    const ny2 = Math.sin(angle2);
    
    // Outer wall of hole
    triangles.push(
      { 
        normal: { x: nx1, y: ny1, z: 0 }, 
        v1: { x: x1, y: y1, z: -t }, 
        v2: { x: x1, y: y1, z: t }, 
        v3: { x: x2, y: y2, z: t } 
      },
      { 
        normal: { x: nx2, y: ny2, z: 0 }, 
        v1: { x: x1, y: y1, z: -t }, 
        v2: { x: x2, y: y2, z: t }, 
        v3: { x: x2, y: y2, z: -t } 
      }
    );
  }
  
  return triangles;
}

export function generateBackingPlate(settings: BackingPlateSettings): Buffer {
  const { shape, width, height, thickness, cornerRadius, holePattern, holeDiameter, holeInset, gridSpacing } = settings;
  
  console.log(`[Backing Plate] Generating ${shape} ${width}x${height}mm plate, thickness ${thickness}mm`);
  
  let triangles: Triangle[] = [];
  
  // Generate main plate based on shape
  if (shape === "circle") {
    const diameter = Math.max(width, height);
    triangles.push(...generateCirclePlate(diameter, thickness));
  } else if (shape === "square") {
    const size = Math.max(width, height);
    triangles.push(...generatePlate(size, size, thickness));
  } else {
    // rectangle, rounded-rect, custom - all use rectangular base
    triangles.push(...generatePlate(width, height, thickness));
  }
  
  // Calculate hole positions
  const holes: [number, number][] = [];
  const w = width / 2;
  const h = height / 2;
  
  if (holePattern === "corners") {
    holes.push(
      [-w + holeInset, h - holeInset],
      [w - holeInset, h - holeInset],
      [-w + holeInset, -h + holeInset],
      [w - holeInset, -h + holeInset]
    );
  } else if (holePattern === "grid") {
    for (let x = -w + holeInset; x <= w - holeInset; x += gridSpacing) {
      for (let y = -h + holeInset; y <= h - holeInset; y += gridSpacing) {
        holes.push([x, y]);
      }
    }
  } else if (holePattern === "perimeter") {
    // Top and bottom edges
    for (let x = -w + holeInset; x <= w - holeInset; x += gridSpacing) {
      holes.push([x, h - holeInset]);
      holes.push([x, -h + holeInset]);
    }
    // Left and right edges
    for (let y = -h + holeInset + gridSpacing; y <= h - holeInset - gridSpacing; y += gridSpacing) {
      holes.push([-w + holeInset, y]);
      holes.push([w - holeInset, y]);
    }
  }
  
  // Generate holes
  const holeRadius = holeDiameter / 2;
  for (const [x, y] of holes) {
    triangles.push(...generateHole(x, y, holeRadius, thickness));
  }
  
  console.log(`[Backing Plate] Generated ${triangles.length} triangles with ${holes.length} holes`);
  
  return trianglesToSTL(triangles, `${width}x${height}mm`);
}
