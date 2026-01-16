// Test script for font glyph skeletonization
// This demonstrates centerline extraction vs outline tracing

import { createCanvas } from 'canvas';
import * as opentype from 'opentype.js';
import * as fs from 'fs';
import * as path from 'path';

// Zhang-Suen skeletonization algorithm
function zhangSuenSkeleton(binary: boolean[][], width: number, height: number): boolean[][] {
  const skeleton = binary.map(row => [...row]);
  let hasChanged = true;
  let iteration = 0;
  const maxIterations = 100;

  while (hasChanged && iteration < maxIterations) {
    hasChanged = false;
    iteration++;

    // Sub-iteration 1
    const toDelete1: Array<[number, number]> = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y][x] && shouldDeleteZhangSuen(skeleton, x, y, 1)) {
          toDelete1.push([x, y]);
        }
      }
    }
    
    for (const [x, y] of toDelete1) {
      skeleton[y][x] = false;
      hasChanged = true;
    }

    // Sub-iteration 2
    const toDelete2: Array<[number, number]> = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y][x] && shouldDeleteZhangSuen(skeleton, x, y, 2)) {
          toDelete2.push([x, y]);
        }
      }
    }
    
    for (const [x, y] of toDelete2) {
      skeleton[y][x] = false;
      hasChanged = true;
    }
  }

  console.log(`Skeletonization completed in ${iteration} iterations`);
  return skeleton;
}

function shouldDeleteZhangSuen(img: boolean[][], x: number, y: number, step: number): boolean {
  const p2 = img[y - 1]?.[x] ? 1 : 0;
  const p3 = img[y - 1]?.[x + 1] ? 1 : 0;
  const p4 = img[y]?.[x + 1] ? 1 : 0;
  const p5 = img[y + 1]?.[x + 1] ? 1 : 0;
  const p6 = img[y + 1]?.[x] ? 1 : 0;
  const p7 = img[y + 1]?.[x - 1] ? 1 : 0;
  const p8 = img[y]?.[x - 1] ? 1 : 0;
  const p9 = img[y - 1]?.[x - 1] ? 1 : 0;

  const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;

  const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
  let A = 0;
  for (let i = 0; i < 8; i++) {
    if (neighbors[i] === 0 && neighbors[i + 1] === 1) A++;
  }

  const condition1 = B >= 2 && B <= 6;
  const condition2 = A === 1;

  if (step === 1) {
    const condition3 = p2 * p4 * p6 === 0;
    const condition4 = p4 * p6 * p8 === 0;
    return condition1 && condition2 && condition3 && condition4;
  } else {
    const condition3 = p2 * p4 * p8 === 0;
    const condition4 = p2 * p6 * p8 === 0;
    return condition1 && condition2 && condition3 && condition4;
  }
}

// Count pixels in binary image
function countPixels(binary: boolean[][]): number {
  let count = 0;
  for (const row of binary) {
    for (const pixel of row) {
      if (pixel) count++;
    }
  }
  return count;
}

// Main test function
async function testFontSkeletonization() {
  console.log('=== Font Glyph Skeletonization Test ===\n');

  // Load a font (ES module compatible)
  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(__filename);
  const fontPath = path.join(__dirname, '../public/fonts/inter-v20-latin-regular.ttf');
  
  if (!fs.existsSync(fontPath)) {
    console.error(`Font not found: ${fontPath}`);
    return;
  }

  const fontBuffer = fs.readFileSync(fontPath);
  const font = opentype.parse(fontBuffer.buffer);

  // Test with letter "H" (good test case - has inner and outer contours)
  const testChar = 'H';
  const fontSize = 200;

  console.log(`Testing character: "${testChar}"`);
  console.log(`Font size: ${fontSize}px\n`);

  // Get the glyph
  const glyph = font.charToGlyph(testChar);
  
  // Create canvas
  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 300, 300);

  // Draw the glyph
  ctx.fillStyle = 'black';
  const glyphPath = glyph.getPath(50, 250, fontSize);
  
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

  // Get image data
  const imageData = ctx.getImageData(0, 0, 300, 300);
  
  // Convert to binary (black/white)
  const binary: boolean[][] = Array(300).fill(0).map(() => Array(300).fill(false));
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
      const idx = (y * 300 + x) * 4;
      const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
      binary[y][x] = gray < 128; // Black pixels
    }
  }

  const originalPixels = countPixels(binary);
  console.log(`Original glyph pixels: ${originalPixels}`);

  // Apply skeletonization
  const skeleton = zhangSuenSkeleton(binary, 300, 300);
  const skeletonPixels = countPixels(skeleton);
  
  console.log(`Skeleton pixels: ${skeletonPixels}`);
  console.log(`Reduction: ${((1 - skeletonPixels / originalPixels) * 100).toFixed(1)}%\n`);

  // Save both images for comparison
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save original
  const originalCanvas = createCanvas(300, 300);
  const originalCtx = originalCanvas.getContext('2d');
  originalCtx.fillStyle = 'white';
  originalCtx.fillRect(0, 0, 300, 300);
  originalCtx.fillStyle = 'black';
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
      if (binary[y][x]) {
        originalCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  const originalBuffer = originalCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, 'original-glyph.png'), originalBuffer);
  console.log('✓ Saved: test-output/original-glyph.png');

  // Save skeleton
  const skeletonCanvas = createCanvas(300, 300);
  const skeletonCtx = skeletonCanvas.getContext('2d');
  skeletonCtx.fillStyle = 'white';
  skeletonCtx.fillRect(0, 0, 300, 300);
  skeletonCtx.fillStyle = 'red';
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
      if (skeleton[y][x]) {
        skeletonCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  const skeletonBuffer = skeletonCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, 'skeleton-centerline.png'), skeletonBuffer);
  console.log('✓ Saved: test-output/skeleton-centerline.png');

  // Save comparison
  const comparisonCanvas = createCanvas(600, 300);
  const comparisonCtx = comparisonCanvas.getContext('2d');
  comparisonCtx.fillStyle = 'white';
  comparisonCtx.fillRect(0, 0, 600, 300);
  
  // Draw original on left
  comparisonCtx.fillStyle = 'black';
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
      if (binary[y][x]) {
        comparisonCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  
  // Draw skeleton on right
  comparisonCtx.fillStyle = 'red';
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
      if (skeleton[y][x]) {
        comparisonCtx.fillRect(x + 300, y, 1, 1);
      }
    }
  }
  
  // Add labels
  comparisonCtx.fillStyle = 'blue';
  comparisonCtx.font = '16px Arial';
  comparisonCtx.fillText('OUTLINE (Current)', 10, 20);
  comparisonCtx.fillText('CENTERLINE (Skeleton)', 310, 20);
  
  const comparisonBuffer = comparisonCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, 'comparison.png'), comparisonBuffer);
  console.log('✓ Saved: test-output/comparison.png');

  console.log('\n=== Test Complete ===');
  console.log('Check the test-output folder to see the results!');
  console.log('\nOutline (left) vs Centerline (right)');
  console.log('The centerline is the single-stroke path perfect for neon tubes.');
}

// Run the test
testFontSkeletonization().catch(console.error);
