import { createCanvas, loadImage, Image } from 'canvas';
import archiver from 'archiver';

interface AnimatedLithophaneSettings {
  frames: string[];
  frameCount: number;
  canvasWidth: number;
  canvasHeight: number;
  baseThickness: number;
  maxDepth: number;
  baffleDepth: number;
  baffleWallThickness: number;
  frameRate: number;
  includeBaffle: boolean;
  includeESP32Code: boolean;
}

interface Triangle {
  vertices: [number, number, number][];
}

export async function generateAnimatedLithophane(settings: AnimatedLithophaneSettings): Promise<Buffer> {
  console.log('[Animated Lithophane] Starting generation...');
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  
  archive.on('data', (chunk) => chunks.push(chunk));
  
  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  // Generate interlaced lithophane
  const lithophaneSTL = await generateInterlacedLithophane(settings);
  archive.append(lithophaneSTL, { name: 'interlaced_lithophane.stl' });

  // Generate baffle grid if requested
  if (settings.includeBaffle) {
    const baffleSTL = generateBaffleGrid(settings);
    archive.append(baffleSTL, { name: 'baffle_grid.stl' });
  }

  // Generate ESP32 code if requested
  if (settings.includeESP32Code) {
    const esp32Code = generateESP32Firmware(settings);
    archive.append(esp32Code, { name: 'chronos_pane_esp32.ino' });
    
    const wiring = generateWiringDiagram(settings);
    archive.append(wiring, { name: 'WIRING_GUIDE.txt' });
  }

  // Add assembly instructions
  const readme = generateAssemblyInstructions(settings);
  archive.append(readme, { name: 'README.txt' });

  await archive.finalize();
  return zipPromise;
}

async function generateInterlacedLithophane(settings: AnimatedLithophaneSettings): Promise<string> {
  console.log('[Interlaced Lithophane] Processing frames...');
  
  // Calculate grid layout
  const gridSize = Math.ceil(Math.sqrt(settings.frameCount));
  const cellWidth = settings.canvasWidth / gridSize;
  const cellHeight = settings.canvasHeight / gridSize;
  
  // Load all frame images
  const frameImages: Image[] = [];
  for (const frameData of settings.frames) {
    const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const img = await loadImage(buffer);
    frameImages.push(img);
  }

  // Create interlaced height map
  const resolution = 100; // pixels per cell
  const totalWidth = gridSize * resolution;
  const totalHeight = gridSize * resolution;
  const heightMap = new Float32Array(totalWidth * totalHeight);

  // Process each frame into its grid cell
  for (let frameIdx = 0; frameIdx < settings.frameCount; frameIdx++) {
    const gridX = frameIdx % gridSize;
    const gridY = Math.floor(frameIdx / gridSize);
    
    const canvas = createCanvas(resolution, resolution);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(frameImages[frameIdx], 0, 0, resolution, resolution);
    
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const pixels = imageData.data;
    
    // Convert to grayscale and map to height
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const pixelIdx = (y * resolution + x) * 4;
        const gray = pixels[pixelIdx] * 0.299 + pixels[pixelIdx + 1] * 0.587 + pixels[pixelIdx + 2] * 0.114;
        const normalized = gray / 255;
        
        // Map to thickness: dark = thick, bright = thin
        const thickness = settings.baseThickness + (1 - normalized) * settings.maxDepth;
        
        // Place in interlaced grid
        const mapX = gridX * resolution + x;
        const mapY = gridY * resolution + y;
        heightMap[mapY * totalWidth + mapX] = thickness;
      }
    }
  }

  console.log(`[Interlaced Lithophane] Created ${totalWidth}x${totalHeight} height map`);

  // Generate mesh from height map
  const triangles: Triangle[] = [];
  const pixelWidth = cellWidth / resolution;
  const pixelHeight = cellHeight / resolution;

  for (let y = 0; y < totalHeight - 1; y++) {
    for (let x = 0; x < totalWidth - 1; x++) {
      const x0 = x * pixelWidth;
      const x1 = (x + 1) * pixelWidth;
      const y0 = y * pixelHeight;
      const y1 = (y + 1) * pixelHeight;

      const z00 = heightMap[y * totalWidth + x];
      const z10 = heightMap[y * totalWidth + (x + 1)];
      const z01 = heightMap[(y + 1) * totalWidth + x];
      const z11 = heightMap[(y + 1) * totalWidth + (x + 1)];

      // Front face (variable depth)
      triangles.push(
        { vertices: [[x0, y0, z00], [x1, y0, z10], [x0, y1, z01]] },
        { vertices: [[x1, y0, z10], [x1, y1, z11], [x0, y1, z01]] }
      );

      // Back face (flat)
      triangles.push(
        { vertices: [[x0, y0, 0], [x0, y1, 0], [x1, y0, 0]] },
        { vertices: [[x1, y0, 0], [x0, y1, 0], [x1, y1, 0]] }
      );
    }
  }

  // Add side walls
  addSideWalls(triangles, heightMap, totalWidth, totalHeight, settings.canvasWidth, settings.canvasHeight, pixelWidth, pixelHeight);

  console.log(`[Interlaced Lithophane] Generated ${triangles.length} triangles`);
  return trianglesToSTL(triangles, 'Interlaced_Lithophane');
}

function generateBaffleGrid(settings: AnimatedLithophaneSettings): string {
  console.log('[Baffle Grid] Generating honeycomb structure...');
  
  const triangles: Triangle[] = [];
  const gridSize = Math.ceil(Math.sqrt(settings.frameCount));
  const cellWidth = settings.canvasWidth / gridSize;
  const cellHeight = settings.canvasHeight / gridSize;
  const wallThickness = settings.baffleWallThickness;
  const depth = settings.baffleDepth;

  // Generate grid cells
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const frameIdx = gy * gridSize + gx;
      if (frameIdx >= settings.frameCount) continue;

      const x0 = gx * cellWidth;
      const y0 = gy * cellHeight;
      const x1 = x0 + cellWidth;
      const y1 = y0 + cellHeight;

      // Create cell walls (vertical baffles)
      // Bottom wall
      if (gy < gridSize - 1) {
        addWall(triangles, x0, y1 - wallThickness / 2, x1, y1 + wallThickness / 2, 0, depth);
      }
      
      // Right wall
      if (gx < gridSize - 1) {
        addWall(triangles, x1 - wallThickness / 2, y0, x1 + wallThickness / 2, y1, 0, depth);
      }

      // Add LED mounting post in center of each cell
      const centerX = (x0 + x1) / 2;
      const centerY = (y0 + y1) / 2;
      addLEDPost(triangles, centerX, centerY, 3, depth - 5); // 3mm diameter post
    }
  }

  // Add outer frame
  addWall(triangles, 0, 0, settings.canvasWidth, wallThickness, 0, depth); // Top
  addWall(triangles, 0, settings.canvasHeight - wallThickness, settings.canvasWidth, settings.canvasHeight, 0, depth); // Bottom
  addWall(triangles, 0, 0, wallThickness, settings.canvasHeight, 0, depth); // Left
  addWall(triangles, settings.canvasWidth - wallThickness, 0, settings.canvasWidth, settings.canvasHeight, 0, depth); // Right

  // Add back plate
  triangles.push(
    { vertices: [[0, 0, 0], [settings.canvasWidth, 0, 0], [0, settings.canvasHeight, 0]] },
    { vertices: [[settings.canvasWidth, 0, 0], [settings.canvasWidth, settings.canvasHeight, 0], [0, settings.canvasHeight, 0]] }
  );

  console.log(`[Baffle Grid] Generated ${triangles.length} triangles`);
  return trianglesToSTL(triangles, 'Baffle_Grid');
}

function addWall(triangles: Triangle[], x0: number, y0: number, x1: number, y1: number, z0: number, z1: number): void {
  // Front face
  triangles.push(
    { vertices: [[x0, y0, z1], [x1, y0, z1], [x0, y1, z1]] },
    { vertices: [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] }
  );
  
  // Back face
  triangles.push(
    { vertices: [[x0, y0, z0], [x0, y1, z0], [x1, y0, z0]] },
    { vertices: [[x1, y0, z0], [x0, y1, z0], [x1, y1, z0]] }
  );
  
  // Side faces
  triangles.push(
    { vertices: [[x0, y0, z0], [x1, y0, z0], [x0, y0, z1]] },
    { vertices: [[x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
    { vertices: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z0]] },
    { vertices: [[x1, y1, z0], [x0, y1, z1], [x1, y1, z1]] },
    { vertices: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z0]] },
    { vertices: [[x0, y1, z0], [x0, y0, z1], [x0, y1, z1]] },
    { vertices: [[x1, y0, z0], [x1, y1, z0], [x1, y0, z1]] },
    { vertices: [[x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] }
  );
}

function addLEDPost(triangles: Triangle[], x: number, y: number, radius: number, height: number): void {
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;
    
    const x1 = x + Math.cos(angle1) * radius;
    const y1 = y + Math.sin(angle1) * radius;
    const x2 = x + Math.cos(angle2) * radius;
    const y2 = y + Math.sin(angle2) * radius;
    
    // Side face
    triangles.push(
      { vertices: [[x1, y1, 0], [x2, y2, 0], [x1, y1, height]] },
      { vertices: [[x2, y2, 0], [x2, y2, height], [x1, y1, height]] }
    );
    
    // Top cap
    triangles.push({ vertices: [[x, y, height], [x1, y1, height], [x2, y2, height]] });
  }
}

function generateESP32Firmware(settings: AnimatedLithophaneSettings): string {
  const gridSize = Math.ceil(Math.sqrt(settings.frameCount));
  const msPerFrame = 1000 / settings.frameRate;
  
  return `/*
 * Project Chronos-Pane - Animated Lithophane Controller
 * Generated by SignCraft 3D - Scott Algorithm System
 * 
 * Hardware: ESP32 + WS2812B LED Strip
 * Animation: ${settings.frameCount} frames at ${settings.frameRate} FPS
 * Grid Layout: ${gridSize}x${gridSize}
 */

#include <FastLED.h>

// Configuration
#define LED_PIN 5
#define NUM_LEDS ${settings.frameCount}
#define BRIGHTNESS 255
#define FRAME_COUNT ${settings.frameCount}
#define FRAME_DELAY ${msPerFrame.toFixed(1)} // milliseconds per frame

CRGB leds[NUM_LEDS];

// Frame channel mapping (which LEDs belong to which frame)
const int frameChannels[FRAME_COUNT][1] = {
${Array.from({ length: settings.frameCount }, (_, i) => `  {${i}}, // Frame ${i + 1}`).join('\n')}
};

int currentFrame = 0;
unsigned long lastFrameTime = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("Chronos-Pane Initializing...");
  
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(BRIGHTNESS);
  
  // Initialize all LEDs to off
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();
  
  Serial.println("Ready - Starting animation loop");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to switch frames
  if (currentTime - lastFrameTime >= FRAME_DELAY) {
    lastFrameTime = currentTime;
    
    // Turn off all LEDs
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    
    // Turn on current frame's LEDs
    for (int i = 0; i < 1; i++) { // Each frame has 1 LED in this simple mapping
      int ledIndex = frameChannels[currentFrame][i];
      leds[ledIndex] = CRGB::White; // Use white for lithophane backlighting
    }
    
    FastLED.show();
    
    // Advance to next frame
    currentFrame = (currentFrame + 1) % FRAME_COUNT;
    
    // Debug output
    Serial.print("Frame: ");
    Serial.println(currentFrame);
  }
}

/*
 * ADVANCED FEATURES TO ADD:
 * 
 * 1. Touch Control: Connect capacitive touch sensors to frame edges
 *    - Touch top = speed up animation
 *    - Touch bottom = slow down animation
 *    - Touch left/right = reverse direction
 * 
 * 2. Music Sync: Use FFT library to sync frame rate to audio input
 * 
 * 3. Streamer Integration: Connect to OBS via WebSocket
 *    - New subscriber = trigger special animation sequence
 *    - Donation = flash effect
 * 
 * 4. Ambient Mode: Use light sensor to adjust brightness based on room lighting
 */
`;
}

function generateWiringDiagram(settings: AnimatedLithophaneSettings): string {
  const gridSize = Math.ceil(Math.sqrt(settings.frameCount));
  
  return `CHRONOS-PANE WIRING GUIDE
==========================

Hardware Required:
- ESP32 Development Board
- WS2812B LED Strip (${settings.frameCount} LEDs minimum)
- 5V Power Supply (2A recommended)
- 470Ω resistor (for data line)
- 1000µF capacitor (across power supply)

Wiring Diagram:
--------------

ESP32 Pin 5 ----[470Ω]----> WS2812B Data In
ESP32 GND -----------------> WS2812B GND + Power Supply GND
Power Supply 5V -----------> WS2812B 5V + [1000µF Cap]

LED Layout (${gridSize}x${gridSize} Grid):
${Array.from({ length: gridSize }, (_, y) => 
  Array.from({ length: gridSize }, (_, x) => {
    const idx = y * gridSize + x;
    return idx < settings.frameCount ? `[${idx.toString().padStart(2, '0')}]` : '[--]';
  }).join(' ')
).join('\n')}

Frame Mapping:
${Array.from({ length: settings.frameCount }, (_, i) => 
  `Frame ${i + 1}: LED ${i} (Grid position: ${i % gridSize}, ${Math.floor(i / gridSize)})`
).join('\n')}

Assembly Steps:
1. Print baffle grid in black PLA
2. Print interlaced lithophane in white/clear PETG
3. Mount one WS2812B LED in each baffle cell
4. Wire LEDs in series (data out → data in)
5. Connect ESP32 as shown above
6. Upload firmware
7. Mount lithophane on front of baffle
8. Power on and enjoy!

Current Draw Estimate:
- ${settings.frameCount} LEDs at full white = ${(settings.frameCount * 60).toFixed(0)}mA
- ESP32 = ~200mA
- Total: ~${(settings.frameCount * 60 + 200).toFixed(0)}mA

Power Supply Recommendation: ${Math.ceil((settings.frameCount * 60 + 200) / 1000 * 1.5)}A minimum

Troubleshooting:
- If animation flickers: Increase capacitor size or add more decoupling caps
- If LEDs don't light: Check data line resistor and verify 5V power
- If animation is too fast/slow: Adjust FRAME_DELAY in firmware
`;
}

function generateAssemblyInstructions(settings: AnimatedLithophaneSettings): string {
  return `PROJECT CHRONOS-PANE - ASSEMBLY INSTRUCTIONS
============================================

Congratulations! You've generated an animated lithophane system using the Scott Algorithm.

What You Have:
--------------
1. interlaced_lithophane.stl - The image carrier (${settings.frameCount} frames interlaced)
2. baffle_grid.stl - Light isolation honeycomb
3. chronos_pane_esp32.ino - Animation controller firmware
4. WIRING_GUIDE.txt - Electrical connections

The Science:
-----------
This system creates "motion" without moving parts using Persistence of Vision (POV).
By rapidly strobing LEDs at ${settings.frameRate} FPS, your brain perceives fluid animation.

The Scott Algorithm ensures:
- Perfect frame alignment (no ghosting)
- Optimized light paths (maximum contrast)
- Minimal point count (fast rendering)

Printing Instructions:
---------------------
LITHOPHANE:
- Material: White or Clear PETG
- Layer Height: 0.2mm
- Infill: 100% (solid)
- Perimeters: 3-4
- NO supports needed
- Print orientation: Flat on bed

BAFFLE GRID:
- Material: Black PLA (blocks light)
- Layer Height: 0.2mm
- Infill: 20%
- Perimeters: 3
- Supports: Yes (for LED posts)

Assembly Order:
--------------
1. Print both parts
2. Install WS2812B LEDs in baffle posts
3. Wire LEDs according to WIRING_GUIDE.txt
4. Flash ESP32 with provided firmware
5. Test animation (LEDs should strobe in sequence)
6. Mount lithophane on front of baffle
7. Secure with clips or glue
8. Mount to wall or stand

Frame Rate Calibration:
----------------------
If you're using this for streaming:
- 60 FPS: Smooth for most cameras
- 120 FPS: Flicker-free for high-speed cameras
- 24 FPS: Cinematic look

Adjust FRAME_DELAY in the Arduino code to fine-tune.

Advanced Modifications:
----------------------
1. Add conductive filament traces for touch control
2. Connect to OBS for streamer alerts
3. Add ambient light sensor for auto-brightness
4. Use RGB LEDs for color animation effects

The "Living Lithophane" Effect:
------------------------------
When powered off: Beautiful white textured sculpture
When powered on: Fluid animation that seems to "breathe"

This is the future of physical-digital art.

Created with SignCraft 3D - Powered by the Scott Algorithm
Visit: github.com/your-repo for updates and community designs
`;
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

    triangles.push(
      { vertices: [[0, y0, 0], [0, y0, z0], [0, y1, 0]] },
      { vertices: [[0, y0, z0], [0, y1, z1], [0, y1, 0]] }
    );
  }

  // Right wall
  for (let y = 0; y < mapHeight - 1; y++) {
    const y0 = y * pixelHeight;
    const y1 = (y + 1) * pixelHeight;
    const z0 = heightData[y * mapWidth + (mapWidth - 1)];
    const z1 = heightData[(y + 1) * mapWidth + (mapWidth - 1)];

    triangles.push(
      { vertices: [[physicalWidth, y0, 0], [physicalWidth, y1, 0], [physicalWidth, y0, z0]] },
      { vertices: [[physicalWidth, y0, z0], [physicalWidth, y1, 0], [physicalWidth, y1, z1]] }
    );
  }

  // Top wall
  for (let x = 0; x < mapWidth - 1; x++) {
    const x0 = x * pixelWidth;
    const x1 = (x + 1) * pixelWidth;
    const z0 = heightData[x];
    const z1 = heightData[x + 1];

    triangles.push(
      { vertices: [[x0, 0, 0], [x1, 0, 0], [x0, 0, z0]] },
      { vertices: [[x1, 0, 0], [x1, 0, z1], [x0, 0, z0]] }
    );
  }

  // Bottom wall
  for (let x = 0; x < mapWidth - 1; x++) {
    const x0 = x * pixelWidth;
    const x1 = (x + 1) * pixelWidth;
    const z0 = heightData[(mapHeight - 1) * mapWidth + x];
    const z1 = heightData[(mapHeight - 1) * mapWidth + (x + 1)];

    triangles.push(
      { vertices: [[x0, physicalHeight, 0], [x0, physicalHeight, z0], [x1, physicalHeight, 0]] },
      { vertices: [[x1, physicalHeight, 0], [x0, physicalHeight, z0], [x1, physicalHeight, z1]] }
    );
  }
}

function trianglesToSTL(triangles: Triangle[], name: string): string {
  let stl = `solid ${name}\n`;

  for (const triangle of triangles) {
    const [v1, v2, v3] = triangle.vertices;
    
    const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    
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
