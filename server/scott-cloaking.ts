/**
 * SCOTT ALGORITHM: GEOMETRIC CLOAKING
 * Anti-Recognition System
 * 
 * Theory: Once a face is profiled, use the geometric signature
 * to generate counter-patterns that defeat detection.
 * 
 * The algorithm knows what it's looking for, so it knows
 * exactly how to hide it.
 */

interface Point2D {
  x: number;
  y: number;
}

interface GeometricSignature {
  leftEye: { x: number; y: number; radius: number };
  rightEye: { x: number; y: number; radius: number };
  symmetryScore: number;
  spacing: number;
  alignment: number;
}

interface CloakingStrategy {
  name: string;
  description: string;
  apply: (imageData: ImageData, signature: GeometricSignature) => ImageData;
}

export class ScottCloaking {
  /**
   * STRATEGY 1: SYMMETRY BREAKING
   * Scott Algorithm relies on left-right symmetry
   * Break the symmetry just enough to fail detection
   */
  private breakSymmetry(imageData: ImageData, signature: GeometricSignature): ImageData {
    const { width, height, data } = imageData;
    const cloaked = new Uint8ClampedArray(data);
    
    // Shift one eye slightly to break symmetry
    const shiftAmount = 15; // pixels
    const leftEyeX = Math.round(signature.leftEye.x);
    const leftEyeY = Math.round(signature.leftEye.y);
    const radius = Math.round(signature.leftEye.radius);
    
    // Move left eye region
    for (let y = leftEyeY - radius; y < leftEyeY + radius; y++) {
      for (let x = leftEyeX - radius; x < leftEyeX + radius; x++) {
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const sourceIdx = (y * width + x) * 4;
        const targetX = x + shiftAmount;
        
        if (targetX >= width) continue;
        
        const targetIdx = (y * width + targetX) * 4;
        
        // Copy pixel to new location
        cloaked[targetIdx] = data[sourceIdx];
        cloaked[targetIdx + 1] = data[sourceIdx + 1];
        cloaked[targetIdx + 2] = data[sourceIdx + 2];
        cloaked[targetIdx + 3] = data[sourceIdx + 3];
        
        // Fill original with background
        cloaked[sourceIdx] = 200;
        cloaked[sourceIdx + 1] = 200;
        cloaked[sourceIdx + 2] = 200;
        cloaked[sourceIdx + 3] = 255;
      }
    }
    
    return {
      width,
      height,
      data: cloaked,
      colorSpace: 'srgb'
    } as ImageData;
  }
  
  /**
   * STRATEGY 2: CONTRAST INVERSION
   * Scott Algorithm uses dual-polarity detection
   * Invert contrast in eye regions to confuse detection
   */
  private invertContrast(imageData: ImageData, signature: GeometricSignature): ImageData {
    const { width, height, data } = imageData;
    const cloaked = new Uint8ClampedArray(data);
    
    const invertRegion = (centerX: number, centerY: number, radius: number) => {
      for (let y = centerY - radius; y < centerY + radius; y++) {
        for (let x = centerX - radius; x < centerX + radius; x++) {
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (dist > radius) continue;
          
          const idx = (y * width + x) * 4;
          
          // Invert RGB values
          cloaked[idx] = 255 - data[idx];
          cloaked[idx + 1] = 255 - data[idx + 1];
          cloaked[idx + 2] = 255 - data[idx + 2];
        }
      }
    };
    
    // Invert both eye regions
    invertRegion(
      Math.round(signature.leftEye.x),
      Math.round(signature.leftEye.y),
      Math.round(signature.leftEye.radius * 1.5)
    );
    
    invertRegion(
      Math.round(signature.rightEye.x),
      Math.round(signature.rightEye.y),
      Math.round(signature.rightEye.radius * 1.5)
    );
    
    return {
      width,
      height,
      data: cloaked,
      colorSpace: 'srgb'
    } as ImageData;
  }
  
  /**
   * STRATEGY 3: BOUNDARY NOISE
   * Scott Algorithm traces boundaries with Moore-Neighbor
   * Add noise to boundaries to break contour detection
   */
  private addBoundaryNoise(imageData: ImageData, signature: GeometricSignature): ImageData {
    const { width, height, data } = imageData;
    const cloaked = new Uint8ClampedArray(data);
    
    const addNoise = (centerX: number, centerY: number, radius: number) => {
      // Add random pixels around boundary
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const x = Math.round(centerX + Math.cos(angle) * radius);
        const y = Math.round(centerY + Math.sin(angle) * radius);
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const idx = (y * width + x) * 4;
        
        // Random gray value
        const noise = Math.random() * 100 + 100;
        cloaked[idx] = noise;
        cloaked[idx + 1] = noise;
        cloaked[idx + 2] = noise;
      }
    };
    
    addNoise(
      Math.round(signature.leftEye.x),
      Math.round(signature.leftEye.y),
      Math.round(signature.leftEye.radius)
    );
    
    addNoise(
      Math.round(signature.rightEye.x),
      Math.round(signature.rightEye.y),
      Math.round(signature.rightEye.radius)
    );
    
    return {
      width,
      height,
      data: cloaked,
      colorSpace: 'srgb'
    } as ImageData;
  }
  
  /**
   * STRATEGY 4: GEOMETRIC DISTORTION
   * Scott Algorithm measures geometric constants
   * Distort the geometry to fail signature matching
   */
  private distortGeometry(imageData: ImageData, signature: GeometricSignature): ImageData {
    const { width, height, data } = imageData;
    const cloaked = new Uint8ClampedArray(width * height * 4);
    
    // Fill with background
    for (let i = 0; i < cloaked.length; i += 4) {
      cloaked[i] = data[i];
      cloaked[i + 1] = data[i + 1];
      cloaked[i + 2] = data[i + 2];
      cloaked[i + 3] = 255;
    }
    
    // Apply non-linear distortion to eye regions
    const distortRegion = (centerX: number, centerY: number, radius: number) => {
      for (let y = centerY - radius; y < centerY + radius; y++) {
        for (let x = centerX - radius; x < centerX + radius; x++) {
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (dist > radius) continue;
          
          // Non-linear warp
          const warpFactor = 1 + (dist / radius) * 0.3;
          const angle = Math.atan2(y - centerY, x - centerX);
          
          const sourceX = Math.round(centerX + Math.cos(angle) * dist * warpFactor);
          const sourceY = Math.round(centerY + Math.sin(angle) * dist * warpFactor);
          
          if (sourceX < 0 || sourceX >= width || sourceY < 0 || sourceY >= height) continue;
          
          const sourceIdx = (sourceY * width + sourceX) * 4;
          const targetIdx = (y * width + x) * 4;
          
          cloaked[targetIdx] = data[sourceIdx];
          cloaked[targetIdx + 1] = data[sourceIdx + 1];
          cloaked[targetIdx + 2] = data[sourceIdx + 2];
          cloaked[targetIdx + 3] = 255;
        }
      }
    };
    
    distortRegion(
      Math.round(signature.leftEye.x),
      Math.round(signature.leftEye.y),
      Math.round(signature.leftEye.radius * 2)
    );
    
    distortRegion(
      Math.round(signature.rightEye.x),
      Math.round(signature.rightEye.y),
      Math.round(signature.rightEye.radius * 2)
    );
    
    return {
      width,
      height,
      data: cloaked,
      colorSpace: 'srgb'
    } as ImageData;
  }
  
  /**
   * STRATEGY 5: VARIANCE NORMALIZATION
   * Scott Algorithm detects deepfakes via variance
   * Force variance to 0.00% to trigger synthetic flag
   */
  private normalizeVariance(imageData: ImageData, signature: GeometricSignature): ImageData {
    const { width, height, data } = imageData;
    const cloaked = new Uint8ClampedArray(data);
    
    // Apply uniform smoothing to create synthetic signature
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Average with neighbors (box blur)
        let sumR = 0, sumG = 0, sumB = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            sumR += data[nIdx];
            sumG += data[nIdx + 1];
            sumB += data[nIdx + 2];
          }
        }
        
        cloaked[idx] = Math.round(sumR / 9);
        cloaked[idx + 1] = Math.round(sumG / 9);
        cloaked[idx + 2] = Math.round(sumB / 9);
      }
    }
    
    return {
      width,
      height,
      data: cloaked,
      colorSpace: 'srgb'
    } as ImageData;
  }
  
  /**
   * MASTER CLOAKING FUNCTION
   * Apply all strategies in sequence
   */
  cloak(imageData: ImageData, signature: GeometricSignature, strategies: string[] = ['all']): ImageData {
    let cloaked = imageData;
    
    if (strategies.includes('all') || strategies.includes('symmetry')) {
      console.log('  [Cloak] Breaking symmetry...');
      cloaked = this.breakSymmetry(cloaked, signature);
    }
    
    if (strategies.includes('all') || strategies.includes('contrast')) {
      console.log('  [Cloak] Inverting contrast...');
      cloaked = this.invertContrast(cloaked, signature);
    }
    
    if (strategies.includes('all') || strategies.includes('noise')) {
      console.log('  [Cloak] Adding boundary noise...');
      cloaked = this.addBoundaryNoise(cloaked, signature);
    }
    
    if (strategies.includes('all') || strategies.includes('distortion')) {
      console.log('  [Cloak] Distorting geometry...');
      cloaked = this.distortGeometry(cloaked, signature);
    }
    
    if (strategies.includes('all') || strategies.includes('variance')) {
      console.log('  [Cloak] Normalizing variance...');
      cloaked = this.normalizeVariance(cloaked, signature);
    }
    
    return cloaked;
  }
  
  /**
   * Extract geometric signature from detection result
   */
  extractSignature(detectionResult: any): GeometricSignature {
    return {
      leftEye: {
        x: detectionResult.leftEye.centroid.x,
        y: detectionResult.leftEye.centroid.y,
        radius: Math.sqrt(detectionResult.leftEye.area / Math.PI)
      },
      rightEye: {
        x: detectionResult.rightEye.centroid.x,
        y: detectionResult.rightEye.centroid.y,
        radius: Math.sqrt(detectionResult.rightEye.area / Math.PI)
      },
      symmetryScore: detectionResult.symmetryScore,
      spacing: detectionResult.rightEye.centroid.x - detectionResult.leftEye.centroid.x,
      alignment: Math.abs(detectionResult.leftEye.centroid.y - detectionResult.rightEye.centroid.y)
    };
  }
}

/**
 * BENCHMARK: Test cloaking effectiveness
 */
export function benchmarkCloaking(
  originalImage: ImageData,
  detector: any
): {
  original: { detected: boolean; confidence: number };
  cloaked: { detected: boolean; confidence: number };
  effectiveness: number;
} {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   SCOTT CLOAKING BENCHMARK                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // 1. Detect original
  console.log('Testing original image...');
  const originalResult = detector.detectFacialFeaturesYinYang();
  
  if (!originalResult) {
    console.log('❌ No face detected in original image');
    return {
      original: { detected: false, confidence: 0 },
      cloaked: { detected: false, confidence: 0 },
      effectiveness: 0
    };
  }
  
  console.log(`✓ Original detected: ${(originalResult.confidence * 100).toFixed(1)}% confidence\n`);
  
  // 2. Extract signature
  const cloaking = new ScottCloaking();
  const signature = cloaking.extractSignature(originalResult);
  
  console.log('Geometric signature extracted:');
  console.log(`  Left eye: (${signature.leftEye.x.toFixed(1)}, ${signature.leftEye.y.toFixed(1)})`);
  console.log(`  Right eye: (${signature.rightEye.x.toFixed(1)}, ${signature.rightEye.y.toFixed(1)})`);
  console.log(`  Symmetry: ${(signature.symmetryScore * 100).toFixed(1)}%\n`);
  
  // 3. Apply cloaking
  console.log('Applying cloaking strategies...');
  const cloakedImage = cloaking.cloak(originalImage, signature, ['symmetry', 'contrast', 'noise']);
  console.log('✓ Cloaking complete\n');
  
  // 4. Test detection on cloaked image
  console.log('Testing cloaked image...');
  const cloakedDetector = new (detector.constructor)(cloakedImage);
  const cloakedResult = cloakedDetector.detectFacialFeaturesYinYang();
  
  const cloakedDetected = cloakedResult !== null;
  const cloakedConfidence = cloakedResult?.confidence || 0;
  
  if (cloakedDetected) {
    console.log(`⚠️  Cloaked still detected: ${(cloakedConfidence * 100).toFixed(1)}% confidence`);
  } else {
    console.log('✅ Cloaked image NOT detected - cloaking successful!');
  }
  
  // 5. Calculate effectiveness
  const effectiveness = ((originalResult.confidence - cloakedConfidence) / originalResult.confidence) * 100;
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CLOAKING EFFECTIVENESS:');
  console.log(`   Original confidence: ${(originalResult.confidence * 100).toFixed(1)}%`);
  console.log(`   Cloaked confidence: ${(cloakedConfidence * 100).toFixed(1)}%`);
  console.log(`   Reduction: ${effectiveness.toFixed(1)}%`);
  
  if (effectiveness > 80) {
    console.log('   ✅ HIGHLY EFFECTIVE - Face successfully cloaked');
  } else if (effectiveness > 50) {
    console.log('   ⚠️  MODERATELY EFFECTIVE - Partial cloaking');
  } else {
    console.log('   ❌ INEFFECTIVE - Cloaking failed');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    original: {
      detected: true,
      confidence: originalResult.confidence
    },
    cloaked: {
      detected: cloakedDetected,
      confidence: cloakedConfidence
    },
    effectiveness
  };
}
