import * as opentype from 'opentype.js';
import * as path from 'path';
import * as fs from 'fs';

interface StrokePath {
  points: number[][];
  closed: boolean;
  area?: number;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
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

function pathCommandsToContours(pathData: opentype.Path, scale: number): StrokePath[] {
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
        // Sample bezier curve
        const steps = 10;
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
          paths.push({ points: [...currentPath], closed: true });
        }
        currentPath = [];
        break;
    }
  }
  
  if (currentPath.length > 1) {
    paths.push({ points: currentPath, closed: false });
  }
  
  // Calculate area for each closed path
  for (const p of paths) {
    if (p.closed) {
      p.area = Math.abs(calculateSignedArea(p.points));
      p.bounds = calculateBounds(p.points);
    }
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

// Extract a single skeleton path from font outline using medial axis approximation
function extractSingleSkeleton(contours: StrokePath[]): number[][][] {
  if (contours.length === 0) return [];
  
  // Separate outer (larger area) and inner (smaller area, holes) contours
  const closedContours = contours.filter(c => c.closed && c.area && c.area > 10);
  
  if (closedContours.length === 0) {
    // No closed contours - use open paths directly
    return contours.filter(c => !c.closed && c.points.length >= 2)
      .map(c => simplifyPath(c.points, 0.2));
  }
  
  // Sort by area - largest first (outer contours)
  closedContours.sort((a, b) => (b.area || 0) - (a.area || 0));
  
  const result: number[][][] = [];
  const processedBounds = new Set<string>();
  
  // Group contours by their bounding box overlap (letters with holes like 'o', 'e', etc)
  for (const outer of closedContours) {
    if (!outer.bounds) continue;
    
    const boundsKey = `${Math.round(outer.bounds.minX)},${Math.round(outer.bounds.minY)}`;
    if (processedBounds.has(boundsKey)) continue;
    
    // Find inner contours (holes) within this outer contour
    const innerContours = closedContours.filter(inner => {
      if (inner === outer || !inner.bounds || !outer.bounds) return false;
      // Check if inner is fully contained in outer
      return inner.bounds.minX >= outer.bounds.minX - 1 &&
             inner.bounds.maxX <= outer.bounds.maxX + 1 &&
             inner.bounds.minY >= outer.bounds.minY - 1 &&
             inner.bounds.maxY <= outer.bounds.maxY + 1 &&
             (inner.area || 0) < (outer.area || 0) * 0.9;
    });
    
    // Mark all involved contours as processed
    processedBounds.add(boundsKey);
    for (const inner of innerContours) {
      if (inner.bounds) {
        processedBounds.add(`${Math.round(inner.bounds.minX)},${Math.round(inner.bounds.minY)}`);
      }
    }
    
    // Compute skeleton for this letter
    if (innerContours.length === 1) {
      // Letter with hole (like 'o', 'a', 'e') - compute centerline between outer and inner
      const skeleton = computeMidlinePath(outer.points, innerContours[0].points);
      if (skeleton.length >= 3) {
        result.push(simplifyPath(skeleton, 0.3));
      }
    } else if (innerContours.length === 0) {
      // Solid letter - compute medial axis approximation
      const skeleton = computeMedialAxis(outer.points);
      if (skeleton.length >= 2) {
        result.push(simplifyPath(skeleton, 0.3));
      }
    } else {
      // Multiple holes - handle outer contour only with offset
      const skeleton = computeMedialAxis(outer.points);
      if (skeleton.length >= 2) {
        result.push(simplifyPath(skeleton, 0.3));
      }
    }
  }
  
  return result;
}

// Compute midline between outer and inner contour (for letters with holes)
function computeMidlinePath(outer: number[][], inner: number[][]): number[][] {
  const midline: number[][] = [];
  
  // Sample points along outer contour and find corresponding inner point
  const step = Math.max(1, Math.floor(outer.length / 60));
  
  for (let i = 0; i < outer.length; i += step) {
    const outerPt = outer[i];
    
    // Find closest point on inner contour
    let minDist = Infinity;
    let closestInner = inner[0];
    
    for (const innerPt of inner) {
      const dist = Math.hypot(outerPt[0] - innerPt[0], outerPt[1] - innerPt[1]);
      if (dist < minDist) {
        minDist = dist;
        closestInner = innerPt;
      }
    }
    
    // Midpoint between outer and inner
    midline.push([
      (outerPt[0] + closestInner[0]) / 2,
      (outerPt[1] + closestInner[1]) / 2
    ]);
  }
  
  // Close the loop if it's circular
  if (midline.length > 2) {
    const first = midline[0];
    const last = midline[midline.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 10) {
      midline.push([first[0], first[1]]);
    }
  }
  
  return midline;
}

// Compute approximate medial axis (skeleton) for solid shapes
function computeMedialAxis(points: number[][]): number[][] {
  if (points.length < 4) return points;
  
  const bounds = calculateBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  // For script fonts, the skeleton should follow the "flow" of the letter
  // We'll trace through the shape following the major axis
  
  if (width > height * 1.5) {
    // Horizontal letter - trace left to right through center
    return traceHorizontalSkeleton(points, bounds);
  } else if (height > width * 1.5) {
    // Vertical letter - trace top to bottom through center  
    return traceVerticalSkeleton(points, bounds);
  } else {
    // Roughly square - trace diagonal or use contour offset
    return traceContourOffset(points, Math.min(width, height) * 0.25);
  }
}

function traceHorizontalSkeleton(points: number[][], bounds: { minX: number; maxX: number; minY: number; maxY: number }): number[][] {
  const skeleton: number[][] = [];
  const steps = 30;
  const dx = (bounds.maxX - bounds.minX) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const x = bounds.minX + i * dx;
    
    // Find all intersections with vertical line at x
    const intersections: number[] = [];
    for (let j = 0; j < points.length; j++) {
      const p1 = points[j];
      const p2 = points[(j + 1) % points.length];
      
      if ((p1[0] <= x && p2[0] >= x) || (p2[0] <= x && p1[0] >= x)) {
        if (Math.abs(p2[0] - p1[0]) > 0.001) {
          const t = (x - p1[0]) / (p2[0] - p1[0]);
          if (t >= 0 && t <= 1) {
            intersections.push(p1[1] + t * (p2[1] - p1[1]));
          }
        }
      }
    }
    
    if (intersections.length >= 2) {
      intersections.sort((a, b) => a - b);
      // Take middle of intersections
      const midY = (intersections[0] + intersections[intersections.length - 1]) / 2;
      skeleton.push([x, midY]);
    }
  }
  
  return skeleton;
}

function traceVerticalSkeleton(points: number[][], bounds: { minX: number; maxX: number; minY: number; maxY: number }): number[][] {
  const skeleton: number[][] = [];
  const steps = 30;
  const dy = (bounds.maxY - bounds.minY) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const y = bounds.minY + i * dy;
    
    // Find all intersections with horizontal line at y
    const intersections: number[] = [];
    for (let j = 0; j < points.length; j++) {
      const p1 = points[j];
      const p2 = points[(j + 1) % points.length];
      
      if ((p1[1] <= y && p2[1] >= y) || (p2[1] <= y && p1[1] >= y)) {
        if (Math.abs(p2[1] - p1[1]) > 0.001) {
          const t = (y - p1[1]) / (p2[1] - p1[1]);
          if (t >= 0 && t <= 1) {
            intersections.push(p1[0] + t * (p2[0] - p1[0]));
          }
        }
      }
    }
    
    if (intersections.length >= 2) {
      intersections.sort((a, b) => a - b);
      const midX = (intersections[0] + intersections[intersections.length - 1]) / 2;
      skeleton.push([midX, y]);
    }
  }
  
  return skeleton;
}

function traceContourOffset(points: number[][], offset: number): number[][] {
  // Simple inward offset of contour
  const result: number[][] = [];
  const n = points.length;
  
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 40))) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    
    // Calculate inward normal
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    
    const len1 = Math.hypot(dx1, dy1) || 1;
    const len2 = Math.hypot(dx2, dy2) || 1;
    
    const nx = (-dy1 / len1 - dy2 / len2) / 2;
    const ny = (dx1 / len1 + dx2 / len2) / 2;
    const nlen = Math.hypot(nx, ny) || 1;
    
    result.push([
      curr[0] + (nx / nlen) * offset,
      curr[1] + (ny / nlen) * offset
    ]);
  }
  
  // Close if original was closed
  if (result.length > 2) {
    result.push([result[0][0], result[0][1]]);
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
  const len = Math.hypot(dx, dy);
  
  if (len < 0.0001) {
    return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
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
    
    const contours = pathCommandsToContours(glyphPath, scale);
    const skeletons = extractSingleSkeleton(contours);
    
    for (const pathPoints of skeletons) {
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
  
  console.log(`[FontLoader] Generated ${centeredPaths.length} skeleton paths for "${text}"`);
  
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
