import type { LetterSettings, WiringSettings, MountingSettings, GeometrySettings } from "@shared/schema";

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

interface GeneratedPart {
  name: string;
  triangles: Triangle[];
  material: string;
}

function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function calculateNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const edge1 = subtract(v2, v1);
  const edge2 = subtract(v3, v1);
  return normalize(cross(edge1, edge2));
}

function generateBoxTriangles(
  width: number,
  height: number,
  depth: number,
  offsetX: number = 0,
  offsetY: number = 0,
  offsetZ: number = 0
): Triangle[] {
  const triangles: Triangle[] = [];
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  const vertices = [
    { x: -hw + offsetX, y: -hh + offsetY, z: -hd + offsetZ },
    { x: hw + offsetX, y: -hh + offsetY, z: -hd + offsetZ },
    { x: hw + offsetX, y: hh + offsetY, z: -hd + offsetZ },
    { x: -hw + offsetX, y: hh + offsetY, z: -hd + offsetZ },
    { x: -hw + offsetX, y: -hh + offsetY, z: hd + offsetZ },
    { x: hw + offsetX, y: -hh + offsetY, z: hd + offsetZ },
    { x: hw + offsetX, y: hh + offsetY, z: hd + offsetZ },
    { x: -hw + offsetX, y: hh + offsetY, z: hd + offsetZ },
  ];

  const faces = [
    [0, 1, 2, 3],
    [5, 4, 7, 6],
    [4, 0, 3, 7],
    [1, 5, 6, 2],
    [4, 5, 1, 0],
    [3, 2, 6, 7],
  ];

  for (const face of faces) {
    const v0 = vertices[face[0]];
    const v1 = vertices[face[1]];
    const v2 = vertices[face[2]];
    const v3 = vertices[face[3]];

    const normal1 = calculateNormal(v0, v1, v2);
    triangles.push({ normal: normal1, v1: v0, v2: v1, v3: v2 });

    const normal2 = calculateNormal(v0, v2, v3);
    triangles.push({ normal: normal2, v1: v0, v2: v2, v3: v3 });
  }

  return triangles;
}

function generateCylinderTriangles(
  radius: number,
  height: number,
  segments: number,
  offsetX: number = 0,
  offsetY: number = 0,
  offsetZ: number = 0,
  rotateX: boolean = false
): Triangle[] {
  const triangles: Triangle[] = [];
  const hh = height / 2;

  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;

    const cos1 = Math.cos(angle1);
    const sin1 = Math.sin(angle1);
    const cos2 = Math.cos(angle2);
    const sin2 = Math.sin(angle2);

    let p1: Vector3, p2: Vector3, p3: Vector3, p4: Vector3;
    let top: Vector3, bottom: Vector3;

    if (rotateX) {
      p1 = { x: offsetX, y: radius * cos1 + offsetY, z: -hh + offsetZ };
      p2 = { x: offsetX, y: radius * cos2 + offsetY, z: -hh + offsetZ };
      p3 = { x: offsetX, y: radius * cos2 + offsetY, z: hh + offsetZ };
      p4 = { x: offsetX, y: radius * cos1 + offsetY, z: hh + offsetZ };
      top = { x: offsetX, y: offsetY, z: hh + offsetZ };
      bottom = { x: offsetX, y: offsetY, z: -hh + offsetZ };
    } else {
      p1 = { x: radius * cos1 + offsetX, y: -hh + offsetY, z: radius * sin1 + offsetZ };
      p2 = { x: radius * cos2 + offsetX, y: -hh + offsetY, z: radius * sin2 + offsetZ };
      p3 = { x: radius * cos2 + offsetX, y: hh + offsetY, z: radius * sin2 + offsetZ };
      p4 = { x: radius * cos1 + offsetX, y: hh + offsetY, z: radius * sin1 + offsetZ };
      top = { x: offsetX, y: hh + offsetY, z: offsetZ };
      bottom = { x: offsetX, y: -hh + offsetY, z: offsetZ };
    }

    const sideNormal1 = calculateNormal(p1, p2, p3);
    triangles.push({ normal: sideNormal1, v1: p1, v2: p2, v3: p3 });
    const sideNormal2 = calculateNormal(p1, p3, p4);
    triangles.push({ normal: sideNormal2, v1: p1, v2: p3, v3: p4 });

    const topNormal = calculateNormal(top, p4, p3);
    triangles.push({ normal: topNormal, v1: top, v2: p4, v3: p3 });
    const bottomNormal = calculateNormal(bottom, p2, p1);
    triangles.push({ normal: bottomNormal, v1: bottom, v2: p2, v3: p1 });
  }

  return triangles;
}

function trianglesToSTL(triangles: Triangle[], header: string = "SignCraft 3D STL Export"): Buffer {
  const headerSize = 80;
  const triangleCountSize = 4;
  const triangleSize = 50;
  const bufferSize = headerSize + triangleCountSize + triangles.length * triangleSize;

  const buffer = Buffer.alloc(bufferSize);
  let offset = 0;

  buffer.write(header, 0, "ascii");
  offset = headerSize;

  buffer.writeUInt32LE(triangles.length, offset);
  offset += 4;

  for (const tri of triangles) {
    buffer.writeFloatLE(tri.normal.x, offset);
    buffer.writeFloatLE(tri.normal.y, offset + 4);
    buffer.writeFloatLE(tri.normal.z, offset + 8);
    offset += 12;

    buffer.writeFloatLE(tri.v1.x, offset);
    buffer.writeFloatLE(tri.v1.y, offset + 4);
    buffer.writeFloatLE(tri.v1.z, offset + 8);
    offset += 12;

    buffer.writeFloatLE(tri.v2.x, offset);
    buffer.writeFloatLE(tri.v2.y, offset + 4);
    buffer.writeFloatLE(tri.v2.z, offset + 8);
    offset += 12;

    buffer.writeFloatLE(tri.v3.x, offset);
    buffer.writeFloatLE(tri.v3.y, offset + 4);
    buffer.writeFloatLE(tri.v3.z, offset + 8);
    offset += 12;

    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }

  return buffer;
}

function trianglesToOBJ(triangles: Triangle[], objectName: string = "signage"): string {
  const vertices: Vector3[] = [];
  const vertexIndices: Map<string, number> = new Map();
  const faces: number[][] = [];

  function getVertexIndex(v: Vector3): number {
    const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
    if (vertexIndices.has(key)) {
      return vertexIndices.get(key)!;
    }
    const index = vertices.length + 1;
    vertices.push(v);
    vertexIndices.set(key, index);
    return index;
  }

  for (const tri of triangles) {
    const i1 = getVertexIndex(tri.v1);
    const i2 = getVertexIndex(tri.v2);
    const i3 = getVertexIndex(tri.v3);
    faces.push([i1, i2, i3]);
  }

  let obj = "# SignCraft 3D OBJ Export\n";
  obj += `# Vertices: ${vertices.length}\n`;
  obj += `# Faces: ${faces.length}\n\n`;
  obj += `o ${objectName}\n`;

  for (const v of vertices) {
    obj += `v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}\n`;
  }

  obj += "\n";

  for (const face of faces) {
    obj += `f ${face[0]} ${face[1]} ${face[2]}\n`;
  }

  return obj;
}

function generateLetterGeometry(
  text: string,
  scale: number,
  letterHeight: number,
  zOffset: number
): Triangle[] {
  const triangles: Triangle[] = [];
  const charWidth = 30;
  const charHeightBase = 45;
  const spacing = 5;

  for (let i = 0; i < text.length; i++) {
    const charOffset = (i - (text.length - 1) / 2) * (charWidth + spacing) * scale;

    const letterTriangles = generateBoxTriangles(
      charWidth * scale,
      charHeightBase * scale,
      letterHeight,
      charOffset,
      0,
      zOffset + letterHeight / 2
    );
    triangles.push(...letterTriangles);
  }

  return triangles;
}

function generateBackingPlate(
  text: string,
  scale: number,
  backingThickness: number,
  paddingX: number = 10,
  paddingY: number = 8
): Triangle[] {
  const charWidth = 30;
  const charHeight = 45;
  const spacing = 5;

  const totalWidth = (text.length * (charWidth + spacing) - spacing) * scale + paddingX * 2;
  const totalHeight = charHeight * scale + paddingY * 2;

  return generateBoxTriangles(
    totalWidth,
    totalHeight,
    backingThickness,
    0,
    0,
    -backingThickness / 2
  );
}

function generateStencilCutouts(
  text: string,
  scale: number,
  backingThickness: number,
  paddingX: number = 10,
  paddingY: number = 8
): { backing: Triangle[]; cutouts: Triangle[] } {
  const charWidth = 30;
  const charHeight = 45;
  const spacing = 5;

  const totalWidth = (text.length * (charWidth + spacing) - spacing) * scale + paddingX * 2;
  const totalHeight = charHeight * scale + paddingY * 2;

  const backing = generateBoxTriangles(
    totalWidth,
    totalHeight,
    backingThickness,
    0,
    0,
    0
  );

  const cutouts: Triangle[] = [];
  for (let i = 0; i < text.length; i++) {
    const charOffset = (i - (text.length - 1) / 2) * (charWidth + spacing) * scale;
    const cutoutTriangles = generateBoxTriangles(
      charWidth * scale * 0.85,
      charHeight * scale * 0.85,
      backingThickness + 2,
      charOffset,
      0,
      0
    );
    cutouts.push(...cutoutTriangles);
  }

  return { backing, cutouts };
}

export interface GeneratedSignage {
  parts: GeneratedPart[];
  combined: Triangle[];
}

export function generateSignageParts(
  letterSettings: LetterSettings,
  geometrySettings: GeometrySettings,
  wiringSettings: WiringSettings,
  mountingSettings: MountingSettings
): GeneratedSignage {
  const parts: GeneratedPart[] = [];
  const text = letterSettings.text || "A";
  const scale = letterSettings.scale;
  
  const charWidth = 30;
  const charHeight = 45;
  const spacing = 5;
  const paddingX = 10;
  const paddingY = 8;
  const totalWidth = (text.length * (charWidth + spacing) - spacing) * scale + paddingX * 2;
  const totalHeight = charHeight * scale + paddingY * 2;

  switch (geometrySettings.mode) {
    case "raised": {
      const backingTriangles = generateBackingPlate(
        text, 
        scale, 
        geometrySettings.backingThickness,
        paddingX,
        paddingY
      );
      parts.push({
        name: "backing",
        triangles: backingTriangles,
        material: geometrySettings.backingMaterial,
      });

      const letterZOffset = geometrySettings.letterOffset;
      const letterTriangles = generateLetterGeometry(
        text,
        scale,
        geometrySettings.letterHeight,
        letterZOffset
      );
      parts.push({
        name: "letters",
        triangles: letterTriangles,
        material: geometrySettings.letterMaterial,
      });
      break;
    }

    case "stencil": {
      const backingTriangles = generateBoxTriangles(
        totalWidth,
        totalHeight,
        geometrySettings.backingThickness,
        0,
        0,
        0
      );
      parts.push({
        name: "backing_with_cutouts",
        triangles: backingTriangles,
        material: geometrySettings.backingMaterial,
      });
      break;
    }

    case "layered": {
      const backingTriangles = generateBackingPlate(
        text,
        scale,
        geometrySettings.backingThickness,
        paddingX,
        paddingY
      );
      parts.push({
        name: "backing_plate",
        triangles: backingTriangles,
        material: geometrySettings.backingMaterial,
      });

      const letterTriangles = generateLetterGeometry(
        text,
        scale,
        geometrySettings.letterHeight,
        geometrySettings.backingThickness / 2 + geometrySettings.letterOffset
      );
      parts.push({
        name: "letters_separate",
        triangles: letterTriangles,
        material: geometrySettings.letterMaterial,
      });
      break;
    }

    case "flat":
    default: {
      const flatTriangles: Triangle[] = [];
      for (let i = 0; i < text.length; i++) {
        const charOffset = (i - (text.length - 1) / 2) * (charWidth + spacing) * scale;
        const letterTris = generateBoxTriangles(
          charWidth * scale,
          charHeight * scale,
          letterSettings.depth,
          charOffset,
          0,
          0
        );
        flatTriangles.push(...letterTris);
      }
      parts.push({
        name: "flat_letters",
        triangles: flatTriangles,
        material: geometrySettings.letterMaterial,
      });
      break;
    }
  }

  if (wiringSettings.channelType !== "none") {
    const channelRadius = wiringSettings.channelDiameter / 2;
    const channelWidth = totalWidth * 0.9;

    const yOffset =
      wiringSettings.channelType === "back"
        ? (-charHeight * scale) / 3
        : 0;
    const zOffset =
      wiringSettings.channelType === "back"
        ? -geometrySettings.backingThickness / 2 - channelRadius
        : geometrySettings.letterHeight / 2;

    const channelTriangles = generateCylinderTriangles(
      channelRadius,
      channelWidth,
      16,
      0,
      yOffset,
      zOffset,
      true
    );
    parts.push({
      name: "wiring_channel",
      triangles: channelTriangles,
      material: "opaque",
    });
  }

  if (mountingSettings.pattern !== "none") {
    const holeRadius = mountingSettings.holeDiameter / 2;
    const baseX = totalWidth / 2 - mountingSettings.insetFromEdge - paddingX;
    const baseY = totalHeight / 2 - mountingSettings.insetFromEdge - paddingY;

    const holePositions: [number, number][] = [];

    switch (mountingSettings.pattern) {
      case "2-point":
        holePositions.push([-baseX, 0], [baseX, 0]);
        break;
      case "4-corner":
        holePositions.push(
          [-baseX, baseY],
          [baseX, baseY],
          [-baseX, -baseY],
          [baseX, -baseY]
        );
        break;
      case "6-point":
        holePositions.push(
          [-baseX, baseY],
          [0, baseY],
          [baseX, baseY],
          [-baseX, -baseY],
          [0, -baseY],
          [baseX, -baseY]
        );
        break;
    }

    const holeTriangles: Triangle[] = [];
    for (const [x, y] of holePositions) {
      const holeTris = generateCylinderTriangles(
        holeRadius,
        mountingSettings.holeDepth,
        16,
        x,
        y,
        -geometrySettings.backingThickness / 2
      );
      holeTriangles.push(...holeTris);
    }
    
    if (holeTriangles.length > 0) {
      parts.push({
        name: "mounting_holes",
        triangles: holeTriangles,
        material: "opaque",
      });
    }
  }

  const combined = parts.flatMap(p => p.triangles);

  return { parts, combined };
}

export function generateSignage(
  letterSettings: LetterSettings,
  wiringSettings: WiringSettings,
  mountingSettings: MountingSettings,
  format: "stl" | "obj" | "3mf",
  geometrySettings?: GeometrySettings
): Buffer | string {
  const geo = geometrySettings || {
    mode: "flat" as const,
    letterHeight: letterSettings.depth,
    backingThickness: 5,
    letterOffset: 0,
    letterMaterial: "opaque" as const,
    backingMaterial: "opaque" as const,
    separateFiles: false,
  };

  const { combined } = generateSignageParts(letterSettings, geo, wiringSettings, mountingSettings);

  if (format === "obj") {
    return trianglesToOBJ(combined, letterSettings.text.replace(/\s/g, "_"));
  }

  return trianglesToSTL(combined);
}

export function generateMultiPartExport(
  letterSettings: LetterSettings,
  geometrySettings: GeometrySettings,
  wiringSettings: WiringSettings,
  mountingSettings: MountingSettings,
  format: "stl" | "obj"
): Map<string, Buffer | string> {
  const { parts } = generateSignageParts(letterSettings, geometrySettings, wiringSettings, mountingSettings);
  const files = new Map<string, Buffer | string>();

  const textSlug = letterSettings.text.replace(/\s/g, "_");

  for (const part of parts) {
    const filename = `${textSlug}_${part.name}_${part.material}.${format}`;
    
    if (format === "obj") {
      files.set(filename, trianglesToOBJ(part.triangles, part.name));
    } else {
      files.set(filename, trianglesToSTL(part.triangles, `SignCraft 3D - ${part.name}`));
    }
  }

  return files;
}
