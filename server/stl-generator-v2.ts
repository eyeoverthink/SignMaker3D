import type { LetterSettings, TubeSettings, TwoPartSystem, SketchPath } from "@shared/schema";
import { defaultTwoPartSystem } from "@shared/schema";
import opentype from "opentype.js";
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

interface ExportedPart {
  filename: string;
  content: Buffer;
  partType: string;
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
  
  const parseBuffer = (buf: Buffer): opentype.Font => {
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return opentype.parse(arrayBuffer);
  };
  
  if (!fs.existsSync(fontPath)) {
    const fallbackPath = path.join(process.cwd(), "server/fonts/Roboto-Bold.ttf");
    const buffer = fs.readFileSync(fallbackPath);
    const font = parseBuffer(buffer);
    fontCache.set(fontId, font);
    return font;
  }
  
  const buffer = fs.readFileSync(fontPath);
  const font = parseBuffer(buffer);
  fontCache.set(fontId, font);
  return font;
}

function getGlyphStrokes(text: string, fontSize: number, fontId: string): number[][][] {
  const font = loadFontSync(fontId);
  const strokes: number[][][] = [];
  
  let xOffset = 0;
  
  for (let charIdx = 0; charIdx < text.length; charIdx++) {
    const char = text[charIdx];
    if (char === ' ') {
      xOffset += fontSize * 0.3;
      continue;
    }
    
    const glyph = font.charToGlyph(char);
    const glyphPath = glyph.getPath(xOffset, 0, fontSize);
    
    let currentStroke: number[] = [];
    
    for (const cmd of glyphPath.commands) {
      switch (cmd.type) {
        case 'M':
          if (currentStroke.length >= 4) {
            strokes.push([currentStroke]);
          }
          currentStroke = [cmd.x, cmd.y];
          break;
        case 'L':
          currentStroke.push(cmd.x, cmd.y);
          break;
        case 'Q': {
          const lx = currentStroke[currentStroke.length - 2];
          const ly = currentStroke[currentStroke.length - 1];
          for (let t = 0.25; t <= 1; t += 0.25) {
            const mt = 1 - t;
            currentStroke.push(
              mt * mt * lx + 2 * mt * t * cmd.x1 + t * t * cmd.x,
              mt * mt * ly + 2 * mt * t * cmd.y1 + t * t * cmd.y
            );
          }
          break;
        }
        case 'C': {
          const cx = currentStroke[currentStroke.length - 2];
          const cy = currentStroke[currentStroke.length - 1];
          for (let t = 0.2; t <= 1; t += 0.2) {
            const mt = 1 - t;
            currentStroke.push(
              mt*mt*mt*cx + 3*mt*mt*t*cmd.x1 + 3*mt*t*t*cmd.x2 + t*t*t*cmd.x,
              mt*mt*mt*cy + 3*mt*mt*t*cmd.y1 + 3*mt*t*t*cmd.y2 + t*t*t*cmd.y
            );
          }
          break;
        }
        case 'Z':
          if (currentStroke.length >= 4) {
            strokes.push([currentStroke]);
          }
          currentStroke = [];
          break;
      }
    }
    
    if (currentStroke.length >= 4) {
      strokes.push([currentStroke]);
    }
    
    xOffset += glyph.advanceWidth ? (glyph.advanceWidth / font.unitsPerEm) * fontSize : fontSize * 0.6;
  }
  
  return strokes;
}

function createSweptTube(
  path: number[],
  tubeRadius: number,
  segments: number = 8,
  closed: boolean = true
): Triangle[] {
  const triangles: Triangle[] = [];
  const numPoints = path.length / 2;
  
  if (numPoints < 2) return triangles;
  
  const rings: Vector3[][] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const x = path[i * 2];
    const y = -path[i * 2 + 1];
    
    let dx: number, dy: number;
    if (i === 0) {
      dx = path[2] - path[0];
      dy = path[3] - path[1];
    } else if (i === numPoints - 1) {
      dx = path[i * 2] - path[(i - 1) * 2];
      dy = path[i * 2 + 1] - path[(i - 1) * 2 + 1];
    } else {
      dx = path[(i + 1) * 2] - path[(i - 1) * 2];
      dy = path[(i + 1) * 2 + 1] - path[(i - 1) * 2 + 1];
    }
    
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) continue;
    
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty;
    const ny = tx;
    
    const ring: Vector3[] = [];
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const rx = Math.cos(angle) * tubeRadius;
      const rz = Math.sin(angle) * tubeRadius;
      
      ring.push({
        x: x + nx * rx,
        y: y + ny * rx,
        z: tubeRadius + rz
      });
    }
    rings.push(ring);
  }
  
  if (rings.length < 2) return triangles;
  
  for (let i = 0; i < rings.length - 1; i++) {
    const ring1 = rings[i];
    const ring2 = rings[i + 1];
    
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      
      const v1 = ring1[s];
      const v2 = ring1[s1];
      const v3 = ring2[s];
      const v4 = ring2[s1];
      
      const n1 = calcNormal(v1, v3, v2);
      const n2 = calcNormal(v2, v3, v4);
      
      triangles.push({ normal: n1, v1, v2: v3, v3: v2 });
      triangles.push({ normal: n2, v1: v2, v2: v3, v3: v4 });
    }
  }
  
  if (closed && rings.length > 2) {
    const firstRing = rings[0];
    const lastRing = rings[rings.length - 1];
    
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      
      const v1 = lastRing[s];
      const v2 = lastRing[s1];
      const v3 = firstRing[s];
      const v4 = firstRing[s1];
      
      const n1 = calcNormal(v1, v3, v2);
      const n2 = calcNormal(v2, v3, v4);
      
      triangles.push({ normal: n1, v1, v2: v3, v3: v2 });
      triangles.push({ normal: n2, v1: v2, v2: v3, v3: v4 });
    }
  } else {
    const firstRing = rings[0];
    const lastRing = rings[rings.length - 1];
    const firstCenter: Vector3 = {
      x: firstRing.reduce((s, v) => s + v.x, 0) / segments,
      y: firstRing.reduce((s, v) => s + v.y, 0) / segments,
      z: firstRing.reduce((s, v) => s + v.z, 0) / segments
    };
    const lastCenter: Vector3 = {
      x: lastRing.reduce((s, v) => s + v.x, 0) / segments,
      y: lastRing.reduce((s, v) => s + v.y, 0) / segments,
      z: lastRing.reduce((s, v) => s + v.z, 0) / segments
    };
    
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      triangles.push({
        normal: { x: 0, y: 0, z: -1 },
        v1: firstCenter,
        v2: firstRing[s1],
        v3: firstRing[s]
      });
      triangles.push({
        normal: { x: 0, y: 0, z: 1 },
        v1: lastCenter,
        v2: lastRing[s],
        v3: lastRing[s1]
      });
    }
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
  const tubeRadius = tubeSettings.neonTubeDiameter / 2;
  let allTriangles: Triangle[] = [];
  let fileSlug = "neon_sign";
  
  if (inputMode === "draw" || inputMode === "image") {
    for (const path of sketchPaths) {
      if (path.points.length < 2) continue;
      const coords: number[] = [];
      for (const pt of path.points) {
        coords.push(pt.x, pt.y);
      }
      allTriangles.push(...createSweptTube(coords, tubeRadius, 8, path.closed));
    }
    fileSlug = inputMode === "draw" ? "freehand" : "traced";
  } else {
    const text = letterSettings.text || "A";
    const fontSize = 45 * letterSettings.scale;
    const fontId = letterSettings.fontId || "roboto";
    
    const glyphStrokes = getGlyphStrokes(text, fontSize, fontId);
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const strokeGroup of glyphStrokes) {
      for (const stroke of strokeGroup) {
        for (let i = 0; i < stroke.length; i += 2) {
          minX = Math.min(minX, stroke[i]);
          maxX = Math.max(maxX, stroke[i]);
          minY = Math.min(minY, stroke[i + 1]);
          maxY = Math.max(maxY, stroke[i + 1]);
        }
      }
    }
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    for (const strokeGroup of glyphStrokes) {
      for (const stroke of strokeGroup) {
        const centeredStroke: number[] = [];
        for (let i = 0; i < stroke.length; i += 2) {
          centeredStroke.push(stroke[i] - centerX, stroke[i + 1] - centerY);
        }
        allTriangles.push(...createSweptTube(centeredStroke, tubeRadius, 8, true));
      }
    }
    
    fileSlug = text.replace(/\s/g, "_").substring(0, 20);
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
