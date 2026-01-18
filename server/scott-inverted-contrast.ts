/**
 * SCOTT ALGORITHM: INVERTED CONTRAST DETECTION
 * "Yin-Yang" Approach to Facial Recognition
 * 
 * Theory: Faces have natural lighting asymmetry
 * - Left eye: Normal contrast (dark pupil on light)
 * - Right eye: Inverted contrast (catches opposite lighting)
 * - Symmetry validation = instant face detection
 * 
 * No training data. No neural networks. Pure geometry.
 */

interface Point2D {
  x: number;
  y: number;
}

interface ContourRegion {
  boundary: Point2D[];
  centroid: Point2D;
  area: number;
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

interface FacialFeatures {
  leftEye: ContourRegion;
  rightEye: ContourRegion;
  nose?: ContourRegion;
  mouth?: ContourRegion;
  confidence: number;
  symmetryScore: number;
  method: 'standard' | 'inverted' | 'yin-yang';
}

interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA format
}

export class InvertedContrastDetector {
  private width: number;
  private height: number;
  private grayscale: number[];

  constructor(imageData: ImageData) {
    this.width = imageData.width;
    this.height = imageData.height;
    this.grayscale = this.toGrayscale(imageData);
  }

  /**
   * Convert RGBA to grayscale
   */
  private toGrayscale(imageData: ImageData): number[] {
    const gray = new Array(this.width * this.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Standard luminance formula
      gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    return gray;
  }

  /**
   * METHOD 1: STANDARD CONTRAST
   * Traditional single-threshold approach
   */
  detectFacialFeaturesStandard(threshold: number = 128): FacialFeatures | null {
    console.log('[Standard Method] Detecting facial features with single threshold...');
    
    const startTime = Date.now();
    
    // Find all dark regions (potential features)
    const darkRegions = this.findContours(threshold, false);
    
    // Filter by size and position
    const eyeCandidates = darkRegions.filter(r => 
      r.area > 50 && r.area < 5000 && // Reasonable eye size
      r.centroid.y < this.height * 0.6 // Upper half of image
    );
    
    if (eyeCandidates.length < 2) {
      console.log('[Standard Method] Insufficient eye candidates found');
      return null;
    }
    
    // Find best eye pair by horizontal alignment
    const eyePair = this.findBestEyePair(eyeCandidates);
    if (!eyePair) {
      console.log('[Standard Method] No valid eye pair found');
      return null;
    }
    
    const symmetryScore = this.calculateSymmetry(eyePair.left, eyePair.right);
    const detectionTime = Date.now() - startTime;
    
    console.log(`[Standard Method] Detection complete in ${detectionTime}ms, symmetry: ${(symmetryScore * 100).toFixed(1)}%`);
    
    return {
      leftEye: eyePair.left,
      rightEye: eyePair.right,
      confidence: symmetryScore,
      symmetryScore,
      method: 'standard'
    };
  }

  /**
   * METHOD 2: INVERTED CONTRAST
   * Flip the threshold to catch opposite lighting
   */
  detectFacialFeaturesInverted(threshold: number = 128): FacialFeatures | null {
    console.log('[Inverted Method] Detecting facial features with inverted threshold...');
    
    const startTime = Date.now();
    
    // Find all light regions (inverted)
    const lightRegions = this.findContours(threshold, true);
    
    const eyeCandidates = lightRegions.filter(r => 
      r.area > 50 && r.area < 5000 &&
      r.centroid.y < this.height * 0.6
    );
    
    if (eyeCandidates.length < 2) {
      console.log('[Inverted Method] Insufficient eye candidates found');
      return null;
    }
    
    const eyePair = this.findBestEyePair(eyeCandidates);
    if (!eyePair) {
      console.log('[Inverted Method] No valid eye pair found');
      return null;
    }
    
    const symmetryScore = this.calculateSymmetry(eyePair.left, eyePair.right);
    const detectionTime = Date.now() - startTime;
    
    console.log(`[Inverted Method] Detection complete in ${detectionTime}ms, symmetry: ${(symmetryScore * 100).toFixed(1)}%`);
    
    return {
      leftEye: eyePair.left,
      rightEye: eyePair.right,
      confidence: symmetryScore,
      symmetryScore,
      method: 'inverted'
    };
  }

  /**
   * METHOD 3: YIN-YANG APPROACH
   * Left eye normal, right eye inverted (or vice versa)
   * Captures natural lighting asymmetry
   */
  detectFacialFeaturesYinYang(threshold: number = 128): FacialFeatures | null {
    console.log('[Yin-Yang Method] Detecting facial features with dual contrast...');
    
    const startTime = Date.now();
    
    // Left side: Normal contrast (yin)
    const leftRegions = this.findContoursInRegion(
      threshold, 
      false, 
      0, 
      this.width / 2
    );
    
    // Right side: Inverted contrast (yang)
    const rightRegions = this.findContoursInRegion(
      threshold, 
      true, 
      this.width / 2, 
      this.width
    );
    
    // Filter eye candidates
    const leftEyeCandidates = leftRegions.filter(r => 
      r.area > 50 && r.area < 5000 &&
      r.centroid.y < this.height * 0.6
    );
    
    const rightEyeCandidates = rightRegions.filter(r => 
      r.area > 50 && r.area < 5000 &&
      r.centroid.y < this.height * 0.6
    );
    
    if (leftEyeCandidates.length === 0 || rightEyeCandidates.length === 0) {
      console.log('[Yin-Yang Method] Insufficient candidates in one or both sides');
      return null;
    }
    
    // Find best cross-contrast pair
    const eyePair = this.findBestCrossContrastPair(leftEyeCandidates, rightEyeCandidates);
    if (!eyePair) {
      console.log('[Yin-Yang Method] No valid cross-contrast pair found');
      return null;
    }
    
    const symmetryScore = this.calculateSymmetry(eyePair.left, eyePair.right);
    const detectionTime = Date.now() - startTime;
    
    console.log(`[Yin-Yang Method] Detection complete in ${detectionTime}ms, symmetry: ${(symmetryScore * 100).toFixed(1)}%`);
    
    // Try to find nose and mouth for additional validation
    const nose = this.findNose(eyePair, threshold);
    const mouth = this.findMouth(eyePair, nose, threshold);
    
    return {
      leftEye: eyePair.left,
      rightEye: eyePair.right,
      nose,
      mouth,
      confidence: symmetryScore,
      symmetryScore,
      method: 'yin-yang'
    };
  }

  /**
   * Find contours using Moore-Neighbor boundary tracing
   */
  private findContours(threshold: number, invert: boolean): ContourRegion[] {
    return this.findContoursInRegion(threshold, invert, 0, this.width);
  }

  /**
   * Find contours in specific horizontal region
   */
  private findContoursInRegion(
    threshold: number, 
    invert: boolean, 
    startX: number, 
    endX: number
  ): ContourRegion[] {
    const visited = new Set<number>();
    const regions: ContourRegion[] = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = Math.floor(startX); x < Math.floor(endX); x++) {
        const idx = y * this.width + x;
        
        if (visited.has(idx)) continue;
        
        const value = this.grayscale[idx];
        const isFeature = invert ? value > threshold : value < threshold;
        
        if (isFeature) {
          const boundary = this.traceBoundary(x, y, threshold, invert, visited);
          
          if (boundary.length > 10) { // Minimum boundary size
            const region = this.createRegion(boundary);
            regions.push(region);
          }
        }
      }
    }
    
    return regions;
  }

  /**
   * Moore-Neighbor boundary tracing
   */
  private traceBoundary(
    startX: number, 
    startY: number, 
    threshold: number, 
    invert: boolean,
    visited: Set<number>
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
      visited.add(y * this.width + x);
      
      let found = false;
      for (let i = 0; i < 8; i++) {
        const checkDir = (dir + i) % 8;
        const nx = x + directions[checkDir][0];
        const ny = y + directions[checkDir][1];
        
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
        
        const value = this.grayscale[ny * this.width + nx];
        const isFeature = invert ? value > threshold : value < threshold;
        
        if (isFeature) {
          x = nx;
          y = ny;
          dir = (checkDir + 5) % 8; // Turn left
          found = true;
          break;
        }
      }
      
      if (!found) break;
      steps++;
      
    } while ((x !== startX || y !== startY) && steps < maxSteps);
    
    return boundary;
  }

  /**
   * Create region from boundary points
   */
  private createRegion(boundary: Point2D[]): ContourRegion {
    let sumX = 0, sumY = 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const point of boundary) {
      sumX += point.x;
      sumY += point.y;
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    const centroid = {
      x: sumX / boundary.length,
      y: sumY / boundary.length
    };
    
    // Approximate area using shoelace formula
    let area = 0;
    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      area += boundary[i].x * boundary[j].y;
      area -= boundary[j].x * boundary[i].y;
    }
    area = Math.abs(area) / 2;
    
    return {
      boundary,
      centroid,
      area,
      boundingBox: { minX, maxX, minY, maxY }
    };
  }

  /**
   * Find best eye pair from candidates
   */
  private findBestEyePair(candidates: ContourRegion[]): { left: ContourRegion; right: ContourRegion } | null {
    let bestPair = null;
    let bestScore = 0;
    
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const left = candidates[i].centroid.x < candidates[j].centroid.x ? candidates[i] : candidates[j];
        const right = candidates[i].centroid.x < candidates[j].centroid.x ? candidates[j] : candidates[i];
        
        // Check horizontal alignment
        const yDiff = Math.abs(left.centroid.y - right.centroid.y);
        const xDist = right.centroid.x - left.centroid.x;
        
        if (yDiff > 50 || xDist < 50) continue; // Too misaligned or too close
        
        const score = this.calculateSymmetry(left, right);
        
        if (score > bestScore) {
          bestScore = score;
          bestPair = { left, right };
        }
      }
    }
    
    return bestPair;
  }

  /**
   * Find best cross-contrast pair (yin-yang)
   */
  private findBestCrossContrastPair(
    leftCandidates: ContourRegion[], 
    rightCandidates: ContourRegion[]
  ): { left: ContourRegion; right: ContourRegion } | null {
    let bestPair = null;
    let bestScore = 0;
    
    for (const left of leftCandidates) {
      for (const right of rightCandidates) {
        const yDiff = Math.abs(left.centroid.y - right.centroid.y);
        const xDist = right.centroid.x - left.centroid.x;
        
        if (yDiff > 50 || xDist < 50) continue;
        
        const score = this.calculateSymmetry(left, right);
        
        if (score > bestScore) {
          bestScore = score;
          bestPair = { left, right };
        }
      }
    }
    
    return bestPair;
  }

  /**
   * Calculate symmetry score between two regions
   */
  private calculateSymmetry(left: ContourRegion, right: ContourRegion): number {
    // 1. Size similarity
    const sizeRatio = Math.min(left.area, right.area) / Math.max(left.area, right.area);
    
    // 2. Vertical alignment
    const yDiff = Math.abs(left.centroid.y - right.centroid.y);
    const alignmentScore = Math.max(0, 1 - yDiff / 50);
    
    // 3. Horizontal spacing
    const xDist = right.centroid.x - left.centroid.x;
    const expectedDist = this.width * 0.3; // ~30% of image width
    const spacingScore = Math.max(0, 1 - Math.abs(xDist - expectedDist) / expectedDist);
    
    // Combined score
    return (sizeRatio * 0.4 + alignmentScore * 0.3 + spacingScore * 0.3);
  }

  /**
   * Find nose region (below eyes, center)
   */
  private findNose(eyePair: { left: ContourRegion; right: ContourRegion }, threshold: number): ContourRegion | undefined {
    const centerX = (eyePair.left.centroid.x + eyePair.right.centroid.x) / 2;
    const eyeY = (eyePair.left.centroid.y + eyePair.right.centroid.y) / 2;
    
    const noseRegions = this.findContoursInRegion(threshold, false, centerX - 30, centerX + 30);
    
    return noseRegions.find(r => 
      r.centroid.y > eyeY + 20 && 
      r.centroid.y < eyeY + 100 &&
      r.area > 20 && r.area < 1000
    );
  }

  /**
   * Find mouth region (below nose, center)
   */
  private findMouth(
    eyePair: { left: ContourRegion; right: ContourRegion }, 
    nose: ContourRegion | undefined, 
    threshold: number
  ): ContourRegion | undefined {
    const centerX = (eyePair.left.centroid.x + eyePair.right.centroid.x) / 2;
    const noseY = nose ? nose.centroid.y : (eyePair.left.centroid.y + eyePair.right.centroid.y) / 2 + 60;
    
    const mouthRegions = this.findContoursInRegion(threshold, true, centerX - 50, centerX + 50);
    
    return mouthRegions.find(r => 
      r.centroid.y > noseY + 20 && 
      r.centroid.y < noseY + 100 &&
      r.area > 50 && r.area < 2000
    );
  }
}

/**
 * BENCHMARK: Compare all three methods
 */
export function benchmarkInvertedContrast(testImages: ImageData[]): {
  standard: { accuracy: number; avgTime: number; detections: number };
  inverted: { accuracy: number; avgTime: number; detections: number };
  yinYang: { accuracy: number; avgTime: number; detections: number };
  improvement: number;
} {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   INVERTED CONTRAST BENCHMARK (YIN-YANG THEORY)           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const results = {
    standard: { totalTime: 0, detections: 0, confidenceSum: 0 },
    inverted: { totalTime: 0, detections: 0, confidenceSum: 0 },
    yinYang: { totalTime: 0, detections: 0, confidenceSum: 0 }
  };
  
  for (let i = 0; i < testImages.length; i++) {
    console.log(`\n[Test ${i + 1}/${testImages.length}] Processing image...`);
    
    const detector = new InvertedContrastDetector(testImages[i]);
    
    // Test standard method
    const startStandard = Date.now();
    const standardResult = detector.detectFacialFeaturesStandard();
    results.standard.totalTime += Date.now() - startStandard;
    if (standardResult) {
      results.standard.detections++;
      results.standard.confidenceSum += standardResult.confidence;
    }
    
    // Test inverted method
    const startInverted = Date.now();
    const invertedResult = detector.detectFacialFeaturesInverted();
    results.inverted.totalTime += Date.now() - startInverted;
    if (invertedResult) {
      results.inverted.detections++;
      results.inverted.confidenceSum += invertedResult.confidence;
    }
    
    // Test yin-yang method
    const startYinYang = Date.now();
    const yinYangResult = detector.detectFacialFeaturesYinYang();
    results.yinYang.totalTime += Date.now() - startYinYang;
    if (yinYangResult) {
      results.yinYang.detections++;
      results.yinYang.confidenceSum += yinYangResult.confidence;
    }
  }
  
  const count = testImages.length;
  
  const standardAccuracy = results.standard.detections > 0 
    ? results.standard.confidenceSum / results.standard.detections 
    : 0;
  const invertedAccuracy = results.inverted.detections > 0 
    ? results.inverted.confidenceSum / results.inverted.detections 
    : 0;
  const yinYangAccuracy = results.yinYang.detections > 0 
    ? results.yinYang.confidenceSum / results.yinYang.detections 
    : 0;
  
  const improvement = ((yinYangAccuracy - standardAccuracy) / standardAccuracy) * 100;
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   BENCHMARK RESULTS                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 STANDARD METHOD:');
  console.log(`   Detections: ${results.standard.detections}/${count}`);
  console.log(`   Avg Confidence: ${(standardAccuracy * 100).toFixed(1)}%`);
  console.log(`   Avg Time: ${(results.standard.totalTime / count).toFixed(2)}ms\n`);
  
  console.log('📊 INVERTED METHOD:');
  console.log(`   Detections: ${results.inverted.detections}/${count}`);
  console.log(`   Avg Confidence: ${(invertedAccuracy * 100).toFixed(1)}%`);
  console.log(`   Avg Time: ${(results.inverted.totalTime / count).toFixed(2)}ms\n`);
  
  console.log('📊 YIN-YANG METHOD:');
  console.log(`   Detections: ${results.yinYang.detections}/${count}`);
  console.log(`   Avg Confidence: ${(yinYangAccuracy * 100).toFixed(1)}%`);
  console.log(`   Avg Time: ${(results.yinYang.totalTime / count).toFixed(2)}ms\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 IMPROVEMENT: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    standard: {
      accuracy: standardAccuracy,
      avgTime: results.standard.totalTime / count,
      detections: results.standard.detections
    },
    inverted: {
      accuracy: invertedAccuracy,
      avgTime: results.inverted.totalTime / count,
      detections: results.inverted.detections
    },
    yinYang: {
      accuracy: yinYangAccuracy,
      avgTime: results.yinYang.totalTime / count,
      detections: results.yinYang.detections
    },
    improvement
  };
}

/**
 * Generate synthetic test images for benchmarking
 */
export function generateTestImages(count: number = 20): ImageData[] {
  const images: ImageData[] = [];
  
  for (let i = 0; i < count; i++) {
    const width = 200;
    const height = 200;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Create synthetic face with varying lighting
    const lightingAngle = (i / count) * Math.PI; // Vary from 0 to π
    
    // Draw two eyes with asymmetric lighting
    const leftEyeX = 60;
    const rightEyeX = 140;
    const eyeY = 80;
    const eyeRadius = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate distance to eyes
        const distLeft = Math.sqrt((x - leftEyeX) ** 2 + (y - eyeY) ** 2);
        const distRight = Math.sqrt((x - rightEyeX) ** 2 + (y - eyeY) ** 2);
        
        // Base gray value
        let gray = 200;
        
        // Left eye (darker with lighting)
        if (distLeft < eyeRadius) {
          gray = 50 + Math.cos(lightingAngle) * 50;
        }
        
        // Right eye (lighter with opposite lighting)
        if (distRight < eyeRadius) {
          gray = 50 - Math.cos(lightingAngle) * 50;
        }
        
        data[idx] = gray;
        data[idx + 1] = gray;
        data[idx + 2] = gray;
        data[idx + 3] = 255;
      }
    }
    
    images.push({ width, height, data });
  }
  
  return images;
}
