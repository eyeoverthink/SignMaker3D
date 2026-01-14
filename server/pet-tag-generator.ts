// Pet Tag Generator - "Mini Neon Signs" with U-Channel floating letters
// Uses Hershey single-stroke fonts for letter paths, same as main neon sign generator
// Structure: Shaped backing plate + U-channel letters + optional snap-fit diffuser cap

import type { PetTagSettings } from "@shared/schema";
import { getTextStrokePaths, interpolatePath } from "./hershey-fonts";
import earcut from "earcut";

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  vertices: [number, number, number][];
  normal: [number, number, number];
}

export interface PetTagPart {
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

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

// Default mini neon channel dimensions for pet tags (used as fallbacks/clamps)
const MIN_BASE_THICKNESS = 1.0;   // mm - minimum base plate
const MIN_WALL_THICKNESS = 0.6;   // mm - minimum wall for printability
const DEFAULT_WALL_RATIO = 0.3;   // wall thickness as ratio of channel width

export function generatePetTagV2(settings: PetTagSettings): PetTagPart[] {
  const parts: PetTagPart[] = [];
  
  const {
    petName,
    tagShape,
    tagWidth,
    tagHeight,
    tagThickness,
    ledChannelEnabled,
    ledChannelWidth,
    ledChannelDepth,
    holeEnabled,
    holeDiameter,
    fontScale,
  } = settings;
  
  // Derive channel dimensions from user settings with safety clamps
  const channelWidth = Math.max(2, Math.min(ledChannelWidth, 8));        // 2-8mm
  const wallThickness = Math.max(MIN_WALL_THICKNESS, channelWidth * DEFAULT_WALL_RATIO);
  const wallHeight = Math.max(2, Math.min(ledChannelDepth * 1.2, 6));    // Wall height based on channel depth
  const baseThickness = Math.max(MIN_BASE_THICKNESS, tagThickness * 0.4); // Base ~40% of total thickness
  
  // Get stroke paths for the pet name using Hershey fonts
  const textResult = getTextStrokePaths(petName || "PET", 1.0);
  const textPaths = textResult.paths;
  
  // Calculate text bounds and scale to fit within tag
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const path of textPaths) {
    for (const point of path) {
      minX = Math.min(minX, point[0]);
      maxX = Math.max(maxX, point[0]);
      minY = Math.min(minY, point[1]);
      maxY = Math.max(maxY, point[1]);
    }
  }
  
  const textWidth = maxX - minX;
  const textHeight = maxY - minY;
  
  // Scale text to fit within tag (leaving margin for walls and hole)
  const availableWidth = tagWidth * 0.7;
  const availableHeight = tagHeight * (holeEnabled ? 0.5 : 0.6);
  
  const scaleX = availableWidth / Math.max(textWidth, 1);
  const scaleY = availableHeight / Math.max(textHeight, 1);
  const textScale = Math.min(scaleX, scaleY) * fontScale;
  
  // Center and offset text (lower if hole is at top)
  const centerX = 0;
  const centerY = holeEnabled ? -tagHeight * 0.08 : 0;
  
  // Transform and interpolate paths
  const transformedPaths: number[][][] = [];
  
  for (const path of textPaths) {
    const transformed: number[][] = path.map((point) => {
      const x = point[0];
      const y = point[1];
      const nx = (x - (minX + maxX) / 2) * textScale + centerX;
      const ny = (y - (minY + maxY) / 2) * textScale + centerY;
      return [nx, -ny]; // Flip Y for correct orientation
    });
    
    // Interpolate for smooth curves
    const interpolated = interpolatePath(transformed, 0.5);
    transformedPaths.push(interpolated);
  }
  
  // Channel geometry settings
  const channelSettings = {
    channelWidth,
    wallThickness,
    wallHeight,
    baseThickness,
  };
  
  // Generate base piece with U-channel letters
  const baseTriangles = generatePetTagBase(
    tagShape,
    tagWidth,
    tagHeight,
    transformedPaths,
    ledChannelEnabled,
    holeEnabled,
    holeDiameter,
    channelSettings
  );
  
  const baseBuffer = createSTLBuffer(baseTriangles, `${petName || 'PetTag'} Base`);
  parts.push({
    filename: `${petName || 'pet'}_${tagShape}_base.stl`,
    content: baseBuffer,
    partType: "base",
    material: "opaque"
  });
  
  // Generate diffuser cap if LED channel is enabled
  if (ledChannelEnabled && transformedPaths.length > 0) {
    const capTriangles = generatePetTagCap(
      transformedPaths,
      channelSettings
    );
    
    if (capTriangles.length > 0) {
      const capBuffer = createSTLBuffer(capTriangles, `${petName || 'PetTag'} Cap`);
      parts.push({
        filename: `${petName || 'pet'}_${tagShape}_cap.stl`,
        content: capBuffer,
        partType: "diffuser_cap",
        material: "translucent"
      });
    }
  }
  
  return parts;
}

interface ChannelSettings {
  channelWidth: number;
  wallThickness: number;
  wallHeight: number;
  baseThickness: number;
}

function generatePetTagBase(
  shape: string,
  width: number,
  height: number,
  letterPaths: number[][][],
  hasLEDChannel: boolean,
  hasHole: boolean,
  holeDiameter: number,
  settings: ChannelSettings
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // Generate shape outline
  const shapePoints = generateShapePoints(shape, width, height);
  
  // Generate hole points if enabled
  const holeCenter = hasHole ? { x: 0, y: height / 2 - holeDiameter * 0.8 } : null;
  const holeRadius = hasHole ? holeDiameter / 2 : 0;
  
  // 1. Generate the backing plate (solid extruded shape with optional hole)
  generateBackingPlate(triangles, shapePoints, settings.baseThickness, holeCenter, holeRadius);
  
  // 2. Generate U-channel walls along letter paths (if LED channel enabled)
  if (hasLEDChannel && letterPaths.length > 0) {
    for (const path of letterPaths) {
      if (path.length >= 2) {
        generateUChannelForPath(triangles, path, settings);
      }
    }
  }
  
  return triangles;
}

function generatePetTagCap(
  letterPaths: number[][][],
  settings: ChannelSettings
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // Generate snap-fit diffuser caps that sit on top of the U-channels
  const capThickness = 1.2; // mm
  const tolerance = 0.15;   // mm - for snap fit
  const capBaseZ = settings.baseThickness + settings.wallHeight;
  
  for (const path of letterPaths) {
    if (path.length >= 2) {
      generateDiffuserCapForPath(triangles, path, capBaseZ, capThickness, tolerance, settings.channelWidth);
    }
  }
  
  return triangles;
}

function generateBackingPlate(
  triangles: Triangle[],
  shapePoints: { x: number; y: number }[],
  thickness: number,
  holeCenter: { x: number; y: number } | null,
  holeRadius: number
): void {
  const holeSegments = 16;
  
  // Generate hole points if present (wound opposite for subtraction)
  let holePoints: { x: number; y: number }[] = [];
  if (holeCenter && holeRadius > 0) {
    for (let i = holeSegments - 1; i >= 0; i--) {
      const angle = (i / holeSegments) * Math.PI * 2;
      holePoints.push({
        x: holeCenter.x + Math.cos(angle) * holeRadius,
        y: holeCenter.y + Math.sin(angle) * holeRadius,
      });
    }
  }
  
  // Bottom face (z=0)
  generateFaceWithHole(triangles, shapePoints, holePoints, 0, false);
  
  // Top face (z=thickness)
  generateFaceWithHole(triangles, shapePoints, holePoints, thickness, true);
  
  // Outer walls
  generateWallsForShape(triangles, shapePoints, 0, thickness, true);
  
  // Hole walls (if present)
  if (holePoints.length > 0) {
    generateWallsForShape(triangles, holePoints, 0, thickness, false);
  }
}

function generateFaceWithHole(
  triangles: Triangle[],
  outerPoints: { x: number; y: number }[],
  holePoints: { x: number; y: number }[],
  z: number,
  topFace: boolean
): void {
  const hasHole = holePoints.length > 0;
  const flatCoords: number[] = [];
  const holeIndices: number[] = [];
  
  for (const p of outerPoints) {
    flatCoords.push(p.x, p.y);
  }
  
  if (hasHole) {
    holeIndices.push(outerPoints.length);
    for (const p of holePoints) {
      flatCoords.push(p.x, p.y);
    }
  }
  
  const indices = earcut(flatCoords, hasHole ? holeIndices : undefined, 2);
  const allPoints = [...outerPoints, ...holePoints];
  
  for (let i = 0; i < indices.length; i += 3) {
    const p0 = allPoints[indices[i]];
    const p1 = allPoints[indices[i + 1]];
    const p2 = allPoints[indices[i + 2]];
    
    if (topFace) {
      triangles.push({
        vertices: [[p0.x, p0.y, z], [p1.x, p1.y, z], [p2.x, p2.y, z]],
        normal: [0, 0, 1],
      });
    } else {
      triangles.push({
        vertices: [[p0.x, p0.y, z], [p2.x, p2.y, z], [p1.x, p1.y, z]],
        normal: [0, 0, -1],
      });
    }
  }
}

function generateWallsForShape(
  triangles: Triangle[],
  points: { x: number; y: number }[],
  z0: number,
  z1: number,
  outwardNormal: boolean
): void {
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) continue;
    
    // Normal perpendicular to wall
    let nx = outwardNormal ? dy / len : -dy / len;
    let ny = outwardNormal ? -dx / len : dx / len;
    
    triangles.push({
      vertices: [[p1.x, p1.y, z0], [p2.x, p2.y, z0], [p2.x, p2.y, z1]],
      normal: [nx, ny, 0],
    });
    
    triangles.push({
      vertices: [[p1.x, p1.y, z0], [p2.x, p2.y, z1], [p1.x, p1.y, z1]],
      normal: [nx, ny, 0],
    });
  }
}

function generateUChannelForPath(
  triangles: Triangle[],
  path: number[][],
  settings: ChannelSettings
): void {
  if (path.length < 2) return;
  
  const { channelWidth, wallThickness, wallHeight, baseThickness } = settings;
  const halfWidth = channelWidth / 2;
  const innerHalfWidth = halfWidth - wallThickness;
  const baseZ = baseThickness;
  
  // Generate cross-section profiles along the path
  const leftOuter: { x: number; y: number; z: number }[][] = [];
  const leftInner: { x: number; y: number; z: number }[][] = [];
  const rightOuter: { x: number; y: number; z: number }[][] = [];
  const rightInner: { x: number; y: number; z: number }[][] = [];
  
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    
    // Calculate tangent
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
    if (tLen < 0.001) continue;
    tx /= tLen;
    ty /= tLen;
    
    // Perpendicular in XY plane
    const px = -ty;
    const py = tx;
    
    // Generate profile points at this position
    const profileOL: { x: number; y: number; z: number }[] = [];
    const profileIL: { x: number; y: number; z: number }[] = [];
    const profileOR: { x: number; y: number; z: number }[] = [];
    const profileIR: { x: number; y: number; z: number }[] = [];
    
    // Left outer wall (bottom to top)
    for (let h = 0; h <= 2; h++) {
      const zPos = baseZ + (h / 2) * wallHeight;
      profileOL.push({ x: x + px * (-halfWidth), y: y + py * (-halfWidth), z: zPos });
    }
    
    // Left inner wall
    for (let h = 0; h <= 2; h++) {
      const zPos = baseZ + (h / 2) * wallHeight;
      profileIL.push({ x: x + px * (-innerHalfWidth), y: y + py * (-innerHalfWidth), z: zPos });
    }
    
    // Right outer wall
    for (let h = 0; h <= 2; h++) {
      const zPos = baseZ + (h / 2) * wallHeight;
      profileOR.push({ x: x + px * halfWidth, y: y + py * halfWidth, z: zPos });
    }
    
    // Right inner wall
    for (let h = 0; h <= 2; h++) {
      const zPos = baseZ + (h / 2) * wallHeight;
      profileIR.push({ x: x + px * innerHalfWidth, y: y + py * innerHalfWidth, z: zPos });
    }
    
    leftOuter.push(profileOL);
    leftInner.push(profileIL);
    rightOuter.push(profileOR);
    rightInner.push(profileIR);
  }
  
  if (leftOuter.length < 2) return;
  
  // Connect profiles to form walls
  for (let i = 0; i < leftOuter.length - 1; i++) {
    // Left outer wall
    connectProfiles(triangles, leftOuter[i], leftOuter[i + 1], true);
    
    // Left inner wall
    connectProfiles(triangles, leftInner[i], leftInner[i + 1], false);
    
    // Right outer wall
    connectProfiles(triangles, rightOuter[i], rightOuter[i + 1], false);
    
    // Right inner wall
    connectProfiles(triangles, rightInner[i], rightInner[i + 1], true);
    
    // Left wall top
    const loTop = leftOuter[i][2];
    const liTop = leftInner[i][2];
    const loTopNext = leftOuter[i + 1][2];
    const liTopNext = leftInner[i + 1][2];
    
    triangles.push({
      vertices: [[loTop.x, loTop.y, loTop.z], [loTopNext.x, loTopNext.y, loTopNext.z], [liTopNext.x, liTopNext.y, liTopNext.z]],
      normal: [0, 0, 1],
    });
    triangles.push({
      vertices: [[loTop.x, loTop.y, loTop.z], [liTopNext.x, liTopNext.y, liTopNext.z], [liTop.x, liTop.y, liTop.z]],
      normal: [0, 0, 1],
    });
    
    // Right wall top
    const roTop = rightOuter[i][2];
    const riTop = rightInner[i][2];
    const roTopNext = rightOuter[i + 1][2];
    const riTopNext = rightInner[i + 1][2];
    
    triangles.push({
      vertices: [[roTop.x, roTop.y, roTop.z], [riTop.x, riTop.y, riTop.z], [riTopNext.x, riTopNext.y, riTopNext.z]],
      normal: [0, 0, 1],
    });
    triangles.push({
      vertices: [[roTop.x, roTop.y, roTop.z], [riTopNext.x, riTopNext.y, riTopNext.z], [roTopNext.x, roTopNext.y, roTopNext.z]],
      normal: [0, 0, 1],
    });
  }
  
  // End caps for open paths
  generateUChannelEndCap(triangles, leftOuter[0], leftInner[0], rightOuter[0], rightInner[0], baseZ, false);
  const last = leftOuter.length - 1;
  generateUChannelEndCap(triangles, leftOuter[last], leftInner[last], rightOuter[last], rightInner[last], baseZ, true);
}

function connectProfiles(
  triangles: Triangle[],
  profile1: { x: number; y: number; z: number }[],
  profile2: { x: number; y: number; z: number }[],
  normalOutward: boolean
): void {
  for (let j = 0; j < profile1.length - 1; j++) {
    const p1 = profile1[j];
    const p2 = profile1[j + 1];
    const p3 = profile2[j + 1];
    const p4 = profile2[j];
    
    // Calculate normal
    const dx1 = p4.x - p1.x;
    const dy1 = p4.y - p1.y;
    const dx2 = p2.x - p1.x;
    const dy2 = p2.y - p1.y;
    const dz2 = p2.z - p1.z;
    
    let nx = dy1 * dz2;
    let ny = -dx1 * dz2;
    let nz = dx1 * dy2 - dy1 * dx2;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nLen > 0.001) {
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;
    }
    
    if (!normalOutward) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    
    if (normalOutward) {
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p4.x, p4.y, p4.z], [p3.x, p3.y, p3.z]],
        normal: [nx, ny, nz],
      });
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p3.x, p3.y, p3.z], [p2.x, p2.y, p2.z]],
        normal: [nx, ny, nz],
      });
    } else {
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z], [p3.x, p3.y, p3.z]],
        normal: [nx, ny, nz],
      });
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p3.x, p3.y, p3.z], [p4.x, p4.y, p4.z]],
        normal: [nx, ny, nz],
      });
    }
  }
}

function generateUChannelEndCap(
  triangles: Triangle[],
  leftOuter: { x: number; y: number; z: number }[],
  leftInner: { x: number; y: number; z: number }[],
  rightOuter: { x: number; y: number; z: number }[],
  rightInner: { x: number; y: number; z: number }[],
  baseZ: number,
  forward: boolean
): void {
  // Close the end of the U-channel
  const lo0 = leftOuter[0];
  const li0 = leftInner[0];
  const ro0 = rightOuter[0];
  const ri0 = rightInner[0];
  const loTop = leftOuter[leftOuter.length - 1];
  const liTop = leftInner[leftInner.length - 1];
  const roTop = rightOuter[rightOuter.length - 1];
  const riTop = rightInner[rightInner.length - 1];
  
  const dir = forward ? 1 : -1;
  
  // Calculate end normal
  const midX = (lo0.x + ro0.x) / 2;
  const midY = (lo0.y + ro0.y) / 2;
  const nextMidX = leftOuter[1]?.x ?? midX;
  const nextMidY = leftOuter[1]?.y ?? midY;
  
  let nx = forward ? -(nextMidY - midY) : (nextMidY - midY);
  let ny = forward ? (nextMidX - midX) : -(nextMidX - midX);
  const nLen = Math.sqrt(nx * nx + ny * ny);
  if (nLen > 0.001) {
    nx /= nLen;
    ny /= nLen;
  } else {
    nx = forward ? 1 : -1;
    ny = 0;
  }
  
  // Left wall end cap
  for (let j = 0; j < leftOuter.length - 1; j++) {
    const p1 = leftOuter[j];
    const p2 = leftOuter[j + 1];
    const p3 = leftInner[j + 1];
    const p4 = leftInner[j];
    
    if (forward) {
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z], [p3.x, p3.y, p3.z]],
        normal: [nx, ny, 0],
      });
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p3.x, p3.y, p3.z], [p4.x, p4.y, p4.z]],
        normal: [nx, ny, 0],
      });
    } else {
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p4.x, p4.y, p4.z], [p3.x, p3.y, p3.z]],
        normal: [nx, ny, 0],
      });
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p3.x, p3.y, p3.z], [p2.x, p2.y, p2.z]],
        normal: [nx, ny, 0],
      });
    }
  }
  
  // Right wall end cap
  for (let j = 0; j < rightOuter.length - 1; j++) {
    const p1 = rightOuter[j];
    const p2 = rightOuter[j + 1];
    const p3 = rightInner[j + 1];
    const p4 = rightInner[j];
    
    if (forward) {
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p4.x, p4.y, p4.z], [p3.x, p3.y, p3.z]],
        normal: [nx, ny, 0],
      });
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p3.x, p3.y, p3.z], [p2.x, p2.y, p2.z]],
        normal: [nx, ny, 0],
      });
    } else {
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z], [p3.x, p3.y, p3.z]],
        normal: [nx, ny, 0],
      });
      triangles.push({
        vertices: [[p1.x, p1.y, p1.z], [p3.x, p3.y, p3.z], [p4.x, p4.y, p4.z]],
        normal: [nx, ny, 0],
      });
    }
  }
  
  // Floor between walls at end
  if (forward) {
    triangles.push({
      vertices: [[li0.x, li0.y, li0.z], [ri0.x, ri0.y, ri0.z], [ri0.x, ri0.y, baseZ]],
      normal: [nx, ny, 0],
    });
    triangles.push({
      vertices: [[li0.x, li0.y, li0.z], [ri0.x, ri0.y, baseZ], [li0.x, li0.y, baseZ]],
      normal: [nx, ny, 0],
    });
  } else {
    triangles.push({
      vertices: [[li0.x, li0.y, li0.z], [li0.x, li0.y, baseZ], [ri0.x, ri0.y, baseZ]],
      normal: [nx, ny, 0],
    });
    triangles.push({
      vertices: [[li0.x, li0.y, li0.z], [ri0.x, ri0.y, baseZ], [ri0.x, ri0.y, ri0.z]],
      normal: [nx, ny, 0],
    });
  }
}

function generateDiffuserCapForPath(
  triangles: Triangle[],
  path: number[][],
  baseZ: number,
  capThickness: number,
  tolerance: number,
  channelWidth: number
): void {
  if (path.length < 2) return;
  
  const capWidth = channelWidth + tolerance * 2;
  const halfWidth = capWidth / 2;
  
  // Generate cap outline along path
  const leftEdge: { x: number; y: number }[] = [];
  const rightEdge: { x: number; y: number }[] = [];
  
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    
    // Calculate tangent
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
    if (tLen < 0.001) continue;
    tx /= tLen;
    ty /= tLen;
    
    // Perpendicular in XY plane
    const px = -ty;
    const py = tx;
    
    leftEdge.push({ x: x + px * (-halfWidth), y: y + py * (-halfWidth) });
    rightEdge.push({ x: x + px * halfWidth, y: y + py * halfWidth });
  }
  
  if (leftEdge.length < 2) return;
  
  // Create closed outline (left edge + right edge reversed + semicircular ends)
  const outline: { x: number; y: number }[] = [];
  
  // Add semicircular start cap
  const startCenter = { x: path[0][0], y: path[0][1] };
  for (let a = 0; a <= 8; a++) {
    const angle = Math.PI / 2 + (a / 8) * Math.PI;
    outline.push({
      x: startCenter.x + Math.cos(angle) * halfWidth,
      y: startCenter.y + Math.sin(angle) * halfWidth,
    });
  }
  
  // Left edge
  for (const p of leftEdge) {
    outline.push(p);
  }
  
  // Add semicircular end cap
  const endCenter = { x: path[path.length - 1][0], y: path[path.length - 1][1] };
  for (let a = 0; a <= 8; a++) {
    const angle = -Math.PI / 2 + (a / 8) * Math.PI;
    outline.push({
      x: endCenter.x + Math.cos(angle) * halfWidth,
      y: endCenter.y + Math.sin(angle) * halfWidth,
    });
  }
  
  // Right edge (reversed)
  for (let i = rightEdge.length - 1; i >= 0; i--) {
    outline.push(rightEdge[i]);
  }
  
  // Triangulate cap outline
  const flatCoords: number[] = [];
  for (const p of outline) {
    flatCoords.push(p.x, p.y);
  }
  
  const indices = earcut(flatCoords, undefined, 2);
  
  // Bottom face of cap
  for (let i = 0; i < indices.length; i += 3) {
    const p0 = outline[indices[i]];
    const p1 = outline[indices[i + 1]];
    const p2 = outline[indices[i + 2]];
    
    triangles.push({
      vertices: [[p0.x, p0.y, baseZ], [p2.x, p2.y, baseZ], [p1.x, p1.y, baseZ]],
      normal: [0, 0, -1],
    });
  }
  
  // Top face of cap
  const topZ = baseZ + capThickness;
  for (let i = 0; i < indices.length; i += 3) {
    const p0 = outline[indices[i]];
    const p1 = outline[indices[i + 1]];
    const p2 = outline[indices[i + 2]];
    
    triangles.push({
      vertices: [[p0.x, p0.y, topZ], [p1.x, p1.y, topZ], [p2.x, p2.y, topZ]],
      normal: [0, 0, 1],
    });
  }
  
  // Side walls
  for (let i = 0; i < outline.length; i++) {
    const p1 = outline[i];
    const p2 = outline[(i + 1) % outline.length];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) continue;
    
    const nx = dy / len;
    const ny = -dx / len;
    
    triangles.push({
      vertices: [[p1.x, p1.y, baseZ], [p2.x, p2.y, baseZ], [p2.x, p2.y, topZ]],
      normal: [nx, ny, 0],
    });
    
    triangles.push({
      vertices: [[p1.x, p1.y, baseZ], [p2.x, p2.y, topZ], [p1.x, p1.y, topZ]],
      normal: [nx, ny, 0],
    });
  }
}

function generateShapePoints(
  shape: string,
  width: number,
  height: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const segments = 32;
  
  switch (shape) {
    case "bone": {
      const endRadius = height * 0.35;
      const bodyWidth = width - endRadius * 2;
      
      for (let i = 0; i <= segments / 4; i++) {
        const angle = -Math.PI / 2 + (i / (segments / 4)) * Math.PI;
        points.push({
          x: bodyWidth / 2 + Math.cos(angle) * endRadius,
          y: Math.sin(angle) * endRadius * 0.7,
        });
      }
      for (let i = 0; i <= segments / 4; i++) {
        const angle = Math.PI / 2 + (i / (segments / 4)) * Math.PI;
        points.push({
          x: -bodyWidth / 2 + Math.cos(angle) * endRadius,
          y: Math.sin(angle) * endRadius * 0.7,
        });
      }
      break;
    }
    
    case "round": {
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * width / 2,
          y: Math.sin(angle) * height / 2,
        });
      }
      break;
    }
    
    case "heart": {
      for (let i = 0; i < segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        points.push({
          x: (x / 16) * width / 2,
          y: (y / 16) * height / 2,
        });
      }
      break;
    }
    
    case "rectangle": {
      const r = Math.min(2, width * 0.1, height * 0.1);
      const hw = width / 2 - r;
      const hh = height / 2 - r;
      const cornerSegs = 4;
      
      for (let i = 0; i <= cornerSegs; i++) {
        const angle = (i / cornerSegs) * Math.PI / 2;
        points.push({ x: hw + Math.cos(angle) * r, y: hh + Math.sin(angle) * r });
      }
      for (let i = 0; i <= cornerSegs; i++) {
        const angle = Math.PI / 2 + (i / cornerSegs) * Math.PI / 2;
        points.push({ x: -hw + Math.cos(angle) * r, y: hh + Math.sin(angle) * r });
      }
      for (let i = 0; i <= cornerSegs; i++) {
        const angle = Math.PI + (i / cornerSegs) * Math.PI / 2;
        points.push({ x: -hw + Math.cos(angle) * r, y: -hh + Math.sin(angle) * r });
      }
      for (let i = 0; i <= cornerSegs; i++) {
        const angle = Math.PI * 1.5 + (i / cornerSegs) * Math.PI / 2;
        points.push({ x: hw + Math.cos(angle) * r, y: -hh + Math.sin(angle) * r });
      }
      break;
    }
    
    case "military": {
      const notch = height * 0.15;
      points.push({ x: -width / 2 + notch, y: height / 2 });
      points.push({ x: width / 2 - notch, y: height / 2 });
      points.push({ x: width / 2, y: height / 2 - notch });
      points.push({ x: width / 2, y: -height / 2 + notch });
      points.push({ x: width / 2 - notch, y: -height / 2 });
      points.push({ x: -width / 2 + notch, y: -height / 2 });
      points.push({ x: -width / 2, y: -height / 2 + notch });
      points.push({ x: -width / 2, y: height / 2 - notch });
      break;
    }
    
    case "paw": {
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * width * 0.4,
          y: Math.sin(angle) * height * 0.4,
        });
      }
      break;
    }
    
    default:
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * width / 2,
          y: Math.sin(angle) * height / 2,
        });
      }
  }
  
  return points;
}

function createSTLBuffer(triangles: Triangle[], headerText: string): Buffer {
  const headerSize = 80;
  const triangleCount = triangles.length;
  const bufferSize = headerSize + 4 + triangleCount * 50;
  
  const buffer = Buffer.alloc(bufferSize);
  
  const header = `STL Export - ${headerText}`.substring(0, 79);
  buffer.write(header, 0, 80, "ascii");
  buffer.writeUInt32LE(triangleCount, 80);
  
  let offset = 84;
  for (const tri of triangles) {
    buffer.writeFloatLE(tri.normal[0], offset);
    buffer.writeFloatLE(tri.normal[1], offset + 4);
    buffer.writeFloatLE(tri.normal[2], offset + 8);
    offset += 12;
    
    for (const vertex of tri.vertices) {
      buffer.writeFloatLE(vertex[0], offset);
      buffer.writeFloatLE(vertex[1], offset + 4);
      buffer.writeFloatLE(vertex[2], offset + 8);
      offset += 12;
    }
    
    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }
  
  return buffer;
}

// Legacy function for backwards compatibility
export function generatePetTagSTL(settings: PetTagSettings): Buffer {
  const parts = generatePetTagV2(settings);
  if (parts.length > 0) {
    return parts[0].content;
  }
  // Fallback to empty STL
  return createSTLBuffer([], "Empty Pet Tag");
}
