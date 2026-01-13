// STL Generator V2 - Proper swept tube geometry using Hershey single-stroke fonts
// This creates watertight meshes suitable for 3D printing
// Unlike regular fonts (which define filled outlines), Hershey fonts define STROKE PATHS
// which is exactly what neon signs need

import type { LetterSettings, TubeSettings, TwoPartSystem, SketchPath } from "@shared/schema";
import { defaultTwoPartSystem } from "@shared/schema";
import { getTextStrokePaths, interpolatePath } from "./hershey-fonts";

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

export interface ExportedPart {
  filename: string;
  content: Buffer;
  partType: string;
  material: string;
}

// Vector math utilities
function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 0.0001) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function sub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

// Generate a circle of points perpendicular to a direction using parallel transport
function generateCircleRing(
  center: Vector3,
  tangent: Vector3,
  normal: Vector3,
  radius: number,
  segments: number
): Vector3[] {
  const binormal = cross(tangent, normal);
  const points: Vector3[] = [];
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    points.push({
      x: center.x + (normal.x * cos + binormal.x * sin) * radius,
      y: center.y + (normal.y * cos + binormal.y * sin) * radius,
      z: center.z + (normal.z * cos + binormal.z * sin) * radius
    });
  }
  
  return points;
}

// Create a swept tube along a path using parallel transport frame
// This produces watertight meshes with shared vertices between rings
function createSweptTube(
  path: number[][],  // Array of [x, y] points
  tubeRadius: number,
  segments: number = 12,
  zOffset: number = 0
): Triangle[] {
  const triangles: Triangle[] = [];
  
  if (path.length < 2) return triangles;
  
  // Convert 2D path to 3D (on XY plane at z=zOffset)
  const path3D: Vector3[] = path.map(([x, y]) => ({ x, y, z: zOffset }));
  
  const rings: Vector3[][] = [];
  
  // Initialize reference frame - perpendicular to first tangent
  let prevNormal: Vector3 = { x: 0, y: 0, z: 1 };
  
  for (let i = 0; i < path3D.length; i++) {
    const p = path3D[i];
    
    // Calculate tangent direction
    let tangent: Vector3;
    if (i === 0) {
      tangent = normalize(sub(path3D[1], path3D[0]));
    } else if (i === path3D.length - 1) {
      tangent = normalize(sub(path3D[i], path3D[i - 1]));
    } else {
      // Smooth tangent using neighbors
      const t1 = normalize(sub(path3D[i], path3D[i - 1]));
      const t2 = normalize(sub(path3D[i + 1], path3D[i]));
      tangent = normalize(add(t1, t2));
    }
    
    // Parallel transport: project previous normal onto plane perpendicular to tangent
    const projection = scale(tangent, dot(prevNormal, tangent));
    let normal = sub(prevNormal, projection);
    
    const normalLen = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (normalLen < 0.0001) {
      // Pick arbitrary perpendicular if degenerate
      if (Math.abs(tangent.z) < 0.9) {
        normal = normalize(cross(tangent, { x: 0, y: 0, z: 1 }));
      } else {
        normal = normalize(cross(tangent, { x: 1, y: 0, z: 0 }));
      }
    } else {
      normal = scale(normal, 1 / normalLen);
    }
    
    prevNormal = normal;
    
    // Generate ring at this point
    const ring = generateCircleRing(p, tangent, normal, tubeRadius, segments);
    rings.push(ring);
  }
  
  if (rings.length < 2) return triangles;
  
  // Connect adjacent rings with triangles
  for (let i = 0; i < rings.length - 1; i++) {
    const ring1 = rings[i];
    const ring2 = rings[i + 1];
    
    for (let j = 0; j < segments; j++) {
      const j1 = (j + 1) % segments;
      
      const v1 = ring1[j];
      const v2 = ring1[j1];
      const v3 = ring2[j];
      const v4 = ring2[j1];
      
      // Two triangles per quad
      triangles.push({
        normal: calcNormal(v1, v3, v2),
        v1: v1,
        v2: v3,
        v3: v2
      });
      triangles.push({
        normal: calcNormal(v2, v3, v4),
        v1: v2,
        v2: v3,
        v3: v4
      });
    }
  }
  
  // Cap the start (disk facing backward)
  const firstRing = rings[0];
  const firstCenter = path3D[0];
  
  for (let j = 0; j < segments; j++) {
    const j1 = (j + 1) % segments;
    triangles.push({
      normal: { x: 0, y: 0, z: -1 }, // Will be recalculated
      v1: firstCenter,
      v2: firstRing[j1],
      v3: firstRing[j]
    });
  }
  
  // Cap the end (disk facing forward)
  const lastRing = rings[rings.length - 1];
  const lastCenter = path3D[path3D.length - 1];
  
  for (let j = 0; j < segments; j++) {
    const j1 = (j + 1) % segments;
    triangles.push({
      normal: { x: 0, y: 0, z: 1 }, // Will be recalculated
      v1: lastCenter,
      v2: lastRing[j],
      v3: lastRing[j1]
    });
  }
  
  return triangles;
}

function calcNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const ax = v2.x - v1.x, ay = v2.y - v1.y, az = v2.z - v1.z;
  const bx = v3.x - v1.x, by = v3.y - v1.y, bz = v3.z - v1.z;
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < 0.0001) return { x: 0, y: 0, z: 1 };
  return { x: nx / len, y: ny / len, z: nz / len };
}

function trianglesToSTL(triangles: Triangle[], name: string = "SignCraft"): Buffer {
  const headerSize = 80;
  const triangleCountSize = 4;
  const triangleSize = 50;
  const bufferSize = headerSize + triangleCountSize + triangles.length * triangleSize;
  
  const buffer = Buffer.alloc(bufferSize);
  
  const header = `STL Export - ${name}`.padEnd(80, ' ');
  buffer.write(header, 0, 80, 'ascii');
  buffer.writeUInt32LE(triangles.length, 80);
  
  let offset = 84;
  for (const tri of triangles) {
    // Recalculate normal for accuracy
    const normal = calcNormal(tri.v1, tri.v2, tri.v3);
    
    buffer.writeFloatLE(normal.x, offset); offset += 4;
    buffer.writeFloatLE(normal.y, offset); offset += 4;
    buffer.writeFloatLE(normal.z, offset); offset += 4;
    
    buffer.writeFloatLE(tri.v1.x, offset); offset += 4;
    buffer.writeFloatLE(tri.v1.y, offset); offset += 4;
    buffer.writeFloatLE(tri.v1.z, offset); offset += 4;
    
    buffer.writeFloatLE(tri.v2.x, offset); offset += 4;
    buffer.writeFloatLE(tri.v2.y, offset); offset += 4;
    buffer.writeFloatLE(tri.v2.z, offset); offset += 4;
    
    buffer.writeFloatLE(tri.v3.x, offset); offset += 4;
    buffer.writeFloatLE(tri.v3.y, offset); offset += 4;
    buffer.writeFloatLE(tri.v3.z, offset); offset += 4;
    
    buffer.writeUInt16LE(0, offset); offset += 2;
  }
  
  return buffer;
}

export function generateNeonSignV2(
  letterSettings: LetterSettings,
  tubeSettings: TubeSettings,
  twoPartSystem: TwoPartSystem = defaultTwoPartSystem,
  format: "stl" | "obj" = "stl",
  sketchPaths: SketchPath[] = [],
  inputMode: "text" | "draw" | "image" = "text"
): ExportedPart[] {
  const tubeRadius = (tubeSettings.neonTubeDiameter || 12) / 2;
  const tubeSegments = 16; // Smooth circular cross-section
  let allTriangles: Triangle[] = [];
  let fileSlug = "neon_sign";
  
  if (inputMode === "draw" || inputMode === "image") {
    // Use sketch paths directly
    for (const sketch of sketchPaths) {
      if (sketch.points.length < 2) continue;
      
      const path2D: number[][] = sketch.points.map(p => [p.x, p.y]);
      
      // Interpolate for smoothness
      const smoothPath = interpolatePath(path2D, tubeRadius * 0.5);
      
      allTriangles.push(...createSweptTube(smoothPath, tubeRadius, tubeSegments, tubeRadius));
    }
    fileSlug = inputMode === "draw" ? "freehand" : "traced";
  } else {
    // Use Hershey single-stroke fonts
    const text = letterSettings.text || "A";
    const fontSize = 50 * letterSettings.scale;
    
    // Get stroke paths from Hershey font
    const { paths, totalWidth, height } = getTextStrokePaths(
      text,
      fontSize,
      fontSize * 0.12 // Letter spacing
    );
    
    // Center the text
    const centerX = totalWidth / 2;
    const centerY = height / 2;
    
    for (const path of paths) {
      if (path.length < 2) continue;
      
      // Center and flip Y (Hershey uses Y-down)
      const centeredPath: number[][] = path.map(([x, y]) => [
        x - centerX,
        centerY - y
      ]);
      
      // Interpolate for smoothness
      const smoothPath = interpolatePath(centeredPath, tubeRadius * 0.5);
      
      allTriangles.push(...createSweptTube(smoothPath, tubeRadius, tubeSegments, tubeRadius));
    }
    
    fileSlug = text.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
  }
  
  if (allTriangles.length === 0) {
    return [];
  }
  
  const content = trianglesToSTL(allTriangles, `${fileSlug} Neon Sign`);
  
  return [{
    filename: `${fileSlug}_neon.stl`,
    content,
    partType: "neon_tube",
    material: "diffuser"
  }];
}
