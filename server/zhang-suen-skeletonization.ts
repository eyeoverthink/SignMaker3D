/**
 * ZHANG-SUEN SKELETONIZATION ALGORITHM
 * Extracts Medial Axis Transform M(Ω) from binary images
 * 
 * Mathematical Foundation:
 * For bounded open set Ω ⊂ ℝ², the Medial Axis M(Ω) is the locus of centers
 * of all maximal inscribed disks. This algorithm approximates M(Ω) by iteratively
 * thinning the shape while preserving topology (homotopy equivalence).
 * 
 * Reference: Zhang, T.Y. and Suen, C.Y. (1984)
 * "A fast parallel algorithm for thinning digital patterns"
 * Communications of the ACM, 27(3), 236-239
 */

export interface BinaryImage {
  width: number;
  height: number;
  data: Uint8Array; // 1 = foreground (shape), 0 = background
}

/**
 * Apply Zhang-Suen thinning algorithm to extract skeleton
 * Returns 1-pixel-wide medial axis that is homotopy-equivalent to input
 */
export function zhangSuenSkeleton(image: BinaryImage): BinaryImage {
  const { width, height, data } = image;
  
  // Create working copy
  const skeleton = new Uint8Array(data);
  
  let pixelsRemoved = 0;
  let iteration = 0;
  const maxIterations = 1000; // Safety limit
  
  console.log('[Zhang-Suen] Starting skeletonization...');
  
  do {
    pixelsRemoved = 0;
    
    // Sub-iteration 1: Remove pixels satisfying conditions with P2, P4, P6 check
    const toRemove1 = findRemovablePixels(skeleton, width, height, 1);
    for (const idx of toRemove1) {
      skeleton[idx] = 0;
      pixelsRemoved++;
    }
    
    // Sub-iteration 2: Remove pixels satisfying conditions with P4, P6, P8 check
    const toRemove2 = findRemovablePixels(skeleton, width, height, 2);
    for (const idx of toRemove2) {
      skeleton[idx] = 0;
      pixelsRemoved++;
    }
    
    iteration++;
    
    if (iteration % 10 === 0) {
      console.log(`[Zhang-Suen] Iteration ${iteration}: removed ${pixelsRemoved} pixels`);
    }
    
  } while (pixelsRemoved > 0 && iteration < maxIterations);
  
  console.log(`[Zhang-Suen] Complete after ${iteration} iterations`);
  
  return { width, height, data: skeleton };
}

/**
 * Find pixels that can be removed in this sub-iteration
 * @param phase 1 or 2 (determines which connectivity check to use)
 */
function findRemovablePixels(
  data: Uint8Array,
  width: number,
  height: number,
  phase: 1 | 2
): number[] {
  const toRemove: number[] = [];
  
  // Scan all foreground pixels (excluding border)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      if (data[idx] === 0) continue; // Skip background
      
      // Get 8-connected neighbors (clockwise from top)
      // P9 P2 P3
      // P8 P1 P4
      // P7 P6 P5
      const p2 = data[(y - 1) * width + x];
      const p3 = data[(y - 1) * width + (x + 1)];
      const p4 = data[y * width + (x + 1)];
      const p5 = data[(y + 1) * width + (x + 1)];
      const p6 = data[(y + 1) * width + x];
      const p7 = data[(y + 1) * width + (x - 1)];
      const p8 = data[y * width + (x - 1)];
      const p9 = data[(y - 1) * width + (x - 1)];
      
      // Condition 1: 2 ≤ B(P1) ≤ 6
      // B(P1) = number of non-zero neighbors
      const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
      if (b < 2 || b > 6) continue;
      
      // Condition 2: A(P1) = 1
      // A(P1) = number of 0→1 transitions in ordered sequence of neighbors
      const a = transitions([p2, p3, p4, p5, p6, p7, p8, p9]);
      if (a !== 1) continue;
      
      // Condition 3 & 4: Connectivity preservation (depends on phase)
      if (phase === 1) {
        // Phase 1: P2 × P4 × P6 = 0 AND P4 × P6 × P8 = 0
        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;
      } else {
        // Phase 2: P2 × P4 × P8 = 0 AND P2 × P6 × P8 = 0
        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;
      }
      
      // All conditions satisfied - mark for removal
      toRemove.push(idx);
    }
  }
  
  return toRemove;
}

/**
 * Count 0→1 transitions in circular sequence
 */
function transitions(neighbors: number[]): number {
  let count = 0;
  const n = neighbors.length;
  
  for (let i = 0; i < n; i++) {
    const current = neighbors[i];
    const next = neighbors[(i + 1) % n];
    
    if (current === 0 && next === 1) {
      count++;
    }
  }
  
  return count;
}

/**
 * Convert grayscale image to binary using threshold
 */
export function toBinary(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): BinaryImage {
  const data = new Uint8Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    // Foreground (1) if pixel is dark (below threshold)
    data[i] = grayscale[i * 4] < threshold ? 1 : 0;
  }
  
  return { width, height, data };
}

/**
 * Extract skeleton paths from binary skeleton image
 * Traces the 1-pixel-wide skeleton to get connected paths
 */
export function extractSkeletonPaths(skeleton: BinaryImage): number[][][] {
  const { width, height, data } = skeleton;
  const visited = new Uint8Array(width * height);
  const paths: number[][][] = [];
  
  // Find all skeleton pixels and trace connected components
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (data[idx] === 1 && visited[idx] === 0) {
        const path = traceSkeletonPath(data, visited, width, height, x, y);
        
        if (path.length >= 3) {
          paths.push(path);
        }
      }
    }
  }
  
  console.log(`[Zhang-Suen] Extracted ${paths.length} skeleton paths`);
  return paths;
}

/**
 * Trace a single connected skeleton path starting from (x, y)
 */
function traceSkeletonPath(
  data: Uint8Array,
  visited: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number
): number[][] {
  const path: number[][] = [];
  const stack: [number, number][] = [[startX, startY]];
  
  // 8-connected neighbors
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;
    
    if (visited[idx] === 1) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (data[idx] === 0) continue;
    
    visited[idx] = 1;
    path.push([x, y]);
    
    // Check all 8-connected neighbors
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const nidx = ny * width + nx;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (data[nidx] === 1 && visited[nidx] === 0) {
          stack.push([nx, ny]);
        }
      }
    }
  }
  
  return path;
}

/**
 * Visualize skeleton for debugging
 */
export function skeletonToImageData(
  skeleton: BinaryImage
): Uint8ClampedArray {
  const { width, height, data } = skeleton;
  const imageData = new Uint8ClampedArray(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    const value = data[i] === 1 ? 255 : 0;
    imageData[i * 4] = value;     // R
    imageData[i * 4 + 1] = value; // G
    imageData[i * 4 + 2] = value; // B
    imageData[i * 4 + 3] = 255;   // A
  }
  
  return imageData;
}
