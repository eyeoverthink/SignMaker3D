// Neon Shapes Generator - Creates 3D printable neon signs with Edison bulb bases
// Generates: 1) Neon tube shape, 2) Tube holder, 3) Base with mounting

import type { NeonShapesSettings } from "@shared/schema";
import { neonShapes, type NeonShapeType } from "@shared/neon-shapes";

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

function calcNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const edge1 = sub(v2, v1);
  const edge2 = sub(v3, v1);
  return normalize(cross(edge1, edge2));
}

// Convert triangles to STL binary format
function trianglesToSTL(triangles: Triangle[], name: string = "model"): Buffer {
  const headerSize = 80;
  const triangleSize = 50; // 12 floats * 4 bytes + 2 bytes attribute
  const bufferSize = headerSize + 4 + (triangles.length * triangleSize);
  const buffer = Buffer.alloc(bufferSize);

  // Write header
  buffer.write(name.substring(0, 80), 0, 80, "ascii");

  // Write triangle count
  buffer.writeUInt32LE(triangles.length, 80);

  // Write triangles
  let offset = 84;
  for (const tri of triangles) {
    buffer.writeFloatLE(tri.normal.x, offset); offset += 4;
    buffer.writeFloatLE(tri.normal.y, offset); offset += 4;
    buffer.writeFloatLE(tri.normal.z, offset); offset += 4;
    buffer.writeFloatLE(tri.v1.x, offset); offset += 4;
    buffer.writeFloatLE(tri.v1.y, offset); offset += 4;
    buffer.writeFloatLE(tri.v1.z, offset); offset += 4;
    buffer.writeFloatLE(tri.v2.x, offset); offset += 4;
    buffer.writeFloatLE(tri.v2.y, offset); offset += 4;
    buffer.writeFloatLE(tri.v2.z, offset); offset += 4;
    buffer.writeFloatLE(tri.v3.x, offset); offset += 4;
    buffer.writeFloatLE(tri.v3.y, offset); offset += 4;
    buffer.writeFloatLE(tri.v3.z, offset); offset += 4;
    buffer.writeUInt16LE(0, offset); offset += 2; // Attribute byte count
  }

  return buffer;
}

// Generate hollow tube along a path
function generateHollowTube(
  path: Array<{ x: number; y: number }>,
  outerDiameter: number,
  innerDiameter: number,
  zOffset: number,
  segments: number = 16
): Triangle[] {
  const triangles: Triangle[] = [];
  if (path.length < 2) return triangles;

  const path3D: Vector3[] = path.map(p => ({ x: p.x, y: p.y, z: zOffset }));
  const outerRadius = outerDiameter / 2;
  const innerRadius = innerDiameter / 2;

  const profiles: { outer: Vector3[], inner: Vector3[] }[] = [];
  let prevNormal: Vector3 = { x: 0, y: 0, z: 1 };

  // Generate circular profiles at each path point
  for (let i = 0; i < path3D.length; i++) {
    const p = path3D[i];
    
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
    const binormal = normalize(cross(tangent, normal));

    const outer: Vector3[] = [];
    const inner: Vector3[] = [];
    
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      outer.push({
        x: p.x + normal.x * cos * outerRadius + binormal.x * sin * outerRadius,
        y: p.y + normal.y * cos * outerRadius + binormal.y * sin * outerRadius,
        z: p.z + normal.z * cos * outerRadius + binormal.z * sin * outerRadius
      });
      
      inner.push({
        x: p.x + normal.x * cos * innerRadius + binormal.x * sin * innerRadius,
        y: p.y + normal.y * cos * innerRadius + binormal.y * sin * innerRadius,
        z: p.z + normal.z * cos * innerRadius + binormal.z * sin * innerRadius
      });
    }
    
    profiles.push({ outer, inner });
  }

  // Connect profiles with triangles
  for (let i = 0; i < profiles.length - 1; i++) {
    const p1 = profiles[i];
    const p2 = profiles[i + 1];
    
    for (let j = 0; j < segments; j++) {
      // Outer surface
      triangles.push({
        normal: calcNormal(p1.outer[j], p2.outer[j], p1.outer[j + 1]),
        v1: p1.outer[j], v2: p2.outer[j], v3: p1.outer[j + 1]
      });
      triangles.push({
        normal: calcNormal(p2.outer[j], p2.outer[j + 1], p1.outer[j + 1]),
        v1: p2.outer[j], v2: p2.outer[j + 1], v3: p1.outer[j + 1]
      });
      
      // Inner surface (reversed winding)
      triangles.push({
        normal: calcNormal(p1.inner[j], p1.inner[j + 1], p2.inner[j]),
        v1: p1.inner[j], v2: p1.inner[j + 1], v3: p2.inner[j]
      });
      triangles.push({
        normal: calcNormal(p1.inner[j + 1], p2.inner[j + 1], p2.inner[j]),
        v1: p1.inner[j + 1], v2: p2.inner[j + 1], v3: p2.inner[j]
      });
    }
  }

  // Cap ends
  for (let end = 0; end < 2; end++) {
    const profile = end === 0 ? profiles[0] : profiles[profiles.length - 1];
    const center = path3D[end === 0 ? 0 : path3D.length - 1];
    
    for (let j = 0; j < segments; j++) {
      if (end === 0) {
        triangles.push({
          normal: calcNormal(center, profile.inner[j], profile.inner[j + 1]),
          v1: center, v2: profile.inner[j], v3: profile.inner[j + 1]
        });
        triangles.push({
          normal: calcNormal(center, profile.outer[j + 1], profile.outer[j]),
          v1: center, v2: profile.outer[j + 1], v3: profile.outer[j]
        });
      } else {
        triangles.push({
          normal: calcNormal(center, profile.inner[j + 1], profile.inner[j]),
          v1: center, v2: profile.inner[j + 1], v3: profile.inner[j]
        });
        triangles.push({
          normal: calcNormal(center, profile.outer[j], profile.outer[j + 1]),
          v1: center, v2: profile.outer[j], v3: profile.outer[j + 1]
        });
      }
    }
  }

  return triangles;
}

// Generate cylindrical base
function generateBase(settings: NeonShapesSettings): Triangle[] {
  const triangles: Triangle[] = [];
  const segments = 64;
  const radius = settings.baseDiameter / 2;
  const height = settings.baseHeight;

  // Bottom circle
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const v1: Vector3 = { x: 0, y: 0, z: 0 };
    const v2: Vector3 = { x: Math.cos(angle1) * radius, y: Math.sin(angle1) * radius, z: 0 };
    const v3: Vector3 = { x: Math.cos(angle2) * radius, y: Math.sin(angle2) * radius, z: 0 };
    
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      v1, v2: v3, v3: v2
    });
  }

  // Side walls
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;
    
    const v1: Vector3 = { x: x1, y: y1, z: 0 };
    const v2: Vector3 = { x: x1, y: y1, z: height };
    const v3: Vector3 = { x: x2, y: y2, z: height };
    const v4: Vector3 = { x: x2, y: y2, z: 0 };
    
    triangles.push({
      normal: calcNormal(v1, v2, v3),
      v1, v2, v3
    });
    triangles.push({
      normal: calcNormal(v1, v3, v4),
      v1, v2: v3, v3: v4
    });
  }

  // Top circle (with hole for tube holder)
  const holeRadius = settings.tubeHolderDiameter / 2;
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const outerV1: Vector3 = { x: Math.cos(angle1) * radius, y: Math.sin(angle1) * radius, z: height };
    const outerV2: Vector3 = { x: Math.cos(angle2) * radius, y: Math.sin(angle2) * radius, z: height };
    const innerV1: Vector3 = { x: Math.cos(angle1) * holeRadius, y: Math.sin(angle1) * holeRadius, z: height };
    const innerV2: Vector3 = { x: Math.cos(angle2) * holeRadius, y: Math.sin(angle2) * holeRadius, z: height };
    
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: outerV1, v2: innerV1, v3: outerV2
    });
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      v1: innerV1, v2: innerV2, v3: outerV2
    });
  }

  // Mounting hole if enabled
  if (settings.mountingHole) {
    const holeDepth = height / 2;
    const holeDiameter = settings.mountingHoleDiameter;
    const holeSegments = 16;
    
    for (let i = 0; i < holeSegments; i++) {
      const angle1 = (i / holeSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / holeSegments) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * holeDiameter / 2;
      const y1 = Math.sin(angle1) * holeDiameter / 2;
      const x2 = Math.cos(angle2) * holeDiameter / 2;
      const y2 = Math.sin(angle2) * holeDiameter / 2;
      
      const v1: Vector3 = { x: x1, y: y1, z: 0 };
      const v2: Vector3 = { x: x1, y: y1, z: holeDepth };
      const v3: Vector3 = { x: x2, y: y2, z: holeDepth };
      const v4: Vector3 = { x: x2, y: y2, z: 0 };
      
      triangles.push({
        normal: calcNormal(v1, v3, v2),
        v1, v2: v3, v3: v2
      });
      triangles.push({
        normal: calcNormal(v1, v4, v3),
        v1, v2: v4, v3
      });
    }
  }

  return triangles;
}

// Main generator function
export function generateNeonShape(settings: NeonShapesSettings): ExportedPart[] {
  const parts: ExportedPart[] = [];
  
  console.log(`[Neon Shapes] Generating ${settings.shapeType}, size=${settings.size}mm`);
  
  const shapeData = neonShapes[settings.shapeType as NeonShapeType];
  if (!shapeData) {
    throw new Error(`Unknown shape type: ${settings.shapeType}`);
  }

  // Scale shape to requested size
  const scale = settings.size / 100; // Shapes are normalized to 100mm
  const zOffset = settings.baseHeight + settings.tubeHolderHeight;

  let allTubeTriangles: Triangle[] = [];

  // Generate neon tube for each path in the shape
  for (const shapePath of shapeData.paths) {
    const scaledPath = shapePath.points.map(p => ({
      x: p.x * scale,
      y: p.y * scale
    }));

    const innerDiameter = settings.ledChannel 
      ? settings.ledChannelDiameter 
      : settings.tubeDiameter * 0.6;

    const tubeTriangles = generateHollowTube(
      scaledPath,
      settings.tubeDiameter,
      innerDiameter,
      zOffset,
      16
    );

    allTubeTriangles.push(...tubeTriangles);
  }

  console.log(`[Neon Shapes] Generated ${allTubeTriangles.length} triangles for neon tube`);

  // Generate base
  const baseTriangles = generateBase(settings);
  console.log(`[Neon Shapes] Generated ${baseTriangles.length} triangles for base`);

  // Export neon tube
  const tubeContent = trianglesToSTL(allTubeTriangles, `${settings.shapeType} Neon Tube`);
  parts.push({
    filename: `neon_${settings.shapeType}_tube.stl`,
    content: tubeContent,
    partType: "neon_tube",
    material: "clear"
  });

  // Export base
  const baseContent = trianglesToSTL(baseTriangles, `${settings.shapeType} Base`);
  parts.push({
    filename: `neon_${settings.shapeType}_base.stl`,
    content: baseContent,
    partType: "base",
    material: "opaque"
  });

  return parts;
}
