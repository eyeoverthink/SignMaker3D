import type { PetTagSettings } from "@shared/schema";
import earcut from "earcut";

interface Triangle {
  vertices: [number, number, number][];
  normal: [number, number, number];
}

export function generatePetTagSTL(settings: PetTagSettings): Buffer {
  const triangles: Triangle[] = [];
  
  const {
    tagShape,
    tagWidth,
    tagHeight,
    tagThickness,
    ledChannelEnabled,
    ledChannelWidth,
    ledChannelDepth,
    holeEnabled,
    holeDiameter,
  } = settings;
  
  // Generate base shape outline points
  const shapePoints = generateShapePoints(tagShape, tagWidth, tagHeight);
  
  // Generate hole points if enabled
  const holeCenter = holeEnabled ? { x: 0, y: tagHeight / 2 - holeDiameter } : null;
  const holeRadius = holeEnabled ? holeDiameter / 2 : 0;
  
  // LED channel dimensions (clamped to fit inside tag)
  const channelLength = ledChannelEnabled ? Math.min(tagWidth * 0.6, tagWidth - 4) : 0;
  const channelWidth = ledChannelEnabled ? Math.min(ledChannelWidth, tagHeight * 0.3) : 0;
  const channelDepth = ledChannelEnabled ? Math.min(ledChannelDepth, tagThickness - 1) : 0;
  
  // Generate 3D mesh with proper CSG subtraction for holes and channels
  generateCompleteTag(
    triangles, 
    shapePoints, 
    tagThickness, 
    holeCenter, 
    holeRadius,
    ledChannelEnabled,
    channelLength,
    channelWidth,
    channelDepth
  );
  
  return createSTLBuffer(triangles);
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

function generateCompleteTag(
  triangles: Triangle[],
  outerPoints: { x: number; y: number }[],
  thickness: number,
  holeCenter: { x: number; y: number } | null,
  holeRadius: number,
  hasChannel: boolean,
  channelLength: number,
  channelWidth: number,
  channelDepth: number
): void {
  const holeSegments = 16;
  
  // Generate hole points (wound in opposite direction for subtraction)
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
  
  // Generate channel rectangle points (wound in opposite direction)
  let channelPoints: { x: number; y: number }[] = [];
  if (hasChannel && channelLength > 0 && channelWidth > 0) {
    const hl = channelLength / 2;
    const hw = channelWidth / 2;
    // Counter-clockwise for hole subtraction
    channelPoints = [
      { x: -hl, y: -hw },
      { x: -hl, y: hw },
      { x: hl, y: hw },
      { x: hl, y: -hw },
    ];
  }
  
  // === BOTTOM FACE (z=0) - Full solid with holes ===
  generateBottomFace(triangles, outerPoints, holePoints);
  
  // === TOP FACE (z=thickness) - With channel cutout if enabled ===
  if (hasChannel && channelPoints.length > 0) {
    // Top face has both hole and channel subtracted
    generateTopFaceWithChannel(triangles, outerPoints, holePoints, channelPoints, thickness);
    
    // Channel floor (z = thickness - channelDepth)
    const channelZ = thickness - channelDepth;
    generateChannelFloor(triangles, channelPoints, channelZ);
    
    // Channel walls
    generateChannelWalls(triangles, channelPoints, channelZ, thickness);
  } else {
    // Top face with just the hole
    generateTopFace(triangles, outerPoints, holePoints, thickness);
  }
  
  // === OUTER WALLS ===
  generateOuterWalls(triangles, outerPoints, thickness);
  
  // === HOLE WALLS (if present) ===
  if (holePoints.length > 0) {
    generateHoleWalls(triangles, holePoints, thickness);
  }
}

function generateBottomFace(
  triangles: Triangle[],
  outerPoints: { x: number; y: number }[],
  holePoints: { x: number; y: number }[]
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
  
  // Bottom face (z=0), reversed winding
  for (let i = 0; i < indices.length; i += 3) {
    const p0 = allPoints[indices[i]];
    const p1 = allPoints[indices[i + 1]];
    const p2 = allPoints[indices[i + 2]];
    
    triangles.push({
      vertices: [
        [p0.x, p0.y, 0],
        [p2.x, p2.y, 0],
        [p1.x, p1.y, 0],
      ],
      normal: [0, 0, -1],
    });
  }
}

function generateTopFace(
  triangles: Triangle[],
  outerPoints: { x: number; y: number }[],
  holePoints: { x: number; y: number }[],
  z: number
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
    
    triangles.push({
      vertices: [
        [p0.x, p0.y, z],
        [p1.x, p1.y, z],
        [p2.x, p2.y, z],
      ],
      normal: [0, 0, 1],
    });
  }
}

function generateTopFaceWithChannel(
  triangles: Triangle[],
  outerPoints: { x: number; y: number }[],
  holePoints: { x: number; y: number }[],
  channelPoints: { x: number; y: number }[],
  z: number
): void {
  const flatCoords: number[] = [];
  const holeIndices: number[] = [];
  
  // Outer ring
  for (const p of outerPoints) {
    flatCoords.push(p.x, p.y);
  }
  
  // Add attachment hole as first hole
  if (holePoints.length > 0) {
    holeIndices.push(outerPoints.length);
    for (const p of holePoints) {
      flatCoords.push(p.x, p.y);
    }
  }
  
  // Add channel as second hole
  const channelStartIdx = outerPoints.length + holePoints.length;
  holeIndices.push(channelStartIdx);
  for (const p of channelPoints) {
    flatCoords.push(p.x, p.y);
  }
  
  const indices = earcut(flatCoords, holeIndices.length > 0 ? holeIndices : undefined, 2);
  const allPoints = [...outerPoints, ...holePoints, ...channelPoints];
  
  for (let i = 0; i < indices.length; i += 3) {
    const p0 = allPoints[indices[i]];
    const p1 = allPoints[indices[i + 1]];
    const p2 = allPoints[indices[i + 2]];
    
    triangles.push({
      vertices: [
        [p0.x, p0.y, z],
        [p1.x, p1.y, z],
        [p2.x, p2.y, z],
      ],
      normal: [0, 0, 1],
    });
  }
}

function generateChannelFloor(
  triangles: Triangle[],
  channelPoints: { x: number; y: number }[],
  z: number
): void {
  // Simple rectangle triangulation
  const p0 = channelPoints[0];
  const p1 = channelPoints[1];
  const p2 = channelPoints[2];
  const p3 = channelPoints[3];
  
  triangles.push({
    vertices: [
      [p0.x, p0.y, z],
      [p1.x, p1.y, z],
      [p2.x, p2.y, z],
    ],
    normal: [0, 0, 1],
  });
  
  triangles.push({
    vertices: [
      [p0.x, p0.y, z],
      [p2.x, p2.y, z],
      [p3.x, p3.y, z],
    ],
    normal: [0, 0, 1],
  });
}

function generateChannelWalls(
  triangles: Triangle[],
  channelPoints: { x: number; y: number }[],
  bottomZ: number,
  topZ: number
): void {
  const n = channelPoints.length;
  
  for (let i = 0; i < n; i++) {
    const p1 = channelPoints[i];
    const p2 = channelPoints[(i + 1) % n];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) continue;
    
    // Normal points inward (toward center of channel)
    const nx = -dy / len;
    const ny = dx / len;
    
    triangles.push({
      vertices: [
        [p1.x, p1.y, topZ],
        [p2.x, p2.y, topZ],
        [p2.x, p2.y, bottomZ],
      ],
      normal: [nx, ny, 0],
    });
    
    triangles.push({
      vertices: [
        [p1.x, p1.y, topZ],
        [p2.x, p2.y, bottomZ],
        [p1.x, p1.y, bottomZ],
      ],
      normal: [nx, ny, 0],
    });
  }
}

function generateOuterWalls(
  triangles: Triangle[],
  points: { x: number; y: number }[],
  thickness: number
): void {
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) continue;
    
    const nx = dy / len;
    const ny = -dx / len;
    
    triangles.push({
      vertices: [
        [p1.x, p1.y, 0],
        [p2.x, p2.y, 0],
        [p2.x, p2.y, thickness],
      ],
      normal: [nx, ny, 0],
    });
    
    triangles.push({
      vertices: [
        [p1.x, p1.y, 0],
        [p2.x, p2.y, thickness],
        [p1.x, p1.y, thickness],
      ],
      normal: [nx, ny, 0],
    });
  }
}

function generateHoleWalls(
  triangles: Triangle[],
  holePoints: { x: number; y: number }[],
  thickness: number
): void {
  const n = holePoints.length;
  
  for (let i = 0; i < n; i++) {
    const p1 = holePoints[i];
    const p2 = holePoints[(i + 1) % n];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) continue;
    
    // Normal points inward for hole
    const nx = -dy / len;
    const ny = dx / len;
    
    triangles.push({
      vertices: [
        [p1.x, p1.y, thickness],
        [p2.x, p2.y, thickness],
        [p2.x, p2.y, 0],
      ],
      normal: [nx, ny, 0],
    });
    
    triangles.push({
      vertices: [
        [p1.x, p1.y, thickness],
        [p2.x, p2.y, 0],
        [p1.x, p1.y, 0],
      ],
      normal: [nx, ny, 0],
    });
  }
}

function createSTLBuffer(triangles: Triangle[]): Buffer {
  const headerSize = 80;
  const triangleCount = triangles.length;
  const bufferSize = headerSize + 4 + triangleCount * 50;
  
  const buffer = Buffer.alloc(bufferSize);
  
  buffer.write("Binary STL - Pet Tag Generated by SignCraft 3D", 0, 80, "ascii");
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
