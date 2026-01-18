/**
 * SCOTT ALGORITHM: REAL VS FAKE (DEEPFAKE DETECTION)
 * Test if organic fluctuations distinguish real faces from synthetic
 */

import { InvertedContrastDetector } from './server/scott-inverted-contrast';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

interface DetectionResult {
  filename: string;
  type: 'real' | 'synthetic';
  standardConfidence: number;
  invertedConfidence: number;
  yinYangConfidence: number;
  confidenceVariance: number; // Fluctuation between methods
  symmetryScore: number;
  processingTime: number;
}

/**
 * Load real images from test-images/real folder
 */
async function loadRealImages(folderPath: string): Promise<{ filename: string; data: ImageData }[]> {
  const images: { filename: string; data: ImageData }[] = [];
  
  if (!fs.existsSync(folderPath)) {
    console.log(`Creating folder: ${folderPath}`);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log('Please add real face images to: test-images/real/');
    return images;
  }
  
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter((f: string) => 
    f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
  );
  
  console.log(`Found ${imageFiles.length} real images in ${folderPath}`);
  
  // Load each image using Sharp
  for (const filename of imageFiles) {
    try {
      const filePath = path.join(folderPath, filename);
      const image = sharp(filePath);
      const metadata = await image.metadata();
      const { data, info } = await image
        .resize(200, 200, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Convert to RGBA format
      const width = info.width;
      const height = info.height;
      const channels = info.channels;
      const rgba = new Uint8ClampedArray(width * height * 4);
      
      for (let i = 0; i < width * height; i++) {
        if (channels === 3) {
          // RGB
          rgba[i * 4] = data[i * 3];
          rgba[i * 4 + 1] = data[i * 3 + 1];
          rgba[i * 4 + 2] = data[i * 3 + 2];
          rgba[i * 4 + 3] = 255;
        } else if (channels === 4) {
          // RGBA
          rgba[i * 4] = data[i * 4];
          rgba[i * 4 + 1] = data[i * 4 + 1];
          rgba[i * 4 + 2] = data[i * 4 + 2];
          rgba[i * 4 + 3] = data[i * 4 + 3];
        } else {
          // Grayscale
          rgba[i * 4] = data[i];
          rgba[i * 4 + 1] = data[i];
          rgba[i * 4 + 2] = data[i];
          rgba[i * 4 + 3] = 255;
        }
      }
      
      images.push({
        filename,
        data: {
          width,
          height,
          data: rgba,
          colorSpace: 'srgb'
        } as ImageData
      });
      
      console.log(`  Loaded: ${filename} (${width}x${height})`);
    } catch (error) {
      console.error(`  Failed to load ${filename}:`, error);
    }
  }
  
  return images;
}

/**
 * Generate synthetic "deepfake" from real image
 * Simulates what a GAN or deepfake generator would create
 */
function generateSyntheticFromReal(realImage: ImageData): ImageData {
  const synthetic = new Uint8ClampedArray(realImage.data.length);
  
  // Copy base image
  for (let i = 0; i < realImage.data.length; i++) {
    synthetic[i] = realImage.data[i];
  }
  
  // Apply "deepfake" artifacts:
  // 1. Smooth out natural texture (GANs over-smooth)
  // 2. Perfect symmetry (too perfect)
  // 3. Uniform lighting (no natural shadows)
  
  const width = realImage.width;
  const height = realImage.height;
  
  // Simple box blur to simulate GAN smoothing
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Average with neighbors (smoothing)
      for (let c = 0; c < 3; c++) { // RGB only
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
            sum += realImage.data[nIdx];
          }
        }
        synthetic[idx + c] = Math.round(sum / 9);
      }
    }
  }
  
  return {
    width: realImage.width,
    height: realImage.height,
    data: synthetic,
    colorSpace: 'srgb'
  } as ImageData;
}

/**
 * Generate simple synthetic face (perfect geometry)
 */
function generatePerfectSynthetic(width: number = 200, height: number = 200): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Perfect circular eyes with uniform lighting
  const leftEyeX = 60;
  const rightEyeX = 140;
  const eyeY = 80;
  const eyeRadius = 10;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      const distLeft = Math.sqrt((x - leftEyeX) ** 2 + (y - eyeY) ** 2);
      const distRight = Math.sqrt((x - rightEyeX) ** 2 + (y - eyeY) ** 2);
      
      // Base skin tone
      let gray = 200;
      
      // Perfect circular eyes
      if (distLeft < eyeRadius || distRight < eyeRadius) {
        gray = 50; // Dark pupils
      }
      
      data[idx] = gray;
      data[idx + 1] = gray;
      data[idx + 2] = gray;
      data[idx + 3] = 255;
    }
  }
  
  return { width, height, data, colorSpace: 'srgb' } as ImageData;
}

/**
 * Analyze organic fluctuation patterns
 */
function analyzeFluctuation(results: DetectionResult[]): {
  realPattern: { avgVariance: number; stdDev: number };
  fakePattern: { avgVariance: number; stdDev: number };
  canDistinguish: boolean;
} {
  const realResults = results.filter(r => r.type === 'real');
  const fakeResults = results.filter(r => r.type === 'synthetic');
  
  const calcStats = (data: number[]) => {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.map(x => (x - avg) ** 2).reduce((a, b) => a + b, 0) / data.length;
    return { avgVariance: avg, stdDev: Math.sqrt(variance) };
  };
  
  const realVariances = realResults.map(r => r.confidenceVariance);
  const fakeVariances = fakeResults.map(r => r.confidenceVariance);
  
  const realPattern = realVariances.length > 0 ? calcStats(realVariances) : { avgVariance: 0, stdDev: 0 };
  const fakePattern = fakeVariances.length > 0 ? calcStats(fakeVariances) : { avgVariance: 0, stdDev: 0 };
  
  // Can distinguish if patterns are significantly different
  const canDistinguish = Math.abs(realPattern.avgVariance - fakePattern.avgVariance) > 0.05;
  
  return { realPattern, fakePattern, canDistinguish };
}

/**
 * Main test runner
 */
async function runRealVsFakeTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   SCOTT ALGORITHM: REAL VS FAKE (DEEPFAKE DETECTION)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const results: DetectionResult[] = [];
  
  // 1. Try to load real images
  const realImagesPath = path.join(process.cwd(), 'test-images', 'real');
  const realImages = await loadRealImages(realImagesPath);
  
  if (realImages.length === 0) {
    console.log('⚠️  No real images found. Using synthetic test instead.\n');
    console.log('To test with real images:');
    console.log('  1. Create folder: test-images/real/');
    console.log('  2. Add face photos (jpg/png)');
    console.log('  3. Run test again\n');
    
    // Generate synthetic faces for demonstration
    console.log('Generating 20 synthetic faces for baseline test...\n');
    
    for (let i = 0; i < 20; i++) {
      const synthetic = generatePerfectSynthetic();
      const detector = new InvertedContrastDetector(synthetic);
      
      const standard = detector.detectFacialFeaturesStandard();
      const inverted = detector.detectFacialFeaturesInverted();
      const yinYang = detector.detectFacialFeaturesYinYang();
      
      const confidences = [
        standard?.confidence || 0,
        inverted?.confidence || 0,
        yinYang?.confidence || 0
      ];
      
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / 3;
      const variance = confidences.map(c => Math.abs(c - avgConfidence)).reduce((a, b) => a + b, 0) / 3;
      
      results.push({
        filename: `synthetic_${i + 1}.png`,
        type: 'synthetic',
        standardConfidence: standard?.confidence || 0,
        invertedConfidence: inverted?.confidence || 0,
        yinYangConfidence: yinYang?.confidence || 0,
        confidenceVariance: variance,
        symmetryScore: yinYang?.symmetryScore || 0,
        processingTime: 0
      });
      
      console.log(`[${i + 1}/20] Synthetic: Std=${(confidences[0] * 100).toFixed(1)}%, Inv=${(confidences[1] * 100).toFixed(1)}%, YY=${(confidences[2] * 100).toFixed(1)}%, Variance=${(variance * 100).toFixed(2)}%`);
    }
  } else {
    // Test with real images
    console.log(`Testing ${realImages.length} real images...\n`);
    
    for (let i = 0; i < realImages.length; i++) {
      const { filename, data } = realImages[i];
      
      console.log(`\n[REAL ${i + 1}/${realImages.length}] ${filename}`);
      
      const detector = new InvertedContrastDetector(data);
      const startTime = Date.now();
      
      const standard = detector.detectFacialFeaturesStandard();
      const inverted = detector.detectFacialFeaturesInverted();
      const yinYang = detector.detectFacialFeaturesYinYang();
      
      const processingTime = Date.now() - startTime;
      
      const confidences = [
        standard?.confidence || 0,
        inverted?.confidence || 0,
        yinYang?.confidence || 0
      ];
      
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / 3;
      const variance = confidences.map(c => Math.abs(c - avgConfidence)).reduce((a, b) => a + b, 0) / 3;
      
      results.push({
        filename,
        type: 'real',
        standardConfidence: confidences[0],
        invertedConfidence: confidences[1],
        yinYangConfidence: confidences[2],
        confidenceVariance: variance,
        symmetryScore: yinYang?.symmetryScore || 0,
        processingTime
      });
      
      console.log(`  Standard: ${(confidences[0] * 100).toFixed(1)}%`);
      console.log(`  Inverted: ${(confidences[1] * 100).toFixed(1)}%`);
      console.log(`  Yin-Yang: ${(confidences[2] * 100).toFixed(1)}%`);
      console.log(`  Variance: ${(variance * 100).toFixed(2)}%`);
      console.log(`  Time: ${processingTime}ms`);
      
      // Generate synthetic version
      console.log(`\n[FAKE ${i + 1}/${realImages.length}] synthetic_${filename}`);
      
      const synthetic = generateSyntheticFromReal(data);
      const detectorSynth = new InvertedContrastDetector(synthetic);
      const startTimeSynth = Date.now();
      
      const standardSynth = detectorSynth.detectFacialFeaturesStandard();
      const invertedSynth = detectorSynth.detectFacialFeaturesInverted();
      const yinYangSynth = detectorSynth.detectFacialFeaturesYinYang();
      
      const processingTimeSynth = Date.now() - startTimeSynth;
      
      const confidencesSynth = [
        standardSynth?.confidence || 0,
        invertedSynth?.confidence || 0,
        yinYangSynth?.confidence || 0
      ];
      
      const avgConfidenceSynth = confidencesSynth.reduce((a, b) => a + b, 0) / 3;
      const varianceSynth = confidencesSynth.map(c => Math.abs(c - avgConfidenceSynth)).reduce((a, b) => a + b, 0) / 3;
      
      results.push({
        filename: `synthetic_${filename}`,
        type: 'synthetic',
        standardConfidence: confidencesSynth[0],
        invertedConfidence: confidencesSynth[1],
        yinYangConfidence: confidencesSynth[2],
        confidenceVariance: varianceSynth,
        symmetryScore: yinYangSynth?.symmetryScore || 0,
        processingTime: processingTimeSynth
      });
      
      console.log(`  Standard: ${(confidencesSynth[0] * 100).toFixed(1)}%`);
      console.log(`  Inverted: ${(confidencesSynth[1] * 100).toFixed(1)}%`);
      console.log(`  Yin-Yang: ${(confidencesSynth[2] * 100).toFixed(1)}%`);
      console.log(`  Variance: ${(varianceSynth * 100).toFixed(2)}%`);
      console.log(`  Time: ${processingTimeSynth}ms`);
    }
  }
  
  // Analyze patterns
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   ORGANIC FLUCTUATION ANALYSIS                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const analysis = analyzeFluctuation(results);
  
  const realResults = results.filter(r => r.type === 'real');
  const fakeResults = results.filter(r => r.type === 'synthetic');
  
  console.log('📊 REAL IMAGES:');
  if (realResults.length > 0) {
    console.log(`   Count: ${realResults.length}`);
    console.log(`   Avg Variance: ${(analysis.realPattern.avgVariance * 100).toFixed(2)}%`);
    console.log(`   Std Deviation: ${(analysis.realPattern.stdDev * 100).toFixed(2)}%`);
    console.log(`   Pattern: ${analysis.realPattern.avgVariance > 0.05 ? 'High fluctuation (organic)' : 'Low fluctuation'}\n`);
  } else {
    console.log('   No real images tested\n');
  }
  
  console.log('📊 SYNTHETIC IMAGES:');
  console.log(`   Count: ${fakeResults.length}`);
  console.log(`   Avg Variance: ${(analysis.fakePattern.avgVariance * 100).toFixed(2)}%`);
  console.log(`   Std Deviation: ${(analysis.fakePattern.stdDev * 100).toFixed(2)}%`);
  console.log(`   Pattern: ${analysis.fakePattern.avgVariance > 0.05 ? 'High fluctuation' : 'Low fluctuation (too perfect)'}\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (analysis.canDistinguish) {
    console.log('✅ DEEPFAKE DETECTION: POSSIBLE');
    console.log(`   Variance difference: ${Math.abs(analysis.realPattern.avgVariance - analysis.fakePattern.avgVariance).toFixed(3)}`);
    console.log('   Real faces show organic fluctuation patterns');
    console.log('   Synthetic faces show uniform confidence scores');
  } else {
    console.log('⚠️  DEEPFAKE DETECTION: INCONCLUSIVE');
    console.log('   Need more real images to establish baseline');
    console.log('   Or synthetic images are too similar to real');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Detailed results table
  console.log('📋 DETAILED RESULTS:\n');
  console.log('Type      | Filename                  | Std    | Inv    | YY     | Variance');
  console.log('----------|---------------------------|--------|--------|--------|----------');
  
  for (const result of results) {
    const type = result.type === 'real' ? 'REAL ' : 'FAKE ';
    const filename = result.filename.padEnd(25).substring(0, 25);
    const std = `${(result.standardConfidence * 100).toFixed(1)}%`.padStart(6);
    const inv = `${(result.invertedConfidence * 100).toFixed(1)}%`.padStart(6);
    const yy = `${(result.yinYangConfidence * 100).toFixed(1)}%`.padStart(6);
    const variance = `${(result.confidenceVariance * 100).toFixed(2)}%`.padStart(8);
    
    console.log(`${type} | ${filename} | ${std} | ${inv} | ${yy} | ${variance}`);
  }
  
  console.log('\n');
  
  return { results, analysis };
}

// Run test
runRealVsFakeTest().catch(console.error);

export { runRealVsFakeTest, analyzeFluctuation };
