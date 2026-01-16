// Font Glyph Skeletonization - Centerline Extraction for Neon Tubes
// Uses Distance Transform + Medial Axis for accurate centerline extraction

import { createCanvas } from 'canvas';
import * as opentype from 'opentype.js';

// Distance Transform - find distance from each pixel to nearest edge
function distanceTransform(binary: boolean[][], width: number, height: number): number[][] {
  const dist: number[][] = Array(height).fill(0).map(() => Array(width).fill(Infinity));
  
  // Initialize: 0 for background, Infinity for foreground
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!binary[y][x]) {
        dist[y][x] = 0;
      }
    }
  }
  
  // Forward pass
  for (let y = 1; y < height; y++) {
    for (let x = 1; x < width; x++) {
      if (binary[y][x]) {
        const d1 = dist[y - 1][x] + 1;
        const d2 = dist[y][x - 1] + 1;
        const d3 = dist[y - 1][x - 1] + 1.414;
        const d4 = dist[y - 1][x + 1] + 1.414;
        dist[y][x] = Math.min(dist[y][x], d1, d2, d3, d4);
      }
    }
  }
  
  // Backward pass
  for (let y = height - 2; y >= 0; y--) {
    for (let x = width - 2; x >= 0; x--) {
      if (binary[y][x]) {
        const d1 = dist[y + 1][x] + 1;
        const d2 = dist[y][x + 1] + 1;
        const d3 = dist[y + 1][x + 1] + 1.414;
        const d4 = dist[y + 1][x - 1] + 1.414;
        dist[y][x] = Math.min(dist[y][x], d1, d2, d3, d4);
      }
    }
  }
  
  return dist;
}

// Extract medial axis (ridge points) from distance transform
function extractMedialAxis(dist: number[][], binary: boolean[][], width: number, height: number): boolean[][] {
  const medial: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!binary[y][x]) continue;
      
      const center = dist[y][x];
      if (center < 2) continue; // Too close to edge
      
      // Check 8 neighbors
      const neighbors = [
        dist[y - 1][x], dist[y - 1][x + 1], dist[y][x + 1], dist[y + 1][x + 1],
        dist[y + 1][x], dist[y + 1][x - 1], dist[y][x - 1], dist[y - 1][x - 1]
      ];
      
      // If center is greater than or equal to most neighbors, it's a ridge point
      let maxCount = 0;
      for (const n of neighbors) {
        if (center >= n) maxCount++;
      }
      
      if (maxCount >= 6) { // Is a ridge point
        medial[y][x] = true;
      }
    }
  }
  
  return medial;
}

// Thin the medial axis to single pixel width
function thinMedialAxis(medial: boolean[][], width: number, height: number): boolean[][] {
  const thinned = medial.map(row => [...row]);
  let changed = true;
  let iterations = 0;
  
  while (changed && iterations < 50) {
    changed = false;
    iterations++;
    
    const toRemove: Array<[number, number]> = [];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (!thinned[y][x]) continue;
        
        // Count neighbors
        const neighbors = [
          thinned[y - 1][x], thinned[y - 1][x + 1], thinned[y][x + 1], thinned[y + 1][x + 1],
          thinned[y + 1][x], thinned[y + 1][x - 1], thinned[y][x - 1], thinned[y - 1][x - 1]
        ];
        
        const count = neighbors.filter(n => n).length;
        
        // Remove if it has only 1 neighbor and is not an endpoint we want to keep
        if (count === 1) {
          // Keep endpoints
          continue;
        }
        
        // Remove if it has 2 neighbors that are adjacent (not a junction)
        if (count === 2) {
          let adjacent = false;
          for (let i = 0; i < 8; i++) {
            if (neighbors[i] && neighbors[(i + 1) % 8]) {
              adjacent = true;
              break;
            }
          }
          if (adjacent) {
            toRemove.push([x, y]);
            changed = true;
          }
        }
      }
    }
    
    for (const [x, y] of toRemove) {
      thinned[y][x] = false;
    }
  }
  
  return thinned;
}

// Trace skeleton pixels into ordered vector paths
function traceSkeleton(skeleton: boolean[][], width: number, height: number): number[][][] {
  const paths: number[][][] = [];
  const visited: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));

  // Find all endpoints and junctions first
  const startPoints: Array<[number, number]> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (skeleton[y][x]) {
        const neighborCount = countNeighbors(skeleton, x, y, width, height);
        // Endpoints (1 neighbor) or junctions (3+ neighbors) are good start points
        if (neighborCount === 1 || neighborCount >= 3) {
          startPoints.push([x, y]);
        }
      }
    }
  }

  // Trace from each start point
  for (const [sx, sy] of startPoints) {
    if (visited[sy][sx]) continue;
    
    const path = followOrderedPath(skeleton, visited, sx, sy, width, height);
    if (path.length >= 2) {
      paths.push(path);
    }
  }

  // Catch any remaining unvisited skeleton pixels (closed loops)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (skeleton[y][x] && !visited[y][x]) {
        const path = followOrderedPath(skeleton, visited, x, y, width, height);
        if (path.length >= 2) {
          paths.push(path);
        }
      }
    }
  }

  return paths;
}

function countNeighbors(skeleton: boolean[][], x: number, y: number, width: number, height: number): number {
  let count = 0;
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && skeleton[ny][nx]) {
      count++;
    }
  }
  
  return count;
}

function followOrderedPath(
  skeleton: boolean[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): number[][] {
  const path: number[][] = [[startX, startY]];
  visited[startY][startX] = true;
  
  let currentX = startX;
  let currentY = startY;
  
  // Follow the path in order (not using queue, follow connected pixels)
  while (true) {
    let nextX = -1;
    let nextY = -1;
    let minDist = Infinity;
    
    // Check 8 neighbors, prefer continuing in same direction
    const neighbors = [
      [0, -1], [1, 0], [0, 1], [-1, 0],  // Cardinal first
      [1, -1], [1, 1], [-1, 1], [-1, -1]  // Then diagonal
    ];
    
    for (const [dx, dy] of neighbors) {
      const nx = currentX + dx;
      const ny = currentY + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          skeleton[ny][nx] && !visited[ny][nx]) {
        // Prefer continuing in same direction if we have a previous point
        if (path.length >= 2) {
          const prevX = path[path.length - 2][0];
          const prevY = path[path.length - 2][1];
          const dirX = currentX - prevX;
          const dirY = currentY - prevY;
          
          // Check if this continues in similar direction
          const dot = dx * dirX + dy * dirY;
          const dist = Math.sqrt(dx * dx + dy * dy) - dot * 0.5; // Prefer same direction
          
          if (dist < minDist) {
            minDist = dist;
            nextX = nx;
            nextY = ny;
          }
        } else {
          // First step, just take first available
          nextX = nx;
          nextY = ny;
          break;
        }
      }
    }
    
    if (nextX === -1) break; // No more neighbors
    
    path.push([nextX, nextY]);
    visited[nextY][nextX] = true;
    currentX = nextX;
    currentY = nextY;
  }
  
  return path;
}

// Simplify path using Douglas-Peucker algorithm
function simplifyPath(points: number[][], tolerance: number): number[][] {
  if (points.length <= 2) return points;
  return douglasPeucker(points, tolerance);
}

function douglasPeucker(points: number[][], epsilon: number): number[][] {
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

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  
  const u = ((px - x1) * dx + (py - y1) * dy) / (mag * mag);
  const closestX = x1 + u * dx;
  const closestY = y1 + u * dy;
  
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Extract centerline from a font glyph using skeletonization
 * @param glyph - OpenType.js glyph object
 * @param fontSize - Size to render the glyph
 * @param scale - Additional scaling factor
 * @returns Array of centerline paths as [x, y] coordinates
 */
export function extractGlyphCenterline(
  glyph: opentype.Glyph,
  fontSize: number,
  scale: number
): number[][][] {
  try {
    // Render glyph to canvas
    const canvasSize = Math.ceil(fontSize * 1.5);
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw glyph
  ctx.fillStyle = 'black';
  const glyphPath = glyph.getPath(canvasSize * 0.1, canvasSize * 0.8, fontSize);
  
  // Convert opentype path to canvas path
  ctx.beginPath();
  for (const cmd of glyphPath.commands) {
    if (cmd.type === 'M') {
      ctx.moveTo(cmd.x, cmd.y);
    } else if (cmd.type === 'L') {
      ctx.lineTo(cmd.x, cmd.y);
    } else if (cmd.type === 'Q') {
      ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    } else if (cmd.type === 'C') {
      ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    } else if (cmd.type === 'Z') {
      ctx.closePath();
    }
  }
  ctx.fill();

  // Get image data and convert to binary
  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const binary: boolean[][] = Array(canvasSize).fill(0).map(() => Array(canvasSize).fill(false));
  
  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const idx = (y * canvasSize + x) * 4;
      const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
      binary[y][x] = gray < 128; // Black pixels
    }
  }

  // Apply distance transform to find medial axis
  console.log(`[Skeletonizer] Computing distance transform...`);
  const distMap = distanceTransform(binary, canvasSize, canvasSize);
  
  // Extract medial axis (ridge points)
  console.log(`[Skeletonizer] Extracting medial axis...`);
  const medialAxis = extractMedialAxis(distMap, binary, canvasSize, canvasSize);
  
  // Thin to single pixel width
  console.log(`[Skeletonizer] Thinning to centerline...`);
  const skeleton = thinMedialAxis(medialAxis, canvasSize, canvasSize);

  // Trace skeleton to ordered paths
  console.log(`[Skeletonizer] Tracing paths...`);
  const rawPaths = traceSkeleton(skeleton, canvasSize, canvasSize);
  console.log(`[Skeletonizer] Found ${rawPaths.length} paths`);

  // Simplify and scale paths
  const simplifiedPaths = rawPaths.map(path => {
    const simplified = simplifyPath(path, 2.0);
    return simplified.map(([x, y]) => [
      (x - canvasSize * 0.1) * scale,
      -(y - canvasSize * 0.8) * scale
    ]);
  });

    return simplifiedPaths;
  } catch (error) {
    console.error('[Skeletonizer] Error extracting centerline:', error);
    // Return empty array on error - font-loader will fall back to outline mode
    return [];
  }
}
