/**
 * LETTER CONNECTOR MODULE
 * Scott Algorithm - Smart Letter Connections
 * 
 * Connects separate letter paths into continuous tube paths
 * Uses:
 * - Closest point detection
 * - Smooth bezier connections
 * - Douglas-Peucker simplification
 */

interface Point2D {
  x: number;
  y: number;
}

interface ConnectionResult {
  connectedPaths: number[][][];
  connectionCount: number;
  totalLength: number;
  originalSegments: number;
  connectedSegments: number;
}

/**
 * Find closest points between two path endpoints
 */
function findClosestEndpoints(
  path1: number[][],
  path2: number[][]
): {
  end1: number[];
  start2: number[];
  distance: number;
} {
  const end1 = path1[path1.length - 1];
  const start2 = path2[0];
  
  const dx = start2[0] - end1[0];
  const dy = start2[1] - end1[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return { end1, start2, distance };
}

/**
 * Generate smooth bezier connection between two points
 */
function generateSmoothConnection(
  point1: number[],
  point2: number[],
  segments: number = 10
): number[][] {
  const connection: number[][] = [];
  
  // Calculate control points for smooth curve
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  
  // Control points offset perpendicular to connection line
  const perpX = -dy * 0.2;
  const perpY = dx * 0.2;
  
  const cp1 = [point1[0] + dx * 0.33 + perpX, point1[1] + dy * 0.33 + perpY];
  const cp2 = [point1[0] + dx * 0.67 - perpX, point1[1] + dy * 0.67 - perpY];
  
  // Generate cubic bezier curve
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    const x = mt3 * point1[0] + 
              3 * mt2 * t * cp1[0] + 
              3 * mt * t2 * cp2[0] + 
              t3 * point2[0];
              
    const y = mt3 * point1[1] + 
              3 * mt2 * t * cp1[1] + 
              3 * mt * t2 * cp2[1] + 
              t3 * point2[1];
    
    connection.push([x, y]);
  }
  
  return connection;
}

/**
 * Calculate total path length
 */
function calculatePathLength(paths: number[][][]): number {
  let total = 0;
  
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1][0] - path[i][0];
      const dy = path[i + 1][1] - path[i][1];
      total += Math.sqrt(dx * dx + dy * dy);
    }
  }
  
  return total;
}

/**
 * Douglas-Peucker simplification
 */
function douglasPeucker(points: number[][], tolerance: number): number[][] {
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

/**
 * Main function: Connect letter paths into continuous tubes
 */
export function connectLetterPaths(
  letterPaths: number[][][],
  maxConnectionDistance: number = 50,
  simplificationTolerance: number = 0.5
): ConnectionResult {
  if (letterPaths.length === 0) {
    return {
      connectedPaths: [],
      connectionCount: 0,
      totalLength: 0,
      originalSegments: 0,
      connectedSegments: 0
    };
  }
  
  const originalSegments = letterPaths.length;
  const connectedPaths: number[][][] = [];
  let connectionCount = 0;
  
  // Start with first path
  let currentPath = [...letterPaths[0]];
  
  for (let i = 1; i < letterPaths.length; i++) {
    const nextPath = letterPaths[i];
    
    // Find closest endpoints (last path of current letter to first path of next letter)
    const lastPathOfCurrent = currentPath[currentPath.length - 1];
    const firstPathOfNext = nextPath[0];
    
    const { end1, start2, distance } = findClosestEndpoints(
      lastPathOfCurrent,
      firstPathOfNext
    );
    
    // If close enough, connect with smooth curve
    if (distance <= maxConnectionDistance) {
      const connection = generateSmoothConnection(end1, start2, 10);
      const simplified = douglasPeucker(connection, simplificationTolerance);
      
      // Add connection to current path
      currentPath.push(simplified);
      
      // Add next letter's paths
      currentPath.push(...nextPath);
      
      connectionCount++;
    } else {
      // Too far apart, start new continuous path
      connectedPaths.push(currentPath);
      currentPath = [...nextPath];
    }
  }
  
  // Add final path
  connectedPaths.push(currentPath);
  
  const totalLength = calculatePathLength(connectedPaths);
  const connectedSegments = connectedPaths.length;
  
  return {
    connectedPaths,
    connectionCount,
    totalLength,
    originalSegments,
    connectedSegments
  };
}

/**
 * Helper: Group paths by letter (for multi-component glyphs like 'i', 'j')
 */
export function groupPathsByLetter(
  allPaths: number[][][],
  letterCount: number
): number[][][][] {
  const pathsPerLetter = Math.ceil(allPaths.length / letterCount);
  const grouped: number[][][][] = [];
  
  for (let i = 0; i < letterCount; i++) {
    const start = i * pathsPerLetter;
    const end = Math.min(start + pathsPerLetter, allPaths.length);
    grouped.push(allPaths.slice(start, end));
  }
  
  return grouped;
}

/**
 * Advanced: Connect with collision avoidance
 */
export function connectWithCollisionAvoidance(
  letterPaths: number[][][],
  existingGeometry: number[][][],
  maxConnectionDistance: number = 50
): ConnectionResult {
  // TODO: Implement collision detection using Scott Algorithm
  // For now, use basic connection
  return connectLetterPaths(letterPaths, maxConnectionDistance);
}
