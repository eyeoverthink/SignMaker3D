/**
 * TEST: Zhang-Suen Skeletonization Algorithm
 * Validates that M(Ω) extraction preserves topology
 */

import { zhangSuenSkeleton, toBinary, extractSkeletonPaths, skeletonToImageData, type BinaryImage } from "./server/zhang-suen-skeletonization";
import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * Test Case 1: Thick Horizontal Line
 * Expected: Single horizontal centerline
 */
async function testThickLine() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST 1: Thick Horizontal Line                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const width = 200;
  const height = 50;
  const data = new Uint8Array(width * height);
  
  // Create thick horizontal line (20 pixels tall, centered)
  for (let y = 15; y < 35; y++) {
    for (let x = 20; x < 180; x++) {
      data[y * width + x] = 1;
    }
  }
  
  const input: BinaryImage = { width, height, data };
  
  console.log('Input: 200x20px horizontal rectangle');
  console.log('Expected: Single horizontal centerline at y=25');
  
  const skeleton = zhangSuenSkeleton(input);
  const paths = extractSkeletonPaths(skeleton);
  
  console.log(`Result: ${paths.length} path(s) extracted`);
  
  if (paths.length > 0) {
    const mainPath = paths[0];
    console.log(`  Path length: ${mainPath.length} points`);
    
    // Check if path is roughly horizontal and centered
    const avgY = mainPath.reduce((sum, p) => sum + p[1], 0) / mainPath.length;
    const yVariance = mainPath.reduce((sum, p) => sum + Math.abs(p[1] - avgY), 0) / mainPath.length;
    
    console.log(`  Average Y: ${avgY.toFixed(1)} (expected ~25)`);
    console.log(`  Y variance: ${yVariance.toFixed(2)} (should be low)`);
    
    const success = Math.abs(avgY - 25) < 3 && yVariance < 2;
    console.log(`  Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
    
    return success;
  }
  
  console.log('  Status: ❌ FAIL - No paths extracted');
  return false;
}

/**
 * Test Case 2: Letter 'I'
 * Expected: Single vertical centerline
 */
async function testLetterI() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST 2: Letter "I" (Thick Vertical Bar)                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const width = 100;
  const height = 200;
  const data = new Uint8Array(width * height);
  
  // Create thick vertical bar (20 pixels wide, centered)
  for (let y = 20; y < 180; y++) {
    for (let x = 40; x < 60; x++) {
      data[y * width + x] = 1;
    }
  }
  
  const input: BinaryImage = { width, height, data };
  
  console.log('Input: 20x160px vertical rectangle');
  console.log('Expected: Single vertical centerline at x=50');
  
  const skeleton = zhangSuenSkeleton(input);
  const paths = extractSkeletonPaths(skeleton);
  
  console.log(`Result: ${paths.length} path(s) extracted`);
  
  if (paths.length > 0) {
    const mainPath = paths[0];
    console.log(`  Path length: ${mainPath.length} points`);
    
    // Check if path is roughly vertical and centered
    const avgX = mainPath.reduce((sum, p) => sum + p[0], 0) / mainPath.length;
    const xVariance = mainPath.reduce((sum, p) => sum + Math.abs(p[0] - avgX), 0) / mainPath.length;
    
    console.log(`  Average X: ${avgX.toFixed(1)} (expected ~50)`);
    console.log(`  X variance: ${xVariance.toFixed(2)} (should be low)`);
    
    const success = Math.abs(avgX - 50) < 3 && xVariance < 2;
    console.log(`  Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
    
    return success;
  }
  
  console.log('  Status: ❌ FAIL - No paths extracted');
  return false;
}

/**
 * Test Case 3: Letter 'T'
 * Expected: T-shaped skeleton (connected)
 */
async function testLetterT() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST 3: Letter "T" (Topology Preservation)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const width = 150;
  const height = 200;
  const data = new Uint8Array(width * height);
  
  // Create T shape
  // Horizontal bar (top)
  for (let y = 20; y < 40; y++) {
    for (let x = 20; x < 130; x++) {
      data[y * width + x] = 1;
    }
  }
  
  // Vertical bar (stem)
  for (let y = 40; y < 180; y++) {
    for (let x = 65; x < 85; x++) {
      data[y * width + x] = 1;
    }
  }
  
  const input: BinaryImage = { width, height, data };
  
  console.log('Input: T-shaped region');
  console.log('Expected: T-shaped skeleton (1 connected component)');
  
  const skeleton = zhangSuenSkeleton(input);
  const paths = extractSkeletonPaths(skeleton);
  
  console.log(`Result: ${paths.length} path(s) extracted`);
  
  // For T shape, we expect 1 connected component
  // The skeleton should preserve the T topology
  const success = paths.length === 1 && paths[0].length > 100;
  console.log(`  Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (paths.length > 0) {
    console.log(`  Main path: ${paths[0].length} points`);
  }
  
  return success;
}

/**
 * Test Case 4: Real Image - Pineapple
 */
async function testRealImage() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST 4: Real Image (Pineapple Shape)                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const imagePath = path.join(process.cwd(), 'test-images', 'shapes', 'pineapple.PNG');
  
  if (!fs.existsSync(imagePath)) {
    console.log('  Status: ⏭️  SKIP - Image not found');
    return true;
  }
  
  // Load and process image
  const image = sharp(imagePath);
  const { data, info } = await image
    .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  console.log(`Input: ${info.width}x${info.height}px pineapple image`);
  
  // Convert to binary
  const grayscale = new Uint8ClampedArray(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    grayscale[i * 4] = data[i];
    grayscale[i * 4 + 1] = data[i];
    grayscale[i * 4 + 2] = data[i];
    grayscale[i * 4 + 3] = 255;
  }
  
  const binary = toBinary(grayscale, info.width, info.height, 128);
  
  console.log('Applying Zhang-Suen skeletonization...');
  const skeleton = zhangSuenSkeleton(binary);
  const paths = extractSkeletonPaths(skeleton);
  
  console.log(`Result: ${paths.length} path(s) extracted`);
  
  if (paths.length > 0) {
    const totalPoints = paths.reduce((sum, p) => sum + p.length, 0);
    console.log(`  Total skeleton points: ${totalPoints}`);
    console.log(`  Largest path: ${Math.max(...paths.map(p => p.length))} points`);
    
    // Save skeleton visualization
    const skeletonImg = skeletonToImageData(skeleton);
    const outputPath = path.join(process.cwd(), 'test-images', 'pineapple-skeleton.png');
    
    await sharp(Buffer.from(skeletonImg.buffer), {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
      .png()
      .toFile(outputPath);
    
    console.log(`  Saved skeleton to: ${outputPath}`);
    console.log('  Status: ✅ PASS');
    return true;
  }
  
  console.log('  Status: ❌ FAIL - No paths extracted');
  return false;
}

/**
 * Run all tests
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ZHANG-SUEN SKELETONIZATION VALIDATION TESTS             ║');
  console.log('║   Medial Axis Transform M(Ω) Extraction                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = {
    thickLine: await testThickLine(),
    letterI: await testLetterI(),
    letterT: await testLetterT(),
    realImage: await testRealImage(),
  };
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`  Thick Line:     ${results.thickLine ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Letter I:       ${results.letterI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Letter T:       ${results.letterT ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Real Image:     ${results.realImage ? '✅ PASS' : '❌ FAIL'}`);
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;
  
  console.log(`\n  Overall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('\n  🎉 All tests passed! M(Ω) extraction validated.');
  } else {
    console.log('\n  ⚠️  Some tests failed. Review implementation.');
  }
}

main().catch(console.error);
