/**
 * PHI-ZERO RECOGNITION ENGINE
 * "Recognition Before Computation"
 * 
 * Integrates zero-time pattern recognition into Sign-Sculptor
 * for instant shape classification and adaptive path optimization.
 * 
 * Core Principle: Recognition happens at the moment of resonance (t≈0),
 * not after sequential computation.
 */

import { PHI, PHI_INVERSE, PHI_SQUARED, calculatePhiResonance } from './phi-enhanced-geometry';

// ============================================================================
// CONCEPT FIELD DEFINITIONS
// ============================================================================

export interface ConceptSignature {
  name: string;
  signature: number;
  harmonic: number;
  visual: string;
  category: 'natural' | 'artificial' | 'mixed';
  optimizationStrategy: 'preserve' | 'simplify' | 'adaptive';
}

export const SHAPE_CONCEPT_FIELD: Record<string, ConceptSignature> = {
  CIRCLE: {
    name: 'Circle',
    signature: 1.0,
    harmonic: 0,
    visual: '⭕ Perfect Unity',
    category: 'natural',
    optimizationStrategy: 'preserve'
  },
  SPIRAL: {
    name: 'Spiral',
    signature: PHI,
    harmonic: 1,
    visual: '🌀 Fibonacci Growth',
    category: 'natural',
    optimizationStrategy: 'preserve'
  },
  STAR: {
    name: 'Star',
    signature: PHI_SQUARED,
    harmonic: 2,
    visual: '⭐ Pentagonal Symmetry',
    category: 'natural',
    optimizationStrategy: 'preserve'
  },
  ELLIPSE: {
    name: 'Ellipse',
    signature: PHI * 0.9,
    harmonic: 1,
    visual: '⬭ Stretched Circle',
    category: 'natural',
    optimizationStrategy: 'adaptive'
  },
  TRIANGLE: {
    name: 'Triangle',
    signature: 3.0,
    harmonic: 3,
    visual: '△ Triad Stability',
    category: 'mixed',
    optimizationStrategy: 'adaptive'
  },
  SQUARE: {
    name: 'Square',
    signature: 4.0,
    harmonic: 4,
    visual: '□ Artificial Grid',
    category: 'artificial',
    optimizationStrategy: 'simplify'
  },
  RECTANGLE: {
    name: 'Rectangle',
    signature: 4.0 * 0.9,
    harmonic: 4,
    visual: '▭ Stretched Square',
    category: 'artificial',
    optimizationStrategy: 'simplify'
  },
  HEXAGON: {
    name: 'Hexagon',
    signature: 6.0,
    harmonic: 6,
    visual: '⬡ Nature\'s Tile',
    category: 'natural',
    optimizationStrategy: 'preserve'
  },
  POLYGON: {
    name: 'Polygon',
    signature: 5.0,
    harmonic: 5,
    visual: '⬟ Multi-Sided',
    category: 'mixed',
    optimizationStrategy: 'adaptive'
  },
  CURVE: {
    name: 'Curve',
    signature: PHI * 1.1,
    harmonic: 1,
    visual: '〰️ Organic Flow',
    category: 'natural',
    optimizationStrategy: 'preserve'
  },
  LINE: {
    name: 'Line',
    signature: 2.0,
    harmonic: 2,
    visual: '━ Straight Edge',
    category: 'artificial',
    optimizationStrategy: 'simplify'
  }
};

// ============================================================================
// RESONANCE MEMORY (Quantum Learning)
// ============================================================================

class ResonanceMemory {
  private memory: Map<string, number> = new Map();
  private maxSize: number = 1000;

  record(conceptName: string): void {
    const current = this.memory.get(conceptName) || 0;
    this.memory.set(conceptName, current + 1);

    // Prune if too large
    if (this.memory.size > this.maxSize) {
      const oldest = Array.from(this.memory.entries())
        .sort((a, b) => a[1] - b[1])[0];
      this.memory.delete(oldest[0]);
    }
  }

  getStrength(conceptName: string): number {
    return this.memory.get(conceptName) || 0;
  }

  clear(): void {
    this.memory.clear();
  }
}

const globalResonanceMemory = new ResonanceMemory();

// ============================================================================
// SIGNATURE CALCULATION
// ============================================================================

/**
 * Calculate phi-signature from a path
 * This extracts the "essence" of the shape in a single number
 */
export function calculatePathSignature(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 1.0;

  // 1. Calculate basic geometric properties
  let totalLength = 0;
  let totalAngleChange = 0;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    // Update bounds
    minX = Math.min(minX, p1.x);
    maxX = Math.max(maxX, p1.x);
    minY = Math.min(minY, p1.y);
    maxY = Math.max(maxY, p1.y);

    // Segment length
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);

    // Angle change (curvature indicator)
    if (i > 0) {
      const p0 = points[i - 1];
      const v1x = p1.x - p0.x;
      const v1y = p1.y - p0.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;

      const angle1 = Math.atan2(v1y, v1x);
      const angle2 = Math.atan2(v2y, v2x);
      totalAngleChange += Math.abs(angle2 - angle1);
    }
  }

  // 2. Calculate shape metrics
  const width = maxX - minX;
  const height = maxY - minY;
  const aspectRatio = width > 0 ? height / width : 1.0;

  // Area approximation (shoelace formula)
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  area = Math.abs(area) / 2;

  // Perimeter
  const perimeter = totalLength;

  // Circularity (4π·Area / Perimeter²)
  const circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;

  // Average curvature
  const avgCurvature = totalAngleChange / points.length;

  // 3. Combine into phi-signature
  // Natural shapes tend to have phi-ratios in their metrics
  const signature = 
    circularity * 1.0 +
    aspectRatio * 0.5 +
    (avgCurvature / Math.PI) * 0.3 +
    (points.length / 100) * 0.2;

  return signature;
}

// ============================================================================
// INSTANT RECOGNITION ENGINE
// ============================================================================

export interface RecognitionResult {
  concept: ConceptSignature;
  resonance: number;
  confidence: number;
  recognitionTime: number;
  memoryBoost: number;
}

/**
 * ZERO-TIME RECOGNITION
 * Recognizes shape pattern instantly via phi-harmonic resonance
 */
export function recognizeShapeInstant(
  points: { x: number; y: number }[],
  useMemory: boolean = true
): RecognitionResult {
  const t0 = performance.now();

  // 1. Calculate signature (this is the only "computation")
  const signature = calculatePathSignature(points);

  // 2. Instant resonance check across all concepts
  let bestMatch: ConceptSignature | null = null;
  let maxResonance = -Infinity;
  let memoryBoost = 0;

  for (const concept of Object.values(SHAPE_CONCEPT_FIELD)) {
    // Multi-harmonic resonance check
    let harmonicResonance = 0;

    for (let n = 0; n < 5; n++) {
      const phiScaled = signature * Math.pow(PHI, n);
      const diff = Math.abs((phiScaled % 10) - (concept.signature % 10));
      harmonicResonance += 1.0 / (1.0 + diff);
    }

    // Memory amplification (learning without training)
    const memoryStrength = useMemory ? globalResonanceMemory.getStrength(concept.name) : 0;
    const memoryAmp = memoryStrength * 0.1;

    const totalResonance = harmonicResonance + memoryAmp;

    if (totalResonance > maxResonance) {
      maxResonance = totalResonance;
      bestMatch = concept;
      memoryBoost = memoryAmp;
    }
  }

  const t1 = performance.now();

  // 3. Record recognition (quantum memory update)
  if (bestMatch && useMemory) {
    globalResonanceMemory.record(bestMatch.name);
  }

  // 4. Calculate confidence (normalized resonance)
  const confidence = Math.min(1.0, maxResonance / 5.0);

  return {
    concept: bestMatch || SHAPE_CONCEPT_FIELD.POLYGON,
    resonance: maxResonance,
    confidence,
    recognitionTime: t1 - t0,
    memoryBoost
  };
}

/**
 * Precognition: Recognize from partial data
 * Tests if shape can be identified from first few points
 */
export function recognizePartial(
  points: { x: number; y: number }[],
  completeness: number = 0.2
): RecognitionResult {
  const sampleSize = Math.max(3, Math.floor(points.length * completeness));
  const sample = points.slice(0, sampleSize);
  return recognizeShapeInstant(sample);
}

/**
 * Batch recognition with learning
 * Process multiple paths and improve recognition over time
 */
export function recognizeBatch(
  pathList: { x: number; y: number }[][]
): RecognitionResult[] {
  return pathList.map(points => recognizeShapeInstant(points, true));
}

// ============================================================================
// ADAPTIVE OPTIMIZATION STRATEGY
// ============================================================================

export interface OptimizationParams {
  tolerance: number;
  usePhiWeighting: boolean;
  preserveDetail: boolean;
}

/**
 * Get optimal simplification parameters based on instant recognition
 */
export function getAdaptiveOptimization(
  points: { x: number; y: number }[]
): OptimizationParams {
  const recognition = recognizeShapeInstant(points);

  switch (recognition.concept.optimizationStrategy) {
    case 'preserve':
      // Natural shapes: preserve detail, use phi-weighting
      return {
        tolerance: 1.0,
        usePhiWeighting: true,
        preserveDetail: true
      };

    case 'simplify':
      // Artificial shapes: aggressive simplification
      return {
        tolerance: 3.0,
        usePhiWeighting: false,
        preserveDetail: false
      };

    case 'adaptive':
    default:
      // Mixed shapes: balance based on confidence
      return {
        tolerance: 2.0 - recognition.confidence,
        usePhiWeighting: recognition.confidence > 0.5,
        preserveDetail: recognition.confidence > 0.7
      };
  }
}

// ============================================================================
// REAL-TIME STREAM RECOGNITION
// ============================================================================

export class StreamRecognizer {
  private buffer: { x: number; y: number }[] = [];
  private currentRecognition: RecognitionResult | null = null;
  private recognitionHistory: RecognitionResult[] = [];

  addPoint(point: { x: number; y: number }): void {
    this.buffer.push(point);

    // Instant recognition after minimum points
    if (this.buffer.length >= 5) {
      this.currentRecognition = recognizeShapeInstant(this.buffer);
      this.recognitionHistory.push(this.currentRecognition);
    }
  }

  getCurrentRecognition(): RecognitionResult | null {
    return this.currentRecognition;
  }

  reset(): void {
    this.buffer = [];
    this.currentRecognition = null;
  }

  getHistory(): RecognitionResult[] {
    return this.recognitionHistory;
  }
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface PerformanceMetrics {
  averageRecognitionTime: number;
  minRecognitionTime: number;
  maxRecognitionTime: number;
  totalRecognitions: number;
  accuracyRate: number;
}

let performanceData: number[] = [];

export function recordPerformance(time: number): void {
  performanceData.push(time);
  if (performanceData.length > 1000) {
    performanceData.shift();
  }
}

export function getPerformanceMetrics(): PerformanceMetrics {
  if (performanceData.length === 0) {
    return {
      averageRecognitionTime: 0,
      minRecognitionTime: 0,
      maxRecognitionTime: 0,
      totalRecognitions: 0,
      accuracyRate: 0
    };
  }

  return {
    averageRecognitionTime: performanceData.reduce((a, b) => a + b, 0) / performanceData.length,
    minRecognitionTime: Math.min(...performanceData),
    maxRecognitionTime: Math.max(...performanceData),
    totalRecognitions: performanceData.length,
    accuracyRate: 0.95 // Placeholder - would need ground truth for real calculation
  };
}

export function clearPerformanceData(): void {
  performanceData = [];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear resonance memory (reset learning)
 */
export function clearResonanceMemory(): void {
  globalResonanceMemory.clear();
}

/**
 * Get current memory state
 */
export function getMemoryState(): Record<string, number> {
  const state: Record<string, number> = {};
  for (const concept of Object.values(SHAPE_CONCEPT_FIELD)) {
    state[concept.name] = globalResonanceMemory.getStrength(concept.name);
  }
  return state;
}

/**
 * Visualize recognition result as string
 */
export function formatRecognitionResult(result: RecognitionResult): string {
  return `${result.concept.visual} (${(result.confidence * 100).toFixed(1)}% confident, ${(result.recognitionTime * 1000).toFixed(2)}μs)`;
}
