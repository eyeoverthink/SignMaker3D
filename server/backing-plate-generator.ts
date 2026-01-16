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

// Generate a hexagonal plate for modular LED panels
function generateHexagonPlate(size: number, thickness: number): Triangle[] {
  const triangles: Triangle[] = [];
  const t = thickness / 2;
  const radius = size / 2;
  
  // Calculate hexagon vertices (flat-top orientation)
  const vertices: Array<{x: number, y: number}> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
    vertices.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  
  // Top face - triangulate from center
  for (let i = 0; i < 6; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 6];
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: { x: 0, y: 0, z: t },
      v2: { x: v1.x, y: v1.y, z: t },
      v3: { x: v2.x, y: v2.y, z: t }
    });
  }
  
  // Bottom face - triangulate from center (reversed winding)
  for (let i = 0; i < 6; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 6];
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: { x: 0, y: 0, z: -t },
      v2: { x: v2.x, y: v2.y, z: -t },
      v3: { x: v1.x, y: v1.y, z: -t }
    });
  }
  
  // Side walls
  for (let i = 0; i < 6; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 6];
    
    // Calculate outward normal for this edge
    const edgeMidX = (v1.x + v2.x) / 2;
    const edgeMidY = (v1.y + v2.y) / 2;
    const normal = normalize({ x: edgeMidX, y: edgeMidY, z: 0 });
    
    triangles.push(
      {
        normal,
        v1: { x: v1.x, y: v1.y, z: -t },
        v2: { x: v1.x, y: v1.y, z: t },
        v3: { x: v2.x, y: v2.y, z: t }
      },
      {
        normal,
        v1: { x: v1.x, y: v1.y, z: -t },
        v2: { x: v2.x, y: v2.y, z: t },
        v3: { x: v2.x, y: v2.y, z: -t }
      }
    );
  }
  
  return triangles;
}

// Generate a cylinder for holes - creates inner wall only (hole is cut from plate faces)
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
    
    // Normal points inward (toward hole center)
    const nx = -Math.cos((angle1 + angle2) / 2);
    const ny = -Math.sin((angle1 + angle2) / 2);
    
    // Inner wall of hole (inverted normals so they point inward)
    triangles.push(
      { 
        normal: { x: nx, y: ny, z: 0 }, 
        v1: { x: x1, y: y1, z: -t }, 
        v2: { x: x2, y: y2, z: t }, 
        v3: { x: x1, y: y1, z: t } 
      },
      { 
        normal: { x: nx, y: ny, z: 0 }, 
        v1: { x: x1, y: y1, z: -t }, 
        v2: { x: x2, y: y2, z: -t }, 
        v3: { x: x2, y: y2, z: t } 
      }
    );
  }
  
  return triangles;
}

// Check if a point is inside any hole
function isPointInHole(px: number, py: number, holes: Array<{x: number, y: number, radius: number}>): boolean {
  for (const hole of holes) {
    const dx = px - hole.x;
    const dy = py - hole.y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= hole.radius * hole.radius) {
      return true;
    }
  }
  return false;
}

// Generate plate with holes properly cut through
function generatePlateWithHoles(
  width: number, 
  height: number, 
  thickness: number, 
  holes: Array<{x: number, y: number, radius: number}>,
  segments: number = 32
): Triangle[] {
  const triangles: Triangle[] = [];
  const w = width / 2;
  const h = height / 2;
  const t = thickness / 2;
  
  // If no holes, generate simple box
  if (holes.length === 0) {
    return generatePlate(width, height, thickness);
  }
  
  // Generate top and bottom faces with triangulation that avoids holes
  // For simplicity, we'll create a grid and skip triangles that intersect holes
  const gridSize = Math.max(width, height) / segments;
  
  for (let gx = -w; gx < w; gx += gridSize) {
    for (let gy = -h; gy < h; gy += gridSize) {
      const x1 = Math.max(-w, gx);
      const y1 = Math.max(-h, gy);
      const x2 = Math.min(w, gx + gridSize);
      const y2 = Math.min(h, gy + gridSize);
      
      // Check if quad corners are outside all holes
      const corners = [
        {x: x1, y: y1}, {x: x2, y: y1},
        {x: x2, y: y2}, {x: x1, y: y2}
      ];
      
      const allCornersValid = corners.every(c => !isPointInHole(c.x, c.y, holes));
      
      if (allCornersValid) {
        // Top face
        triangles.push(
          { normal: { x: 0, y: 0, z: 1 }, v1: { x: x1, y: y1, z: t }, v2: { x: x2, y: y1, z: t }, v3: { x: x2, y: y2, z: t } },
          { normal: { x: 0, y: 0, z: 1 }, v1: { x: x1, y: y1, z: t }, v2: { x: x2, y: y2, z: t }, v3: { x: x1, y: y2, z: t } }
        );
        
        // Bottom face
        triangles.push(
          { normal: { x: 0, y: 0, z: -1 }, v1: { x: x1, y: y1, z: -t }, v2: { x: x2, y: y2, z: -t }, v3: { x: x2, y: y1, z: -t } },
          { normal: { x: 0, y: 0, z: -1 }, v1: { x: x1, y: y1, z: -t }, v2: { x: x1, y: y2, z: -t }, v3: { x: x2, y: y2, z: -t } }
        );
      }
    }
  }
  
  // Add side walls
  triangles.push(
    { normal: { x: 0, y: 1, z: 0 }, v1: { x: -w, y: h, z: -t }, v2: { x: w, y: h, z: -t }, v3: { x: w, y: h, z: t } },
    { normal: { x: 0, y: 1, z: 0 }, v1: { x: -w, y: h, z: -t }, v2: { x: w, y: h, z: t }, v3: { x: -w, y: h, z: t } },
    { normal: { x: 0, y: -1, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: w, y: -h, z: t }, v3: { x: w, y: -h, z: -t } },
    { normal: { x: 0, y: -1, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: -h, z: t }, v3: { x: w, y: -h, z: t } },
    { normal: { x: -1, y: 0, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: h, z: -t }, v3: { x: -w, y: h, z: t } },
    { normal: { x: -1, y: 0, z: 0 }, v1: { x: -w, y: -h, z: -t }, v2: { x: -w, y: h, z: t }, v3: { x: -w, y: -h, z: t } },
    { normal: { x: 1, y: 0, z: 0 }, v1: { x: w, y: -h, z: -t }, v2: { x: w, y: h, z: t }, v3: { x: w, y: h, z: -t } },
    { normal: { x: 1, y: 0, z: 0 }, v1: { x: w, y: -h, z: -t }, v2: { x: w, y: -h, z: t }, v3: { x: w, y: h, z: t } }
  );
  
  return triangles;
}

export function generateBackingPlate(settings: BackingPlateSettings): Buffer {
  const { shape, width, height, thickness, cornerRadius, holePattern, holeDiameter, holeInset, gridSpacing } = settings;
  
  console.log(`[Backing Plate] Generating ${shape} ${width}x${height}mm plate, thickness ${thickness}mm`);
  
  let triangles: Triangle[] = [];
  
  // Calculate hole positions first
  const holePositions: [number, number][] = [];
  const w = width / 2;
  const h = height / 2;
  
  if (holePattern === "corners") {
    holePositions.push(
      [-w + holeInset, h - holeInset],
      [w - holeInset, h - holeInset],
      [-w + holeInset, -h + holeInset],
      [w - holeInset, -h + holeInset]
    );
  } else if (holePattern === "grid") {
    for (let x = -w + holeInset; x <= w - holeInset; x += gridSpacing) {
      for (let y = -h + holeInset; y <= h - holeInset; y += gridSpacing) {
        holePositions.push([x, y]);
      }
    }
  } else if (holePattern === "perimeter") {
    // Top and bottom edges
    for (let x = -w + holeInset; x <= w - holeInset; x += gridSpacing) {
      holePositions.push([x, h - holeInset]);
      holePositions.push([x, -h + holeInset]);
    }
    // Left and right edges
    for (let y = -h + holeInset + gridSpacing; y <= h - holeInset - gridSpacing; y += gridSpacing) {
      holePositions.push([-w + holeInset, y]);
      holePositions.push([w - holeInset, y]);
    }
  }
  
  const holeRadius = holeDiameter / 2;
  const holes = holePositions.map(([x, y]) => ({ x, y, radius: holeRadius }));
  
  // Generate main plate based on shape with holes cut through
  if (shape === "circle") {
    const diameter = Math.max(width, height);
    triangles.push(...generateCirclePlate(diameter, thickness));
    // Add hole cylinders for circle (simple approach - holes not cut from faces)
    for (const hole of holes) {
      triangles.push(...generateHole(hole.x, hole.y, hole.radius, thickness));
    }
  } else if (shape === "hexagon") {
    const size = Math.max(width, height);
    triangles.push(...generateHexagonPlate(size, thickness));
    // Add hole cylinders for hexagon
    for (const hole of holes) {
      triangles.push(...generateHole(hole.x, hole.y, hole.radius, thickness));
    }
  } else if (shape === "square") {
    const size = Math.max(width, height);
    triangles.push(...generatePlateWithHoles(size, size, thickness, holes));
    // Add hole cylinders
    for (const hole of holes) {
      triangles.push(...generateHole(hole.x, hole.y, hole.radius, thickness));
    }
  } else {
    // rectangle, rounded-rect, custom - all use rectangular base
    triangles.push(...generatePlateWithHoles(width, height, thickness, holes));
    // Add hole cylinders
    for (const hole of holes) {
      triangles.push(...generateHole(hole.x, hole.y, hole.radius, thickness));
    }
  }
  
  console.log(`[Backing Plate] Generated ${triangles.length} triangles with ${holes.length} holes`);
  
  return trianglesToSTL(triangles, `${width}x${height}mm`);
}
