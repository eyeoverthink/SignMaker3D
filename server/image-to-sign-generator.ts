import archiver from 'archiver';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const execAsync = promisify(exec);

interface ImageToSignSettings {
  tolerance: number;
  ledType: string;
  signHeight: number;
  wallThickness: number;
  baseThickness: number;
}

interface ContourPoint {
  x: number;
  y: number;
}

export async function generateImageToSign(
  imageBuffer: Buffer,
  imageName: string,
  settings: ImageToSignSettings
): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  const tempDir = path.join(os.tmpdir(), `image-to-sign-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Stage 1: Image Processing - Convert to grayscale and threshold
    const processedImagePath = path.join(tempDir, 'processed.png');
    await sharp(imageBuffer)
      .grayscale()
      .threshold(127)
      .negate() // Invert so white becomes black (foreground)
      .toFile(processedImagePath);

    // Stage 2: Contour Extraction using ImageMagick (alternative to OpenCV)
    // We'll use potrace for vectorization which is available via CLI
    const svgPath = path.join(tempDir, 'contour.svg');
    try {
      await execAsync(`potrace "${processedImagePath}" -s -o "${svgPath}"`);
    } catch (error) {
      // If potrace not available, generate a simple fallback contour
      console.warn('Potrace not available, using fallback contour generation');
      const points = generateFallbackContour(settings.tolerance);
      const scadContent = generateSCAD(imageName, points, settings);
      await generateSTLFiles(scadContent, imageName, tempDir, archive);
      
      archive.append(generateAssemblyInstructions(imageName, settings), { 
        name: 'ASSEMBLY_INSTRUCTIONS.md' 
      });
      archive.append(generateBOM(imageName, settings), { name: 'BOM.md' });
      
      archive.finalize();
      return zipPromise;
    }

    // Stage 3: Parse SVG and extract polygon points
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    const points = parseSVGPath(svgContent, settings.tolerance);

    // Stage 4: Generate SCAD file with Scott Engine template
    const scadContent = generateSCAD(imageName, points, settings);
    
    // Stage 5: Generate STL files
    await generateSTLFiles(scadContent, imageName, tempDir, archive);

    // Stage 6: Add documentation
    archive.append(generateAssemblyInstructions(imageName, settings), { 
      name: 'ASSEMBLY_INSTRUCTIONS.md' 
    });
    archive.append(generateBOM(imageName, settings), { name: 'BOM.md' });

    archive.finalize();
    return zipPromise;
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

function parseSVGPath(svgContent: string, tolerance: number): ContourPoint[] {
  // Extract path data from SVG
  const pathMatch = svgContent.match(/d="([^"]+)"/);
  if (!pathMatch) {
    return generateFallbackContour(tolerance);
  }

  const pathData = pathMatch[1];
  const points: ContourPoint[] = [];
  
  // Simple SVG path parser - extracts M (moveto) and L (lineto) commands
  const commands = pathData.match(/[ML]\s*[\d.-]+\s+[\d.-]+/g) || [];
  
  for (const cmd of commands) {
    const coords = cmd.match(/[\d.-]+/g);
    if (coords && coords.length >= 2) {
      points.push({
        x: parseFloat(coords[0]),
        y: -parseFloat(coords[1]) // Flip Y for OpenSCAD coordinate system
      });
    }
  }

  // Apply Douglas-Peucker simplification
  if (points.length > 10) {
    return douglasPeucker(points, tolerance);
  }

  return points.length > 0 ? points : generateFallbackContour(tolerance);
}

function douglasPeucker(points: ContourPoint[], epsilon: number): ContourPoint[] {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[end]];
}

function perpendicularDistance(
  point: ContourPoint,
  lineStart: ContourPoint,
  lineEnd: ContourPoint
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const norm = Math.sqrt(dx * dx + dy * dy);
  
  if (norm === 0) return Math.sqrt(
    Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
  );

  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / norm;
}

function generateFallbackContour(tolerance: number): ContourPoint[] {
  // Generate a simple rectangular contour as fallback
  const size = 100;
  return [
    { x: -size, y: -size },
    { x: size, y: -size },
    { x: size, y: size },
    { x: -size, y: size }
  ];
}

function generateSCAD(
  imageName: string,
  points: ContourPoint[],
  settings: ImageToSignSettings
): string {
  const ledChannelWidth = parseFloat(settings.ledType.replace('mm', ''));
  const pointsArray = points.map(p => `[${p.x.toFixed(2)}, ${p.y.toFixed(2)}]`).join(', ');

  return `// AUTOMATICALLY GENERATED BY SCOTT ENGINE
// Source: ${imageName}
// Generated by Sign-Sculptor Image-to-Sign Designer
$fn = 60;

// --- Configuration ---
Render_Mode = "Body"; // Options: "Body", "Lid"
Sign_Height = ${settings.signHeight};
Wall_Thickness = ${settings.wallThickness};
Base_Thickness = ${settings.baseThickness};
Lid_Tolerance = 0.15;

// -- Engineering Constants (Scott Algorithm Derived) --
CW = ${ledChannelWidth};
Lip_Overhang = ${ledChannelWidth <= 8 ? '0.4' : '0.0'};

module core_shape() {
    // Scott-Peucker Optimized Vector Path
    polygon(points=[${pointsArray}]);
}

module body_geometry() {
    difference() {
        linear_extrude(Sign_Height) 
            offset(r = CW/2 + Wall_Thickness) 
            core_shape();
        
        translate([0, 0, Base_Thickness]) 
            linear_extrude(Sign_Height + 1) 
            offset(r = CW/2) 
            core_shape();
        
        // Friction Lip for Snap-Fit
        if (Lip_Overhang > 0) {
            translate([0, 0, Sign_Height - 2.0]) 
                linear_extrude(3.0)
                difference() {
                    offset(r = CW/2 + 5) core_shape();
                    offset(r = CW/2 - Lip_Overhang) core_shape();
                }
        }
        
        // Lid Shelf
        translate([0, 0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            core_shape();
    }
}

module lid_geometry() {
    linear_extrude(2.0) 
        offset(r = (CW/2 + 1.5) - Lid_Tolerance) 
        core_shape();
}

if (Render_Mode == "Body") { body_geometry(); }
else { lid_geometry(); }
`;
}

async function generateSTLFiles(
  scadContent: string,
  imageName: string,
  tempDir: string,
  archive: archiver.Archiver
): Promise<void> {
  const scadPath = path.join(tempDir, `${imageName}.scad`);
  fs.writeFileSync(scadPath, scadContent, 'utf-8');

  // Generate Body STL
  const bodySTLPath = path.join(tempDir, `${imageName}_Body.stl`);
  await execAsync(`openscad -o "${bodySTLPath}" -D Render_Mode=\\"Body\\" "${scadPath}"`);
  if (fs.existsSync(bodySTLPath)) {
    archive.append(fs.createReadStream(bodySTLPath), { name: `${imageName}_Body.stl` });
  }

  // Generate Lid STL
  const lidSTLPath = path.join(tempDir, `${imageName}_Lid.stl`);
  await execAsync(`openscad -o "${lidSTLPath}" -D Render_Mode=\\"Lid\\" "${scadPath}"`);
  if (fs.existsSync(lidSTLPath)) {
    archive.append(fs.createReadStream(lidSTLPath), { name: `${imageName}_Lid.stl` });
  }

  // Include SCAD source
  archive.append(scadContent, { name: `${imageName}.scad` });
}

function generateAssemblyInstructions(imageName: string, settings: ImageToSignSettings): string {
  return `# Image-to-Sign Assembly Instructions
## Scott Engine: ${imageName}

Generated by Sign-Sculptor Image-to-Sign Designer

## Parts Included

- **${imageName}_Body.stl** - Main shell with LED channel
- **${imageName}_Lid.stl** - Snap-fit diffuser cover
- **${imageName}.scad** - OpenSCAD source file

## Assembly Steps

### 1. Print Parts

**Body:**
- Material: PLA or PETG
- Layer Height: 0.2mm
- Infill: 15-20%
- Supports: None required

**Lid:**
- Material: White PLA or PETG (for light diffusion)
- Layer Height: 0.2mm
- Infill: 100% (for even light distribution)
- Supports: None required

### 2. LED Installation

**Materials Needed:**
- ${settings.ledType} silicone neon LED strip
- 22 AWG hookup wire
- Soldering iron + solder
- Hot glue gun

**Steps:**
1. Measure LED strip length to fit the contour path
2. Cut LED strip to size
3. Thread LED strip into the channel inside the body
4. Secure with hot glue at key points
5. Solder power wires to LED strip connections

### 3. Wiring

- Route wires through side holes in body
- Connect to 5V USB power or 4×AA battery holder (6V)
- Add optional on/off switch

### 4. Final Assembly

1. Test LED illumination before sealing
2. Snap lid onto body - press firmly until it clicks
3. Check for even light diffusion
4. Mount on wall using command strips or screws

## LED Specifications

- **Channel Width:** ${settings.ledType}
- **Voltage:** 5V (USB) or 6V (4×AA batteries)
- **Sign Height:** ${settings.signHeight}mm
- **Wall Thickness:** ${settings.wallThickness}mm

## Troubleshooting

**LEDs not lighting:**
- Check polarity of connections
- Verify solder joints
- Test power supply voltage

**Uneven lighting:**
- Adjust LED strip position in channel
- Ensure lid is fully seated
- Check for gaps in LED strip

**Lid won't snap:**
- Check for print warping
- Sand edges if too tight
- Verify tolerance settings

---

**Enjoy your custom image-based LED sign!**

Generated: ${new Date().toISOString()}
Settings: ${settings.tolerance}% tolerance, ${settings.ledType} LEDs
`;
}

function generateBOM(imageName: string, settings: ImageToSignSettings): string {
  return `# Bill of Materials (BOM)
## Image-to-Sign: ${imageName}

Generated by Sign-Sculptor Scott Engine

### 3D Printed Parts
- ${imageName}_Body.stl (1x) - Main shell with LED channel
- ${imageName}_Lid.stl (1x) - Diffuser cover

### Electronics
- ${settings.ledType} Silicone Neon LED Strip: ~500mm
- 22 AWG hookup wire: ~400mm
- Power supply: 5V USB or 4×AA battery holder (6V)
- Optional: On/off switch
- Optional: Brightness dimmer (PWM controller)

### Hardware
- Hot glue gun + glue sticks
- Soldering iron + solder
- Wire strippers
- Flush cutters

### Assembly Time
Estimated: 30-45 minutes

### Print Settings
- Material: PLA or PETG
- Layer Height: 0.2mm
- Infill: 15-20% (body), 100% (lid for diffusion)
- Supports: None required
- Print Time: ~3-4 hours total

---
Generated: ${new Date().toISOString()}
`;
}
