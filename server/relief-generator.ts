// 2.5D Relief Generator
// Converts images to raised/recessed 3D surfaces with LED channels

import type { ReliefSettings } from "@shared/relief-types";
import archiver from "archiver";
import { Writable } from "stream";

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  v1: Vector3;
  v2: Vector3;
  v3: Vector3;
}

// Convert image data to height map
function imageToHeightMap(
  imageData: string,
  width: number,
  height: number,
  settings: ReliefSettings
): Float32Array {
  // Extract base64 data
  const base64Data = imageData.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // For now, create a simple height map based on grayscale
  // In production, this would parse the actual image
  const heightMap = new Float32Array(width * height);
  
  // Simulate grayscale conversion (will be replaced with actual image parsing)
  for (let i = 0; i < heightMap.length; i++) {
    const gray = Math.random() * 255; // Placeholder - will parse actual image
    const normalized = gray / 255;
    const depth = normalized * settings.maxDepth;
    heightMap[i] = settings.invertDepth ? (settings.maxDepth - depth) : depth;
  }
  
  return heightMap;
}

// Smooth height map using box blur
function smoothHeightMap(
  heightMap: Float32Array,
  width: number,
  height: number,
  iterations: number
): Float32Array {
  let current = new Float32Array(heightMap);
  let next = new Float32Array(heightMap.length);
  
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // 3x3 box blur
        const sum = 
          current[(y-1)*width + (x-1)] + current[(y-1)*width + x] + current[(y-1)*width + (x+1)] +
          current[y*width + (x-1)] + current[y*width + x] + current[y*width + (x+1)] +
          current[(y+1)*width + (x-1)] + current[(y+1)*width + x] + current[(y+1)*width + (x+1)];
        
        next[idx] = sum / 9;
      }
    }
    
    // Swap buffers
    const temp = current;
    current = next;
    next = temp;
  }
  
  return current;
}

// Generate 3D mesh from height map
function heightMapToMesh(
  heightMap: Float32Array,
  width: number,
  height: number,
  settings: ReliefSettings
): Triangle[] {
  const triangles: Triangle[] = [];
  const scaleX = settings.baseWidth / width;
  const scaleY = settings.baseHeight / height;
  
  // Generate vertices and triangles
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx00 = y * width + x;
      const idx10 = y * width + (x + 1);
      const idx01 = (y + 1) * width + x;
      const idx11 = (y + 1) * width + (x + 1);
      
      const v00: Vector3 = { x: x * scaleX, y: y * scaleY, z: heightMap[idx00] };
      const v10: Vector3 = { x: (x + 1) * scaleX, y: y * scaleY, z: heightMap[idx10] };
      const v01: Vector3 = { x: x * scaleX, y: (y + 1) * scaleY, z: heightMap[idx01] };
      const v11: Vector3 = { x: (x + 1) * scaleX, y: (y + 1) * scaleY, z: heightMap[idx11] };
      
      // Create two triangles for this quad
      triangles.push({ v1: v00, v2: v10, v3: v11 });
      triangles.push({ v1: v00, v2: v11, v3: v01 });
    }
  }
  
  // Add base plate
  const baseTriangles = generateBasePlate(settings);
  triangles.push(...baseTriangles);
  
  return triangles;
}

// Generate base plate
function generateBasePlate(settings: ReliefSettings): Triangle[] {
  const triangles: Triangle[] = [];
  const w = settings.baseWidth;
  const h = settings.baseHeight;
  const t = settings.baseThickness;
  
  // Bottom face
  const v1: Vector3 = { x: 0, y: 0, z: -t };
  const v2: Vector3 = { x: w, y: 0, z: -t };
  const v3: Vector3 = { x: w, y: h, z: -t };
  const v4: Vector3 = { x: 0, y: h, z: -t };
  
  triangles.push({ v1, v2, v3: v3 });
  triangles.push({ v1, v2: v3, v3: v4 });
  
  // Top face (at z=0)
  const t1: Vector3 = { x: 0, y: 0, z: 0 };
  const t2: Vector3 = { x: w, y: 0, z: 0 };
  const t3: Vector3 = { x: w, y: h, z: 0 };
  const t4: Vector3 = { x: 0, y: h, z: 0 };
  
  triangles.push({ v1: t1, v2: t3, v3: t2 });
  triangles.push({ v1: t1, v2: t4, v3: t3 });
  
  // Side faces
  // Front
  triangles.push({ v1, v2: t1, v3: t2 });
  triangles.push({ v1, v2: t2, v3: v2 });
  
  // Right
  triangles.push({ v1: v2, v2: t2, v3: t3 });
  triangles.push({ v1: v2, v2: t3, v3: v3 });
  
  // Back
  triangles.push({ v1: v3, v2: t3, v3: t4 });
  triangles.push({ v1: v3, v2: t4, v3: v4 });
  
  // Left
  triangles.push({ v1: v4, v2: t4, v3: t1 });
  triangles.push({ v1: v4, v2: t1, v3: v1 });
  
  return triangles;
}

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

// Simplify path using Douglas-Peucker algorithm
function simplifyPath(points: Array<{x: number, y: number}>, tolerance: number): Array<{x: number, y: number}> {
  if (points.length <= 2) return points;
  
  const distanceToSegment = (p: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}): number => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) {
      const pdx = p.x - a.x;
      const pdy = p.y - a.y;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }
    
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    const pdx = p.x - projX;
    const pdy = p.y - projY;
    
    return Math.sqrt(pdx * pdx + pdy * pdy);
  };
  
  let maxDist = 0;
  let maxIdx = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = distanceToSegment(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPath(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[points.length - 1]];
}

// Add LED channels to mesh
function addLEDChannels(
  triangles: Triangle[],
  settings: ReliefSettings,
  width: number,
  height: number,
  heightMap: Float32Array
): Triangle[] {
  const ledTriangles: Triangle[] = [];
  
  if (settings.ledPlacement === "none") {
    return ledTriangles;
  }
  
  const channelWidth = settings.ledChannelWidth;
  const channelDepth = settings.ledChannelDepth;
  const scaleX = settings.baseWidth / width;
  const scaleY = settings.baseHeight / height;
  
  if (settings.ledPlacement === "edges") {
    // Add channels around the perimeter
    const w = settings.baseWidth;
    const h = settings.baseHeight;
    const offset = 5;
    
    ledTriangles.push(...createChannelSegment(
      { x: offset, y: offset, z: 0 },
      { x: w - offset, y: offset, z: 0 },
      channelWidth,
      channelDepth
    ));
    
    ledTriangles.push(...createChannelSegment(
      { x: w - offset, y: offset, z: 0 },
      { x: w - offset, y: h - offset, z: 0 },
      channelWidth,
      channelDepth
    ));
    
    ledTriangles.push(...createChannelSegment(
      { x: w - offset, y: h - offset, z: 0 },
      { x: offset, y: h - offset, z: 0 },
      channelWidth,
      channelDepth
    ));
    
    ledTriangles.push(...createChannelSegment(
      { x: offset, y: h - offset, z: 0 },
      { x: offset, y: offset, z: 0 },
      channelWidth,
      channelDepth
    ));
  } else if (settings.ledPlacement === "contours") {
    // Use Moore-Neighbor boundary tracing
    const threshold = settings.maxDepth * 0.3; // Detect edges at 30% depth
    const contours = traceContours(heightMap, width, height, threshold);
    
    console.log(`[Relief] Found ${contours.length} contours`);
    
    for (const contour of contours) {
      // Simplify contour using Douglas-Peucker
      const simplified = simplifyPath(contour, 2.0);
      
      console.log(`[Relief] Contour: ${contour.length} points -> ${simplified.length} simplified`);
      
      // Create LED channels along simplified contour
      for (let i = 0; i < simplified.length - 1; i++) {
        const p1 = simplified[i];
        const p2 = simplified[i + 1];
        
        ledTriangles.push(...createChannelSegment(
          { x: p1.x * scaleX, y: p1.y * scaleY, z: 0 },
          { x: p2.x * scaleX, y: p2.y * scaleY, z: 0 },
          channelWidth,
          channelDepth
        ));
      }
    }
  } else if (settings.ledPlacement === "grid") {
    // Grid pattern
    const spacing = 20;
    const w = settings.baseWidth;
    const h = settings.baseHeight;
    
    for (let x = spacing; x < w; x += spacing) {
      ledTriangles.push(...createChannelSegment(
        { x, y: 5, z: 0 },
        { x, y: h - 5, z: 0 },
        channelWidth,
        channelDepth
      ));
    }
    
    for (let y = spacing; y < h; y += spacing) {
      ledTriangles.push(...createChannelSegment(
        { x: 5, y, z: 0 },
        { x: w - 5, y, z: 0 },
        channelWidth,
        channelDepth
      ));
    }
  }
  
  return ledTriangles;
}

// Create a channel segment between two points
function createChannelSegment(
  start: Vector3,
  end: Vector3,
  width: number,
  depth: number
): Triangle[] {
  const triangles: Triangle[] = [];
  
  // Calculate perpendicular vector
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len * (width / 2);
  const perpY = dx / len * (width / 2);
  
  // Create channel as a rectangular groove
  const v1: Vector3 = { x: start.x + perpX, y: start.y + perpY, z: start.z };
  const v2: Vector3 = { x: start.x - perpX, y: start.y - perpY, z: start.z };
  const v3: Vector3 = { x: end.x - perpX, y: end.y - perpY, z: end.z };
  const v4: Vector3 = { x: end.x + perpX, y: end.y + perpY, z: end.z };
  
  const b1: Vector3 = { x: start.x + perpX, y: start.y + perpY, z: start.z - depth };
  const b2: Vector3 = { x: start.x - perpX, y: start.y - perpY, z: start.z - depth };
  const b3: Vector3 = { x: end.x - perpX, y: end.y - perpY, z: end.z - depth };
  const b4: Vector3 = { x: end.x + perpX, y: end.y + perpY, z: end.z - depth };
  
  // Bottom of channel
  triangles.push({ v1: b1, v2: b3, v3: b2 });
  triangles.push({ v1: b1, v2: b4, v3: b3 });
  
  // Sides of channel
  triangles.push({ v1: v1, v2: b1, v3: b2 });
  triangles.push({ v1: v1, v2: b2, v3: v2 });
  
  triangles.push({ v1: v2, v2: b2, v3: b3 });
  triangles.push({ v1: v2, v2: b3, v3: v3 });
  
  triangles.push({ v1: v3, v2: b3, v3: b4 });
  triangles.push({ v1: v3, v2: b4, v3: v4 });
  
  triangles.push({ v1: v4, v2: b4, v3: b1 });
  triangles.push({ v1: v4, v2: b1, v3: v1 });
  
  return triangles;
}

// Convert triangles to STL binary format
function trianglesToSTL(triangles: Triangle[], name: string): Buffer {
  const headerSize = 80;
  const triangleSize = 50; // 12 floats * 4 bytes + 2 bytes attribute
  const bufferSize = headerSize + 4 + (triangles.length * triangleSize);
  const buffer = Buffer.alloc(bufferSize);
  
  // Write header
  buffer.write(`STL Binary - ${name}`, 0, headerSize, 'ascii');
  
  // Write triangle count
  buffer.writeUInt32LE(triangles.length, headerSize);
  
  let offset = headerSize + 4;
  
  for (const tri of triangles) {
    // Calculate normal
    const v1 = tri.v1, v2 = tri.v2, v3 = tri.v3;
    const ux = v2.x - v1.x, uy = v2.y - v1.y, uz = v2.z - v1.z;
    const vx = v3.x - v1.x, vy = v3.y - v1.y, vz = v3.z - v1.z;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    
    // Write normal
    buffer.writeFloatLE(len > 0 ? nx / len : 0, offset); offset += 4;
    buffer.writeFloatLE(len > 0 ? ny / len : 0, offset); offset += 4;
    buffer.writeFloatLE(len > 0 ? nz / len : 0, offset); offset += 4;
    
    // Write vertices
    buffer.writeFloatLE(v1.x, offset); offset += 4;
    buffer.writeFloatLE(v1.y, offset); offset += 4;
    buffer.writeFloatLE(v1.z, offset); offset += 4;
    
    buffer.writeFloatLE(v2.x, offset); offset += 4;
    buffer.writeFloatLE(v2.y, offset); offset += 4;
    buffer.writeFloatLE(v2.z, offset); offset += 4;
    
    buffer.writeFloatLE(v3.x, offset); offset += 4;
    buffer.writeFloatLE(v3.y, offset); offset += 4;
    buffer.writeFloatLE(v3.z, offset); offset += 4;
    
    // Attribute byte count (unused)
    buffer.writeUInt16LE(0, offset); offset += 2;
  }
  
  return buffer;
}

// Main export function
export async function generateReliefSTL(
  settings: ReliefSettings,
  imageData: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Relief Generator] Starting generation...');
      
      // For now, use fixed dimensions (will parse actual image later)
      const imageWidth = 100;
      const imageHeight = 100;
      
      // Convert image to height map
      let heightMap = imageToHeightMap(imageData, imageWidth, imageHeight, settings);
      console.log('[Relief Generator] Height map created');
      
      // Smooth height map
      if (settings.smoothing > 0) {
        heightMap = smoothHeightMap(heightMap, imageWidth, imageHeight, settings.smoothing);
        console.log('[Relief Generator] Height map smoothed');
      }
      
      // Generate 3D mesh
      let triangles = heightMapToMesh(heightMap, imageWidth, imageHeight, settings);
      console.log(`[Relief Generator] Mesh created: ${triangles.length} triangles`);
      
      // Add LED channels
      const ledTriangles = addLEDChannels(triangles, settings, imageWidth, imageHeight, heightMap);
      triangles.push(...ledTriangles);
      console.log(`[Relief Generator] LED channels added: ${ledTriangles.length} triangles`);
      
      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      
      const bufferStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        }
      });
      
      archive.on('error', (err) => {
        console.error('[Relief Generator] Archive error:', err);
        reject(err);
      });
      
      archive.on('end', () => {
        console.log('[Relief Generator] Archive finalized');
        resolve(Buffer.concat(chunks));
      });
      
      archive.pipe(bufferStream);
      
      // Add relief STL
      const reliefSTL = trianglesToSTL(triangles, 'relief_main');
      archive.append(reliefSTL, { name: 'relief_main.stl' });
      
      // Add diffuser if enabled
      if (settings.includeDiffuser) {
        const diffuserTriangles = generateBasePlate({
          ...settings,
          baseThickness: settings.diffuserThickness
        });
        const diffuserSTL = trianglesToSTL(diffuserTriangles, 'relief_diffuser');
        archive.append(diffuserSTL, { name: 'relief_diffuser.stl' });
      }
      
      // Add README
      const readme = `2.5D Relief Model
==================

Relief Style: ${settings.reliefStyle}
Max Depth: ${settings.maxDepth}mm
Base Size: ${settings.baseWidth}mm x ${settings.baseHeight}mm
LED Placement: ${settings.ledPlacement}

Parts Included:
1. relief_main.stl - Main relief surface with LED channels
${settings.includeDiffuser ? '2. relief_diffuser.stl - Translucent diffuser cover\n' : ''}

Printing Instructions:
- Main relief: Print in opaque filament
${settings.includeDiffuser ? '- Diffuser: Print in clear/translucent PETG\n' : ''}
- Layer height: 0.2mm recommended
- Supports: May be needed for deep reliefs

Assembly:
1. Print all parts
2. Insert LED strip into channels
3. Wire LEDs to power source
${settings.includeDiffuser ? '4. Attach diffuser cover\n' : ''}

Created with Sign-Sculptor - 2.5D Relief Generator
`;
      
      archive.append(readme, { name: 'README.txt' });
      
      archive.finalize();
      
    } catch (error) {
      console.error('[Relief Generator] Error:', error);
      reject(error);
    }
  });
}
