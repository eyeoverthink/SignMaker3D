import { createCanvas, loadImage, Image } from 'canvas';

interface LithophaneSettings {
  image: string;
  baseThickness: number;
  maxDepth: number;
  width: number;
  height: number;
  invertImage: boolean;
  smoothing: number;
  borderThickness: number;
  addFrame: boolean;
}

interface Triangle {
  vertices: [number, number, number][];
}

export async function generateLithophaneSTL(settings: LithophaneSettings): Promise<string> {
  console.log('[Lithophane] Starting generation with settings:', {
    baseThickness: settings.baseThickness,
    maxDepth: settings.maxDepth,
    dimensions: `${settings.width}x${settings.height}mm`,
    invertImage: settings.invertImage,
    smoothing: settings.smoothing,
    addFrame: settings.addFrame,
  });

  // Parse image and create height map
  const heightMap = await imageToHeightMap(settings);
  const resolution = heightMap.width;
  const heightData = heightMap.data;

  console.log(`[Lithophane] Height map created: ${heightMap.width}x${heightMap.height} pixels`);

  // Generate mesh
  const triangles: Triangle[] = [];

  // Physical dimensions
  const physicalWidth = settings.width;
  const physicalHeight = settings.height;
  const pixelWidth = physicalWidth / resolution;
  const pixelHeight = physicalHeight / heightMap.height;

  // Generate front and back surfaces
  for (let y = 0; y < heightMap.height - 1; y++) {
    for (let x = 0; x < heightMap.width - 1; x++) {
      const x0 = x * pixelWidth;
      const x1 = (x + 1) * pixelWidth;
      const y0 = y * pixelHeight;
      const y1 = (y + 1) * pixelHeight;

      // Get heights (z-values) for each corner
      const z00 = heightData[y * heightMap.width + x];
      const z10 = heightData[y * heightMap.width + (x + 1)];
      const z01 = heightData[(y + 1) * heightMap.width + x];
      const z11 = heightData[(y + 1) * heightMap.width + (x + 1)];

      // Front face (variable depth)
      triangles.push({
        vertices: [
          [x0, y0, z00],
          [x1, y0, z10],
          [x0, y1, z01],
        ],
      });
      triangles.push({
        vertices: [
          [x1, y0, z10],
          [x1, y1, z11],
          [x0, y1, z01],
        ],
      });

      // Back face (flat)
      const backZ = 0;
      triangles.push({
        vertices: [
          [x0, y0, backZ],
          [x0, y1, backZ],
          [x1, y0, backZ],
        ],
      });
      triangles.push({
        vertices: [
          [x1, y0, backZ],
          [x0, y1, backZ],
          [x1, y1, backZ],
        ],
      });
    }
  }

  // Add side walls
  addSideWalls(triangles, heightData, heightMap.width, heightMap.height, physicalWidth, physicalHeight, pixelWidth, pixelHeight);

  // Add frame if requested
  if (settings.addFrame) {
    addFrame(triangles, physicalWidth, physicalHeight, settings.borderThickness, settings.baseThickness + settings.maxDepth);
  }

  console.log(`[Lithophane] Generated ${triangles.length} triangles`);

  // Convert to STL
  return trianglesToSTL(triangles, 'Lithophane');
}

async function imageToHeightMap(settings: LithophaneSettings): Promise<{ data: Float32Array; width: number; height: number }> {
  // Decode base64 image
  const base64Data = settings.image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Load image using canvas
  const img: Image = await loadImage(buffer);
  
  // Calculate target resolution (maintain aspect ratio)
  const aspectRatio = img.width / img.height;
  const targetWidth = Math.min(200, img.width); // Max 200px for performance
  const targetHeight = Math.round(targetWidth / aspectRatio);

  // Create canvas and draw image
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = imageData.data;

  // Convert to grayscale height map
  const heightMap = new Float32Array(targetWidth * targetHeight);
  
  for (let i = 0; i < targetWidth * targetHeight; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    
    // Convert to grayscale (luminance formula)
    let gray = r * 0.299 + g * 0.587 + b * 0.114;
    
    // Normalize to 0-1
    gray = gray / 255;
    
    // Invert if requested
    if (settings.invertImage) {
      gray = 1 - gray;
    }
    
    // Map to thickness: dark = thick, bright = thin
    // gray=0 (dark) → baseThickness + maxDepth
    // gray=1 (bright) → baseThickness
    heightMap[i] = settings.baseThickness + (1 - gray) * settings.maxDepth;
  }

  // Apply smoothing if requested
  if (settings.smoothing > 0) {
    return {
      data: gaussianBlur(heightMap, targetWidth, targetHeight, settings.smoothing),
      width: targetWidth,
      height: targetHeight,
    };
  }

  return {
    data: heightMap,
    width: targetWidth,
    height: targetHeight,
  };
}

function gaussianBlur(data: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (radius === 0) return data;

  const blurred = new Float32Array(data.length);
  const kernel = createGaussianKernel(radius);
  const kernelSize = kernel.length;
  const halfKernel = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx));
          const py = Math.max(0, Math.min(height - 1, y + ky));
          const weight = kernel[ky + halfKernel] * kernel[kx + halfKernel];
          
          sum += data[py * width + px] * weight;
          weightSum += weight;
        }
      }

      blurred[y * width + x] = sum / weightSum;
    }
  }

  return blurred;
}

function createGaussianKernel(radius: number): number[] {
  const size = radius * 2 + 1;
  const kernel = new Array(size);
  const sigma = radius / 2;
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  // Normalize
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

function addSideWalls(
  triangles: Triangle[],
  heightData: Float32Array,
  mapWidth: number,
  mapHeight: number,
  physicalWidth: number,
  physicalHeight: number,
  pixelWidth: number,
  pixelHeight: number
): void {
  // Left wall
  for (let y = 0; y < mapHeight - 1; y++) {
    const y0 = y * pixelHeight;
    const y1 = (y + 1) * pixelHeight;
    const z0 = heightData[y * mapWidth];
    const z1 = heightData[(y + 1) * mapWidth];

    triangles.push({
      vertices: [
        [0, y0, 0],
        [0, y0, z0],
        [0, y1, 0],
      ],
    });
    triangles.push({
      vertices: [
        [0, y0, z0],
        [0, y1, z1],
        [0, y1, 0],
      ],
    });
  }

  // Right wall
  for (let y = 0; y < mapHeight - 1; y++) {
    const y0 = y * pixelHeight;
    const y1 = (y + 1) * pixelHeight;
    const z0 = heightData[y * mapWidth + (mapWidth - 1)];
    const z1 = heightData[(y + 1) * mapWidth + (mapWidth - 1)];

    triangles.push({
      vertices: [
        [physicalWidth, y0, 0],
        [physicalWidth, y1, 0],
        [physicalWidth, y0, z0],
      ],
    });
    triangles.push({
      vertices: [
        [physicalWidth, y0, z0],
        [physicalWidth, y1, 0],
        [physicalWidth, y1, z1],
      ],
    });
  }

  // Top wall
  for (let x = 0; x < mapWidth - 1; x++) {
    const x0 = x * pixelWidth;
    const x1 = (x + 1) * pixelWidth;
    const z0 = heightData[x];
    const z1 = heightData[x + 1];

    triangles.push({
      vertices: [
        [x0, 0, 0],
        [x1, 0, 0],
        [x0, 0, z0],
      ],
    });
    triangles.push({
      vertices: [
        [x1, 0, 0],
        [x1, 0, z1],
        [x0, 0, z0],
      ],
    });
  }

  // Bottom wall
  for (let x = 0; x < mapWidth - 1; x++) {
    const x0 = x * pixelWidth;
    const x1 = (x + 1) * pixelWidth;
    const z0 = heightData[(mapHeight - 1) * mapWidth + x];
    const z1 = heightData[(mapHeight - 1) * mapWidth + (x + 1)];

    triangles.push({
      vertices: [
        [x0, physicalHeight, 0],
        [x0, physicalHeight, z0],
        [x1, physicalHeight, 0],
      ],
    });
    triangles.push({
      vertices: [
        [x1, physicalHeight, 0],
        [x0, physicalHeight, z0],
        [x1, physicalHeight, z1],
      ],
    });
  }
}

function addFrame(
  triangles: Triangle[],
  width: number,
  height: number,
  thickness: number,
  depth: number
): void {
  // Frame extends outward from the lithophane edges
  const outerWidth = width + thickness * 2;
  const outerHeight = height + thickness * 2;

  // Top frame
  triangles.push(
    { vertices: [[-thickness, -thickness, 0], [width + thickness, -thickness, 0], [-thickness, 0, 0]] },
    { vertices: [[width + thickness, -thickness, 0], [width + thickness, 0, 0], [-thickness, 0, 0]] },
    { vertices: [[-thickness, -thickness, depth], [-thickness, 0, depth], [width + thickness, -thickness, depth]] },
    { vertices: [[width + thickness, -thickness, depth], [-thickness, 0, depth], [width + thickness, 0, depth]] }
  );

  // Bottom frame
  triangles.push(
    { vertices: [[-thickness, height, 0], [-thickness, height + thickness, 0], [width + thickness, height, 0]] },
    { vertices: [[width + thickness, height, 0], [-thickness, height + thickness, 0], [width + thickness, height + thickness, 0]] },
    { vertices: [[-thickness, height, depth], [width + thickness, height, depth], [-thickness, height + thickness, depth]] },
    { vertices: [[width + thickness, height, depth], [-thickness, height + thickness, depth], [width + thickness, height + thickness, depth]] }
  );

  // Left frame
  triangles.push(
    { vertices: [[-thickness, 0, 0], [0, 0, 0], [-thickness, height, 0]] },
    { vertices: [[0, 0, 0], [0, height, 0], [-thickness, height, 0]] },
    { vertices: [[-thickness, 0, depth], [-thickness, height, depth], [0, 0, depth]] },
    { vertices: [[0, 0, depth], [-thickness, height, depth], [0, height, depth]] }
  );

  // Right frame
  triangles.push(
    { vertices: [[width, 0, 0], [width + thickness, 0, 0], [width, height, 0]] },
    { vertices: [[width + thickness, 0, 0], [width + thickness, height, 0], [width, height, 0]] },
    { vertices: [[width, 0, depth], [width, height, depth], [width + thickness, 0, depth]] },
    { vertices: [[width + thickness, 0, depth], [width, height, depth], [width + thickness, height, depth]] }
  );
}

function trianglesToSTL(triangles: Triangle[], name: string): string {
  let stl = `solid ${name}\n`;

  for (const triangle of triangles) {
    const [v1, v2, v3] = triangle.vertices;
    
    // Calculate normal
    const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    
    // Normalize
    const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    if (length > 0) {
      normal[0] /= length;
      normal[1] /= length;
      normal[2] /= length;
    }

    stl += `  facet normal ${normal[0].toFixed(6)} ${normal[1].toFixed(6)} ${normal[2].toFixed(6)}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}\n`;
    stl += `      vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}\n`;
    stl += `      vertex ${v3[0].toFixed(6)} ${v3[1].toFixed(6)} ${v3[2].toFixed(6)}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }

  stl += `endsolid ${name}\n`;
  return stl;
}
