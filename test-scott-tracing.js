// Scott Algorithm Tracing Test
// Tests the boundary tracing on sample images without using the full app

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scott Algorithm boundary tracing implementation
function traceBoundary(binary, width, height) {
  const boundary = [];
  
  // Find starting point (first foreground pixel)
  let startX = -1, startY = -1;
  for (let y = 0; y < height && startX === -1; y++) {
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 1) {
        startX = x;
        startY = y;
        break;
      }
    }
  }

  if (startX === -1) return boundary;

  // Moore-Neighbor directions (8-connected)
  const dirs = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];

  let x = startX, y = startY;
  let dir = 0;
  const visited = new Set();
  let steps = 0;
  const maxSteps = width * height;

  do {
    const key = `${x},${y}`;
    if (!visited.has(key)) {
      boundary.push({ x, y });
      visited.add(key);
    }

    // Search for next boundary pixel
    let found = false;
    for (let i = 0; i < 8; i++) {
      const checkDir = (dir + i) % 8;
      const [dx, dy] = dirs[checkDir];
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (binary[ny * width + nx] === 1) {
          x = nx;
          y = ny;
          dir = checkDir;
          found = true;
          break;
        }
      }
    }

    if (!found) break;
    steps++;

    if (steps > 2 && x === startX && y === startY) break;
  } while (steps < maxSteps);

  return boundary;
}

// Douglas-Peucker simplification
function simplifyPath(points, epsilon) {
  if (points.length < 3) return points;

  const distanceToSegment = (p, v, w) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
    const t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
  };

  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = distanceToSegment(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPath(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[end]];
}

// Process image and trace boundaries
async function testImage(imagePath, threshold = 128) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${path.basename(imagePath)}`);
  console.log('='.repeat(60));

  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const { data, width, height } = imageData;

  // Convert to binary
  const binary = new Uint8Array(width * height);
  
  // First pass: count opaque pixels and determine polarity
  let darkPixels = 0;
  let opaquePixels = 0;
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha > 128) {  // Only count opaque pixels
      opaquePixels++;
      const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
      if (gray < threshold) darkPixels++;
    }
  }
  
  // Determine if opaque content is dark-on-light or light-on-dark
  const isDarkOnLight = opaquePixels > 0 && darkPixels < (opaquePixels / 2);
  
  // Second pass: create binary (transparent = background always)
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha < 128) {
      binary[i] = 0;  // Transparent = background
    } else {
      const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
      if (isDarkOnLight) {
        binary[i] = gray < threshold ? 1 : 0;  // Dark pixels = foreground
      } else {
        binary[i] = gray >= threshold ? 1 : 0;  // Light pixels = foreground
      }
    }
  }

  console.log(`Image size: ${width}x${height}`);
  
  // Count foreground pixels
  const foregroundPixels = binary.filter(v => v === 1).length;
  console.log(`Foreground pixels: ${foregroundPixels} (${(foregroundPixels / (width * height) * 100).toFixed(1)}%)`);

  // Trace boundary
  const startTime = Date.now();
  const boundary = traceBoundary(binary, width, height);
  const traceTime = Date.now() - startTime;

  console.log(`Boundary points: ${boundary.length}`);
  console.log(`Trace time: ${traceTime}ms`);

  // Simplify
  const simplified = simplifyPath(boundary, 2.0);
  console.log(`Simplified points: ${simplified.length}`);
  console.log(`Compression ratio: ${(boundary.length / simplified.length).toFixed(2)}x`);

  // Create output visualization
  const outCanvas = createCanvas(width, height);
  const outCtx = outCanvas.getContext('2d');
  
  // Draw original image (faded)
  outCtx.globalAlpha = 0.3;
  outCtx.drawImage(image, 0, 0);
  outCtx.globalAlpha = 1.0;

  // Draw traced boundary
  if (boundary.length > 0) {
    outCtx.strokeStyle = '#00ff00';
    outCtx.lineWidth = 2;
    outCtx.beginPath();
    outCtx.moveTo(boundary[0].x, boundary[0].y);
    for (let i = 1; i < boundary.length; i++) {
      outCtx.lineTo(boundary[i].x, boundary[i].y);
    }
    outCtx.closePath();
    outCtx.stroke();

    // Draw simplified path
    outCtx.strokeStyle = '#ff0000';
    outCtx.lineWidth = 3;
    outCtx.beginPath();
    outCtx.moveTo(simplified[0].x, simplified[0].y);
    for (let i = 1; i < simplified.length; i++) {
      outCtx.lineTo(simplified[i].x, simplified[i].y);
    }
    outCtx.closePath();
    outCtx.stroke();
  }

  // Save output
  const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '_traced.png');
  const buffer = outCanvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Output saved: ${path.basename(outputPath)}`);

  return {
    success: boundary.length > 0,
    boundaryPoints: boundary.length,
    simplifiedPoints: simplified.length,
    traceTime
  };
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         Scott Algorithm Boundary Tracing Test             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const testDir = path.join(__dirname, 'test-images');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    console.log('\n⚠️  Created test-images directory');
    console.log('Please add test images to:', testDir);
    return;
  }

  const imageFiles = fs.readdirSync(testDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('_traced'));

  if (imageFiles.length === 0) {
    console.log('\n⚠️  No test images found in:', testDir);
    console.log('Please add PNG or JPG images to test');
    return;
  }

  const results = [];
  
  for (const file of imageFiles) {
    const imagePath = path.join(testDir, file);
    try {
      const result = await testImage(imagePath);
      results.push({ file, ...result });
    } catch (error) {
      console.error(`\n❌ Error processing ${file}:`, error.message);
      results.push({ file, success: false, error: error.message });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  console.log(`\nTotal images: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${results.length - successful}`);

  if (successful > 0) {
    const avgBoundary = results.filter(r => r.success)
      .reduce((sum, r) => sum + r.boundaryPoints, 0) / successful;
    const avgSimplified = results.filter(r => r.success)
      .reduce((sum, r) => sum + r.simplifiedPoints, 0) / successful;
    const avgTime = results.filter(r => r.success)
      .reduce((sum, r) => sum + r.traceTime, 0) / successful;

    console.log(`\nAverage boundary points: ${avgBoundary.toFixed(0)}`);
    console.log(`Average simplified points: ${avgSimplified.toFixed(0)}`);
    console.log(`Average trace time: ${avgTime.toFixed(2)}ms`);
  }

  console.log('\n✅ Test complete! Check test-images folder for *_traced.png outputs\n');
}

// Run tests
runTests().catch(console.error);
