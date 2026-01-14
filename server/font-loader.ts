import * as opentype from 'opentype.js';
import * as path from 'path';
import * as fs from 'fs';

interface StrokePath {
  points: number[][];
  closed: boolean;
  area?: number;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

interface GlyphStrokePaths {
  char: string;
  width: number;
  paths: StrokePath[];
}

const fontCache: Map<string, opentype.Font> = new Map();

export const neonFontOptions = [
  { id: "aerioz", name: "Aerioz (Neon Script)", file: "Aerioz-Demo.otf", scale: 0.08 },
  { id: "airstream", name: "Airstream", file: "Airstream.ttf", scale: 0.08 },
  { id: "airstream-nf", name: "Airstream NF", file: "AirstreamNF.ttf", scale: 0.08 },
  { id: "alliston", name: "Alliston (Script)", file: "Alliston-Demo.ttf", scale: 0.08 },
  { id: "cookiemonster", name: "Cookie Monster", file: "Cookiemonster.ttf", scale: 0.08 },
  { id: "darlington", name: "Darlington", file: "Darlington-Demo.ttf", scale: 0.08 },
  { id: "dirtyboy", name: "Dirtyboy", file: "Dirtyboy.ttf", scale: 0.08 },
  { id: "future-light", name: "Future Light", file: "FutureLight.ttf", scale: 0.08 },
  { id: "future-light-italic", name: "Future Light Italic", file: "FutureLightItalic.ttf", scale: 0.08 },
  { id: "halimun", name: "Halimun (Script)", file: "Halimun.ttf", scale: 0.08 },
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
        const steps = 12;
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
        const qSteps = 8;
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
          const first = currentPath[0];
          const last = currentPath[currentPath.length - 1];
          if (Math.abs(first[0] - last[0]) > 0.01 || Math.abs(first[1] - last[1]) > 0.01) {
            currentPath.push([first[0], first[1]]);
          }
          paths.push({ points: [...currentPath], closed: true });
        }
        currentPath = [];
        break;
    }
  }
  
  if (currentPath.length > 1) {
    paths.push({ points: currentPath, closed: false });
  }
  
  // Calculate area and bounds for each path
  for (const p of paths) {
    p.area = calculateSignedArea(p.points);
    p.bounds = calculateBounds(p.points);
  }
  
  return paths;
}

function calculateSignedArea(points: number[][]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return area / 2;
}

function calculateBounds(points: number[][]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

function boundsContains(outer: { minX: number; maxX: number; minY: number; maxY: number }, 
                        inner: { minX: number; maxX: number; minY: number; maxY: number }): boolean {
  return outer.minX <= inner.minX && outer.maxX >= inner.maxX &&
         outer.minY <= inner.minY && outer.maxY >= inner.maxY;
}

function extractCenterlineFromContours(paths: StrokePath[]): number[][][] {
  if (paths.length === 0) return [];
  
  // For open paths (already stroke-like), return them directly
  const openPaths = paths.filter(p => !p.closed);
  const closedPaths = paths.filter(p => p.closed);
  
  const result: number[][][] = [];
  
  // Add open paths directly (already centerlines)
  for (const p of openPaths) {
    if (p.points.length >= 2) {
      result.push(simplifyPath(p.points, 0.1));
    }
  }
  
  if (closedPaths.length === 0) {
    return result;
  }
  
  // Separate outer contours (positive area) from inner (holes, negative area)
  const outerContours = closedPaths.filter(p => (p.area || 0) > 0);
  const innerContours = closedPaths.filter(p => (p.area || 0) < 0);
  
  // For each outer contour, find its corresponding inner contour (hole)
  // and compute the centerline between them
  for (const outer of outerContours) {
    // Find inner contours that are inside this outer contour
    const matchingInners = innerContours.filter(inner => 
      outer.bounds && inner.bounds && boundsContains(outer.bounds, inner.bounds)
    );
    
    if (matchingInners.length === 1) {
      // We have a clear outer-inner pair - compute centerline between them
      const centerline = computeCenterlineBetweenContours(outer.points, matchingInners[0].points);
      if (centerline.length >= 2) {
        result.push(simplifyPath(centerline, 0.15));
      }
    } else if (matchingInners.length === 0) {
      // No inner contour - this is a filled shape, use offset from outline
      const centerline = computeOffsetCenterline(outer.points);
      if (centerline.length >= 2) {
        result.push(simplifyPath(centerline, 0.15));
      }
    } else {
      // Multiple inner contours - handle each pair separately
      for (const inner of matchingInners) {
        const centerline = computeCenterlineBetweenContours(outer.points, inner.points);
        if (centerline.length >= 2) {
          result.push(simplifyPath(centerline, 0.15));
        }
      }
    }
  }
  
  // If no outer contours found, treat negative-area closed paths as outlines
  if (outerContours.length === 0 && innerContours.length > 0) {
    for (const inner of innerContours) {
      const centerline = computeOffsetCenterline(inner.points);
      if (centerline.length >= 2) {
        result.push(simplifyPath(centerline, 0.15));
      }
    }
  }
  
  return result;
}

function computeCenterlineBetweenContours(outer: number[][], inner: number[][]): number[][] {
  // For each point on outer contour, find nearest point on inner contour
  // The centerline is the midpoint between them
  const centerline: number[][] = [];
  
  // Sample points along the outer contour
  const sampleCount = Math.min(outer.length, 100);
  const step = Math.max(1, Math.floor(outer.length / sampleCount));
  
  for (let i = 0; i < outer.length; i += step) {
    const outerPt = outer[i];
    
    // Find closest point on inner contour
    let minDist = Infinity;
    let closestInner = inner[0];
    
    for (const innerPt of inner) {
      const dist = Math.sqrt((outerPt[0] - innerPt[0]) ** 2 + (outerPt[1] - innerPt[1]) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestInner = innerPt;
      }
    }
    
    // Midpoint is the centerline
    centerline.push([
      (outerPt[0] + closestInner[0]) / 2,
      (outerPt[1] + closestInner[1]) / 2
    ]);
  }
  
  // Close the centerline if it's meant to be closed
  if (centerline.length > 2) {
    const first = centerline[0];
    const last = centerline[centerline.length - 1];
    const dist = Math.sqrt((first[0] - last[0]) ** 2 + (first[1] - last[1]) ** 2);
    if (dist < 5) {
      centerline.push([first[0], first[1]]);
    }
  }
  
  return centerline;
}

function computeOffsetCenterline(points: number[][]): number[][] {
  // For a filled shape without inner contour, offset inward to create centerline
  // This estimates the stroke width and offsets by half
  
  // Calculate approximate stroke width from shape dimensions
  const bounds = calculateBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const strokeWidth = Math.min(width, height) * 0.4; // Estimate 40% of smaller dimension
  
  // Offset each point inward by half stroke width
  const centerline: number[][] = [];
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    
    // Calculate inward normal
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    
    // Average normal direction
    const nx = ((-dy1 / len1) + (-dy2 / len2)) / 2;
    const ny = ((dx1 / len1) + (dx2 / len2)) / 2;
    const nlen = Math.sqrt(nx * nx + ny * ny) || 1;
    
    // Offset inward
    centerline.push([
      curr[0] + (nx / nlen) * (strokeWidth / 2),
      curr[1] + (ny / nlen) * (strokeWidth / 2)
    ]);
  }
  
  // Close the path
  if (centerline.length > 2) {
    centerline.push([centerline[0][0], centerline[0][1]]);
  }
  
  return centerline;
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
    const centerlines = extractCenterlineFromContours(strokePaths);
    
    for (const pathPoints of centerlines) {
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
