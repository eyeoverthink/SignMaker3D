// Test Relief Tab Tracing - Verify no random lines in dinosaur trace
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function testReliefTrace() {
  console.log('Testing Relief Tab Tracing...\n');

  // Load dinosaur test image (assuming it's in the project)
  const testImagePath = './test-images/dinosaur.png';
  
  if (!fs.existsSync(testImagePath)) {
    console.error('❌ Test image not found. Please provide dinosaur.png in test-images/');
    return;
  }

  const image = await loadImage(testImagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create height map (simple grayscale - matching fixed code)
  const heightMap = new Float32Array(canvas.width * canvas.height);
  
  for (let i = 0; i < canvas.width * canvas.height; i++) {
    const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    const normalized = gray / 255;
    heightMap[i] = normalized;
  }

  // Trace contours (matching relief-editor.tsx logic)
  const threshold = 0.03; // settings.maxDepth * 0.3 / 50 where maxDepth=5
  const contours = traceContours(heightMap, canvas.width, canvas.height, threshold);

  console.log(`✓ Traced ${contours.length} contours`);
  
  // Check if we have exactly 1 outer contour (expected for clean dinosaur outline)
  if (contours.length === 1) {
    console.log('✅ SUCCESS: Single outer contour traced (no internal lines)');
  } else {
    console.log(`⚠️  WARNING: Found ${contours.length} contours (expected 1 for clean outline)`);
    console.log('   This may indicate internal contours are being traced');
  }

  // Check contour point count
  contours.forEach((contour, idx) => {
    console.log(`   Contour ${idx + 1}: ${contour.length} points`);
  });

  return contours;
}

function traceContours(heightMap, width, height, threshold) {
  const contours = [];
  const visited = new Set();
  
  const isEdge = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return heightMap[y * width + x] > threshold;
  };

  const dirs = [
    {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 0, dy: 1}, {dx: -1, dy: 1},
    {dx: -1, dy: 0}, {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1}
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (visited.has(y * width + x)) continue;
      if (!isEdge(x, y)) continue;

      let isBoundary = false;
      for (const d of dirs) {
        if (!isEdge(x + d.dx, y + d.dy)) {
          isBoundary = true;
          break;
        }
      }

      if (!isBoundary) continue;

      const startX = x;
      const startY = y;
      const contour = [];
      let cx = x;
      let cy = y;
      let dirIdx = 0;

      do {
        contour.push({x: cx, y: cy});
        visited.add(cy * width + cx);
        
        let found = false;
        for (let i = 0; i < 8; i++) {
          const checkDir = (dirIdx + i) % 8;
          const nx = cx + dirs[checkDir].dx;
          const ny = cy + dirs[checkDir].dy;
          
          if (isEdge(nx, ny)) {
            let nextIsBoundary = false;
            for (const d of dirs) {
              if (!isEdge(nx + d.dx, ny + d.dy)) {
                nextIsBoundary = true;
                break;
              }
            }
            
            if (nextIsBoundary) {
              cx = nx;
              cy = ny;
              dirIdx = (checkDir + 6) % 8;
              found = true;
              break;
            }
          }
        }
        if (!found) break;
      } while (!(cx === startX && cy === startY) && contour.length < width * height);
      
      if (contour.length > 10) {
        contours.push(contour);
      }
    }
  }
  return contours;
}

testReliefTrace().catch(console.error);
