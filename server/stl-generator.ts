import type { LetterSettings, WiringSettings, MountingSettings, GeometrySettings, TubeSettings } from "@shared/schema";
import { defaultTubeSettings } from "@shared/schema";
import opentype from "opentype.js";
import earcut from "earcut";
import path from "path";
import fs from "fs";

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

const fontCache: Map<string, opentype.Font> = new Map();

const fontFileMap: Record<string, string> = {
  "inter": "Inter-Bold.ttf",
  "roboto": "Roboto-Bold.ttf",
  "poppins": "Poppins-Bold.ttf",
  "montserrat": "Montserrat-Bold.ttf",
  "open-sans": "OpenSans-Bold.ttf",
  "playfair": "PlayfairDisplay-Bold.ttf",
  "merriweather": "Merriweather-Bold.ttf",
  "lora": "Lora-Bold.ttf",
  "space-grotesk": "SpaceGrotesk-Bold.ttf",
  "outfit": "Outfit-Bold.ttf",
  "architects-daughter": "ArchitectsDaughter-Regular.ttf",
  "oxanium": "Oxanium-Bold.ttf",
};

function loadFontSync(fontId: string = "roboto"): opentype.Font {
  if (fontCache.has(fontId)) {
    return fontCache.get(fontId)!;
  }
  
  const fontFileName = fontFileMap[fontId] || "Roboto-Bold.ttf";
  const fontPath = path.join(process.cwd(), "server/fonts", fontFileName);
  
  if (!fs.existsSync(fontPath)) {
    console.warn(`Font file not found: ${fontPath}, falling back to Roboto`);
    const fallbackPath = path.join(process.cwd(), "server/fonts/Roboto-Bold.ttf");
    if (!fs.existsSync(fallbackPath)) {
      throw new Error(`Default font file not found at ${fallbackPath}`);
    }
    const buffer = fs.readFileSync(fallbackPath);
    const font = opentype.parse(buffer.buffer as ArrayBuffer);
    fontCache.set(fontId, font);
    return font;
  }
  
  const buffer = fs.readFileSync(fontPath);
  const font = opentype.parse(buffer.buffer as ArrayBuffer);
  fontCache.set(fontId, font);
  return font;
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

function pathToContours(fontPath: opentype.Path): number[][] {
  const contours: number[][] = [];
  let currentContour: number[] = [];
  const curveSteps = 8;

  for (const cmd of fontPath.commands) {
    switch (cmd.type) {
      case "M":
        if (currentContour.length > 0) {
          contours.push(currentContour);
        }
        currentContour = [cmd.x, cmd.y];
        break;

      case "L":
        currentContour.push(cmd.x, cmd.y);
        break;

      case "Q": {
        const lastX = currentContour[currentContour.length - 2];
        const lastY = currentContour[currentContour.length - 1];
        for (let i = 1; i <= curveSteps; i++) {
          const t = i / curveSteps;
          const mt = 1 - t;
          const x = mt * mt * lastX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
          const y = mt * mt * lastY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
          currentContour.push(x, y);
        }
        break;
      }

      case "C": {
        const cLastX = currentContour[currentContour.length - 2];
        const cLastY = currentContour[currentContour.length - 1];
        for (let i = 1; i <= curveSteps; i++) {
          const t = i / curveSteps;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          const t2 = t * t;
          const t3 = t2 * t;
          const x = mt3 * cLastX + 3 * mt2 * t * cmd.x1 + 3 * mt * t2 * cmd.x2 + t3 * cmd.x;
          const y = mt3 * cLastY + 3 * mt2 * t * cmd.y1 + 3 * mt * t2 * cmd.y2 + t3 * cmd.y;
          currentContour.push(x, y);
        }
        break;
      }

      case "Z":
        break;
    }
  }

  if (currentContour.length > 0) {
    contours.push(currentContour);
  }

  return contours;
}

function triangulateContours(contours: number[][]): { vertices: number[]; indices: number[] } {
  if (contours.length === 0) return { vertices: [], indices: [] };

  const vertices = [...contours[0]];
  const holes: number[] = [];

  let offset = vertices.length / 2;
  for (let i = 1; i < contours.length; i++) {
    holes.push(offset);
    vertices.push(...contours[i]);
    offset += contours[i].length / 2;
  }

  const indices = earcut(vertices, holes);
  return { vertices, indices };
}

function getBoundaryEdges(vertices: number[], indices: number[]): number[][] {
  const edgeCount = new Map<string, { count: number; a: number; b: number }>();

  for (let i = 0; i < indices.length; i += 3) {
    const edges = [
      [indices[i], indices[i + 1]],
      [indices[i + 1], indices[i + 2]],
      [indices[i + 2], indices[i]],
    ];

    for (const [a, b] of edges) {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const existing = edgeCount.get(key);
      if (existing) {
        existing.count++;
      } else {
        edgeCount.set(key, { count: 1, a, b });
      }
    }
  }

  const boundaryEdges: number[][] = [];
  edgeCount.forEach(({ count, a, b }) => {
    if (count === 1) {
      boundaryEdges.push([a, b]);
    }
  });

  return boundaryEdges;
}

function orderBoundaryEdges(edges: number[][]): number[][] {
  if (edges.length === 0) return [];

  const contours: number[][] = [];
  const usedEdges = new Set<number>();
  
  while (usedEdges.size < edges.length) {
    let startIdx = -1;
    for (let i = 0; i < edges.length; i++) {
      if (!usedEdges.has(i)) {
        startIdx = i;
        break;
      }
    }
    
    if (startIdx === -1) break;
    
    const contour: number[] = [];
    let currentIdx = startIdx;
    let currentVertex = edges[currentIdx][0];
    contour.push(currentVertex);
    
    while (true) {
      usedEdges.add(currentIdx);
      const edge = edges[currentIdx];
      const nextVertex = edge[0] === currentVertex ? edge[1] : edge[0];
      
      if (nextVertex === contour[0] && contour.length > 2) {
        break;
      }
      
      contour.push(nextVertex);
      currentVertex = nextVertex;
      
      let foundNext = false;
      for (let i = 0; i < edges.length; i++) {
        if (!usedEdges.has(i)) {
          if (edges[i][0] === currentVertex || edges[i][1] === currentVertex) {
            currentIdx = i;
            foundNext = true;
            break;
          }
        }
      }
      
      if (!foundNext) break;
    }
    
    contours.push(contour);
  }
  
  return contours;
}

function extrudeToTriangles(
  vertices2D: number[],
  indices: number[],
  depth: number,
  offsetX: number = 0,
  offsetY: number = 0,
  offsetZ: number = 0
): Triangle[] {
  const triangles: Triangle[] = [];
  const numVerts = vertices2D.length / 2;

  const frontVertices: Vector3[] = [];
  const backVertices: Vector3[] = [];

  for (let i = 0; i < vertices2D.length; i += 2) {
    frontVertices.push({
      x: vertices2D[i] + offsetX,
      y: vertices2D[i + 1] + offsetY,
      z: offsetZ,
    });
    backVertices.push({
      x: vertices2D[i] + offsetX,
      y: vertices2D[i + 1] + offsetY,
      z: offsetZ + depth,
    });
  }

  for (let i = 0; i < indices.length; i += 3) {
    const v1 = frontVertices[indices[i]];
    const v2 = frontVertices[indices[i + 1]];
    const v3 = frontVertices[indices[i + 2]];
    const normal = calculateNormal(v1, v2, v3);
    triangles.push({ normal, v1, v2, v3 });
  }

  for (let i = 0; i < indices.length; i += 3) {
    const v1 = backVertices[indices[i + 2]];
    const v2 = backVertices[indices[i + 1]];
    const v3 = backVertices[indices[i]];
    const normal = calculateNormal(v1, v2, v3);
    triangles.push({ normal, v1, v2, v3 });
  }

  const boundaryEdges = getBoundaryEdges(vertices2D, indices);
  const orderedContours = orderBoundaryEdges(boundaryEdges);

  for (const contour of orderedContours) {
    for (let i = 0; i < contour.length; i++) {
      const curr = contour[i];
      const next = contour[(i + 1) % contour.length];

      const v1 = frontVertices[curr];
      const v2 = frontVertices[next];
      const v3 = backVertices[curr];
      const v4 = backVertices[next];

      const normal1 = calculateNormal(v1, v2, v3);
      triangles.push({ normal: normal1, v1, v2, v3 });

      const normal2 = calculateNormal(v2, v4, v3);
      triangles.push({ normal: normal2, v1: v2, v2: v4, v3 });
    }
  }

  return triangles;
}

function getContourWinding(contour: number[]): number {
  let sum = 0;
  for (let i = 0; i < contour.length; i += 2) {
    const x1 = contour[i];
    const y1 = contour[i + 1];
    const x2 = contour[(i + 2) % contour.length];
    const y2 = contour[(i + 3) % contour.length];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum;
}

function isContourInside(inner: number[], outer: number[]): boolean {
  if (inner.length < 2) return false;
  const testX = inner[0];
  const testY = inner[1];
  
  let inside = false;
  for (let i = 0, j = outer.length - 2; i < outer.length; j = i, i += 2) {
    const xi = outer[i];
    const yi = outer[i + 1];
    const xj = outer[j];
    const yj = outer[j + 1];
    
    if (((yi > testY) !== (yj > testY)) && 
        (testX < (xj - xi) * (testY - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

function generateTextGeometry(
  text: string,
  fontSize: number,
  depth: number,
  offsetX: number = 0,
  offsetY: number = 0,
  offsetZ: number = 0,
  fontId: string = "roboto"
): Triangle[] {
  const font = loadFontSync(fontId);
  const allTriangles: Triangle[] = [];

  const glyphs = font.stringToGlyphs(text);
  let currentX = 0;
  
  const glyphData: { contours: number[][]; x: number }[] = [];
  
  for (const glyph of glyphs) {
    if (glyph.advanceWidth) {
      const glyphPath = glyph.getPath(currentX, 0, fontSize);
      const contours = pathToContours(glyphPath);
      if (contours.length > 0) {
        glyphData.push({ contours, x: currentX });
      }
      currentX += (glyph.advanceWidth / font.unitsPerEm) * fontSize;
    }
  }

  if (glyphData.length === 0) {
    return generateFallbackTextGeometry(text, fontSize, depth, offsetX, offsetY, offsetZ);
  }

  let globalMinX = Infinity, globalMaxX = -Infinity;
  let globalMinY = Infinity, globalMaxY = -Infinity;

  for (const { contours } of glyphData) {
    for (const contour of contours) {
      for (let i = 0; i < contour.length; i += 2) {
        globalMinX = Math.min(globalMinX, contour[i]);
        globalMaxX = Math.max(globalMaxX, contour[i]);
        globalMinY = Math.min(globalMinY, contour[i + 1]);
        globalMaxY = Math.max(globalMaxY, contour[i + 1]);
      }
    }
  }

  const centerX = (globalMinX + globalMaxX) / 2;
  const centerY = (globalMinY + globalMaxY) / 2;

  for (const { contours } of glyphData) {
    const outerContours: number[][] = [];
    const holeContours: number[][] = [];
    
    for (const contour of contours) {
      const winding = getContourWinding(contour);
      if (winding > 0) {
        holeContours.push(contour);
      } else {
        outerContours.push(contour);
      }
    }
    
    for (const outer of outerContours) {
      const holesForThisOuter: number[][] = [];
      for (const hole of holeContours) {
        if (isContourInside(hole, outer)) {
          holesForThisOuter.push(hole);
        }
      }
      
      const { vertices, indices } = triangulateContours([outer, ...holesForThisOuter]);
      
      if (indices.length > 0) {
        const centeredVertices: number[] = [];
        for (let i = 0; i < vertices.length; i += 2) {
          centeredVertices.push(
            vertices[i] - centerX,
            -(vertices[i + 1] - centerY)
          );
        }
        
        const letterTriangles = extrudeToTriangles(
          centeredVertices,
          indices,
          depth,
          offsetX,
          offsetY,
          offsetZ
        );
        allTriangles.push(...letterTriangles);
      }
    }
  }

  if (allTriangles.length === 0) {
    return generateFallbackTextGeometry(text, fontSize, depth, offsetX, offsetY, offsetZ);
  }

  return allTriangles;
}

function generateFallbackTextGeometry(
  text: string,
  fontSize: number,
  depth: number,
  offsetX: number,
  offsetY: number,
  offsetZ: number
): Triangle[] {
  const triangles: Triangle[] = [];
  const charWidth = fontSize * 0.6;
  const charHeight = fontSize;
  const spacing = fontSize * 0.1;
  const totalWidth = text.length * (charWidth + spacing) - spacing;
  const startX = -totalWidth / 2;

  for (let i = 0; i < text.length; i++) {
    const x = startX + i * (charWidth + spacing) + charWidth / 2 + offsetX;
    const boxTriangles = generateBoxTriangles(
      charWidth,
      charHeight,
      depth,
      x,
      offsetY,
      offsetZ + depth / 2
    );
    triangles.push(...boxTriangles);
  }

  return triangles;
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

function generateOrientedTubeSegment(
  radius: number,
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  segments: number = 8
): Triangle[] {
  const triangles: Triangle[] = [];
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (length < 0.001) return triangles;
  
  const dir = { x: dx / length, y: dy / length, z: dz / length };
  
  let perp1: { x: number; y: number; z: number };
  if (Math.abs(dir.z) < 0.9) {
    const temp = { x: 0, y: 0, z: 1 };
    perp1 = normalize(cross(dir, temp));
  } else {
    const temp = { x: 1, y: 0, z: 0 };
    perp1 = normalize(cross(dir, temp));
  }
  const perp2 = normalize(cross(dir, perp1));
  
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const cos1 = Math.cos(angle1);
    const sin1 = Math.sin(angle1);
    const cos2 = Math.cos(angle2);
    const sin2 = Math.sin(angle2);
    
    const p1 = {
      x: start.x + radius * (cos1 * perp1.x + sin1 * perp2.x),
      y: start.y + radius * (cos1 * perp1.y + sin1 * perp2.y),
      z: start.z + radius * (cos1 * perp1.z + sin1 * perp2.z),
    };
    const p2 = {
      x: start.x + radius * (cos2 * perp1.x + sin2 * perp2.x),
      y: start.y + radius * (cos2 * perp1.y + sin2 * perp2.y),
      z: start.z + radius * (cos2 * perp1.z + sin2 * perp2.z),
    };
    const p3 = {
      x: end.x + radius * (cos2 * perp1.x + sin2 * perp2.x),
      y: end.y + radius * (cos2 * perp1.y + sin2 * perp2.y),
      z: end.z + radius * (cos2 * perp1.z + sin2 * perp2.z),
    };
    const p4 = {
      x: end.x + radius * (cos1 * perp1.x + sin1 * perp2.x),
      y: end.y + radius * (cos1 * perp1.y + sin1 * perp2.y),
      z: end.z + radius * (cos1 * perp1.z + sin1 * perp2.z),
    };
    
    const normal1 = calculateNormal(p1, p2, p3);
    triangles.push({ normal: normal1, v1: p1, v2: p2, v3: p3 });
    
    const normal2 = calculateNormal(p1, p3, p4);
    triangles.push({ normal: normal2, v1: p1, v2: p3, v3: p4 });
    
    const startCenter = start;
    const endCenter = end;
    const startNormal = { x: -dir.x, y: -dir.y, z: -dir.z };
    triangles.push({ normal: startNormal, v1: startCenter, v2: p2, v3: p1 });
    
    const endNormal = dir;
    triangles.push({ normal: endNormal, v1: endCenter, v2: p4, v3: p3 });
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

    const bottomNormal = rotateX
      ? { x: 0, y: 0, z: -1 }
      : { x: 0, y: -1, z: 0 };
    triangles.push({ normal: bottomNormal, v1: bottom, v2: p2, v3: p1 });

    const topNormal = rotateX
      ? { x: 0, y: 0, z: 1 }
      : { x: 0, y: 1, z: 0 };
    triangles.push({ normal: topNormal, v1: top, v2: p4, v3: p3 });
  }

  return triangles;
}

function trianglesToSTL(triangles: Triangle[], solidName: string = "signage"): Buffer {
  const headerSize = 80;
  const triangleCount = triangles.length;
  const dataSize = headerSize + 4 + triangleCount * 50;

  const buffer = Buffer.alloc(dataSize);
  const header = `SignCraft 3D STL - ${solidName}`.slice(0, 80).padEnd(80, "\0");
  buffer.write(header, 0);
  buffer.writeUInt32LE(triangleCount, 80);

  let offset = 84;
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

function generateBackingPlate(
  text: string,
  fontSize: number,
  backingThickness: number,
  paddingX: number = 10,
  paddingY: number = 8,
  fontId: string = "roboto"
): Triangle[] {
  const font = loadFontSync(fontId);
  const fontPath = font.getPath(text, 0, 0, fontSize);
  const contours = pathToContours(fontPath);

  let totalWidth: number;
  let totalHeight: number;

  if (contours.length > 0) {
    const allX = contours.flatMap(c => c.filter((_, i) => i % 2 === 0));
    const allY = contours.flatMap(c => c.filter((_, i) => i % 2 === 1));
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    totalWidth = (maxX - minX) + paddingX * 2;
    totalHeight = (maxY - minY) + paddingY * 2;
  } else {
    const charWidth = fontSize * 0.6;
    const spacing = fontSize * 0.1;
    totalWidth = (text.length * (charWidth + spacing) - spacing) + paddingX * 2;
    totalHeight = fontSize + paddingY * 2;
  }

  return generateBoxTriangles(
    totalWidth,
    totalHeight,
    backingThickness,
    0,
    0,
    -backingThickness / 2
  );
}

export interface GeneratedSignage {
  parts: GeneratedPart[];
  combined: Triangle[];
}

export function generateSignageParts(
  letterSettings: LetterSettings,
  geometrySettings: GeometrySettings,
  wiringSettings: WiringSettings,
  mountingSettings: MountingSettings,
  tubeSettings: TubeSettings = defaultTubeSettings
): GeneratedSignage {
  const parts: GeneratedPart[] = [];
  const text = letterSettings.text || "A";
  const scale = letterSettings.scale;
  const fontSize = 45 * scale;
  const fontId = letterSettings.fontId || "roboto";

  switch (geometrySettings.mode) {
    case "raised": {
      const backingTriangles = generateBackingPlate(
        text,
        fontSize,
        geometrySettings.backingThickness,
        10 * scale,
        8 * scale,
        fontId
      );
      parts.push({
        name: "backing",
        triangles: backingTriangles,
        material: geometrySettings.backingMaterial,
      });

      const letterZOffset = geometrySettings.letterOffset;
      const letterTriangles = generateTextGeometry(
        text,
        fontSize,
        geometrySettings.letterHeight,
        0,
        0,
        letterZOffset,
        fontId
      );
      parts.push({
        name: "letters",
        triangles: letterTriangles,
        material: geometrySettings.letterMaterial,
      });
      break;
    }

    case "stencil": {
      const backingTriangles = generateBackingPlate(
        text,
        fontSize,
        geometrySettings.backingThickness,
        10 * scale,
        8 * scale,
        fontId
      );
      parts.push({
        name: "stencil_backing",
        triangles: backingTriangles,
        material: geometrySettings.backingMaterial,
      });
      break;
    }

    case "layered": {
      const backingTriangles = generateBackingPlate(
        text,
        fontSize,
        geometrySettings.backingThickness,
        10 * scale,
        8 * scale,
        fontId
      );
      parts.push({
        name: "backing",
        triangles: backingTriangles,
        material: geometrySettings.backingMaterial,
      });

      const letterTriangles = generateTextGeometry(
        text,
        fontSize,
        geometrySettings.letterHeight,
        0,
        0,
        geometrySettings.letterOffset,
        fontId
      );
      parts.push({
        name: "letters",
        triangles: letterTriangles,
        material: geometrySettings.letterMaterial,
      });
      break;
    }

    case "outline": {
      const font = loadFontSync(fontId);
      const fontPath = font.getPath(text, 0, 0, fontSize);
      const contours = pathToContours(fontPath);
      
      if (contours.length > 0) {
        const allX = contours.flatMap(c => c.filter((_, i) => i % 2 === 0));
        const allY = contours.flatMap(c => c.filter((_, i) => i % 2 === 1));
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minY = Math.min(...allY);
        const maxY = Math.max(...allY);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        const isFilament = tubeSettings.channelType === "filament";
        const tubeRadius = isFilament 
          ? (tubeSettings.filamentDiameter / 2) 
          : (tubeSettings.tubeWidth / 2);
        const wallHeight = tubeSettings.wallHeight;
        const zOffset = wallHeight / 2;
        
        const tubeTriangles: Triangle[] = [];
        
        for (const contour of contours) {
          const numPoints = contour.length / 2;
          if (numPoints < 3) continue;
          
          for (let i = 0; i < numPoints; i++) {
            const x1 = contour[i * 2] - centerX;
            const y1 = -(contour[i * 2 + 1] - centerY);
            const next = (i + 1) % numPoints;
            const x2 = contour[next * 2] - centerX;
            const y2 = -(contour[next * 2 + 1] - centerY);
            
            const segTriangles = generateOrientedTubeSegment(
              tubeRadius,
              { x: x1, y: y1, z: zOffset },
              { x: x2, y: y2, z: zOffset },
              isFilament ? 12 : 8
            );
            tubeTriangles.push(...segTriangles);
          }
        }
        
        parts.push({
          name: isFilament ? "filament_tube" : "led_channel",
          triangles: tubeTriangles,
          material: geometrySettings.letterMaterial,
        });
        
        if (tubeSettings.enableOverlay) {
          const overlayTriangles: Triangle[] = [];
          const overlayZ = wallHeight + tubeSettings.overlayThickness / 2;
          const overlayRadius = tubeRadius * 1.1;
          
          for (const contour of contours) {
            const numPoints = contour.length / 2;
            if (numPoints < 3) continue;
            
            for (let i = 0; i < numPoints; i++) {
              const x1 = contour[i * 2] - centerX;
              const y1 = -(contour[i * 2 + 1] - centerY);
              const next = (i + 1) % numPoints;
              const x2 = contour[next * 2] - centerX;
              const y2 = -(contour[next * 2 + 1] - centerY);
              
              const segTriangles = generateOrientedTubeSegment(
                overlayRadius,
                { x: x1, y: y1, z: overlayZ },
                { x: x2, y: y2, z: overlayZ },
                isFilament ? 12 : 8
              );
              overlayTriangles.push(...segTriangles);
            }
          }
          
          parts.push({
            name: "overlay_cap",
            triangles: overlayTriangles,
            material: "diffuser",
          });
        }
        
        if (geometrySettings.enableBacking !== false) {
          const backingTriangles = generateBackingPlate(
            text,
            fontSize,
            geometrySettings.backingThickness,
            10 * scale,
            8 * scale,
            fontId
          );
          parts.push({
            name: "backing",
            triangles: backingTriangles,
            material: geometrySettings.backingMaterial,
          });
        }
      }
      break;
    }

    case "flat":
    default: {
      const letterTriangles = generateTextGeometry(
        text,
        fontSize,
        letterSettings.depth,
        0,
        0,
        0,
        fontId
      );
      parts.push({
        name: "letters",
        triangles: letterTriangles,
        material: geometrySettings.letterMaterial,
      });
      break;
    }
  }

  if (wiringSettings.channelType !== "none") {
    const font = loadFontSync(fontId);
    const fontPath = font.getPath(text, 0, 0, fontSize);
    const contours = pathToContours(fontPath);

    let textWidth: number;
    if (contours.length > 0) {
      const allX = contours.flatMap(c => c.filter((_, i) => i % 2 === 0));
      textWidth = Math.max(...allX) - Math.min(...allX);
    } else {
      textWidth = text.length * fontSize * 0.7;
    }

    const channelY = (wiringSettings.channelType === "back" || wiringSettings.channelType === "ws2812b")
      ? -fontSize * 0.4 
      : 0;

    let channelTriangles: Triangle[];
    
    if (wiringSettings.channelType === "ws2812b") {
      const channelWidth = wiringSettings.channelWidth || 12;
      const channelHeight = Math.min(wiringSettings.channelDepth || 4, geometrySettings.backingThickness - 1);
      channelTriangles = generateBoxTriangles(
        textWidth * 0.9,
        channelWidth,
        channelHeight,
        0,
        channelY,
        -(geometrySettings.backingThickness - channelHeight / 2)
      );
    } else if (wiringSettings.channelType === "filament") {
      const channelDiameter = wiringSettings.channelDiameter || 10;
      const clampedDiameter = Math.min(channelDiameter, geometrySettings.backingThickness * 0.9);
      channelTriangles = generateCylinderTriangles(
        clampedDiameter / 2,
        textWidth * 0.9,
        16,
        0,
        channelY,
        -(geometrySettings.backingThickness - clampedDiameter / 2),
        true
      );
    } else {
      channelTriangles = generateCylinderTriangles(
        wiringSettings.channelDiameter / 2,
        textWidth * 0.9,
        16,
        0,
        channelY,
        -geometrySettings.backingThickness / 2,
        true
      );
    }

    const existingLetters = parts.find(p => p.name === "letters" || p.name === "stencil_backing");
    if (existingLetters) {
      existingLetters.triangles.push(...channelTriangles);
    }
  }

  if (mountingSettings.pattern !== "none") {
    const font = loadFontSync(fontId);
    const fontPath = font.getPath(text, 0, 0, fontSize);
    const contours = pathToContours(fontPath);

    let totalWidth: number;
    let totalHeight: number;

    if (contours.length > 0) {
      const allX = contours.flatMap(c => c.filter((_, i) => i % 2 === 0));
      const allY = contours.flatMap(c => c.filter((_, i) => i % 2 === 1));
      totalWidth = Math.max(...allX) - Math.min(...allX) + 20 * scale;
      totalHeight = Math.max(...allY) - Math.min(...allY) + 16 * scale;
    } else {
      totalWidth = text.length * fontSize * 0.7 + 20 * scale;
      totalHeight = fontSize + 16 * scale;
    }

    const holePositions: { x: number; y: number }[] = [];
    const hw = totalWidth / 2 - mountingSettings.insetFromEdge * scale;
    const hh = totalHeight / 2 - mountingSettings.insetFromEdge * scale;

    switch (mountingSettings.pattern) {
      case "4-corner":
        holePositions.push(
          { x: -hw, y: -hh },
          { x: hw, y: -hh },
          { x: -hw, y: hh },
          { x: hw, y: hh }
        );
        break;
      case "2-point":
        holePositions.push({ x: -hw, y: 0 }, { x: hw, y: 0 });
        break;
      case "6-point":
        holePositions.push(
          { x: -hw, y: -hh },
          { x: 0, y: -hh },
          { x: hw, y: -hh },
          { x: -hw, y: hh },
          { x: 0, y: hh },
          { x: hw, y: hh }
        );
        break;
      case "custom":
        holePositions.push({ x: 0, y: 0 });
        break;
    }

    for (const pos of holePositions) {
      const holeTriangles = generateCylinderTriangles(
        mountingSettings.holeDiameter / 2,
        geometrySettings.backingThickness + 2,
        16,
        pos.x,
        pos.y,
        -geometrySettings.backingThickness / 2
      );

      const backing = parts.find(p => p.name === "backing" || p.name === "stencil_backing");
      if (backing) {
        backing.triangles.push(...holeTriangles);
      }
    }
  }

  const combined: Triangle[] = [];
  for (const part of parts) {
    combined.push(...part.triangles);
  }

  return { parts, combined };
}

export function generateSignage(
  letterSettings: LetterSettings,
  wiringSettings: WiringSettings,
  mountingSettings: MountingSettings,
  format: string,
  geometrySettings: GeometrySettings,
  tubeSettings: TubeSettings = defaultTubeSettings
): Buffer | string {
  const { combined } = generateSignageParts(
    letterSettings,
    geometrySettings,
    wiringSettings,
    mountingSettings,
    tubeSettings
  );

  if (format === "obj") {
    return trianglesToOBJ(combined);
  }

  return trianglesToSTL(combined);
}

export interface ExportedPart {
  filename: string;
  content: Buffer | string;
  partType: string;
  material: string;
}

export function generateMultiPartExport(
  letterSettings: LetterSettings,
  geometrySettings: GeometrySettings,
  wiringSettings: WiringSettings,
  mountingSettings: MountingSettings,
  format: "stl" | "obj",
  tubeSettings: TubeSettings = defaultTubeSettings
): ExportedPart[] {
  const { parts } = generateSignageParts(letterSettings, geometrySettings, wiringSettings, mountingSettings, tubeSettings);
  const exportedParts: ExportedPart[] = [];

  const textSlug = letterSettings.text.replace(/\s/g, "_");

  for (const part of parts) {
    const filename = `${textSlug}_${part.name}_${part.material}.${format}`;

    const content = format === "obj"
      ? trianglesToOBJ(part.triangles, part.name)
      : trianglesToSTL(part.triangles, `SignCraft 3D - ${part.name}`);

    exportedParts.push({
      filename,
      content,
      partType: part.name,
      material: part.material,
    });
  }

  return exportedParts;
}
