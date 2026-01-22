/**
 * IMAGE TRACER UTILITY
 * Auto-trace and manual trace functionality for converting images to SVG paths
 * 
 * Features:
 * - Auto edge detection (Canny algorithm)
 * - Manual point-by-point tracing
 * - Path simplification (Douglas-Peucker)
 * - SVG path generation
 */

export interface TracedPath {
  points: { x: number; y: number }[];
  svgPath: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

/**
 * Auto-trace image using edge detection
 */
export async function autoTraceImage(
  imageData: ImageData,
  threshold: number = 128,
  simplifyTolerance: number = 2
): Promise<TracedPath[]> {
  const edges = detectEdges(imageData, threshold);
  const contours = findContours(edges);
  const paths = contours.map(contour => {
    const simplified = simplifyPath(contour, simplifyTolerance);
    return {
      points: simplified,
      svgPath: pointsToSVGPath(simplified),
      boundingBox: calculateBoundingBox(simplified),
    };
  });
  
  return paths;
}

/**
 * Edge detection using simple threshold
 * (In production, use Canny edge detection)
 */
function detectEdges(imageData: ImageData, threshold: number): boolean[][] {
  const width = imageData.width;
  const height = imageData.height;
  const edges: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
      
      // Simple gradient detection
      const idxRight = (y * width + (x + 1)) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      const grayRight = (imageData.data[idxRight] + imageData.data[idxRight + 1] + imageData.data[idxRight + 2]) / 3;
      const grayDown = (imageData.data[idxDown] + imageData.data[idxDown + 1] + imageData.data[idxDown + 2]) / 3;
      
      const gradientX = Math.abs(gray - grayRight);
      const gradientY = Math.abs(gray - grayDown);
      const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
      
      edges[y][x] = gradient > threshold;
    }
  }
  
  return edges;
}

/**
 * Find contours in edge-detected image
 */
function findContours(edges: boolean[][]): Array<{ x: number; y: number }[]> {
  const height = edges.length;
  const width = edges[0].length;
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  const contours: Array<{ x: number; y: number }[]> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y][x] && !visited[y][x]) {
        const contour = traceContour(edges, visited, x, y);
        if (contour.length > 10) { // Minimum contour size
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

/**
 * Trace a single contour starting from a point
 */
function traceContour(
  edges: boolean[][],
  visited: boolean[][],
  startX: number,
  startY: number
): { x: number; y: number }[] {
  const contour: { x: number; y: number }[] = [];
  const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const height = edges.length;
  const width = edges[0].length;
  
  while (stack.length > 0) {
    const point = stack.pop()!;
    const { x, y } = point;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x] || !edges[y][x]) continue;
    
    visited[y][x] = true;
    contour.push({ x, y });
    
    // 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        stack.push({ x: x + dx, y: y + dy });
      }
    }
  }
  
  return contour;
}

/**
 * Simplify path using Douglas-Peucker algorithm
 */
export function simplifyPath(
  points: { x: number; y: number }[],
  tolerance: number
): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  
  // Find point with maximum distance from line
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const closestX = lineStart.x + u * dx;
  const closestY = lineStart.y + u * dy;
  
  return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
}

/**
 * Convert points to SVG path string
 */
export function pointsToSVGPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  
  let path = `M ${points[0].x},${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }
  
  // Close path if first and last points are close
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);
  
  if (distance < 5) {
    path += " Z";
  }
  
  return path;
}

/**
 * Calculate bounding box for points
 */
function calculateBoundingBox(points: { x: number; y: number }[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Manual tracing: Add point to path
 */
export class ManualTracer {
  private points: { x: number; y: number }[] = [];
  
  addPoint(x: number, y: number) {
    this.points.push({ x, y });
  }
  
  removeLastPoint() {
    this.points.pop();
  }
  
  clear() {
    this.points = [];
  }
  
  getPoints() {
    return [...this.points];
  }
  
  getSVGPath(): string {
    return pointsToSVGPath(this.points);
  }
  
  closePath() {
    if (this.points.length > 0) {
      this.points.push({ ...this.points[0] });
    }
  }
}

/**
 * Load image from file/URL and convert to ImageData
 */
export async function loadImageData(source: string | File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Convert SVG path to canvas drawing
 */
export function drawSVGPath(
  ctx: CanvasRenderingContext2D,
  svgPath: string,
  strokeStyle: string = '#000000',
  lineWidth: number = 2
) {
  const path = new Path2D(svgPath);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke(path);
}
