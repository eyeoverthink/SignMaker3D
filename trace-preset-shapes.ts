/**
 * TRACE PRESET SHAPES FROM IMAGES
 * Uses Scott Algorithm (Moore-Neighbor + Douglas-Peucker) to trace shape images
 * and generate accurate SVG paths for preset-shapes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

interface Point2D {
  x: number;
  y: number;
}

interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Convert RGBA to grayscale
 */
function toGrayscale(imageData: ImageData): number[] {
  const gray = new Array(imageData.width * imageData.height);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  return gray;
}

/**
 * Moore-Neighbor boundary tracing
 */
function traceBoundary(
  grayscale: number[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  threshold: number
): Point2D[] {
  const boundary: Point2D[] = [];
  const directions = [
    [-1, 0], [-1, -1], [0, -1], [1, -1],
    [1, 0], [1, 1], [0, 1], [-1, 1]
  ];
  
  let x = startX;
  let y = startY;
  let dir = 0;
  const maxSteps = 10000;
  let steps = 0;
  
  do {
    boundary.push({ x, y });
    
    let found = false;
    for (let i = 0; i < 8; i++) {
      const checkDir = (dir + i) % 8;
      const [dx, dy] = directions[checkDir];
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (grayscale[idx] < threshold) {
          x = nx;
          y = ny;
          dir = (checkDir + 6) % 8;
          found = true;
          break;
        }
      }
    }
    
    if (!found) break;
    steps++;
    
  } while ((x !== startX || y !== startY) && steps < maxSteps);
  
  return boundary;
}

/**
 * Find all contours in image
 */
function findContours(imageData: ImageData, threshold: number = 128): Point2D[][] {
  const grayscale = toGrayscale(imageData);
  const visited = new Set<number>();
  const contours: Point2D[][] = [];
  
  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const idx = y * imageData.width + x;
      
      if (visited.has(idx)) continue;
      
      const value = grayscale[idx];
      if (value < threshold) {
        const boundary = traceBoundary(grayscale, imageData.width, imageData.height, x, y, threshold);
        
        if (boundary.length > 20) {
          contours.push(boundary);
          
          // Mark all boundary points as visited
          boundary.forEach(p => {
            visited.add(p.y * imageData.width + p.x);
          });
        }
      }
    }
  }
  
  return contours;
}

/**
 * Douglas-Peucker path simplification
 */
function douglasPeucker(points: Point2D[], tolerance: number): Point2D[] {
  if (points.length <= 2) return points;
  
  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  
  let closestX: number, closestY: number;
  if (u < 0) {
    closestX = lineStart.x;
    closestY = lineStart.y;
  } else if (u > 1) {
    closestX = lineEnd.x;
    closestY = lineEnd.y;
  } else {
    closestX = lineStart.x + u * dx;
    closestY = lineStart.y + u * dy;
  }
  
  return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
}

/**
 * Convert points to SVG path data
 */
function pointsToSVGPath(points: Point2D[], centerX: number, centerY: number): string {
  if (points.length === 0) return '';
  
  // Center the path
  const centeredPoints = points.map(p => ({
    x: p.x - centerX,
    y: p.y - centerY
  }));
  
  let path = `M${centeredPoints[0].x.toFixed(0)},${centeredPoints[0].y.toFixed(0)}`;
  
  for (let i = 1; i < centeredPoints.length; i++) {
    path += ` L${centeredPoints[i].x.toFixed(0)},${centeredPoints[i].y.toFixed(0)}`;
  }
  
  path += ' Z';
  return path;
}

/**
 * Trace a single image and generate SVG path
 */
async function traceImage(imagePath: string): Promise<string> {
  console.log(`\nTracing: ${path.basename(imagePath)}`);
  
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const { data, info } = await image
    .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  
  // Convert to RGBA
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (channels === 3) {
      rgba[i * 4] = data[i * 3];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    } else if (channels === 4) {
      rgba[i * 4] = data[i * 4];
      rgba[i * 4 + 1] = data[i * 4 + 1];
      rgba[i * 4 + 2] = data[i * 4 + 2];
      rgba[i * 4 + 3] = data[i * 4 + 3];
    } else {
      rgba[i * 4] = data[i];
      rgba[i * 4 + 1] = data[i];
      rgba[i * 4 + 2] = data[i];
      rgba[i * 4 + 3] = 255;
    }
  }
  
  const imageData: ImageData = { width, height, data: rgba };
  
  // Find contours
  const contours = findContours(imageData, 200);
  console.log(`  Found ${contours.length} contours`);
  
  if (contours.length === 0) {
    return '';
  }
  
  // Get largest contour (main shape)
  const largestContour = contours.reduce((max, c) => c.length > max.length ? c : max, contours[0]);
  console.log(`  Largest contour: ${largestContour.length} points`);
  
  // Simplify with Douglas-Peucker
  const simplified = douglasPeucker(largestContour, 2.0);
  console.log(`  Simplified to: ${simplified.length} points (${((1 - simplified.length / largestContour.length) * 100).toFixed(1)}% reduction)`);
  
  // Convert to SVG path (centered)
  const centerX = width / 2;
  const centerY = height / 2;
  const svgPath = pointsToSVGPath(simplified, centerX, centerY);
  
  // Calculate viewBox
  const minX = Math.min(...simplified.map(p => p.x - centerX));
  const maxX = Math.max(...simplified.map(p => p.x - centerX));
  const minY = Math.min(...simplified.map(p => p.y - centerY));
  const maxY = Math.max(...simplified.map(p => p.y - centerY));
  const viewBox = `${minX - 5} ${minY - 5} ${maxX - minX + 10} ${maxY - minY + 10}`;
  
  console.log(`  ViewBox: ${viewBox}`);
  console.log(`  Path: ${svgPath.substring(0, 80)}...`);
  
  return svgPath;
}

/**
 * Main function - trace all shapes
 */
async function main() {
  const shapesDir = path.join(process.cwd(), 'test-images', 'shapes');
  const files = fs.readdirSync(shapesDir).filter(f => f.endsWith('.PNG') || f.endsWith('.png'));
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PRESET SHAPE TRACER                                      ║');
  console.log('║   Scott Algorithm - Moore-Neighbor + Douglas-Peucker      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nFound ${files.length} shape images to trace\n`);
  
  const results: { [key: string]: string } = {};
  
  for (const file of files) {
    const filePath = path.join(shapesDir, file);
    const shapeName = file.replace('.PNG', '').replace('.png', '');
    const svgPath = await traceImage(filePath);
    results[shapeName] = svgPath;
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TRACED PATHS                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  for (const [name, path] of Object.entries(results)) {
    console.log(`${name}:`);
    console.log(`  pathData: '${path}'`);
    console.log('');
  }
}

main().catch(console.error);
