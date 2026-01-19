import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Douglas-Peucker simplification
function simplifyPath(points, tolerance) {
  if (points.length < 3) return points;
  
  const sqDist = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  };
  
  const sqSegDist = (p, p1, p2) => {
    let x = p1.x, y = p1.y;
    let dx = p2.x - x, dy = p2.y - y;
    
    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = p2.x; y = p2.y; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    
    dx = p.x - x;
    dy = p.y - y;
    return dx * dx + dy * dy;
  };
  
  const simplifyDPStep = (points, first, last, sqTolerance, simplified) => {
    let maxSqDist = sqTolerance;
    let index = -1;
    
    for (let i = first + 1; i < last; i++) {
      const sqDist = sqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }
    
    if (maxSqDist > sqTolerance) {
      if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
      simplified.push(points[index]);
      if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  };
  
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, tolerance * tolerance, simplified);
  simplified.push(points[last]);
  
  return simplified;
}

// Test with dinosaur icon
async function testIconTracing() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         Testing Icon Tracing (Dinosaur)                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Create a simple test image (black dinosaur on white background)
  const width = 200;
  const height = 200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Draw simple dinosaur shape (black outline)
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 8;
  ctx.fillStyle = 'white';
  
  ctx.beginPath();
  // Head
  ctx.arc(150, 50, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Body
  ctx.beginPath();
  ctx.arc(100, 100, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Tail
  ctx.beginPath();
  ctx.moveTo(60, 120);
  ctx.quadraticCurveTo(20, 140, 30, 170);
  ctx.stroke();
  
  // Legs
  ctx.beginPath();
  ctx.moveTo(90, 140);
  ctx.lineTo(85, 180);
  ctx.moveTo(110, 140);
  ctx.lineTo(115, 180);
  ctx.stroke();
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Test CURRENT implementation with alpha/polarity
  console.log('Testing CURRENT implementation (with alpha/polarity):');
  const binary1 = new Uint8Array(width * height);
  
  let darkPixels = 0;
  let opaquePixels = 0;
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha > 128) {
      opaquePixels++;
      const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
      if (gray < 128) darkPixels++;
    }
  }
  
  const isDarkOnLight = opaquePixels > 0 && darkPixels < (opaquePixels / 2);
  console.log(`  Opaque pixels: ${opaquePixels}`);
  console.log(`  Dark pixels: ${darkPixels}`);
  console.log(`  Detected as: ${isDarkOnLight ? 'dark-on-light' : 'light-on-dark'}`);
  
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha < 128) {
      binary1[i] = 0;
    } else {
      const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
      if (isDarkOnLight) {
        binary1[i] = gray < 128 ? 1 : 0;
      } else {
        binary1[i] = gray >= 128 ? 1 : 0;
      }
    }
  }
  
  const foreground1 = binary1.filter(v => v === 1).length;
  console.log(`  Foreground pixels: ${foreground1} (${(foreground1 / (width * height) * 100).toFixed(1)}%)`);
  
  // Test SIMPLE implementation (just threshold)
  console.log('\nTesting SIMPLE implementation (just threshold):');
  const binary2 = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    binary2[i] = gray < 128 ? 1 : 0;
  }
  
  const foreground2 = binary2.filter(v => v === 1).length;
  console.log(`  Foreground pixels: ${foreground2} (${(foreground2 / (width * height) * 100).toFixed(1)}%)`);
  
  console.log('\n✅ Test complete!');
  console.log(`\nConclusion: ${foreground1 === foreground2 ? 'SAME result' : 'DIFFERENT results'}`);
  console.log(`Current: ${foreground1} pixels, Simple: ${foreground2} pixels`);
}

testIconTracing().catch(console.error);
