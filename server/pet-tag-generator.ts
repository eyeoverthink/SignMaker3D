// Pet Tag Generator - Simple "Neon Signs for Dogs"
// Uses the same U-channel system as the main text generator
// Just text + optional attachment loop for dog chains

import type { PetTagSettings } from "@shared/schema";
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

export interface PetTagPart {
  filename: string;
  content: Buffer;
  partType: string;
  material: string;
}

// Vector math utilities
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

interface UChannelProfile {
  outerLeft: Vector3[];
  innerLeft: Vector3[];
  outerRight: Vector3[];
  innerRight: Vector3[];
  center: Vector3;
}

function createUChannel(
  path: number[][],
  channelWidth: number,
  wallThickness: number,
  wallHeight: number,
  baseThickness: number = 3
): Triangle[] {
  const triangles: Triangle[] = [];
  
  if (path.length < 2) return triangles;
  
  const halfWidth = channelWidth / 2;
  const innerHalfWidth = halfWidth - wallThickness;
  
  // Generate cross-section profiles along the path
  const profiles: UChannelProfile[] = [];
  
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    
    // Calculate tangent direction
    let tx: number, ty: number;
    if (i === 0) {
      tx = path[1][0] - path[0][0];
      ty = path[1][1] - path[0][1];
    } else if (i === path.length - 1) {
      tx = path[i][0] - path[i - 1][0];
      ty = path[i][1] - path[i - 1][1];
    } else {
      tx = path[i + 1][0] - path[i - 1][0];
      ty = path[i + 1][1] - path[i - 1][1];
    }
    
    const tLen = Math.sqrt(tx * tx + ty * ty);
    if (tLen < 0.0001) continue;
    tx /= tLen;
    ty /= tLen;
    
    // Perpendicular direction in XY plane
    const px = -ty;
    const py = tx;
    
    // Create the U-channel cross-section:
    // Outer left wall, inner left wall, outer right wall, inner right wall
    // Each wall goes from base (z=baseThickness) up to top (z=baseThickness+wallHeight)
    
    const outerLeft: Vector3[] = [];
    const innerLeft: Vector3[] = [];
    const outerRight: Vector3[] = [];
    const innerRight: Vector3[] = [];
    
    // Bottom of walls (at base thickness level)
    const baseZ = baseThickness;
    const topZ = baseThickness + wallHeight;
    
    // Left wall - outer edge
    outerLeft.push({ x: x + px * (-halfWidth), y: y + py * (-halfWidth), z: 0 });
    outerLeft.push({ x: x + px * (-halfWidth), y: y + py * (-halfWidth), z: topZ });
    
    // Left wall - inner edge
    innerLeft.push({ x: x + px * (-innerHalfWidth), y: y + py * (-innerHalfWidth), z: baseZ });
    innerLeft.push({ x: x + px * (-innerHalfWidth), y: y + py * (-innerHalfWidth), z: topZ });
    
    // Right wall - outer edge
    outerRight.push({ x: x + px * halfWidth, y: y + py * halfWidth, z: 0 });
    outerRight.push({ x: x + px * halfWidth, y: y + py * halfWidth, z: topZ });
    
    // Right wall - inner edge
    innerRight.push({ x: x + px * innerHalfWidth, y: y + py * innerHalfWidth, z: baseZ });
    innerRight.push({ x: x + px * innerHalfWidth, y: y + py * innerHalfWidth, z: topZ });
    
    profiles.push({
      outerLeft,
      innerLeft,
      outerRight,
      innerRight,
      center: { x, y, z: baseZ }
    });
  }
  
  if (profiles.length < 2) return triangles;
  
  // Connect profiles to form the U-channel walls
  for (let i = 0; i < profiles.length - 1; i++) {
    const p1 = profiles[i];
    const p2 = profiles[i + 1];
    
    // Left outer wall (faces outward)
    addQuad(triangles, p1.outerLeft[0], p2.outerLeft[0], p2.outerLeft[1], p1.outerLeft[1], true);
    
    // Left inner wall (faces inward toward channel)
    addQuad(triangles, p1.innerLeft[0], p1.innerLeft[1], p2.innerLeft[1], p2.innerLeft[0], true);
    
    // Left wall top
    addQuad(triangles, p1.outerLeft[1], p2.outerLeft[1], p2.innerLeft[1], p1.innerLeft[1], true);
    
    // Right outer wall (faces outward)
    addQuad(triangles, p1.outerRight[0], p1.outerRight[1], p2.outerRight[1], p2.outerRight[0], true);
    
    // Right inner wall (faces inward toward channel)
    addQuad(triangles, p1.innerRight[0], p2.innerRight[0], p2.innerRight[1], p1.innerRight[1], true);
    
    // Right wall top
    addQuad(triangles, p1.innerRight[1], p2.innerRight[1], p2.outerRight[1], p1.outerRight[1], true);
    
    // Bottom of channel (floor between walls)
    addQuad(triangles, p1.innerLeft[0], p2.innerLeft[0], p2.innerRight[0], p1.innerRight[0], true);
    
    // Base plate bottom
    addQuad(triangles, p1.outerLeft[0], p1.outerRight[0], p2.outerRight[0], p2.outerLeft[0], false);
    
    // Base plate sides (connect bottom to channel floor)
    addQuad(triangles, p1.outerLeft[0], p2.outerLeft[0], p2.innerLeft[0], p1.innerLeft[0], false);
    addQuad(triangles, p1.innerRight[0], p2.innerRight[0], p2.outerRight[0], p1.outerRight[0], false);
  }
  
  // End caps
  capUChannel(triangles, profiles[0], true);
  capUChannel(triangles, profiles[profiles.length - 1], false);
  
  return triangles;
}

function addQuad(triangles: Triangle[], a: Vector3, b: Vector3, c: Vector3, d: Vector3, ccw: boolean) {
  if (ccw) {
    triangles.push({ normal: calcNormal(a, b, c), v1: a, v2: b, v3: c });
    triangles.push({ normal: calcNormal(a, c, d), v1: a, v2: c, v3: d });
  } else {
    triangles.push({ normal: calcNormal(a, c, b), v1: a, v2: c, v3: b });
    triangles.push({ normal: calcNormal(a, d, c), v1: a, v2: d, v3: c });
  }
}

function capUChannel(triangles: Triangle[], profile: UChannelProfile, isStart: boolean) {
  const ol = profile.outerLeft;
  const il = profile.innerLeft;
  const or = profile.outerRight;
  const ir = profile.innerRight;
  
  // Left wall end cap
  if (isStart) {
    addQuad(triangles, ol[0], ol[1], il[1], il[0], false);
  } else {
    addQuad(triangles, ol[0], il[0], il[1], ol[1], false);
  }
  
  // Right wall end cap
  if (isStart) {
    addQuad(triangles, or[0], ir[0], ir[1], or[1], false);
  } else {
    addQuad(triangles, or[0], or[1], ir[1], ir[0], false);
  }
  
  // Floor end cap (between inner walls)
  if (isStart) {
    addQuad(triangles, il[0], ir[0], { x: ir[0].x, y: ir[0].y, z: 0 }, { x: il[0].x, y: il[0].y, z: 0 }, false);
  } else {
    addQuad(triangles, il[0], { x: il[0].x, y: il[0].y, z: 0 }, { x: ir[0].x, y: ir[0].y, z: 0 }, ir[0], false);
  }
  
  // Base end cap
  if (isStart) {
    addQuad(triangles, ol[0], { x: ol[0].x, y: ol[0].y, z: 0 }, { x: or[0].x, y: or[0].y, z: 0 }, or[0], true);
  } else {
    addQuad(triangles, ol[0], or[0], { x: or[0].x, y: or[0].y, z: 0 }, { x: ol[0].x, y: ol[0].y, z: 0 }, true);
  }
}

function createDiffuserCap(
  path: number[][],
  channelWidth: number,
  wallThickness: number,
  wallHeight: number,
  baseThickness: number,
  capThickness: number,
  tolerance: number
): Triangle[] {
  const triangles: Triangle[] = [];
  
  if (path.length < 2) return triangles;
  
  const innerWidth = channelWidth - wallThickness * 2 + tolerance * 2;
  const halfWidth = innerWidth / 2;
  const baseZ = baseThickness + wallHeight;
  const topZ = baseZ + capThickness;
  
  // Generate cap outline along path
  interface CapProfile {
    left: Vector3;
    right: Vector3;
  }
  
  const bottomProfiles: CapProfile[] = [];
  const topProfiles: CapProfile[] = [];
  
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    
    let tx: number, ty: number;
    if (i === 0) {
      tx = path[1][0] - path[0][0];
      ty = path[1][1] - path[0][1];
    } else if (i === path.length - 1) {
      tx = path[i][0] - path[i - 1][0];
      ty = path[i][1] - path[i - 1][1];
    } else {
      tx = path[i + 1][0] - path[i - 1][0];
      ty = path[i + 1][1] - path[i - 1][1];
    }
    
    const tLen = Math.sqrt(tx * tx + ty * ty);
    if (tLen < 0.0001) continue;
    tx /= tLen;
    ty /= tLen;
    
    const px = -ty;
    const py = tx;
    
    bottomProfiles.push({
      left: { x: x + px * (-halfWidth), y: y + py * (-halfWidth), z: baseZ },
      right: { x: x + px * halfWidth, y: y + py * halfWidth, z: baseZ }
    });
    
    topProfiles.push({
      left: { x: x + px * (-halfWidth), y: y + py * (-halfWidth), z: topZ },
      right: { x: x + px * halfWidth, y: y + py * halfWidth, z: topZ }
    });
  }
  
  if (bottomProfiles.length < 2) return triangles;
  
  // Connect profiles to form the cap
  for (let i = 0; i < bottomProfiles.length - 1; i++) {
    const b1 = bottomProfiles[i];
    const b2 = bottomProfiles[i + 1];
    const t1 = topProfiles[i];
    const t2 = topProfiles[i + 1];
    
    // Top face
    addQuad(triangles, t1.left, t2.left, t2.right, t1.right, true);
    
    // Bottom face
    addQuad(triangles, b1.left, b1.right, b2.right, b2.left, true);
    
    // Left side
    addQuad(triangles, b1.left, b2.left, t2.left, t1.left, true);
    
    // Right side
    addQuad(triangles, b1.right, t1.right, t2.right, b2.right, true);
  }
  
  // End caps
  const bf = bottomProfiles[0];
  const tf = topProfiles[0];
  addQuad(triangles, bf.left, tf.left, tf.right, bf.right, false);
  
  const bl = bottomProfiles[bottomProfiles.length - 1];
  const tl = topProfiles[topProfiles.length - 1];
  addQuad(triangles, bl.left, bl.right, tl.right, tl.left, false);
  
  return triangles;
}

function createConnectingStrut(
  start: { x: number; y: number },
  end: { x: number; y: number },
  width: number,
  height: number
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // Calculate direction and perpendicular
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len < 0.1) return triangles;
  
  const nx = -dy / len;  // Perpendicular normal
  const ny = dx / len;
  const halfW = width / 2;
  
  // Four corners of the strut at bottom and top
  const bl = { x: start.x + nx * halfW, y: start.y + ny * halfW, z: 0 };
  const br = { x: start.x - nx * halfW, y: start.y - ny * halfW, z: 0 };
  const fl = { x: end.x + nx * halfW, y: end.y + ny * halfW, z: 0 };
  const fr = { x: end.x - nx * halfW, y: end.y - ny * halfW, z: 0 };
  
  const tbl = { x: bl.x, y: bl.y, z: height };
  const tbr = { x: br.x, y: br.y, z: height };
  const tfl = { x: fl.x, y: fl.y, z: height };
  const tfr = { x: fr.x, y: fr.y, z: height };
  
  // Bottom face
  addQuad(triangles, bl, br, fr, fl, false);
  
  // Top face
  addQuad(triangles, tbl, tfl, tfr, tbr, true);
  
  // Left side
  addQuad(triangles, bl, fl, tfl, tbl, true);
  
  // Right side
  addQuad(triangles, br, tbr, tfr, fr, true);
  
  // Back face
  addQuad(triangles, bl, tbl, tbr, br, true);
  
  // Front face
  addQuad(triangles, fl, fr, tfr, tfl, true);
  
  return triangles;
}

function createAttachmentLoop(
  position: { x: number; y: number },
  innerDiameter: number,
  outerDiameter: number,
  thickness: number
): Triangle[] {
  const triangles: Triangle[] = [];
  const segments = 24;
  const innerRadius = innerDiameter / 2;
  const outerRadius = outerDiameter / 2;
  
  // Generate ring profiles at bottom and top
  const bottomOuter: Vector3[] = [];
  const bottomInner: Vector3[] = [];
  const topOuter: Vector3[] = [];
  const topInner: Vector3[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    bottomOuter.push({ x: position.x + cos * outerRadius, y: position.y + sin * outerRadius, z: 0 });
    bottomInner.push({ x: position.x + cos * innerRadius, y: position.y + sin * innerRadius, z: 0 });
    topOuter.push({ x: position.x + cos * outerRadius, y: position.y + sin * outerRadius, z: thickness });
    topInner.push({ x: position.x + cos * innerRadius, y: position.y + sin * innerRadius, z: thickness });
  }
  
  // Connect to form the ring
  for (let i = 0; i < segments; i++) {
    // Outer wall
    addQuad(triangles, bottomOuter[i], bottomOuter[i + 1], topOuter[i + 1], topOuter[i], true);
    
    // Inner wall (faces inward)
    addQuad(triangles, bottomInner[i], topInner[i], topInner[i + 1], bottomInner[i + 1], true);
    
    // Top face
    addQuad(triangles, topOuter[i], topOuter[i + 1], topInner[i + 1], topInner[i], true);
    
    // Bottom face
    addQuad(triangles, bottomOuter[i], bottomInner[i], bottomInner[i + 1], bottomOuter[i + 1], true);
  }
  
  return triangles;
}

function trianglesToSTL(triangles: Triangle[], name: string): Buffer {
  const headerSize = 80;
  const triangleCountSize = 4;
  const triangleSize = 50;
  const bufferSize = headerSize + triangleCountSize + triangles.length * triangleSize;
  
  const buffer = Buffer.alloc(bufferSize);
  
  // Header
  const header = `Binary STL - ${name}`.substring(0, 80).padEnd(80, '\0');
  buffer.write(header, 0, 80, 'ascii');
  
  // Triangle count
  buffer.writeUInt32LE(triangles.length, 80);
  
  // Triangles
  let offset = 84;
  for (const tri of triangles) {
    // Normal
    buffer.writeFloatLE(tri.normal.x, offset);
    buffer.writeFloatLE(tri.normal.y, offset + 4);
    buffer.writeFloatLE(tri.normal.z, offset + 8);
    
    // Vertex 1
    buffer.writeFloatLE(tri.v1.x, offset + 12);
    buffer.writeFloatLE(tri.v1.y, offset + 16);
    buffer.writeFloatLE(tri.v1.z, offset + 20);
    
    // Vertex 2
    buffer.writeFloatLE(tri.v2.x, offset + 24);
    buffer.writeFloatLE(tri.v2.y, offset + 28);
    buffer.writeFloatLE(tri.v2.z, offset + 32);
    
    // Vertex 3
    buffer.writeFloatLE(tri.v3.x, offset + 36);
    buffer.writeFloatLE(tri.v3.y, offset + 40);
    buffer.writeFloatLE(tri.v3.z, offset + 44);
    
    // Attribute byte count
    buffer.writeUInt16LE(0, offset + 48);
    
    offset += 50;
  }
  
  return buffer;
}

export function generatePetTagV2(settings: PetTagSettings): PetTagPart[] {
  const parts: PetTagPart[] = [];
  
  const {
    petName,
    tagWidth,
    tagThickness,
    ledChannelEnabled,
    ledChannelWidth,
    ledChannelDepth,
    holeEnabled,
    holeDiameter,
    fontScale,
  } = settings;
  
  // Channel dimensions - same approach as main neon sign generator
  const channelWidth = Math.max(4, Math.min(ledChannelWidth || 8, 12));
  const wallThickness = Math.max(1.5, channelWidth * 0.2);
  const wallHeight = Math.max(4, Math.min(ledChannelDepth || 6, 15));
  const baseThickness = Math.max(2, tagThickness * 0.3);
  const capThickness = 2;
  const snapTolerance = 0.2;
  
  console.log(`[PetTag] Generating: "${petName}", channelWidth=${channelWidth}, wallHeight=${wallHeight}`);
  
  // Get stroke paths for the pet name using Hershey fonts
  const fontSize = 40 * (fontScale || 1);
  const textResult = getTextStrokePaths(petName || "PET", fontSize, fontSize * 0.1);
  const textPaths = textResult.paths;
  
  // Center the text
  const centerX = textResult.totalWidth / 2;
  const centerY = textResult.height / 2;
  
  // Transform paths and create U-channels
  const allTriangles: Triangle[] = [];
  const allSmoothPaths: number[][][] = [];
  
  for (const path of textPaths) {
    if (path.length < 2) continue;
    
    // Center and flip Y
    const centeredPath: number[][] = path.map(([x, y]) => [
      x - centerX,
      centerY - y
    ]);
    
    // Interpolate for smoothness
    const smoothPath = interpolatePath(centeredPath, channelWidth * 0.25);
    
    if (smoothPath.length < 2) continue;
    
    allSmoothPaths.push(smoothPath);
    
    // Create U-channel along the path
    if (ledChannelEnabled !== false) {
      const channelTriangles = createUChannel(smoothPath, channelWidth, wallThickness, wallHeight, baseThickness);
      allTriangles.push(...channelTriangles);
    }
  }
  
  // Calculate actual text bounds from all paths
  let textMinX = Infinity, textMaxX = -Infinity;
  let textMinY = Infinity, textMaxY = -Infinity;
  for (const path of allSmoothPaths) {
    for (const [x, y] of path) {
      textMinX = Math.min(textMinX, x);
      textMaxX = Math.max(textMaxX, x);
      textMinY = Math.min(textMinY, y);
      textMaxY = Math.max(textMaxY, y);
    }
  }
  
  // Add attachment loop if enabled
  if (holeEnabled && allSmoothPaths.length > 0) {
    const innerDiam = holeDiameter || 4;
    const outerDiam = innerDiam + channelWidth;
    const loopThickness = baseThickness + wallHeight;
    
    // Position loop to the left of actual text bounds with small gap
    const gapFromText = channelWidth / 2;
    const loopX = textMinX - outerDiam / 2 - gapFromText;
    const loopY = 0; // Centered vertically
    
    // Create the ring-shaped loop
    const loopTriangles = createAttachmentLoop(
      { x: loopX, y: loopY },
      innerDiam,
      outerDiam,
      loopThickness
    );
    allTriangles.push(...loopTriangles);
    
    // Add a connecting strut between the loop and text
    const strutTriangles = createConnectingStrut(
      { x: loopX + outerDiam / 2, y: loopY },
      { x: textMinX - channelWidth / 2, y: 0 },
      channelWidth,
      loopThickness
    );
    allTriangles.push(...strutTriangles);
  }
  
  console.log(`[PetTag] Generated ${allTriangles.length} triangles for base`);
  
  if (allTriangles.length === 0) {
    console.log(`[PetTag] Warning: No triangles generated`);
    return parts;
  }
  
  // Create base STL
  const baseBuffer = trianglesToSTL(allTriangles, `${petName || 'PetTag'} Neon Tag`);
  parts.push({
    filename: `${(petName || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '_')}_neon_tag.stl`,
    content: baseBuffer,
    partType: "base",
    material: "opaque"
  });
  
  // Generate diffuser cap if LED channel is enabled
  if (ledChannelEnabled !== false && allSmoothPaths.length > 0) {
    const capTriangles: Triangle[] = [];
    
    for (const smoothPath of allSmoothPaths) {
      const cap = createDiffuserCap(
        smoothPath,
        channelWidth,
        wallThickness,
        wallHeight,
        baseThickness,
        capThickness,
        snapTolerance
      );
      capTriangles.push(...cap);
    }
    
    if (capTriangles.length > 0) {
      console.log(`[PetTag] Generated ${capTriangles.length} triangles for diffuser cap`);
      const capBuffer = trianglesToSTL(capTriangles, `${petName || 'PetTag'} Diffuser Cap`);
      parts.push({
        filename: `${(petName || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '_')}_diffuser_cap.stl`,
        content: capBuffer,
        partType: "diffuser_cap",
        material: "translucent"
      });
    }
  }
  
  return parts;
}
