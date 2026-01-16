import * as opentype from 'opentype.js';
import * as path from 'path';
import * as fs from 'fs';

interface StrokePath {
  points: number[][];
  closed: boolean;
  area?: number;
}

const fontCache: Map<string, opentype.Font> = new Map();

// All available fonts from fonts folder
export const neonFontOptions = [
  { id: "aguafina-script", name: "Aguafina Script", file: "aguafina-script-v24-latin-regular.otf", scale: 0.08, strokeBased: false },
  { id: "alex-brush", name: "Alex Brush", file: "alex-brush-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "allison", name: "Allison", file: "allison-v13-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "allura", name: "Allura", file: "allura-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "amatic-sc", name: "Amatic SC", file: "amatic-sc-v28-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "amita", name: "Amita", file: "amita-v20-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "annie-use-your-telescope", name: "Annie Use Your Telescope", file: "annie-use-your-telescope-v20-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "architects-daughter", name: "Architects Daughter", file: "architects-daughter-v20-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "archivo-black", name: "Archivo Black", file: "archivo-black-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "archivo-narrow", name: "Archivo Narrow", file: "archivo-narrow-v35-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "are-you-serious", name: "Are You Serious", file: "are-you-serious-v14-latin-regular.otf", scale: 0.08, strokeBased: false },
  { id: "arizonia", name: "Arizonia", file: "arizonia-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "babylonica", name: "Babylonica", file: "babylonica-v7-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "bad-script", name: "Bad Script", file: "bad-script-v18-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "ballet", name: "Ballet", file: "ballet-v30-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "beau-rivage", name: "Beau Rivage", file: "beau-rivage-v2-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "berkshire-swash", name: "Berkshire Swash", file: "berkshire-swash-v22-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "beth-ellen", name: "Beth Ellen", file: "beth-ellen-v22-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "bilbo", name: "Bilbo", file: "bilbo-v21-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "bilbo-swash-caps", name: "Bilbo Swash Caps", file: "bilbo-swash-caps-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "birthstone", name: "Birthstone", file: "birthstone-v16-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "birthstone-bounce", name: "Birthstone Bounce", file: "birthstone-bounce-v13-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "bonbon", name: "Bonbon", file: "bonbon-v32-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "bonheur-royale", name: "Bonheur Royale", file: "bonheur-royale-v15-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "borel", name: "Borel", file: "borel-v10-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "butterfly-kids", name: "Butterfly Kids", file: "butterfly-kids-v27-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "calligraffitti", name: "Calligraffitti", file: "calligraffitti-v20-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "caramel", name: "Caramel", file: "caramel-v8-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "cause", name: "Cause", file: "cause-v1-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "caveat", name: "Caveat", file: "caveat-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "caveat-brush", name: "Caveat Brush", file: "caveat-brush-v12-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "cedarville-cursive", name: "Cedarville Cursive", file: "cedarville-cursive-v18-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "charm", name: "Charm", file: "charm-v14-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "charmonman", name: "Charmonman", file: "charmonman-v20-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "chilanka", name: "Chilanka", file: "chilanka-v23-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "edu-nsw-act-cursive", name: "EDU NSW ACT Cursive", file: "edu-nsw-act-cursive-v3-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "hershey-sans", name: "Hershey Sans", file: null, scale: 1, strokeBased: true },
  { id: "hershey-script", name: "Hershey Script", file: null, scale: 1, strokeBased: true },
  { id: "inter", name: "Inter", file: "inter-v20-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "inter-tight", name: "Inter Tight", file: "inter-tight-v9-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "lora", name: "Lora", file: "lora-v37-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "montserrat", name: "Montserrat", file: "montserrat-v31-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "neonderthaw", name: "Neonderthaw", file: "neonderthaw-v8-latin-regular.otf", scale: 0.08, strokeBased: false },
  { id: "open-sans", name: "Open Sans", file: "open-sans-v44-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "outfit", name: "Outfit", file: "outfit-v15-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "playfair-display", name: "Playfair Display", file: "playfair-display-v40-latin-regular.ttf", scale: 0.08, strokeBased: false },
  { id: "recursive", name: "Recursive", file: "recursive-v44-latin-regular.otf", scale: 0.08, strokeBased: false },
  { id: "tilt-neon", name: "Tilt Neon", file: "tilt-neon-v12-latin-regular.otf", scale: 0.08, strokeBased: false },
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

// Extract the OUTER contour only from font outlines
// This gives us a single clean path per letter component
function extractOuterContour(pathData: opentype.Path, scale: number): number[][][] {
  const contours: StrokePath[] = [];
  let currentPath: number[][] = [];
  let currentX = 0;
  let currentY = 0;
  
  for (const cmd of pathData.commands) {
    switch (cmd.type) {
      case 'M':
        if (currentPath.length > 1) {
          const area = Math.abs(calculateSignedArea(currentPath));
          contours.push({ points: [...currentPath], closed: false, area });
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
        // Sample bezier - fewer steps for cleaner output
        const steps = 6;
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
        const qSteps = 5;
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
          const area = Math.abs(calculateSignedArea(currentPath));
          contours.push({ points: [...currentPath], closed: true, area });
        }
        currentPath = [];
        break;
    }
  }
  
  if (currentPath.length > 1) {
    const area = Math.abs(calculateSignedArea(currentPath));
    contours.push({ points: currentPath, closed: true, area });
  }
  
  // For outline fonts, we need to extract paths that represent the letter's stroke
  // Keep all significant outer contours (positive area) but filter out small inner holes
  if (contours.length === 0) return [];
  
  // Sort by area descending 
  contours.sort((a, b) => (b.area || 0) - (a.area || 0));
  
  // Get the largest contour area as reference
  const maxArea = contours[0].area || 0;
  const minAreaThreshold = maxArea * 0.05; // Keep contours at least 5% of largest
  
  const result: number[][][] = [];
  
  // Keep all significant contours (not just the largest)
  // This preserves multi-component glyphs like "i", "j", etc.
  for (const contour of contours) {
    if ((contour.area || 0) >= minAreaThreshold && contour.points.length >= 3) {
      result.push(simplifyPath(contour.points, 0.5));
    }
  }
  
  return result;
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
    
    // Extract only outer contour per glyph
    const outerContours = extractOuterContour(glyphPath, scale);
    
    for (const pathPoints of outerContours) {
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
  
  console.log(`[FontLoader] Generated ${centeredPaths.length} paths for "${text}" (outer contours only)`);
  
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
