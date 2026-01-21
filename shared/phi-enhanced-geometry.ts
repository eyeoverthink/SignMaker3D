/**
 * PHI-ENHANCED GEOMETRY UTILITIES
 * 
 * Integrates golden ratio (φ) and Fibonacci sequence principles
 * into path simplification and image tracing algorithms.
 * 
 * Based on: PHI_ENHANCED_SCOTT_ALGORITHM_PROOF.md
 * Author: Vaughn Scott
 * Date: January 2026
 */

// ============================================================================
// PHI CONSTANTS AND FIBONACCI SEQUENCE
// ============================================================================

export const PHI = 1.6180339887498948482;
export const PHI_INVERSE = 1 / PHI; // 0.618033988...
export const PHI_SQUARED = PHI * PHI; // 2.618033988...

export const FIBONACCI_SEQUENCE = [
  1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597
];

// ============================================================================
// PHI-RESONANCE CALCULATIONS
// ============================================================================

/**
 * Calculate phi-resonance of a value
 * Returns 0-1, where 1 = perfect resonance (value * φ is near integer)
 */
export function calculatePhiResonance(value: number): number {
  if (value === 0) return 0;
  
  const product = value * PHI;
  const fractional = Math.abs(product - Math.round(product));
  
  // Perfect resonance when fractional part is near 0
  return 1 - fractional;
}

/**
 * Find closest Fibonacci number to a value
 */
export function findClosestFibonacci(value: number): { fib: number; index: number } {
  let closest = FIBONACCI_SEQUENCE[0];
  let closestIndex = 0;
  let minDiff = Math.abs(value - closest);
  
  for (let i = 1; i < FIBONACCI_SEQUENCE.length; i++) {
    const diff = Math.abs(value - FIBONACCI_SEQUENCE[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = FIBONACCI_SEQUENCE[i];
      closestIndex = i;
    }
  }
  
  return { fib: closest, index: closestIndex };
}

/**
 * Calculate Fibonacci-adaptive threshold for image processing
 */
export function calculateFibonacciThreshold(width: number, height: number): number {
  const diagonal = Math.sqrt(width * width + height * height);
  const { index } = findClosestFibonacci(diagonal);
  
  // Base threshold scaled by phi-ratio
  const threshold = 128 * (1 + (index / FIBONACCI_SEQUENCE.length) * PHI_INVERSE);
  
  return Math.min(255, Math.max(0, Math.round(threshold)));
}

// ============================================================================
// PHI-WEIGHTED DISTANCE CALCULATIONS
// ============================================================================

/**
 * Calculate perpendicular distance from point to line
 * Standard Euclidean distance (no phi-weighting)
 */
export function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const norm = Math.sqrt(dx * dx + dy * dy);
  
  if (norm === 0) {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }
  
  return Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  ) / norm;
}

/**
 * Calculate phi-weighted perpendicular distance
 * Emphasizes natural curvature patterns
 */
export function phiWeightedDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  // Standard perpendicular distance
  const baseDistance = perpendicularDistance(point, lineStart, lineEnd);
  
  // Calculate angle of line segment
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
  
  // Phi-resonance of angle
  const angleResonance = calculatePhiResonance(angle);
  
  // Angle weight (higher resonance = different weighting)
  const angleWeight = 1.0 + angleResonance * PHI_INVERSE;
  
  // Calculate position along segment (t parameter)
  const t = calculateTParameter(point, lineStart, lineEnd);
  
  // Position weight (points at phi-ratio positions are significant)
  const phiPosition = Math.abs(t - PHI_INVERSE);
  const positionWeight = 1.0 + phiPosition * 0.5;
  
  return baseDistance * angleWeight * positionWeight;
}

/**
 * Calculate t parameter (0-1) for point projection onto line segment
 */
function calculateTParameter(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) return 0;
  
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  return Math.max(0, Math.min(1, t));
}

// ============================================================================
// PHI-ENHANCED DOUGLAS-PEUCKER SIMPLIFICATION
// ============================================================================

/**
 * Standard Douglas-Peucker path simplification
 * No phi-enhancement (for comparison/fallback)
 */
export function simplifyPathStandard(
  points: { x: number; y: number }[],
  tolerance: number
): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  
  // Find point with maximum distance
  let maxDist = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // Recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPathStandard(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPathStandard(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[points.length - 1]];
}

/**
 * Phi-enhanced Douglas-Peucker path simplification
 * Uses phi-weighted distances and adaptive tolerance
 */
export function simplifyPathPhi(
  points: { x: number; y: number }[],
  baseTolerance: number,
  usePhiWeighting: boolean = true
): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  
  // Find point with maximum distance (phi-weighted or standard)
  let maxDist = 0;
  let maxIndex = 0;
  
  const distanceFunc = usePhiWeighting ? phiWeightedDistance : perpendicularDistance;
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = distanceFunc(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // Calculate segment resonance for adaptive tolerance
  const segmentLength = calculatePathLength(points);
  const resonance = calculatePhiResonance(segmentLength);
  
  // Adaptive tolerance: high resonance = more aggressive simplification
  const adaptiveTolerance = baseTolerance * (1.0 + resonance * PHI);
  
  // Recursively simplify
  if (maxDist > adaptiveTolerance) {
    const left = simplifyPathPhi(points.slice(0, maxIndex + 1), baseTolerance, usePhiWeighting);
    const right = simplifyPathPhi(points.slice(maxIndex), baseTolerance, usePhiWeighting);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[points.length - 1]];
}

/**
 * Calculate total path length
 */
function calculatePathLength(points: { x: number; y: number }[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

// ============================================================================
// ARRAY FORMAT CONVERSIONS (for compatibility with existing code)
// ============================================================================

/**
 * Convert array format [[x,y], ...] to object format [{x,y}, ...]
 */
export function arrayToObjectPoints(points: number[][]): { x: number; y: number }[] {
  return points.map(([x, y]) => ({ x, y }));
}

/**
 * Convert object format [{x,y}, ...] to array format [[x,y], ...]
 */
export function objectToArrayPoints(points: { x: number; y: number }[]): number[][] {
  return points.map(p => [p.x, p.y]);
}

/**
 * Simplify path in array format (for font-loader.ts compatibility)
 */
export function simplifyPathArrayFormat(
  points: number[][],
  tolerance: number,
  usePhiEnhancement: boolean = true
): number[][] {
  if (points.length <= 2) return points;
  
  const objectPoints = arrayToObjectPoints(points);
  const simplified = usePhiEnhancement
    ? simplifyPathPhi(objectPoints, tolerance, true)
    : simplifyPathStandard(objectPoints, tolerance);
  
  return objectToArrayPoints(simplified);
}

// ============================================================================
// CURVATURE DETECTION (for identifying natural patterns)
// ============================================================================

/**
 * Calculate Menger curvature at a point
 * Higher values = sharper curves
 */
export function calculateCurvature(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  // Area of triangle formed by three points
  const area = Math.abs(
    (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
  ) / 2;
  
  // Side lengths
  const a = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  const b = Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2);
  const c = Math.sqrt((p3.x - p1.x) ** 2 + (p3.y - p1.y) ** 2);
  
  if (a * b * c === 0) return 0;
  
  // Menger curvature
  return (4 * area) / (a * b * c);
}

/**
 * Detect high-curvature points using Fibonacci sampling
 * Returns indices of significant curvature points
 */
export function detectCurvaturePoints(
  points: { x: number; y: number }[],
  curvatureThreshold: number = 0.1
): number[] {
  if (points.length < 5) return [];
  
  const curvaturePoints: number[] = [];
  
  // Sample at Fibonacci intervals
  for (const fib of FIBONACCI_SEQUENCE) {
    if (fib >= points.length - 1) break;
    
    const i = fib;
    if (i < 1 || i >= points.length - 1) continue;
    
    const p1 = points[Math.max(0, i - 1)];
    const p2 = points[i];
    const p3 = points[Math.min(points.length - 1, i + 1)];
    
    const curvature = calculateCurvature(p1, p2, p3);
    
    if (curvature > curvatureThreshold) {
      curvaturePoints.push(i);
    }
  }
  
  return curvaturePoints;
}

// ============================================================================
// SHAPE CLASSIFICATION (natural vs artificial)
// ============================================================================

/**
 * Classify shape as natural or artificial based on phi-resonance
 * Returns resonance score (0-1) and classification
 */
export function classifyShape(points: { x: number; y: number }[]): {
  resonance: number;
  classification: 'natural' | 'artificial' | 'mixed';
  confidence: number;
} {
  if (points.length < 3) {
    return { resonance: 0, classification: 'artificial', confidence: 0 };
  }
  
  const pathLength = calculatePathLength(points);
  const resonance = calculatePhiResonance(pathLength);
  
  // Calculate average curvature
  let totalCurvature = 0;
  let curvatureCount = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const curvature = calculateCurvature(points[i - 1], points[i], points[i + 1]);
    totalCurvature += curvature;
    curvatureCount++;
  }
  
  const avgCurvature = curvatureCount > 0 ? totalCurvature / curvatureCount : 0;
  
  // Classification logic
  let classification: 'natural' | 'artificial' | 'mixed';
  let confidence: number;
  
  if (resonance > 0.7 && avgCurvature > 0.05) {
    classification = 'natural';
    confidence = resonance;
  } else if (resonance < 0.3 && avgCurvature < 0.02) {
    classification = 'artificial';
    confidence = 1 - resonance;
  } else {
    classification = 'mixed';
    confidence = 0.5;
  }
  
  return { resonance, classification, confidence };
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export interface PhiEnhancementConfig {
  enabled: boolean;
  usePhiWeighting: boolean;
  useFibonacciThreshold: boolean;
  useAdaptiveTolerance: boolean;
  baseTolerance: number;
}

export const DEFAULT_PHI_CONFIG: PhiEnhancementConfig = {
  enabled: true,
  usePhiWeighting: true,
  useFibonacciThreshold: true,
  useAdaptiveTolerance: true,
  baseTolerance: 2.0
};
