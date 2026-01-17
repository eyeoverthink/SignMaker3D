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

// Add LED channels to mesh
function addLEDChannels(
  triangles: Triangle[],
  settings: ReliefSettings,
  width: number,
  height: number
): Triangle[] {
  const ledTriangles: Triangle[] = [];
  
  if (settings.ledPlacement === "none") {
    return ledTriangles;
  }
  
  const channelWidth = settings.ledChannelWidth;
  const channelDepth = settings.ledChannelDepth;
  
  if (settings.ledPlacement === "edges") {
    // Add channels around the perimeter
    const w = settings.baseWidth;
    const h = settings.baseHeight;
    const offset = 5; // Offset from edge
    
    // Top edge channel
    ledTriangles.push(...createChannelSegment(
      { x: offset, y: offset, z: 0 },
      { x: w - offset, y: offset, z: 0 },
      channelWidth,
      channelDepth
    ));
    
    // Right edge channel
    ledTriangles.push(...createChannelSegment(
      { x: w - offset, y: offset, z: 0 },
      { x: w - offset, y: h - offset, z: 0 },
      channelWidth,
      channelDepth
    ));
    
    // Bottom edge channel
    ledTriangles.push(...createChannelSegment(
      { x: w - offset, y: h - offset, z: 0 },
      { x: offset, y: h - offset, z: 0 },
      channelWidth,
      channelDepth
    ));
    
    // Left edge channel
    ledTriangles.push(...createChannelSegment(
      { x: offset, y: h - offset, z: 0 },
      { x: offset, y: offset, z: 0 },
      channelWidth,
      channelDepth
    ));
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
      const ledTriangles = addLEDChannels(triangles, settings, imageWidth, imageHeight);
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
