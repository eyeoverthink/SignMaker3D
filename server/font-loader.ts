import * as opentype from 'opentype.js';
import * as path from 'path';
import * as fs from 'fs';

interface StrokePath {
  points: number[][];
  closed: boolean;
}

interface GlyphStrokePaths {
  char: string;
  width: number;
  paths: StrokePath[];
}

const fontCache: Map<string, opentype.Font> = new Map();

export const neonFontOptions = [
  { id: "aerioz", name: "Aerioz (Neon Script)", file: "Aerioz-Demo.otf", scale: 0.08 },
  { id: "hershey-sans", name: "Hershey Sans", file: null, scale: 1 },
  { id: "hershey-script", name: "Hershey Script", file: null, scale: 1 },
];

function loadFont(fontFile: string): opentype.Font | null {
  if (fontCache.has(fontFile)) {
    return fontCache.get(fontFile)!;
  }
  
  const fontPath = path.join(process.cwd(), 'public', 'fonts', fontFile);
  
  if (!fs.existsSync(fontPath)) {
    console.error(`[FontLoader] Font file not found: ${fontPath}`);
    return null;
  }
  
  try {
    const font = opentype.loadSync(fontPath);
    fontCache.set(fontFile, font);
    console.log(`[FontLoader] Loaded font: ${fontFile}`);
    return font;
  } catch (error) {
    console.error(`[FontLoader] Failed to load font: ${fontFile}`, error);
    return null;
  }
}

function pathCommandsToStrokePaths(pathData: opentype.Path, scale: number): StrokePath[] {
  const paths: StrokePath[] = [];
  let currentPath: number[][] = [];
  let currentX = 0;
  let currentY = 0;
  
  for (const cmd of pathData.commands) {
    switch (cmd.type) {
      case 'M':
        if (currentPath.length > 1) {
          paths.push({ points: [...currentPath], closed: false });
        }
        currentPath = [[cmd.x! * scale, cmd.y! * scale]];
        currentX = cmd.x!;
        currentY = cmd.y!;
        break;
        
      case 'L':
        currentPath.push([cmd.x! * scale, cmd.y! * scale]);
        currentX = cmd.x!;
        currentY = cmd.y!;
        break;
        
      case 'C':
        const steps = 8;
        for (let t = 1; t <= steps; t++) {
          const tt = t / steps;
          const t2 = tt * tt;
          const t3 = t2 * tt;
          const mt = 1 - tt;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          
          const x = mt3 * currentX + 3 * mt2 * tt * cmd.x1! + 3 * mt * t2 * cmd.x2! + t3 * cmd.x!;
          const y = mt3 * currentY + 3 * mt2 * tt * cmd.y1! + 3 * mt * t2 * cmd.y2! + t3 * cmd.y!;
          currentPath.push([x * scale, y * scale]);
        }
        currentX = cmd.x!;
        currentY = cmd.y!;
        break;
        
      case 'Q':
        const qSteps = 6;
        for (let t = 1; t <= qSteps; t++) {
          const tt = t / qSteps;
          const mt = 1 - tt;
          const x = mt * mt * currentX + 2 * mt * tt * cmd.x1! + tt * tt * cmd.x!;
          const y = mt * mt * currentY + 2 * mt * tt * cmd.y1! + tt * tt * cmd.y!;
          currentPath.push([x * scale, y * scale]);
        }
        currentX = cmd.x!;
        currentY = cmd.y!;
        break;
        
      case 'Z':
        if (currentPath.length > 1) {
          paths.push({ points: [...currentPath], closed: true });
        }
        currentPath = [];
        break;
    }
  }
  
  if (currentPath.length > 1) {
    paths.push({ points: currentPath, closed: false });
  }
  
  return paths;
}

function extractSkeletonFromOutline(paths: StrokePath[]): number[][][] {
  if (paths.length === 0) return [];
  
  if (paths.length === 1 && !paths[0].closed) {
    return [paths[0].points];
  }
  
  const result: number[][][] = [];
  
  for (const path of paths) {
    if (path.points.length < 2) continue;
    
    if (!path.closed) {
      result.push(path.points);
      continue;
    }
    
    const simplified = simplifyPath(path.points, 0.3);
    
    if (simplified.length >= 3) {
      result.push(simplified);
    }
  }
  
  return result;
}

function simplifyPath(points: number[][], tolerance: number): number[][] {
  if (points.length <= 2) return points;
  
  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointToLineDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [start, end];
}

function pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len < 0.0001) {
    return Math.sqrt(
      (point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2
    );
  }
  
  return Math.abs(
    (dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]) / len
  );
}

export function getTextStrokePathsFromFont(
  text: string,
  fontId: string,
  letterHeight: number = 50
): { paths: number[][][]; bounds: { minX: number; maxX: number; minY: number; maxY: number } } {
  const fontOption = neonFontOptions.find(f => f.id === fontId);
  
  if (!fontOption || !fontOption.file) {
    console.log(`[FontLoader] Font ${fontId} not found or uses Hershey, falling back`);
    return { paths: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
  }
  
  const font = loadFont(fontOption.file);
  if (!font) {
    return { paths: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
  }
  
  const scale = fontOption.scale * (letterHeight / 50);
  const allPaths: number[][][] = [];
  
  let currentX = 0;
  const glyphs = font.stringToGlyphs(text);
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const glyphPath = glyph.getPath(currentX, 0, 1000);
    
    const strokePaths = pathCommandsToStrokePaths(glyphPath, scale);
    const skeleton = extractSkeletonFromOutline(strokePaths);
    
    for (const pathPoints of skeleton) {
      const offsetPath = pathPoints.map(([x, y]) => {
        const px = x;
        const py = -y;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
        return [px, py];
      });
      
      if (offsetPath.length >= 2) {
        allPaths.push(offsetPath);
      }
    }
    
    const advance = glyph.advanceWidth || 600;
    if (i < glyphs.length - 1) {
      const kerning = font.getKerningValue(glyph, glyphs[i + 1]);
      currentX += advance + kerning;
    } else {
      currentX += advance;
    }
  }
  
  if (minX === Infinity) {
    return { paths: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
  }
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  const centeredPaths = allPaths.map(path =>
    path.map(([x, y]) => [x - centerX, y - centerY])
  );
  
  return {
    paths: centeredPaths,
    bounds: {
      minX: minX - centerX,
      maxX: maxX - centerX,
      minY: minY - centerY,
      maxY: maxY - centerY
    }
  };
}

export function isOTFFont(fontId: string): boolean {
  const fontOption = neonFontOptions.find(f => f.id === fontId);
  return fontOption?.file !== null && fontOption?.file !== undefined;
}
