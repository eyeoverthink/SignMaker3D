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
  const binormal = cross(tangent, normal);
  
  // The channel is oriented so "up" is along the binormal (z-direction typically)
  // "left/right" is along the normal direction
  
  const halfWidth = channelWidth / 2;
  const innerHalfWidth = halfWidth - wallThickness;
  
  // Create points for U-channel cross-section
  // Going around: outer-bottom-left, up outer-left, across top-left (not needed - open top),
  // down inner-left, across inner-bottom, up inner-right, across top-right (open),
  // down outer-right, across outer-bottom
  
  const outerLeft: Vector3[] = [];
  const innerLeft: Vector3[] = [];
  const outerRight: Vector3[] = [];
  const innerRight: Vector3[] = [];
  const bottom: Vector3[] = [];
  
  // Outer left edge (from bottom to top)
  for (let h = 0; h <= 4; h++) {
    const zPos = (h / 4) * wallHeight;
    outerLeft.push({
      x: center.x + normal.x * (-halfWidth) + binormal.x * zPos,
      y: center.y + normal.y * (-halfWidth) + binormal.y * zPos,
      z: center.z + normal.z * (-halfWidth) + binormal.z * zPos
    });
  }
  
  // Inner left edge (from bottom to top)
  for (let h = 0; h <= 4; h++) {
    const zPos = (h / 4) * wallHeight;
    innerLeft.push({
      x: center.x + normal.x * (-innerHalfWidth) + binormal.x * zPos,
      y: center.y + normal.y * (-innerHalfWidth) + binormal.y * zPos,
      z: center.z + normal.z * (-innerHalfWidth) + binormal.z * zPos
    });
  }
  
  // Outer right edge (from bottom to top)
  for (let h = 0; h <= 4; h++) {
    const zPos = (h / 4) * wallHeight;
    outerRight.push({
      x: center.x + normal.x * halfWidth + binormal.x * zPos,
      y: center.y + normal.y * halfWidth + binormal.y * zPos,
      z: center.z + normal.z * halfWidth + binormal.z * zPos
    });
  }
  
  // Inner right edge (from bottom to top)
  for (let h = 0; h <= 4; h++) {
    const zPos = (h / 4) * wallHeight;
    innerRight.push({
      x: center.x + normal.x * innerHalfWidth + binormal.x * zPos,
      y: center.y + normal.y * innerHalfWidth + binormal.y * zPos,
      z: center.z + normal.z * innerHalfWidth + binormal.z * zPos
    });
  }
  
  // Bottom (from left to right, at z=0)
  for (let w = 0; w <= 4; w++) {
    const xPos = -halfWidth + (w / 4) * channelWidth;
    bottom.push({
      x: center.x + normal.x * xPos,
      y: center.y + normal.y * xPos,
      z: center.z + normal.z * xPos
    });
  }
  
  return { outerLeft, innerLeft, outerRight, innerRight, bottom };
}

// Create a U-channel along a path (hollow channel for LED insertion)
function createUChannel(
  path: number[][],
  channelWidth: number,
  wallThickness: number,
  wallHeight: number
): Triangle[] {
  const triangles: Triangle[] = [];
  
  if (path.length < 2) return triangles;
  
  // Convert 2D path to 3D
  const path3D: Vector3[] = path.map(([x, y]) => ({ x, y, z: 0 }));
  
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
  
  return triangles;
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
  // Create end caps for the U-channel
  // This closes off the ends with solid walls
  
  const ol = profile.outerLeft;
  const il = profile.innerLeft;
  const or = profile.outerRight;
  const ir = profile.innerRight;
  
  // Left wall end cap
  for (let i = 0; i < ol.length - 1; i++) {
    if (isStart) {
      triangles.push({
        normal: calcNormal(ol[i], il[i], ol[i + 1]),
        v1: ol[i], v2: il[i], v3: ol[i + 1]
      });
      triangles.push({
        normal: calcNormal(ol[i + 1], il[i], il[i + 1]),
        v1: ol[i + 1], v2: il[i], v3: il[i + 1]
      });
    } else {
      triangles.push({
        normal: calcNormal(ol[i], ol[i + 1], il[i]),
        v1: ol[i], v2: ol[i + 1], v3: il[i]
      });
      triangles.push({
        normal: calcNormal(ol[i + 1], il[i + 1], il[i]),
        v1: ol[i + 1], v2: il[i + 1], v3: il[i]
      });
    }
  }
  
  // Right wall end cap
  for (let i = 0; i < or.length - 1; i++) {
    if (isStart) {
      triangles.push({
        normal: calcNormal(or[i], or[i + 1], ir[i]),
        v1: or[i], v2: or[i + 1], v3: ir[i]
      });
      triangles.push({
        normal: calcNormal(or[i + 1], ir[i + 1], ir[i]),
        v1: or[i + 1], v2: ir[i + 1], v3: ir[i]
      });
    } else {
      triangles.push({
        normal: calcNormal(or[i], ir[i], or[i + 1]),
        v1: or[i], v2: ir[i], v3: or[i + 1]
      });
      triangles.push({
        normal: calcNormal(or[i + 1], ir[i], ir[i + 1]),
        v1: or[i + 1], v2: ir[i], v3: ir[i + 1]
      });
    }
  }
  
  // Bottom end cap (connects outer left bottom to outer right bottom)
  const bottomLeft = ol[0];
  const bottomRight = or[0];
  const innerBottomLeft = il[0];
  const innerBottomRight = ir[0];
  
  if (isStart) {
    triangles.push({
      normal: calcNormal(bottomLeft, innerBottomLeft, bottomRight),
      v1: bottomLeft, v2: innerBottomLeft, v3: bottomRight
    });
    triangles.push({
      normal: calcNormal(innerBottomLeft, innerBottomRight, bottomRight),
      v1: innerBottomLeft, v2: innerBottomRight, v3: bottomRight
    });
  } else {
    triangles.push({
      normal: calcNormal(bottomLeft, bottomRight, innerBottomLeft),
      v1: bottomLeft, v2: bottomRight, v3: innerBottomLeft
    });
    triangles.push({
      normal: calcNormal(innerBottomLeft, bottomRight, innerBottomRight),
      v1: innerBottomLeft, v2: bottomRight, v3: innerBottomRight
    });
  }
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
  // Channel dimensions from settings
  const channelWidth = tubeSettings.neonTubeDiameter || 12;
  const wallThickness = twoPartSystem.baseWallThickness || 2;
  const wallHeight = twoPartSystem.baseWallHeight || 15;
  
  let allTriangles: Triangle[] = [];
  let fileSlug = "neon_sign";
  
  if (inputMode === "draw" || inputMode === "image") {
    // Use sketch paths directly
    for (const sketch of sketchPaths) {
      if (sketch.points.length < 2) continue;
      
      const path2D: number[][] = sketch.points.map(p => [p.x, p.y]);
      
      // Interpolate for smoothness
      const smoothPath = interpolatePath(path2D, channelWidth * 0.25);
      
      // Create U-channel with hollow interior for LED insertion
      allTriangles.push(...createUChannel(smoothPath, channelWidth, wallThickness, wallHeight));
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
      const smoothPath = interpolatePath(centeredPath, channelWidth * 0.25);
      
      // Create U-channel with hollow interior for LED insertion
      allTriangles.push(...createUChannel(smoothPath, channelWidth, wallThickness, wallHeight));
    }
    
    fileSlug = text.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
  }
  
  if (allTriangles.length === 0) {
    return [];
  }
  
  const content = trianglesToSTL(allTriangles, `${fileSlug} Neon Sign`);
  
  return [{
    filename: `${fileSlug}_neon_channel.stl`,
    content,
    partType: "base_channel",
    material: "opaque"
  }];
}
