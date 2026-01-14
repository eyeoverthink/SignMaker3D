// STL Generator V2 - Proper swept tube geometry using stroke-based fonts
// This creates watertight meshes suitable for 3D printing
// Supports OTF/TTF fonts via opentype.js and Hershey single-stroke fonts

import type { LetterSettings, TubeSettings, TwoPartSystem, SketchPath } from "@shared/schema";
import { defaultTwoPartSystem } from "@shared/schema";
import { getTextStrokePaths, interpolatePath } from "./hershey-fonts";
import { getTextStrokePathsFromFont, isOTFFont } from "./font-loader";

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

// U-Channel profile for LED insertion
// Creates a U-shaped cross-section with walls and hollow interior
interface UChannelProfile {
  outerLeft: Vector3[];   // Outer left wall points
  innerLeft: Vector3[];   // Inner left wall points  
  outerRight: Vector3[];  // Outer right wall points
  innerRight: Vector3[];  // Inner right wall points
  bottom: Vector3[];      // Bottom floor points
}

function generateUChannelRing(
  center: Vector3,
  tangent: Vector3,
  normal: Vector3,
  channelWidth: number,
  wallThickness: number,
  wallHeight: number
): UChannelProfile {
  // For 2D paths on XY plane, we want:
  // - Width direction: perpendicular to tangent in XY plane
  // - Height direction: always +Z
  
  // Calculate perpendicular direction in XY plane
  const perpX = -tangent.y;
  const perpY = tangent.x;
  const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
  const perpNormX = perpLen > 0.001 ? perpX / perpLen : 1;
  const perpNormY = perpLen > 0.001 ? perpY / perpLen : 0;
  
  const halfWidth = channelWidth / 2;
  const innerHalfWidth = halfWidth - wallThickness;
  
  const outerLeft: Vector3[] = [];
  const innerLeft: Vector3[] = [];
  const outerRight: Vector3[] = [];
  const innerRight: Vector3[] = [];
  const bottom: Vector3[] = [];
  
  // Outer left edge (from floor to top of wall)
  // Left is negative perpendicular direction
  for (let h = 0; h <= 4; h++) {
    const zPos = center.z + (h / 4) * wallHeight;
    outerLeft.push({
      x: center.x + perpNormX * (-halfWidth),
      y: center.y + perpNormY * (-halfWidth),
      z: zPos
    });
  }
  
  // Inner left edge (from floor to top of wall)
  for (let h = 0; h <= 4; h++) {
    const zPos = center.z + (h / 4) * wallHeight;
    innerLeft.push({
      x: center.x + perpNormX * (-innerHalfWidth),
      y: center.y + perpNormY * (-innerHalfWidth),
      z: zPos
    });
  }
  
  // Outer right edge (from floor to top of wall)
  for (let h = 0; h <= 4; h++) {
    const zPos = center.z + (h / 4) * wallHeight;
    outerRight.push({
      x: center.x + perpNormX * halfWidth,
      y: center.y + perpNormY * halfWidth,
      z: zPos
    });
  }
  
  // Inner right edge (from floor to top of wall)
  for (let h = 0; h <= 4; h++) {
    const zPos = center.z + (h / 4) * wallHeight;
    innerRight.push({
      x: center.x + perpNormX * innerHalfWidth,
      y: center.y + perpNormY * innerHalfWidth,
      z: zPos
    });
  }
  
  // Bottom edge (from left to right at floor level)
  for (let w = 0; w <= 4; w++) {
    const offset = -halfWidth + (w / 4) * channelWidth;
    bottom.push({
      x: center.x + perpNormX * offset,
      y: center.y + perpNormY * offset,
      z: center.z
    });
  }
  
  return { outerLeft, innerLeft, outerRight, innerRight, bottom };
}

// Create a U-channel along a path (hollow channel for LED insertion)
// Structure: solid base plate + channel floor + U-shaped walls on top
function createUChannel(
  path: number[][],
  channelWidth: number,
  wallThickness: number,
  wallHeight: number,
  baseThickness: number = 3  // Solid base plate thickness
): Triangle[] {
  const triangles: Triangle[] = [];
  
  if (path.length < 2) return triangles;
  
  // Convert 2D path to 3D - channel floor starts at baseThickness
  const path3D: Vector3[] = path.map(([x, y]) => ({ x, y, z: baseThickness }));
  
  const profiles: UChannelProfile[] = [];
  let prevNormal: Vector3 = { x: 0, y: 0, z: 1 };
  
  for (let i = 0; i < path3D.length; i++) {
    const p = path3D[i];
    
    // Calculate tangent
    let tangent: Vector3;
    if (i === 0) {
      tangent = normalize(sub(path3D[1], path3D[0]));
    } else if (i === path3D.length - 1) {
      tangent = normalize(sub(path3D[i], path3D[i - 1]));
    } else {
      const t1 = normalize(sub(path3D[i], path3D[i - 1]));
      const t2 = normalize(sub(path3D[i + 1], path3D[i]));
      tangent = normalize(add(t1, t2));
    }
    
    // Parallel transport normal
    const projection = scale(tangent, dot(prevNormal, tangent));
    let normal = sub(prevNormal, projection);
    
    const normalLen = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (normalLen < 0.0001) {
      if (Math.abs(tangent.z) < 0.9) {
        normal = normalize(cross(tangent, { x: 0, y: 0, z: 1 }));
      } else {
        normal = normalize(cross(tangent, { x: 1, y: 0, z: 0 }));
      }
    } else {
      normal = scale(normal, 1 / normalLen);
    }
    
    prevNormal = normal;
    
    const profile = generateUChannelRing(p, tangent, normal, channelWidth, wallThickness, wallHeight);
    profiles.push(profile);
  }
  
  if (profiles.length < 2) return triangles;
  
  // Connect adjacent profiles
  for (let i = 0; i < profiles.length - 1; i++) {
    const p1 = profiles[i];
    const p2 = profiles[i + 1];
    
    // Left outer wall
    connectEdges(triangles, p1.outerLeft, p2.outerLeft, false);
    
    // Left inner wall
    connectEdges(triangles, p1.innerLeft, p2.innerLeft, true);
    
    // Right outer wall
    connectEdges(triangles, p1.outerRight, p2.outerRight, true);
    
    // Right inner wall
    connectEdges(triangles, p1.innerRight, p2.innerRight, false);
    
    // Bottom outer surface
    connectEdges(triangles, p1.bottom, p2.bottom, false);
    
    // Left wall top cap (connects outer to inner at top)
    const leftTopOuter1 = p1.outerLeft[p1.outerLeft.length - 1];
    const leftTopInner1 = p1.innerLeft[p1.innerLeft.length - 1];
    const leftTopOuter2 = p2.outerLeft[p2.outerLeft.length - 1];
    const leftTopInner2 = p2.innerLeft[p2.innerLeft.length - 1];
    
    triangles.push({
      normal: calcNormal(leftTopOuter1, leftTopInner1, leftTopOuter2),
      v1: leftTopOuter1, v2: leftTopInner1, v3: leftTopOuter2
    });
    triangles.push({
      normal: calcNormal(leftTopInner1, leftTopInner2, leftTopOuter2),
      v1: leftTopInner1, v2: leftTopInner2, v3: leftTopOuter2
    });
    
    // Right wall top cap
    const rightTopOuter1 = p1.outerRight[p1.outerRight.length - 1];
    const rightTopInner1 = p1.innerRight[p1.innerRight.length - 1];
    const rightTopOuter2 = p2.outerRight[p2.outerRight.length - 1];
    const rightTopInner2 = p2.innerRight[p2.innerRight.length - 1];
    
    triangles.push({
      normal: calcNormal(rightTopOuter1, rightTopOuter2, rightTopInner1),
      v1: rightTopOuter1, v2: rightTopOuter2, v3: rightTopInner1
    });
    triangles.push({
      normal: calcNormal(rightTopInner1, rightTopOuter2, rightTopInner2),
      v1: rightTopInner1, v2: rightTopOuter2, v3: rightTopInner2
    });
    
    // Inner bottom (floor of the channel)
    const innerBottomLeft1 = p1.innerLeft[0];
    const innerBottomRight1 = p1.innerRight[0];
    const innerBottomLeft2 = p2.innerLeft[0];
    const innerBottomRight2 = p2.innerRight[0];
    
    triangles.push({
      normal: calcNormal(innerBottomLeft1, innerBottomLeft2, innerBottomRight1),
      v1: innerBottomLeft1, v2: innerBottomLeft2, v3: innerBottomRight1
    });
    triangles.push({
      normal: calcNormal(innerBottomRight1, innerBottomLeft2, innerBottomRight2),
      v1: innerBottomRight1, v2: innerBottomLeft2, v3: innerBottomRight2
    });
  }
  
  // End caps
  capUChannel(triangles, profiles[0], true);  // Start cap
  capUChannel(triangles, profiles[profiles.length - 1], false);  // End cap
  
  // Generate base plate if baseThickness > 0
  if (baseThickness > 0) {
    generateBasePlate(triangles, profiles, baseThickness, channelWidth);
  }
  
  return triangles;
}

// Generate solid base plate underneath the U-channel
function generateBasePlate(
  triangles: Triangle[],
  profiles: UChannelProfile[],
  baseThickness: number,
  channelWidth: number
) {
  // The base plate extends from Z=0 to the channel floor
  // It follows the outer edges of the channel
  
  for (let i = 0; i < profiles.length - 1; i++) {
    const p1 = profiles[i];
    const p2 = profiles[i + 1];
    
    // Get outer bottom corners at channel floor level
    const topLeft1 = p1.outerLeft[0];
    const topRight1 = p1.outerRight[0];
    const topLeft2 = p2.outerLeft[0];
    const topRight2 = p2.outerRight[0];
    
    // Create corresponding points at Z=0 (base bottom)
    const bottomLeft1: Vector3 = { x: topLeft1.x, y: topLeft1.y, z: 0 };
    const bottomRight1: Vector3 = { x: topRight1.x, y: topRight1.y, z: 0 };
    const bottomLeft2: Vector3 = { x: topLeft2.x, y: topLeft2.y, z: 0 };
    const bottomRight2: Vector3 = { x: topRight2.x, y: topRight2.y, z: 0 };
    
    // Bottom face of base plate (at Z=0, facing down)
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: bottomLeft1, v2: bottomRight1, v3: bottomLeft2
    });
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: bottomRight1, v2: bottomRight2, v3: bottomLeft2
    });
    
    // Left side of base plate (connects top-left to bottom-left)
    triangles.push({
      normal: calcNormal(topLeft1, bottomLeft1, topLeft2),
      v1: topLeft1, v2: bottomLeft1, v3: topLeft2
    });
    triangles.push({
      normal: calcNormal(bottomLeft1, bottomLeft2, topLeft2),
      v1: bottomLeft1, v2: bottomLeft2, v3: topLeft2
    });
    
    // Right side of base plate (connects top-right to bottom-right)
    triangles.push({
      normal: calcNormal(topRight1, topRight2, bottomRight1),
      v1: topRight1, v2: topRight2, v3: bottomRight1
    });
    triangles.push({
      normal: calcNormal(bottomRight1, topRight2, bottomRight2),
      v1: bottomRight1, v2: topRight2, v3: bottomRight2
    });
  }
  
  // End caps for base plate
  const firstProfile = profiles[0];
  const lastProfile = profiles[profiles.length - 1];
  
  // Start cap of base plate
  const startTopLeft = firstProfile.outerLeft[0];
  const startTopRight = firstProfile.outerRight[0];
  const startBottomLeft: Vector3 = { x: startTopLeft.x, y: startTopLeft.y, z: 0 };
  const startBottomRight: Vector3 = { x: startTopRight.x, y: startTopRight.y, z: 0 };
  
  // Start cap facing backward
  triangles.push({
    normal: calcNormal(startTopLeft, startTopRight, startBottomLeft),
    v1: startTopLeft, v2: startTopRight, v3: startBottomLeft
  });
  triangles.push({
    normal: calcNormal(startBottomLeft, startTopRight, startBottomRight),
    v1: startBottomLeft, v2: startTopRight, v3: startBottomRight
  });
  
  // End cap of base plate
  const endTopLeft = lastProfile.outerLeft[0];
  const endTopRight = lastProfile.outerRight[0];
  const endBottomLeft: Vector3 = { x: endTopLeft.x, y: endTopLeft.y, z: 0 };
  const endBottomRight: Vector3 = { x: endTopRight.x, y: endTopRight.y, z: 0 };
  
  // End cap facing forward
  triangles.push({
    normal: calcNormal(endTopLeft, endBottomLeft, endTopRight),
    v1: endTopLeft, v2: endBottomLeft, v3: endTopRight
  });
  triangles.push({
    normal: calcNormal(endBottomLeft, endBottomRight, endTopRight),
    v1: endBottomLeft, v2: endBottomRight, v3: endTopRight
  });
}

function connectEdges(triangles: Triangle[], edge1: Vector3[], edge2: Vector3[], reverse: boolean) {
  const len = Math.min(edge1.length, edge2.length);
  for (let i = 0; i < len - 1; i++) {
    if (reverse) {
      triangles.push({
        normal: calcNormal(edge1[i], edge2[i], edge1[i + 1]),
        v1: edge1[i], v2: edge2[i], v3: edge1[i + 1]
      });
      triangles.push({
        normal: calcNormal(edge1[i + 1], edge2[i], edge2[i + 1]),
        v1: edge1[i + 1], v2: edge2[i], v3: edge2[i + 1]
      });
    } else {
      triangles.push({
        normal: calcNormal(edge1[i], edge1[i + 1], edge2[i]),
        v1: edge1[i], v2: edge1[i + 1], v3: edge2[i]
      });
      triangles.push({
        normal: calcNormal(edge1[i + 1], edge2[i + 1], edge2[i]),
        v1: edge1[i + 1], v2: edge2[i + 1], v3: edge2[i]
      });
    }
  }
}

function capUChannel(triangles: Triangle[], profile: UChannelProfile, isStart: boolean) {
  // Create end caps for the U-channel with consistent winding
  // isStart: cap faces backward (into path), isEnd: cap faces forward (out of path)
  
  const ol = profile.outerLeft;
  const il = profile.innerLeft;
  const or = profile.outerRight;
  const ir = profile.innerRight;
  
  // Helper to add a quad with proper winding based on direction
  // Start cap: normals point opposite to path direction (-tangent)
  // End cap: normals point along path direction (+tangent)
  function addQuad(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
    // Swap winding: start cap uses CW, end cap uses CCW (relative to outward normal)
    if (isStart) {
      // CW winding for start cap - normals point backward (-tangent)
      triangles.push({ normal: calcNormal(a, c, b), v1: a, v2: c, v3: b });
      triangles.push({ normal: calcNormal(a, d, c), v1: a, v2: d, v3: c });
    } else {
      // CCW winding for end cap - normals point forward (+tangent)
      triangles.push({ normal: calcNormal(a, b, c), v1: a, v2: b, v3: c });
      triangles.push({ normal: calcNormal(a, c, d), v1: a, v2: c, v3: d });
    }
  }
  
  // Left wall end cap - connect outer left edge to inner left edge
  for (let i = 0; i < ol.length - 1; i++) {
    addQuad(ol[i], il[i], il[i + 1], ol[i + 1]);
  }
  
  // Right wall end cap - connect outer right edge to inner right edge
  for (let i = 0; i < or.length - 1; i++) {
    addQuad(or[i], or[i + 1], ir[i + 1], ir[i]);
  }
  
  // Bottom end cap (connects bottom of left wall to bottom of right wall)
  const bottomLeft = ol[0];
  const bottomRight = or[0];
  const innerBottomLeft = il[0];
  const innerBottomRight = ir[0];
  
  addQuad(bottomLeft, bottomRight, innerBottomRight, innerBottomLeft);
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

// Mirror triangles on X axis (flip horizontally)
function mirrorTrianglesX(triangles: Triangle[]): Triangle[] {
  return triangles.map(t => {
    // Mirror vertices on X axis
    const v1: Vector3 = { x: -t.v1.x, y: t.v1.y, z: t.v1.z };
    const v2: Vector3 = { x: -t.v2.x, y: t.v2.y, z: t.v2.z };
    const v3: Vector3 = { x: -t.v3.x, y: t.v3.y, z: t.v3.z };
    
    // Swap v2 and v3 to reverse winding order (flip normal direction)
    // Then recompute normal from the new vertices
    const newNormal = calcNormal(v1, v3, v2);
    
    return {
      normal: newNormal,
      v1: v1,
      v2: v3,
      v3: v2
    };
  });
}

// Create diffuser cap that fits on top of U-channel
// Simple solid rectangular cap that sits over the channel opening and walls
function createDiffuserCap(
  path: number[][],
  channelWidth: number,
  wallThickness: number,
  wallHeight: number,
  baseThickness: number = 3,
  capThickness: number = 2,
  tolerance: number = 0.2
): Triangle[] {
  const triangles: Triangle[] = [];
  
  if (path.length < 2) return triangles;
  
  // Cap sits on top of the walls
  const capBottomZ = baseThickness + wallHeight;
  const capTopZ = capBottomZ + capThickness;
  
  // Cap sits ON TOP of the walls, slightly wider than channel opening
  // The extra width creates a lip that rests on the wall tops for snap-fit
  // halfWidth = channel radius + small overlap for resting on walls
  const halfWidth = (channelWidth / 2) + tolerance;
  
  // Build profile for each path point - simple rectangle cross-section
  interface CapProfile {
    bottomLeft: Vector3;
    bottomRight: Vector3;
    topLeft: Vector3;
    topRight: Vector3;
  }
  
  const profiles: CapProfile[] = [];
  
  for (let i = 0; i < path.length; i++) {
    const [px, py] = path[i];
    
    // Calculate perpendicular direction
    let tangentX = 0, tangentY = 1;
    if (i === 0 && path.length > 1) {
      tangentX = path[1][0] - path[0][0];
      tangentY = path[1][1] - path[0][1];
    } else if (i === path.length - 1) {
      tangentX = path[i][0] - path[i-1][0];
      tangentY = path[i][1] - path[i-1][1];
    } else {
      tangentX = path[i+1][0] - path[i-1][0];
      tangentY = path[i+1][1] - path[i-1][1];
    }
    
    const len = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (len > 0.001) {
      tangentX /= len;
      tangentY /= len;
    }
    
    const perpX = -tangentY;
    const perpY = tangentX;
    
    profiles.push({
      bottomLeft: { x: px + perpX * (-halfWidth), y: py + perpY * (-halfWidth), z: capBottomZ },
      bottomRight: { x: px + perpX * halfWidth, y: py + perpY * halfWidth, z: capBottomZ },
      topLeft: { x: px + perpX * (-halfWidth), y: py + perpY * (-halfWidth), z: capTopZ },
      topRight: { x: px + perpX * halfWidth, y: py + perpY * halfWidth, z: capTopZ }
    });
  }
  
  // Connect adjacent profiles to form the cap
  for (let i = 0; i < profiles.length - 1; i++) {
    const p1 = profiles[i];
    const p2 = profiles[i + 1];
    
    // Top surface (facing up)
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: p1.topLeft, v2: p2.topLeft, v3: p1.topRight
    });
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: p1.topRight, v2: p2.topLeft, v3: p2.topRight
    });
    
    // Bottom surface (facing down)
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: p1.bottomLeft, v2: p1.bottomRight, v3: p2.bottomLeft
    });
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: p1.bottomRight, v2: p2.bottomRight, v3: p2.bottomLeft
    });
    
    // Left side (outer)
    triangles.push({
      normal: calcNormal(p1.bottomLeft, p1.topLeft, p2.bottomLeft),
      v1: p1.bottomLeft, v2: p1.topLeft, v3: p2.bottomLeft
    });
    triangles.push({
      normal: calcNormal(p1.topLeft, p2.topLeft, p2.bottomLeft),
      v1: p1.topLeft, v2: p2.topLeft, v3: p2.bottomLeft
    });
    
    // Right side (outer)
    triangles.push({
      normal: calcNormal(p1.bottomRight, p2.bottomRight, p1.topRight),
      v1: p1.bottomRight, v2: p2.bottomRight, v3: p1.topRight
    });
    triangles.push({
      normal: calcNormal(p1.topRight, p2.bottomRight, p2.topRight),
      v1: p1.topRight, v2: p2.bottomRight, v3: p2.topRight
    });
  }
  
  // End caps (start and end of path)
  const first = profiles[0];
  const last = profiles[profiles.length - 1];
  
  // Start end cap (facing backward along path)
  triangles.push({
    normal: calcNormal(first.bottomLeft, first.topLeft, first.bottomRight),
    v1: first.bottomLeft, v2: first.topLeft, v3: first.bottomRight
  });
  triangles.push({
    normal: calcNormal(first.topLeft, first.topRight, first.bottomRight),
    v1: first.topLeft, v2: first.topRight, v3: first.bottomRight
  });
  
  // End end cap (facing forward along path)
  triangles.push({
    normal: calcNormal(last.bottomLeft, last.bottomRight, last.topLeft),
    v1: last.bottomLeft, v2: last.bottomRight, v3: last.topLeft
  });
  triangles.push({
    normal: calcNormal(last.topLeft, last.bottomRight, last.topRight),
    v1: last.topLeft, v2: last.bottomRight, v3: last.topRight
  });
  
  return triangles;
}

export interface NeonSignOptions {
  mirrorX?: boolean;
  generateDiffuserCap?: boolean;
  weldLetters?: boolean;  // Connect all letters with bridges
  addFeedHoles?: boolean;  // Add entry/exit holes in the back
  feedHoleDiameter?: number;  // Diameter of feed holes (mm)
}

// Create a bridge/strut connecting two points (for welding letters together)
function createBridge(
  start: { x: number; y: number },
  end: { x: number; y: number },
  channelWidth: number,
  wallThickness: number,
  wallHeight: number,
  baseThickness: number = 3
): Triangle[] {
  const triangles: Triangle[] = [];
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  // If the points are too close, skip the bridge
  if (len < channelWidth * 0.5) return triangles;
  
  // Create a simple rectangular bridge path
  const path: number[][] = [[start.x, start.y], [end.x, end.y]];
  
  // Use the same U-channel function to create the bridge with proper baseThickness
  return createUChannel(path, channelWidth, wallThickness, wallHeight, baseThickness);
}

// Create a feed hole (cylinder cut) in the base at a specific point
// This creates interior-facing geometry that represents a hole through the base
// The cylinder walls have normals pointing INWARD (toward hole center) to represent void
function createFeedHole(
  center: { x: number; y: number },
  diameter: number,
  baseThickness: number
): Triangle[] {
  const triangles: Triangle[] = [];
  const segments = 16;
  const radius = diameter / 2;
  
  // Hole goes from slightly below base (z=-0.5) to just above the base floor
  // This ensures it punches through the entire base
  const topZ = baseThickness + 0.5;
  const bottomZ = -0.5;
  
  const topRing: Vector3[] = [];
  const bottomRing: Vector3[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    topRing.push({ x: center.x + cos * radius, y: center.y + sin * radius, z: topZ });
    bottomRing.push({ x: center.x + cos * radius, y: center.y + sin * radius, z: bottomZ });
  }
  
  // Create the inner wall of the hole with normals pointing INWARD (toward center)
  // Winding order: when looking from outside the cylinder, vertices go clockwise
  // This makes the face point toward the center (representing interior of hole)
  for (let i = 0; i < segments; i++) {
    // Calculate inward-pointing normal for this segment
    const midAngle = ((i + 0.5) / segments) * Math.PI * 2;
    const inwardNormal = { x: -Math.cos(midAngle), y: -Math.sin(midAngle), z: 0 };
    
    // First triangle
    triangles.push({
      normal: inwardNormal,
      v1: bottomRing[i],
      v2: topRing[i],
      v3: topRing[i + 1]
    });
    // Second triangle
    triangles.push({
      normal: inwardNormal,
      v1: bottomRing[i],
      v2: topRing[i + 1],
      v3: bottomRing[i + 1]
    });
  }
  
  return triangles;
}

export function generateNeonSignV2(
  letterSettings: LetterSettings,
  tubeSettings: TubeSettings,
  twoPartSystem: TwoPartSystem = defaultTwoPartSystem,
  format: "stl" | "obj" = "stl",
  sketchPaths: SketchPath[] = [],
  inputMode: "text" | "draw" | "image" = "text",
  options: NeonSignOptions = {}
): ExportedPart[] {
  // Channel dimensions from settings - prioritize tubeSettings, fallback to twoPartSystem
  const channelWidth = tubeSettings.neonTubeDiameter || 12;
  const wallThickness = twoPartSystem.baseWallThickness || 2;
  // Use tubeSettings.wallHeight if set, otherwise fall back to twoPartSystem.baseWallHeight
  const wallHeight = tubeSettings.wallHeight || twoPartSystem.baseWallHeight || 15;
  const baseThickness = 3;
  const capThickness = twoPartSystem.capThickness || 2;
  
  console.log(`[V2 Generator] channelWidth=${channelWidth}, wallHeight=${wallHeight}, wallThickness=${wallThickness}`);
  
  let allTriangles: Triangle[] = [];
  let capTriangles: Triangle[] = [];
  let fileSlug = "neon_sign";
  
  // Store all smooth paths for cap generation
  const allSmoothPaths: number[][][] = [];
  
  if (inputMode === "draw" || inputMode === "image") {
    // Use sketch paths directly
    console.log(`[V2 Generator] Processing ${sketchPaths.length} sketch paths for ${inputMode} mode`);
    for (let i = 0; i < sketchPaths.length; i++) {
      const sketch = sketchPaths[i];
      if (sketch.points.length < 2) {
        console.log(`[V2 Generator] Skipping path ${i}: only ${sketch.points.length} points`);
        continue;
      }
      
      const path2D: number[][] = sketch.points.map(p => [p.x, p.y]);
      
      // Interpolate for smoothness
      const smoothPath = interpolatePath(path2D, channelWidth * 0.25);
      allSmoothPaths.push(smoothPath);
      
      // Create U-channel with hollow interior for LED insertion
      const channelTriangles = createUChannel(smoothPath, channelWidth, wallThickness, wallHeight);
      console.log(`[V2 Generator] Path ${i}: ${sketch.points.length} points -> ${smoothPath.length} smooth points -> ${channelTriangles.length} triangles`);
      allTriangles.push(...channelTriangles);
    }
    console.log(`[V2 Generator] Total base triangles: ${allTriangles.length}`);
    fileSlug = inputMode === "draw" ? "freehand" : "traced";
  } else {
    // Use appropriate font system based on font type
    const text = letterSettings.text || "A";
    const fontSize = 50 * letterSettings.scale;
    const fontId = letterSettings.fontId || "hershey-sans";
    
    let paths: number[][][] = [];
    
    // Check if this is an OTF font
    if (isOTFFont(fontId)) {
      console.log(`[V2 Generator] Using OTF font: ${fontId}`);
      const result = getTextStrokePathsFromFont(text, fontId, fontSize);
      paths = result.paths;
      
      // Paths from OTF loader are already centered
      for (const path of paths) {
        if (path.length < 2) continue;
        const smoothPath = interpolatePath(path, channelWidth * 0.25);
        allSmoothPaths.push(smoothPath);
        allTriangles.push(...createUChannel(smoothPath, channelWidth, wallThickness, wallHeight));
      }
    } else {
      // Use Hershey single-stroke fonts
      console.log(`[V2 Generator] Using Hershey font: ${fontId}`);
      const { paths: hersheyPaths, totalWidth, height } = getTextStrokePaths(
        text,
        fontSize,
        fontSize * 0.12 // Letter spacing
      );
      
      // Center the text
      const centerX = totalWidth / 2;
      const centerY = height / 2;
      
      for (const path of hersheyPaths) {
        if (path.length < 2) continue;
        
        // Center and flip Y (Hershey uses Y-down)
        const centeredPath: number[][] = path.map(([x, y]) => [
          x - centerX,
          centerY - y
        ]);
        
        // Interpolate for smoothness
        const smoothPath = interpolatePath(centeredPath, channelWidth * 0.25);
        allSmoothPaths.push(smoothPath);
        
        // Create U-channel with hollow interior for LED insertion
        allTriangles.push(...createUChannel(smoothPath, channelWidth, wallThickness, wallHeight));
      }
    }
    
    fileSlug = text.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
  }
  
  if (allTriangles.length === 0) {
    return [];
  }
  
  // Weld letters together with bridges if requested
  if (options.weldLetters && allSmoothPaths.length > 1) {
    console.log(`[V2 Generator] Welding ${allSmoothPaths.length} paths together`);
    
    // Connect each path to the next one
    for (let i = 0; i < allSmoothPaths.length - 1; i++) {
      const currentPath = allSmoothPaths[i];
      const nextPath = allSmoothPaths[i + 1];
      
      if (currentPath.length > 0 && nextPath.length > 0) {
        // Get end of current path and start of next path
        const endPoint = currentPath[currentPath.length - 1];
        const startPoint = nextPath[0];
        
        // Create bridge between them with proper baseThickness
        const bridgeTriangles = createBridge(
          { x: endPoint[0], y: endPoint[1] },
          { x: startPoint[0], y: startPoint[1] },
          channelWidth,
          wallThickness,
          wallHeight,
          baseThickness
        );
        
        allTriangles.push(...bridgeTriangles);
        console.log(`[V2 Generator] Added bridge ${i}: ${bridgeTriangles.length} triangles`);
      }
    }
  }
  
  // Add feed holes in the back for LED wire routing
  if (options.addFeedHoles && allSmoothPaths.length > 0) {
    const holeDiameter = options.feedHoleDiameter || 5; // Default 5mm holes
    console.log(`[V2 Generator] Adding feed holes, diameter=${holeDiameter}mm`);
    
    // Add a feed hole at the start of the first path
    const firstPath = allSmoothPaths[0];
    if (firstPath.length > 0) {
      const firstPoint = firstPath[0];
      allTriangles.push(...createFeedHole(
        { x: firstPoint[0], y: firstPoint[1] },
        holeDiameter,
        baseThickness
      ));
    }
    
    // Add a feed hole at the end of the last path
    const lastPath = allSmoothPaths[allSmoothPaths.length - 1];
    if (lastPath.length > 0) {
      const lastPoint = lastPath[lastPath.length - 1];
      allTriangles.push(...createFeedHole(
        { x: lastPoint[0], y: lastPoint[1] },
        holeDiameter,
        baseThickness
      ));
    }
  }
  
  // Generate diffuser cap if requested
  if (options.generateDiffuserCap) {
    for (const smoothPath of allSmoothPaths) {
      capTriangles.push(...createDiffuserCap(
        smoothPath,
        channelWidth,
        wallThickness,
        wallHeight,
        baseThickness,
        capThickness,
        twoPartSystem.snapTolerance || 0.2
      ));
    }
  }
  
  // Apply mirror if requested
  if (options.mirrorX) {
    allTriangles = mirrorTrianglesX(allTriangles);
    if (capTriangles.length > 0) {
      capTriangles = mirrorTrianglesX(capTriangles);
    }
  }
  
  const results: ExportedPart[] = [];
  
  // Base channel
  const baseContent = trianglesToSTL(allTriangles, `${fileSlug} Neon Sign Base`);
  console.log(`[V2 Generator] Base STL: ${allTriangles.length} triangles, ${baseContent.length} bytes`);
  results.push({
    filename: `${fileSlug}_neon_channel${options.mirrorX ? '_mirrored' : ''}.stl`,
    content: baseContent,
    partType: "base_channel",
    material: "opaque"
  });
  
  // Diffuser cap
  if (capTriangles.length > 0) {
    const capContent = trianglesToSTL(capTriangles, `${fileSlug} Diffuser Cap`);
    results.push({
      filename: `${fileSlug}_diffuser_cap${options.mirrorX ? '_mirrored' : ''}.stl`,
      content: capContent,
      partType: "diffuser_cap",
      material: "diffuser"
    });
  }
  
  return results;
}
