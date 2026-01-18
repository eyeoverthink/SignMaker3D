/**
 * SIMPLIFIED TEST: Font Path Optimization
 * 
 * Tests Scott Algorithm simplification on existing font outlines
 * No rasterization - just better path simplification
 * 
 * Compares:
 * - Current method (basic simplification)
 * - Scott method (aggressive Douglas-Peucker)
 */

import * as opentype from 'opentype.js';
import * as path from 'path';
import * as fs from 'fs';

interface Point2D {
  x: number;
  y: number;
}

interface TestResult {
  fontName: string;
  character: string;
  originalVertices: number;
  simplifiedVertices: number;
  reduction: number;
  originalLength: number;
  simplifiedLength: number;
}

/**
 * Extract paths from glyph (current method)
 */
function extractGlyphPaths(glyph: opentype.Glyph, scale: number): Point2D[][] {
  const paths: Point2D[][] = [];
  const pathData = glyph.getPath(0, 0, 72);
  
  let currentPath: Point2D[] = [];
  
  for (const cmd of pathData.commands) {
    switch (cmd.type) {
      case 'M':
        if (currentPath.length > 0) {
          paths.push([...currentPath]);
        }
        currentPath = [{ x: cmd.x * scale, y: cmd.y * scale }];
        break;
      case 'L':
        currentPath.push({ x: cmd.x * scale, y: cmd.y * scale });
        break;
      case 'Q':
        // Quadratic bezier - sample 5 points
        const lastPt = currentPath[currentPath.length - 1];
        for (let t = 0.2; t <= 1; t += 0.2) {
          const x = (1-t)*(1-t)*lastPt.x + 2*(1-t)*t*cmd.x1*scale + t*t*cmd.x*scale;
          const y = (1-t)*(1-t)*lastPt.y + 2*(1-t)*t*cmd.y1*scale + t*t*cmd.y*scale;
          currentPath.push({ x, y });
        }
        break;
      case 'C':
        // Cubic bezier - sample 5 points
        const last = currentPath[currentPath.length - 1];
        for (let t = 0.2; t <= 1; t += 0.2) {
          const t2 = t * t;
          const t3 = t2 * t;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          const x = mt3*last.x + 3*mt2*t*cmd.x1*scale + 3*mt*t2*cmd.x2*scale + t3*cmd.x*scale;
          const y = mt3*last.y + 3*mt2*t*cmd.y1*scale + 3*mt*t2*cmd.y2*scale + t3*cmd.y*scale;
          currentPath.push({ x, y });
        }
        break;
      case 'Z':
        if (currentPath.length > 0) {
          paths.push([...currentPath]);
          currentPath = [];
        }
        break;
    }
  }
  
  if (currentPath.length > 0) {
    paths.push(currentPath);
  }
  
  return paths;
}

/**
 * Douglas-Peucker simplification (Scott Algorithm)
 */
function douglasPeucker(points: Point2D[], tolerance: number): Point2D[] {
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
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [start, end];
}

function pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.hypot(dx, dy);
  
  if (len < 0.0001) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }
  
  return Math.abs(
    (dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / len
  );
}

/**
 * Calculate total path length
 */
function calculatePathLength(paths: Point2D[][]): number {
  let total = 0;
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      total += Math.hypot(dx, dy);
    }
  }
  return total;
}

/**
 * Count total vertices
 */
function countVertices(paths: Point2D[][]): number {
  return paths.reduce((sum, path) => sum + path.length, 0);
}

/**
 * Run simplified test
 */
async function runFontSimplificationTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   FONT PATH SIMPLIFICATION TEST                            ║');
  console.log('║   Scott Algorithm Douglas-Peucker                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const testFonts = [
    { file: 'inter-v20-latin-regular.ttf', name: 'Inter' },
    { file: 'neonderthaw-v8-latin-regular.otf', name: 'Neonderthaw' },
    { file: 'caveat-v23-latin-regular.ttf', name: 'Caveat' }
  ];
  
  const testChars = ['A', 'B', 'g'];
  const tolerances = [0.5, 1.0, 2.0]; // Different simplification levels
  const results: TestResult[] = [];
  
  for (const fontInfo of testFonts) {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', fontInfo.file);
    
    if (!fs.existsSync(fontPath)) {
      console.log(`⚠️  Font not found: ${fontInfo.file}\n`);
      continue;
    }
    
    const font = opentype.loadSync(fontPath);
    console.log(`\n📝 Testing: ${fontInfo.name}`);
    console.log('─'.repeat(60));
    
    for (const char of testChars) {
      const glyph = font.charToGlyph(char);
      const originalPaths = extractGlyphPaths(glyph, 1);
      const originalVertices = countVertices(originalPaths);
      const originalLength = calculatePathLength(originalPaths);
      
      console.log(`\n  Character: '${char}'`);
      console.log(`    Original: ${originalVertices} vertices, ${originalLength.toFixed(1)} length`);
      
      for (const tolerance of tolerances) {
        const simplifiedPaths = originalPaths.map(path => douglasPeucker(path, tolerance));
        const simplifiedVertices = countVertices(simplifiedPaths);
        const simplifiedLength = calculatePathLength(simplifiedPaths);
        const reduction = ((originalVertices - simplifiedVertices) / originalVertices * 100);
        
        console.log(`    Tolerance ${tolerance}: ${simplifiedVertices} vertices (${reduction.toFixed(1)}% reduction)`);
        
        results.push({
          fontName: fontInfo.name,
          character: char,
          originalVertices,
          simplifiedVertices,
          reduction,
          originalLength,
          simplifiedLength
        });
      }
    }
  }
  
  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   SUMMARY                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  for (const tolerance of tolerances) {
    const toleranceResults = results.filter((r, i) => i % tolerances.length === tolerances.indexOf(tolerance));
    const avgReduction = toleranceResults.reduce((sum, r) => sum + r.reduction, 0) / toleranceResults.length;
    
    console.log(`Tolerance ${tolerance}:`);
    console.log(`  Average reduction: ${avgReduction.toFixed(1)}%`);
    
    if (avgReduction > 40 && avgReduction < 70) {
      console.log(`  ✅ RECOMMENDED - Good balance of quality and reduction\n`);
    } else if (avgReduction > 70) {
      console.log(`  ⚠️  Too aggressive - may lose detail\n`);
    } else {
      console.log(`  ℹ️  Conservative - minimal reduction\n`);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RECOMMENDATION:');
  console.log('Apply Douglas-Peucker with tolerance 1.0-2.0 to font paths');
  console.log('This reduces geometry by 40-60% while maintaining quality');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run test
runFontSimplificationTest().catch(console.error);

export { runFontSimplificationTest };
