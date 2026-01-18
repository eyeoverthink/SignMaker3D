/**
 * ISOLATED TEST: Font Centerline Extraction
 * 
 * Tests Scott Algorithm centerline extraction on fonts
 * Compares:
 * - Current method (outline tracing)
 * - Scott method (centerline extraction)
 * 
 * Measures:
 * - Vertex count reduction
 * - Geometry simplification
 * - Visual quality
 * - Export file size
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
  method: 'outline' | 'centerline';
  vertexCount: number;
  pathLength: number;
  boundingBox: { width: number; height: number };
  processingTime: number;
}

/**
 * CURRENT METHOD: Outline Tracing
 * Traces outer and inner contours (hollow letters)
 */
function extractOutlineMethod(glyph: opentype.Glyph, scale: number): Point2D[][] {
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
        // Quadratic bezier - sample points
        const lastPt = currentPath[currentPath.length - 1];
        for (let t = 0.1; t <= 1; t += 0.1) {
          const x = (1-t)*(1-t)*lastPt.x + 2*(1-t)*t*cmd.x1*scale + t*t*cmd.x*scale;
          const y = (1-t)*(1-t)*lastPt.y + 2*(1-t)*t*cmd.y1*scale + t*t*cmd.y*scale;
          currentPath.push({ x, y });
        }
        break;
      case 'C':
        // Cubic bezier - sample points
        const last = currentPath[currentPath.length - 1];
        for (let t = 0.1; t <= 1; t += 0.1) {
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
 * SCOTT METHOD: Centerline Extraction
 * 1. Rasterize glyph to bitmap
 * 2. Apply Zhang-Suen thinning (skeletonization)
 * 3. Trace skeleton with Moore-Neighbor
 * 4. Simplify with Douglas-Peucker
 */
function extractCenterlineMethod(glyph: opentype.Glyph, scale: number): Point2D[][] {
  const resolution = 100; // pixels per unit
  const bbox = glyph.getBoundingBox();
  
  const width = Math.ceil((bbox.x2 - bbox.x1) * resolution) + 20;
  const height = Math.ceil((bbox.y2 - bbox.y1) * resolution) + 20;
  
  // 1. Rasterize glyph to bitmap
  const bitmap = new Array(height).fill(0).map(() => new Array(width).fill(0));
  
  const pathData = glyph.getPath(0, 0, 72);
  
  // Simple rasterization - fill glyph area
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const glyphX = (x - 10) / resolution + bbox.x1;
      const glyphY = (y - 10) / resolution + bbox.y1;
      
      // Check if point is inside glyph (simple approach)
      if (isPointInGlyph(glyphX, glyphY, pathData)) {
        bitmap[y][x] = 1;
      }
    }
  }
  
  // 2. Apply Zhang-Suen thinning
  const skeleton = zhangSuenThinning(bitmap);
  
  // 3. Trace skeleton with Moore-Neighbor
  const skeletonPaths = traceSkeletonPaths(skeleton);
  
  // 4. Convert back to original scale and simplify
  const centerlines: Point2D[][] = [];
  
  for (const skPath of skeletonPaths) {
    const scaledPath = skPath.map(p => ({
      x: ((p.x - 10) / resolution + bbox.x1) * scale,
      y: ((p.y - 10) / resolution + bbox.y1) * scale
    }));
    
    // Douglas-Peucker simplification
    const simplified = douglasPeucker(scaledPath, 0.5);
    if (simplified.length >= 2) {
      centerlines.push(simplified);
    }
  }
  
  return centerlines;
}

/**
 * Simple point-in-polygon test for glyph
 */
function isPointInGlyph(x: number, y: number, pathData: opentype.Path): boolean {
  // Ray casting algorithm
  let inside = false;
  const commands = pathData.commands;
  
  let prevX = 0, prevY = 0;
  
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      prevX = cmd.x;
      prevY = cmd.y;
    } else if (cmd.type === 'L' || cmd.type === 'Z') {
      const x1 = prevX;
      const y1 = prevY;
      const x2 = cmd.type === 'Z' ? commands[0].x : cmd.x;
      const y2 = cmd.type === 'Z' ? commands[0].y : cmd.y;
      
      if ((y1 > y) !== (y2 > y)) {
        const slope = (x2 - x1) / (y2 - y1);
        const intersectX = x1 + slope * (y - y1);
        if (x < intersectX) {
          inside = !inside;
        }
      }
      
      prevX = x2;
      prevY = y2;
    }
  }
  
  return inside;
}

/**
 * Zhang-Suen thinning algorithm
 * Reduces bitmap to 1-pixel-wide skeleton
 */
function zhangSuenThinning(bitmap: number[][]): number[][] {
  const height = bitmap.length;
  const width = bitmap[0].length;
  const skeleton = bitmap.map(row => [...row]);
  
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Step 1
    const toDelete1: [number, number][] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y][x] === 1 && shouldDeleteStep1(skeleton, x, y)) {
          toDelete1.push([y, x]);
        }
      }
    }
    
    for (const [y, x] of toDelete1) {
      skeleton[y][x] = 0;
      changed = true;
    }
    
    // Step 2
    const toDelete2: [number, number][] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y][x] === 1 && shouldDeleteStep2(skeleton, x, y)) {
          toDelete2.push([y, x]);
        }
      }
    }
    
    for (const [y, x] of toDelete2) {
      skeleton[y][x] = 0;
      changed = true;
    }
  }
  
  return skeleton;
}

function shouldDeleteStep1(img: number[][], x: number, y: number): boolean {
  const p2 = img[y-1][x];
  const p3 = img[y-1][x+1];
  const p4 = img[y][x+1];
  const p5 = img[y+1][x+1];
  const p6 = img[y+1][x];
  const p7 = img[y+1][x-1];
  const p8 = img[y][x-1];
  const p9 = img[y-1][x-1];
  
  const neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
  if (neighbors < 2 || neighbors > 6) return false;
  
  const transitions = countTransitions([p2,p3,p4,p5,p6,p7,p8,p9]);
  if (transitions !== 1) return false;
  
  if (p2 * p4 * p6 !== 0) return false;
  if (p4 * p6 * p8 !== 0) return false;
  
  return true;
}

function shouldDeleteStep2(img: number[][], x: number, y: number): boolean {
  const p2 = img[y-1][x];
  const p3 = img[y-1][x+1];
  const p4 = img[y][x+1];
  const p5 = img[y+1][x+1];
  const p6 = img[y+1][x];
  const p7 = img[y+1][x-1];
  const p8 = img[y][x-1];
  const p9 = img[y-1][x-1];
  
  const neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
  if (neighbors < 2 || neighbors > 6) return false;
  
  const transitions = countTransitions([p2,p3,p4,p5,p6,p7,p8,p9]);
  if (transitions !== 1) return false;
  
  if (p2 * p4 * p8 !== 0) return false;
  if (p2 * p6 * p8 !== 0) return false;
  
  return true;
}

function countTransitions(neighbors: number[]): number {
  let count = 0;
  for (let i = 0; i < neighbors.length; i++) {
    if (neighbors[i] === 0 && neighbors[(i + 1) % neighbors.length] === 1) {
      count++;
    }
  }
  return count;
}

/**
 * Trace skeleton paths using Moore-Neighbor
 */
function traceSkeletonPaths(skeleton: number[][]): Point2D[][] {
  const height = skeleton.length;
  const width = skeleton[0].length;
  const visited = skeleton.map(row => row.map(() => false));
  const paths: Point2D[][] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (skeleton[y][x] === 1 && !visited[y][x]) {
        const path = tracePath(skeleton, visited, x, y);
        if (path.length >= 2) {
          paths.push(path);
        }
      }
    }
  }
  
  return paths;
}

function tracePath(skeleton: number[][], visited: boolean[][], startX: number, startY: number): Point2D[] {
  const path: Point2D[] = [];
  const directions = [
    [-1, 0], [-1, -1], [0, -1], [1, -1],
    [1, 0], [1, 1], [0, 1], [-1, 1]
  ];
  
  let x = startX;
  let y = startY;
  
  while (skeleton[y][x] === 1 && !visited[y][x]) {
    visited[y][x] = true;
    path.push({ x, y });
    
    // Find next unvisited neighbor
    let found = false;
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < skeleton[0].length && 
          ny >= 0 && ny < skeleton.length &&
          skeleton[ny][nx] === 1 && !visited[ny][nx]) {
        x = nx;
        y = ny;
        found = true;
        break;
      }
    }
    
    if (!found) break;
  }
  
  return path;
}

/**
 * Douglas-Peucker simplification
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
 * Run comparison test
 */
async function runFontCenterlineTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   FONT CENTERLINE EXTRACTION TEST                          ║');
  console.log('║   Scott Algorithm vs Current Method                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const testFonts = [
    { file: 'inter-v20-latin-regular.ttf', name: 'Inter (Block)' },
    { file: 'neonderthaw-v8-latin-regular.otf', name: 'Neonderthaw (Script)' },
    { file: 'caveat-v23-latin-regular.ttf', name: 'Caveat (Cursive)' }
  ];
  
  const testChars = ['A', 'B', 'g', 'i'];
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
      
      // Test outline method
      const startOutline = Date.now();
      const outlinePaths = extractOutlineMethod(glyph, 1);
      const outlineTime = Date.now() - startOutline;
      
      const outlineVertices = outlinePaths.reduce((sum, p) => sum + p.length, 0);
      const outlineLength = calculatePathLength(outlinePaths);
      
      results.push({
        fontName: fontInfo.name,
        character: char,
        method: 'outline',
        vertexCount: outlineVertices,
        pathLength: outlineLength,
        boundingBox: { width: 0, height: 0 },
        processingTime: outlineTime
      });
      
      // Test centerline method
      const startCenterline = Date.now();
      const centerlinePaths = extractCenterlineMethod(glyph, 1);
      const centerlineTime = Date.now() - startCenterline;
      
      const centerlineVertices = centerlinePaths.reduce((sum, p) => sum + p.length, 0);
      const centerlineLength = calculatePathLength(centerlinePaths);
      
      results.push({
        fontName: fontInfo.name,
        character: char,
        method: 'centerline',
        vertexCount: centerlineVertices,
        pathLength: centerlineLength,
        boundingBox: { width: 0, height: 0 },
        processingTime: centerlineTime
      });
      
      // Calculate reduction
      const vertexReduction = ((outlineVertices - centerlineVertices) / outlineVertices * 100);
      const lengthReduction = ((outlineLength - centerlineLength) / outlineLength * 100);
      
      console.log(`\n  Character: '${char}'`);
      console.log(`    Outline:    ${outlineVertices} vertices, ${outlineLength.toFixed(1)} length, ${outlineTime}ms`);
      console.log(`    Centerline: ${centerlineVertices} vertices, ${centerlineLength.toFixed(1)} length, ${centerlineTime}ms`);
      console.log(`    Reduction:  ${vertexReduction.toFixed(1)}% vertices, ${lengthReduction.toFixed(1)}% length`);
    }
  }
  
  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   SUMMARY                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const outlineResults = results.filter(r => r.method === 'outline');
  const centerlineResults = results.filter(r => r.method === 'centerline');
  
  const avgOutlineVertices = outlineResults.reduce((sum, r) => sum + r.vertexCount, 0) / outlineResults.length;
  const avgCenterlineVertices = centerlineResults.reduce((sum, r) => sum + r.vertexCount, 0) / centerlineResults.length;
  const avgReduction = ((avgOutlineVertices - avgCenterlineVertices) / avgOutlineVertices * 100);
  
  console.log(`Average vertices per character:`);
  console.log(`  Outline method:    ${avgOutlineVertices.toFixed(0)}`);
  console.log(`  Centerline method: ${avgCenterlineVertices.toFixed(0)}`);
  console.log(`  Reduction:         ${avgReduction.toFixed(1)}%\n`);
  
  if (avgReduction > 40) {
    console.log('✅ CENTERLINE METHOD RECOMMENDED');
    console.log('   Significant geometry reduction achieved');
    console.log('   Ready for integration into app\n');
  } else {
    console.log('⚠️  RESULTS INCONCLUSIVE');
    console.log('   Further testing needed\n');
  }
}

// Run test
runFontCenterlineTest().catch(console.error);

export { runFontCenterlineTest };
