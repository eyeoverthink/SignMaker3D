// Test script for Moore-Neighbor contour tracing algorithm
// Creates simple shapes and traces their contours

// Moore-Neighbor boundary tracing (maze algorithm)
function traceContours(
  heightMap: Float32Array,
  width: number,
  height: number,
  threshold: number
): Array<Array<{x: number, y: number}>> {
  const contours: Array<Array<{x: number, y: number}>> = [];
  const visited = new Set<number>();
  
  // Moore-Neighbor directions (8-connected)
  const dirs = [
    {dx: 1, dy: 0},   // E
    {dx: 1, dy: 1},   // SE
    {dx: 0, dy: 1},   // S
    {dx: -1, dy: 1},  // SW
    {dx: -1, dy: 0},  // W
    {dx: -1, dy: -1}, // NW
    {dx: 0, dy: -1},  // N
    {dx: 1, dy: -1}   // NE
  ];
  
  const isEdge = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = y * width + x;
    return heightMap[idx] > threshold;
  };
  
  // Find all contours
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      if (visited.has(idx) || !isEdge(x, y)) continue;
      
      // Check if this is a boundary pixel (has at least one non-edge neighbor)
      let isBoundary = false;
      for (const dir of dirs) {
        if (!isEdge(x + dir.dx, y + dir.dy)) {
          isBoundary = true;
          break;
        }
      }
      
      if (!isBoundary) continue;
      
      // Trace contour using Moore-Neighbor
      const contour: Array<{x: number, y: number}> = [];
      let cx = x, cy = y;
      let startX = x, startY = y;
      let dirIdx = 0; // Start searching East
      
      do {
        contour.push({x: cx, y: cy});
        visited.add(cy * width + cx);
        
        // Moore-Neighbor: search in clockwise direction
        let found = false;
        for (let i = 0; i < 8; i++) {
          const checkDir = (dirIdx + i) % 8;
          const nx = cx + dirs[checkDir].dx;
          const ny = cy + dirs[checkDir].dy;
          
          if (isEdge(nx, ny)) {
            // Check if it's a boundary pixel
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
              dirIdx = (checkDir + 6) % 8; // Turn left to search next
              found = true;
              break;
            }
          }
        }
        
        if (!found) break;
        
      } while (!(cx === startX && cy === startY) && contour.length < width * height);
      
      if (contour.length > 10) { // Minimum contour size
        contours.push(contour);
      }
    }
  }
  
  return contours;
}

// Create a circle shape
function createCircle(width: number, height: number, centerX: number, centerY: number, radius: number): Float32Array {
  const heightMap = new Float32Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Inside circle = 1.0, outside = 0.0
      heightMap[y * width + x] = dist <= radius ? 1.0 : 0.0;
    }
  }
  
  return heightMap;
}

// Create a square shape
function createSquare(width: number, height: number, x1: number, y1: number, size: number): Float32Array {
  const heightMap = new Float32Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = x >= x1 && x < x1 + size && y >= y1 && y < y1 + size;
      heightMap[y * width + x] = inside ? 1.0 : 0.0;
    }
  }
  
  return heightMap;
}

// Create a star shape (5-pointed)
function createStar(width: number, height: number, centerX: number, centerY: number, outerRadius: number): Float32Array {
  const heightMap = new Float32Array(width * height);
  const innerRadius = outerRadius * 0.4;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Create 5-pointed star
      const pointAngle = (angle + Math.PI) % (Math.PI * 2 / 5);
      const maxRadius = innerRadius + (outerRadius - innerRadius) * 
        (0.5 + 0.5 * Math.cos(pointAngle * 5));
      
      heightMap[y * width + x] = dist <= maxRadius ? 1.0 : 0.0;
    }
  }
  
  return heightMap;
}

// Visualize height map as ASCII
function visualizeHeightMap(heightMap: Float32Array, width: number, height: number): void {
  console.log('\n=== Height Map ===');
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const val = heightMap[y * width + x];
      row += val > 0.5 ? '██' : '  ';
    }
    console.log(row);
  }
}

// Visualize contours as ASCII
function visualizeContours(contours: Array<Array<{x: number, y: number}>>, width: number, height: number): void {
  console.log('\n=== Traced Contours ===');
  const grid: string[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = '  ';
    }
  }
  
  // Mark contour points
  contours.forEach((contour, idx) => {
    const markers = ['██', '▓▓', '▒▒', '░░'];
    const marker = markers[idx % markers.length];
    contour.forEach(p => {
      if (p.y >= 0 && p.y < height && p.x >= 0 && p.x < width) {
        grid[p.y][p.x] = marker;
      }
    });
  });
  
  for (let y = 0; y < height; y++) {
    console.log(grid[y].join(''));
  }
}

// Run tests
function runTests(): void {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Moore-Neighbor Contour Tracing Algorithm Test Suite      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const testWidth = 40;
  const testHeight = 30;
  
  // Test 1: Circle
  console.log('\n\n📍 TEST 1: CIRCLE (radius=10)');
  console.log('─'.repeat(60));
  const circle = createCircle(testWidth, testHeight, 20, 15, 10);
  visualizeHeightMap(circle, testWidth, testHeight);
  
  const circleContours = traceContours(circle, testWidth, testHeight, 0.5);
  console.log(`\n✓ Found ${circleContours.length} contour(s)`);
  circleContours.forEach((c, i) => {
    console.log(`  Contour ${i + 1}: ${c.length} points`);
  });
  visualizeContours(circleContours, testWidth, testHeight);
  
  // Test 2: Square
  console.log('\n\n📍 TEST 2: SQUARE (15x15)');
  console.log('─'.repeat(60));
  const square = createSquare(testWidth, testHeight, 12, 7, 15);
  visualizeHeightMap(square, testWidth, testHeight);
  
  const squareContours = traceContours(square, testWidth, testHeight, 0.5);
  console.log(`\n✓ Found ${squareContours.length} contour(s)`);
  squareContours.forEach((c, i) => {
    console.log(`  Contour ${i + 1}: ${c.length} points`);
  });
  visualizeContours(squareContours, testWidth, testHeight);
  
  // Test 3: Star
  console.log('\n\n📍 TEST 3: STAR (5-pointed, radius=12)');
  console.log('─'.repeat(60));
  const star = createStar(testWidth, testHeight, 20, 15, 12);
  visualizeHeightMap(star, testWidth, testHeight);
  
  const starContours = traceContours(star, testWidth, testHeight, 0.5);
  console.log(`\n✓ Found ${starContours.length} contour(s)`);
  starContours.forEach((c, i) => {
    console.log(`  Contour ${i + 1}: ${c.length} points`);
  });
  visualizeContours(starContours, testWidth, testHeight);
  
  // Test 4: Multiple shapes
  console.log('\n\n📍 TEST 4: MULTIPLE SHAPES (2 circles)');
  console.log('─'.repeat(60));
  const multi = new Float32Array(testWidth * testHeight);
  const circle1 = createCircle(testWidth, testHeight, 12, 10, 6);
  const circle2 = createCircle(testWidth, testHeight, 28, 20, 5);
  
  for (let i = 0; i < multi.length; i++) {
    multi[i] = Math.max(circle1[i], circle2[i]);
  }
  
  visualizeHeightMap(multi, testWidth, testHeight);
  
  const multiContours = traceContours(multi, testWidth, testHeight, 0.5);
  console.log(`\n✓ Found ${multiContours.length} contour(s)`);
  multiContours.forEach((c, i) => {
    console.log(`  Contour ${i + 1}: ${c.length} points`);
  });
  visualizeContours(multiContours, testWidth, testHeight);
  
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✓ All tests completed successfully!                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run the tests
runTests();
