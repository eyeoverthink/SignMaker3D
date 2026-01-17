// Framed diffuser cap generator for modular panels
// Creates a full-panel diffuser with frame and optional snap-fit clips

import type { ModularShapeType } from "@shared/schema";

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

function generatePolygonVertices(sides: number, edgeLength: number): number[][] {
  const angle = (2 * Math.PI) / sides;
  const circumradius = edgeLength / (2 * Math.sin(Math.PI / sides));
  const vertices: number[][] = [];
  
  for (let i = 0; i < sides; i++) {
    const a = angle * i - Math.PI / 2;
    vertices.push([
      circumradius * Math.cos(a),
      circumradius * Math.sin(a)
    ]);
  }
  return vertices;
}

// Create a framed diffuser cap that covers the entire panel
export function createFramedDiffuserCap(
  shapeType: ModularShapeType,
  edgeLength: number,
  frameWidth: number,
  capThickness: number,
  wallHeight: number,
  baseThickness: number,
  addSnapFit: boolean
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // Determine number of sides
  const sidesMap: Record<ModularShapeType, number> = {
    hexagon: 6,
    triangle: 3,
    square: 4,
    pentagon: 5,
    octagon: 8,
  };
  const sides = sidesMap[shapeType];
  
  // Generate outer polygon (full panel size)
  const outerVertices = generatePolygonVertices(sides, edgeLength);
  
  // Generate inner polygon (diffuser area - frame width inset)
  const innerEdgeLength = edgeLength - (frameWidth * 2 * Math.sin(Math.PI / sides) * 2);
  const innerVertices = generatePolygonVertices(sides, Math.max(10, innerEdgeLength));
  
  // Cap sits on top of the walls
  const capBottomZ = baseThickness + wallHeight;
  const capTopZ = capBottomZ + capThickness;
  
  // Create frame (outer polygon with inner hole)
  for (let i = 0; i < sides; i++) {
    const nextI = (i + 1) % sides;
    
    const outerV1 = outerVertices[i];
    const outerV2 = outerVertices[nextI];
    const innerV1 = innerVertices[i];
    const innerV2 = innerVertices[nextI];
    
    // Top surface - frame face
    // Outer edge to inner edge quad (2 triangles)
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: { x: outerV1[0], y: outerV1[1], z: capTopZ },
      v2: { x: outerV2[0], y: outerV2[1], z: capTopZ },
      v3: { x: innerV1[0], y: innerV1[1], z: capTopZ }
    });
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: { x: outerV2[0], y: outerV2[1], z: capTopZ },
      v2: { x: innerV2[0], y: innerV2[1], z: capTopZ },
      v3: { x: innerV1[0], y: innerV1[1], z: capTopZ }
    });
    
    // Bottom surface - frame underside
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: { x: outerV1[0], y: outerV1[1], z: capBottomZ },
      v2: { x: innerV1[0], y: innerV1[1], z: capBottomZ },
      v3: { x: outerV2[0], y: outerV2[1], z: capBottomZ }
    });
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: { x: outerV2[0], y: outerV2[1], z: capBottomZ },
      v2: { x: innerV1[0], y: innerV1[1], z: capBottomZ },
      v3: { x: innerV2[0], y: innerV2[1], z: capBottomZ }
    });
    
    // Outer edge wall
    const outerBottom1 = { x: outerV1[0], y: outerV1[1], z: capBottomZ };
    const outerBottom2 = { x: outerV2[0], y: outerV2[1], z: capBottomZ };
    const outerTop1 = { x: outerV1[0], y: outerV1[1], z: capTopZ };
    const outerTop2 = { x: outerV2[0], y: outerV2[1], z: capTopZ };
    
    triangles.push({
      normal: calcNormal(outerBottom1, outerTop1, outerBottom2),
      v1: outerBottom1, v2: outerTop1, v3: outerBottom2
    });
    triangles.push({
      normal: calcNormal(outerTop1, outerTop2, outerBottom2),
      v1: outerTop1, v2: outerTop2, v3: outerBottom2
    });
    
    // Inner edge wall (diffuser opening)
    const innerBottom1 = { x: innerV1[0], y: innerV1[1], z: capBottomZ };
    const innerBottom2 = { x: innerV2[0], y: innerV2[1], z: capBottomZ };
    const innerTop1 = { x: innerV1[0], y: innerV1[1], z: capTopZ };
    const innerTop2 = { x: innerV2[0], y: innerV2[1], z: capTopZ };
    
    triangles.push({
      normal: calcNormal(innerBottom1, innerBottom2, innerTop1),
      v1: innerBottom1, v2: innerBottom2, v3: innerTop1
    });
    triangles.push({
      normal: calcNormal(innerTop1, innerBottom2, innerTop2),
      v1: innerTop1, v2: innerBottom2, v3: innerTop2
    });
  }
  
  // Add snap-fit clips if enabled
  if (addSnapFit) {
    const clipTriangles = createSnapFitClips(
      outerVertices,
      capBottomZ,
      capThickness,
      frameWidth
    );
    triangles.push(...clipTriangles);
  }
  
  console.log(`[Framed Diffuser] Generated ${triangles.length} triangles for ${shapeType} panel`);
  
  return triangles;
}

// Create snap-fit clips on the underside of the frame
function createSnapFitClips(
  vertices: number[][],
  capBottomZ: number,
  capThickness: number,
  frameWidth: number
): Triangle[] {
  const triangles: Triangle[] = [];
  const sides = vertices.length;
  
  // Add a clip on each edge
  for (let i = 0; i < sides; i++) {
    const nextI = (i + 1) % sides;
    const v1 = vertices[i];
    const v2 = vertices[nextI];
    
    // Midpoint of edge
    const midX = (v1[0] + v2[0]) / 2;
    const midY = (v1[1] + v2[1]) / 2;
    
    // Edge direction
    const edgeX = v2[0] - v1[0];
    const edgeY = v2[1] - v1[1];
    const edgeLen = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
    const edgeDirX = edgeX / edgeLen;
    const edgeDirY = edgeY / edgeLen;
    
    // Perpendicular (pointing inward)
    const perpX = -edgeDirY;
    const perpY = edgeDirX;
    
    // Clip dimensions
    const clipWidth = Math.min(8, frameWidth * 0.8);
    const clipDepth = 1.5; // How far the clip extends down
    const clipHeight = 0.8; // Thickness of the clip
    const clipInset = frameWidth * 0.3; // How far inward from edge
    
    // Clip base position (on underside of frame)
    const clipBaseZ = capBottomZ - clipDepth;
    const clipTopZ = capBottomZ - clipDepth + clipHeight;
    
    // Clip vertices
    const clipCenter = {
      x: midX + perpX * clipInset,
      y: midY + perpY * clipInset
    };
    
    const halfClipWidth = clipWidth / 2;
    
    const c1 = { x: clipCenter.x - edgeDirX * halfClipWidth, y: clipCenter.y - edgeDirY * halfClipWidth };
    const c2 = { x: clipCenter.x + edgeDirX * halfClipWidth, y: clipCenter.y + edgeDirY * halfClipWidth };
    
    // Create simple rectangular clip
    const clipBottomLeft = { x: c1.x, y: c1.y, z: clipBaseZ };
    const clipBottomRight = { x: c2.x, y: c2.y, z: clipBaseZ };
    const clipTopLeft = { x: c1.x, y: c1.y, z: clipTopZ };
    const clipTopRight = { x: c2.x, y: c2.y, z: clipTopZ };
    
    // Bottom face
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1: clipBottomLeft,
      v2: clipBottomRight,
      v3: { x: clipCenter.x, y: clipCenter.y, z: clipBaseZ }
    });
    
    // Top face
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: clipTopLeft,
      v2: { x: clipCenter.x, y: clipCenter.y, z: clipTopZ },
      v3: clipTopRight
    });
    
    // Side faces
    triangles.push({
      normal: calcNormal(clipBottomLeft, clipTopLeft, clipBottomRight),
      v1: clipBottomLeft, v2: clipTopLeft, v3: clipBottomRight
    });
    triangles.push({
      normal: calcNormal(clipTopLeft, clipTopRight, clipBottomRight),
      v1: clipTopLeft, v2: clipTopRight, v3: clipBottomRight
    });
  }
  
  return triangles;
}
