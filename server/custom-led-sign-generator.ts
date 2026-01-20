/**
 * CUSTOM LED SIGN GENERATOR
 * Based on Sign Sculptor OpenSCAD procedural manufacturing logic
 * Creates text/logo shaped signs with LED channels (like "GEYORD", "NI3D")
 * Supports: LED strips, NeoPixels, discrete LEDs, Edison tubes
 */

import { type LEDInstallationType } from "../shared/led-grid-types";
import opentype from "opentype.js";
import earcut from "earcut";
import path from "path";
import fs from "fs";

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  normal: Vector3;
  v1: Vector3;
  v2: Vector3;
  v3: Vector3;
}

const fontCache: Map<string, opentype.Font> = new Map();

const fontFileMap: Record<string, string> = {
  "inter": "Inter-Bold.ttf",
  "roboto": "Roboto-Bold.ttf",
  "poppins": "Poppins-Bold.ttf",
  "montserrat": "Montserrat-Bold.ttf",
  "open-sans": "OpenSans-Bold.ttf",
  "arial": "Roboto-Bold.ttf", // Fallback to Roboto for Arial
};

function loadFontSync(fontId: string = "roboto"): opentype.Font {
  if (fontCache.has(fontId)) {
    return fontCache.get(fontId)!;
  }
  
  const fontFileName = fontFileMap[fontId] || "Roboto-Bold.ttf";
  const fontPath = path.join(process.cwd(), "server/fonts", fontFileName);
  
  const parseBuffer = (buf: Buffer): opentype.Font => {
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return opentype.parse(arrayBuffer);
  };
  
  if (!fs.existsSync(fontPath)) {
    const fallbackPath = path.join(process.cwd(), "server/fonts/Roboto-Bold.ttf");
    const buffer = fs.readFileSync(fallbackPath);
    const font = parseBuffer(buffer);
    fontCache.set(fontId, font);
    return font;
  }
  
  const buffer = fs.readFileSync(fontPath);
  const font = parseBuffer(buffer);
  fontCache.set(fontId, font);
  return font;
}

function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function calculateNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const edge1 = subtract(v2, v1);
  const edge2 = subtract(v3, v1);
  return normalize(cross(edge1, edge2));
}

interface CustomLEDSignConfig {
  text: string;
  fontSize: number;
  fontName: string;
  
  // LED configuration (Multi-Light Engine)
  ledType: LEDInstallationType;
  neonWidth: number;      // Auto-calculated based on LED type
  channelDepth: number;   // Auto-calculated based on LED type
  
  // Sign dimensions
  signHeight: number;     // Total height of sign walls (30mm default)
  wallThickness: number;  // Thickness of printed walls (2mm)
  baseThickness: number;  // Thickness of bottom backing (2mm)
  
  // Lid/diffuser
  lidTolerance: number;   // Gap between lid and body (0.2mm)
  lidThickness: number;   // Thickness of diffuser lid (2mm)
  lipWidth: number;       // Width of shelf lid sits on (1.5mm default)
  lidType: "flat" | "domed";  // Flat lid or curved dome
  domeHeight: number;     // Total height of dome (10mm)
  domeWallThickness: number;  // Shell wall thickness (1.2mm)
  domeBaseHeight: number;     // Straight vertical base (2mm)
  domeLayerResolution: number; // Layer height for smoothness (0.5mm)
  
  // Advanced features
  enableFrictionLip: boolean;  // Narrower top for neon retention
  lipOverhang: number;         // 0.4mm for neon tubes
  wirePassThrough: "none" | "left" | "right" | "both";  // Modular letter connections
  wireHoleHeight: number;      // Height from base (5mm)
  wireHoleSize: number;        // Diameter (5mm)
  enablePowerHole: boolean;    // Punch hole at origin
  powerHoleSize: number;       // Cable diameter (5mm)
  
  // Wire routing
  enableBackplate: boolean;  // Unified backplate connecting letters
  backplateOffset: number;   // Distance to expand backplate (3mm)
}

export class CustomLEDSignGenerator {
  private config: CustomLEDSignConfig;

  constructor(config: Partial<CustomLEDSignConfig> = {}) {
    const ledType = config.ledType || "silicone_neon_6mm";
    
    this.config = {
      text: config.text || "OPEN",
      fontSize: config.fontSize || 50,
      fontName: config.fontName || "Arial",
      ledType: ledType,
      neonWidth: config.neonWidth || this.getLEDWidth(ledType),
      channelDepth: config.channelDepth || this.getChannelDepth(ledType),
      signHeight: config.signHeight || 30,
      wallThickness: config.wallThickness || 2,
      baseThickness: config.baseThickness || 2,
      lidTolerance: config.lidTolerance || 0.2,
      lidThickness: config.lidThickness || 2,
      lipWidth: config.lipWidth || 1.5,
      lidType: config.lidType || "flat",
      domeHeight: config.domeHeight || 10.0,
      domeWallThickness: config.domeWallThickness || 1.2,
      domeBaseHeight: config.domeBaseHeight || 2.0,
      domeLayerResolution: config.domeLayerResolution || 0.5,
      enableFrictionLip: config.enableFrictionLip !== undefined ? config.enableFrictionLip : this.needsFrictionLip(ledType),
      lipOverhang: config.lipOverhang || 0.4,
      wirePassThrough: config.wirePassThrough || "none",
      wireHoleHeight: config.wireHoleHeight || 5,
      wireHoleSize: config.wireHoleSize || 5,
      enablePowerHole: config.enablePowerHole || false,
      powerHoleSize: config.powerHoleSize || 5,
      enableBackplate: config.enableBackplate !== false,
      backplateOffset: config.backplateOffset || 3,
    };
  }

  /**
   * Get recommended LED channel width based on LED type (OpenSCAD CW variable)
   */
  private getLEDWidth(ledType: LEDInstallationType): number {
    switch (ledType) {
      case "silicone_neon_6mm":
        return 6.0;
      case "silicone_neon_8mm":
        return 8.0;
      case "led_strip_10mm":
        return 10.5;
      case "individual_pixels":
        return 14.0;
      case "led_grid":
        return 10.0;
      case "discrete_leds":
        return 5.5;
      default:
        return 6.0;
    }
  }

  /**
   * Get recommended channel depth based on LED type (OpenSCAD CD variable)
   */
  private getChannelDepth(ledType: LEDInstallationType): number {
    switch (ledType) {
      case "silicone_neon_6mm":
        return 6.0;
      case "silicone_neon_8mm":
        return 8.0;
      case "led_strip_10mm":
        return 4.0;
      case "individual_pixels":
        return 12.0; // Deeper for solder lumps
      case "led_grid":
        return 10.0;
      case "discrete_leds":
        return 5.0;
      default:
        return 6.0;
    }
  }

  /**
   * Check if LED type needs friction lip (OpenSCAD Lip_Overhang)
   */
  private needsFrictionLip(ledType: LEDInstallationType): boolean {
    return ledType === "silicone_neon_6mm" || ledType === "silicone_neon_8mm";
  }

  /**
   * Generate OpenSCAD code for the custom LED sign
   * This matches the user's proven OpenSCAD logic
   */
  generateOpenSCAD(): string {
    const c = this.config;
    
    return `// ==========================================
//   SIGN SCULPTOR: PROCEDURAL MANUFACTURING
//   Generated by SignCraft 3D
// ==========================================

/* [Sign Configuration] */
Render_Mode = "Assembly"; // [Body, Lid, Assembly, Preview_Cutaway]
Text_String = "${c.text}";
Font_Size = ${c.fontSize};
Font_Name = "${c.fontName}:style=Bold";

/* [Neon & Engineering] */
Neon_Width = ${c.neonWidth}; 
Sign_Height = ${c.signHeight};
Wall_Thickness = ${c.wallThickness};
Base_Thickness = ${c.baseThickness};

/* [Tolerances & Assembly] */
Lid_Tolerance = ${c.lidTolerance}; 
Lid_Thickness = ${c.lidThickness};
Lip_Width = ${c.lipWidth};

/* [Wire Routing] */
Enable_Backplate = ${c.enableBackplate ? "true" : "false"};
Backplate_Offset = ${c.backplateOffset};

// ==========================================
//   LOGIC ENGINE
// ==========================================

$fn = 60; // Resolution of curves

module text_shape() {
    text(text=Text_String, size=Font_Size, font=Font_Name, halign="center", valign="center");
}

module body_geometry() {
    union() {
        difference() {
            // 1. THE OUTER SHELL
            linear_extrude(Sign_Height)
                offset(r = Neon_Width/2 + Wall_Thickness)
                text_shape();

            // 2. THE MAIN CAVITY (Where LED goes)
            translate([0,0, Base_Thickness])
                linear_extrude(Sign_Height)
                offset(r = Neon_Width/2)
                text_shape();
            
            // 3. THE LIP CUTOUT (Where Lid sits)
            translate([0,0, Sign_Height - Lid_Thickness])
                linear_extrude(Lid_Thickness + 1)
                offset(r = Neon_Width/2 + Lip_Width)
                text_shape();
        }
        
        // 4. THE LIP SUPPORT SHELF
        difference() {
            translate([0,0, Base_Thickness])
                linear_extrude(Sign_Height - Lid_Thickness - Base_Thickness)
                offset(r = Neon_Width/2 + Wall_Thickness)
                text_shape();
            
            translate([0,0, Base_Thickness])
                linear_extrude(Sign_Height)
                offset(r = Neon_Width/2)
                text_shape();
        }

        // 5. WIRE ROUTING (Backplate)
        if (Enable_Backplate) {
            linear_extrude(Base_Thickness)
                hull()
                offset(r = Backplate_Offset)
                text_shape();
        }
    }
}

module lid_geometry() {
    // 6. THE LID INSERT
    color("White")
        linear_extrude(Lid_Thickness)
        offset(r = (Neon_Width/2 + Lip_Width) - Lid_Tolerance)
        text_shape();
}

// ==========================================
//   RENDER CONTROLLER
// ==========================================

if (Render_Mode == "Body") {
    body_geometry();
} 
else if (Render_Mode == "Lid") {
    lid_geometry();
} 
else if (Render_Mode == "Assembly") {
    body_geometry();
    translate([0,0, Sign_Height + 5])
        lid_geometry();
}
else if (Render_Mode == "Preview_Cutaway") {
    difference() {
        union() {
            body_geometry();
            translate([0,0, Sign_Height - Lid_Thickness])
                lid_geometry();
        }
        translate([0, -500, -1]) cube([1000, 1000, 1000]);
    }
}
`;
  }

  /**
   * Generate assembly instructions based on LED type
   */
  generateAssemblyInstructions(): string {
    const c = this.config;
    let ledInstructions = "";

    switch (c.ledType) {
      case "silicone_neon_6mm":
      case "silicone_neon_8mm":
        ledInstructions = `Silicone Neon Tube Installation (${c.neonWidth}mm):
1. Measure the total length of LED channel in the sign
2. Cut silicone neon tube to length
3. Route tube through the channel - friction lip holds it in place
4. The top opening is ${c.lipOverhang}mm narrower for retention
5. Connect power (12V DC typically) and controller
6. Test before sealing with diffuser lid`;
        break;

      case "led_strip_10mm":
        ledInstructions = `LED Strip Installation (10mm waterproof):
1. Measure the total length of LED channel in the sign
2. Cut WS2812B strip to length (${c.neonWidth}mm wide strip)
3. Route strip through the channel, starting from one end
4. Use hot glue or double-sided tape to secure at corners
5. Connect power (5V, GND) and data line (GPIO)
6. Add 470Ω resistor on data line, 1000µF capacitor on power`;
        break;

      case "individual_pixels":
        ledInstructions = `Individual NeoPixel Installation:
1. Calculate LED positions along the channel path
2. Place individual NeoPixels every 10-15mm
3. Solder data connections in series (DOUT → DIN)
4. Connect power bus (5V, GND) to all pixels
5. Use wire routing channels in backplate
6. Seal with hot glue for stability`;
        break;

      case "discrete_leds":
        ledInstructions = `Discrete LED Installation (3mm/5mm):
1. Calculate number of LEDs needed (one every 10-15mm)
2. Wire LEDs in series with appropriate resistors
3. Calculate resistor: R = (Vsupply - (Vled × N)) / I
4. Place LEDs in channel, secure with hot glue
5. Route wires through backplate channels
6. Connect to power supply (typically 12V for series strings)`;
        break;

      case "led_grid":
        ledInstructions = `LED Grid/Matrix Installation:
1. This mode is for rectangular grids only
2. Use "Grid Matrix" mode instead for pre-wired panels
3. Custom shapes work best with strips or individual LEDs`;
        break;
    }

    return `# Assembly Instructions: ${c.text}

## Parts List
- Body (main sign with LED channels)
- Lid/Diffuser (frosted cover)
- LED components (see below)
- Power supply
- Mounting hardware

## Sign Specifications
- Text: "${c.text}"
- Font Size: ${c.fontSize}mm
- Sign Height: ${c.signHeight}mm
- LED Channel Width: ${c.neonWidth}mm
- Wall Thickness: ${c.wallThickness}mm
- Base Thickness: ${c.baseThickness}mm
- Backplate: ${c.enableBackplate ? "Yes (unified wire routing)" : "No (separate letters)"}

## ${ledInstructions}

## Assembly Steps

### Step 1: Print Components
1. Print Body with supports (if needed)
2. Print Lid/Diffuser in white or translucent filament
3. Recommended: 0.2mm layer height, 20% infill for body
4. Recommended: 0.2mm layer height, 100% infill for lid (for diffusion)

### Step 2: Post-Processing
1. Remove supports from body
2. Sand lid with 400-800 grit for frosted effect
3. Test-fit lid on body (should snap in with slight pressure)
4. Clean LED channels of any stringing or artifacts

### Step 3: Install LEDs
${ledInstructions}

### Step 4: Test Electronics
1. Connect power supply (check voltage/current requirements)
2. Test all LEDs before final assembly
3. Verify no shorts or open circuits
4. Test dimming/control if using addressable LEDs

### Step 5: Final Assembly
1. Route all wires through backplate channels
2. Secure wires with hot glue or cable ties
3. Snap lid/diffuser into place
4. Test illumination and check for hot spots
5. Mount sign to wall or stand

## Power Requirements

LED Type: ${c.ledType}
Channel Width: ${c.neonWidth}mm

Estimated Power (depends on LED count and brightness):
- LED Strip: ~60mA per LED @ 5V
- NeoPixels: ~60mA per pixel @ 5V
- Discrete LEDs: ~20mA per LED @ Vf (typically 2-3V)

## Troubleshooting

**Lid doesn't fit:**
- Increase Lid_Tolerance in OpenSCAD (try 0.3mm)
- Sand the lip shelf slightly

**LEDs don't fit in channel:**
- Increase Neon_Width in OpenSCAD
- Check LED strip width specification

**Light leaks between letters:**
- Enable backplate (Enable_Backplate = true)
- Increase Backplate_Offset for better coverage

**Uneven illumination:**
- Use more LEDs (closer spacing)
- Sand lid more for better diffusion
- Increase diffuser thickness (Lid_Thickness)

## Customization Tips

**For different LED types:**
- LED Strip (6mm): Neon_Width = 6.0
- NeoPixels (5mm): Neon_Width = 5.5
- Discrete LEDs (3-5mm): Neon_Width = 5.5
- Edison Tubes (10mm): Neon_Width = 10.0

**For taller signs:**
- Increase Sign_Height (30-50mm typical)
- May need internal supports for large letters

**For thicker walls:**
- Increase Wall_Thickness (2-4mm)
- Provides more strength but uses more filament

**For better wire routing:**
- Enable_Backplate = true (recommended)
- Increase Backplate_Offset for more space
- Add wire channels in CAD if needed
`;
  }

  /**
   * Generate bill of materials
   */
  generateBOM(): {
    component: string;
    quantity: string;
    notes: string;
  }[] {
    const c = this.config;
    const bom: Array<{ component: string; quantity: string; notes: string }> = [
      {
        component: "3D Printed Body",
        quantity: "1",
        notes: `PLA/PETG, ${c.signHeight}mm height, ${c.wallThickness}mm walls`
      },
      {
        component: "3D Printed Lid/Diffuser",
        quantity: "1",
        notes: `White PLA, ${c.lidThickness}mm thick, 100% infill, sanded`
      }
    ];

    switch (c.ledType) {
      case "silicone_neon_6mm":
      case "silicone_neon_8mm":
        bom.push(
          { component: `Silicone Neon Tube (${c.neonWidth}mm)`, quantity: "1-2m", notes: "Flexible LED neon rope" },
          { component: "12V DC Power Supply", quantity: "1", notes: "12V 2A minimum" },
          { component: "Neon Controller", quantity: "1", notes: "Optional for dimming/effects" }
        );
        break;

      case "led_strip_10mm":
        bom.push(
          { component: "WS2812B LED Strip", quantity: "1m", notes: `${c.neonWidth}mm wide, 60 LEDs/m` },
          { component: "5V Power Supply", quantity: "1", notes: "5V 5A minimum" },
          { component: "ESP32 or Arduino", quantity: "1", notes: "For addressable control" },
          { component: "470Ω Resistor", quantity: "1", notes: "Data line protection" },
          { component: "1000µF Capacitor", quantity: "1", notes: "Power smoothing" }
        );
        break;

      case "individual_pixels":
        bom.push(
          { component: "Individual NeoPixels", quantity: "20-50", notes: "Depends on sign size" },
          { component: "5V Power Supply", quantity: "1", notes: "5V 3A minimum" },
          { component: "ESP32 or Arduino", quantity: "1", notes: "For addressable control" },
          { component: "Wire (22 AWG)", quantity: "2m", notes: "For data and power bus" }
        );
        break;

      case "discrete_leds":
        bom.push(
          { component: "3mm or 5mm LEDs", quantity: "20-50", notes: "White or RGB" },
          { component: "Resistors", quantity: "20-50", notes: "Calculate based on voltage" },
          { component: "Power Supply", quantity: "1", notes: "12V 1A typical" },
          { component: "Wire (22 AWG)", quantity: "2m", notes: "For series wiring" }
        );
        break;

      case "led_grid":
        bom.push(
          { component: "LED Matrix Panel", quantity: "1", notes: "Use Grid Matrix mode instead" }
        );
        break;
    }

    bom.push(
      { component: "Hot Glue Gun", quantity: "1", notes: "For securing LEDs and wires" },
      { component: "Double-Sided Tape", quantity: "1 roll", notes: "Alternative to hot glue" },
      { component: "Mounting Hardware", quantity: "2-4", notes: "Screws or command strips" }
    );

    return bom;
  }

  /**
   * Get physical dimensions estimate
   */
  getEstimatedDimensions(): {
    width: number;
    height: number;
    depth: number;
    volume: number;
  } {
    const c = this.config;
    
    // Rough estimate based on text length and font size
    const charWidth = c.fontSize * 0.6; // Average character width
    const estimatedWidth = c.text.length * charWidth;
    const estimatedHeight = c.fontSize * 1.2; // Height with descenders
    
    return {
      width: estimatedWidth + (c.neonWidth + c.wallThickness) * 2,
      height: estimatedHeight + (c.neonWidth + c.wallThickness) * 2,
      depth: c.signHeight,
      volume: (estimatedWidth * estimatedHeight * c.signHeight) / 1000 // cm³
    };
  }

  /**
   * Generate text path from font
   */
  private getTextPath(): opentype.Path {
    const font = loadFontSync(this.config.fontName.toLowerCase());
    const fontSize = this.config.fontSize;
    const textPath = font.getPath(this.config.text, 0, 0, fontSize);
    return textPath;
  }

  /**
   * Convert opentype path to contours (array of 2D points)
   */
  private pathToContours(fontPath: opentype.Path): number[][][] {
    const contours: number[][][] = [];
    let currentContour: number[][] = [];
    
    fontPath.commands.forEach((cmd: any) => {
      if (cmd.type === 'M') {
        if (currentContour.length > 0) {
          contours.push(currentContour);
        }
        currentContour = [[cmd.x, cmd.y]];
      } else if (cmd.type === 'L') {
        currentContour.push([cmd.x, cmd.y]);
      } else if (cmd.type === 'Q') {
        // Quadratic bezier - approximate with line segments
        const lastPoint = currentContour[currentContour.length - 1];
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const x = (1 - t) * (1 - t) * lastPoint[0] + 2 * (1 - t) * t * cmd.x1 + t * t * cmd.x;
          const y = (1 - t) * (1 - t) * lastPoint[1] + 2 * (1 - t) * t * cmd.y1 + t * t * cmd.y;
          currentContour.push([x, y]);
        }
      } else if (cmd.type === 'C') {
        // Cubic bezier - approximate with line segments
        const lastPoint = currentContour[currentContour.length - 1];
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const x = Math.pow(1 - t, 3) * lastPoint[0] + 
                   3 * Math.pow(1 - t, 2) * t * cmd.x1 +
                   3 * (1 - t) * t * t * cmd.x2 +
                   t * t * t * cmd.x;
          const y = Math.pow(1 - t, 3) * lastPoint[1] + 
                   3 * Math.pow(1 - t, 2) * t * cmd.y1 +
                   3 * (1 - t) * t * t * cmd.y2 +
                   t * t * t * cmd.y;
          currentContour.push([x, y]);
        }
      } else if (cmd.type === 'Z') {
        if (currentContour.length > 0) {
          currentContour.push(currentContour[0]); // Close the contour
        }
      }
    });
    
    if (currentContour.length > 0) {
      contours.push(currentContour);
    }
    
    return contours;
  }

  /**
   * Offset a 2D contour by a given radius (for creating LED channels and walls)
   */
  private offsetContour(contour: number[][], offset: number): number[][] {
    // Simple offset algorithm - for production use clipper.js
    const offsetContour: number[][] = [];
    
    for (let i = 0; i < contour.length; i++) {
      const prev = contour[(i - 1 + contour.length) % contour.length];
      const curr = contour[i];
      const next = contour[(i + 1) % contour.length];
      
      // Calculate normals
      const dx1 = curr[0] - prev[0];
      const dy1 = curr[1] - prev[1];
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const nx1 = -dy1 / len1;
      const ny1 = dx1 / len1;
      
      const dx2 = next[0] - curr[0];
      const dy2 = next[1] - curr[1];
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const nx2 = -dy2 / len2;
      const ny2 = dx2 / len2;
      
      // Average normal
      const nx = (nx1 + nx2) / 2;
      const ny = (ny1 + ny2) / 2;
      const nlen = Math.sqrt(nx * nx + ny * ny);
      
      offsetContour.push([
        curr[0] + (nx / nlen) * offset,
        curr[1] + (ny / nlen) * offset
      ]);
    }
    
    return offsetContour;
  }

  /**
   * Extrude 2D contours to 3D triangles
   */
  private extrudeContours(contours: number[][][], height: number, zOffset: number = 0): Triangle[] {
    const triangles: Triangle[] = [];
    
    for (const contour of contours) {
      // Create side walls
      for (let i = 0; i < contour.length - 1; i++) {
        const p1 = contour[i];
        const p2 = contour[i + 1];
        
        const v1: Vector3 = { x: p1[0], y: p1[1], z: zOffset };
        const v2: Vector3 = { x: p2[0], y: p2[1], z: zOffset };
        const v3: Vector3 = { x: p2[0], y: p2[1], z: zOffset + height };
        const v4: Vector3 = { x: p1[0], y: p1[1], z: zOffset + height };
        
        // Two triangles per quad
        const normal1 = calculateNormal(v1, v2, v3);
        triangles.push({ normal: normal1, v1, v2, v3 });
        
        const normal2 = calculateNormal(v1, v3, v4);
        triangles.push({ normal: normal2, v1, v2: v3, v3: v4 });
      }
      
      // Top and bottom caps using earcut triangulation
      const flatCoords: number[] = [];
      for (const point of contour) {
        flatCoords.push(point[0], point[1]);
      }
      
      const indices = earcut(flatCoords);
      
      // Bottom cap
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];
        
        const v1: Vector3 = { x: contour[i1][0], y: contour[i1][1], z: zOffset };
        const v2: Vector3 = { x: contour[i2][0], y: contour[i2][1], z: zOffset };
        const v3: Vector3 = { x: contour[i3][0], y: contour[i3][1], z: zOffset };
        
        const normal = calculateNormal(v1, v2, v3);
        triangles.push({ normal, v1, v2, v3 });
      }
      
      // Top cap
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];
        
        const v1: Vector3 = { x: contour[i1][0], y: contour[i1][1], z: zOffset + height };
        const v2: Vector3 = { x: contour[i3][0], y: contour[i3][1], z: zOffset + height };
        const v3: Vector3 = { x: contour[i2][0], y: contour[i2][1], z: zOffset + height };
        
        const normal = calculateNormal(v1, v2, v3);
        triangles.push({ normal, v1, v2, v3 });
      }
    }
    
    return triangles;
  }

  /**
   * Convert triangles to STL format
   */
  private trianglesToSTL(triangles: Triangle[], name: string): string {
    let stl = `solid ${name}\n`;
    
    for (const tri of triangles) {
      stl += `  facet normal ${tri.normal.x.toFixed(6)} ${tri.normal.y.toFixed(6)} ${tri.normal.z.toFixed(6)}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${tri.v1.x.toFixed(6)} ${tri.v1.y.toFixed(6)} ${tri.v1.z.toFixed(6)}\n`;
      stl += `      vertex ${tri.v2.x.toFixed(6)} ${tri.v2.y.toFixed(6)} ${tri.v2.z.toFixed(6)}\n`;
      stl += `      vertex ${tri.v3.x.toFixed(6)} ${tri.v3.y.toFixed(6)} ${tri.v3.z.toFixed(6)}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }
    
    stl += `endsolid ${name}\n`;
    return stl;
  }

  /**
   * Generate body STL (sign with LED channels carved out)
   */
  generateBodySTL(): string {
    const c = this.config;
    const textPath = this.getTextPath();
    const baseContours = this.pathToContours(textPath);
    
    const triangles: Triangle[] = [];
    
    // 1. Outer shell (text + wall thickness)
    const outerOffset = (c.neonWidth / 2) + c.wallThickness;
    const outerContours: number[][][] = [];
    for (const contour of baseContours) {
      const outerContour = this.offsetContour(contour, outerOffset);
      outerContours.push(outerContour);
    }
    triangles.push(...this.extrudeContours(outerContours, c.signHeight, 0));
    
    // 2. Subtract LED channel (text + neon width)
    // This would require CSG operations - for now we'll create a simplified version
    // In production, use a proper CSG library or OpenSCAD
    
    // 3. Base plate (unified backplate for wire routing)
    if (c.enableBackplate) {
      // Create hull of all letters for backplate
      const allPoints: number[][] = [];
      for (const contour of baseContours) {
        const offsetContour = this.offsetContour(contour, c.backplateOffset);
        allPoints.push(...offsetContour);
      }
      
      // Simple convex hull approximation
      triangles.push(...this.extrudeContours([allPoints], c.baseThickness, 0));
    }
    
    return this.trianglesToSTL(triangles, "CustomLEDSign_Body");
  }

  /**
   * Generate lid/diffuser STL
   * Routes to flat or domed based on config
   */
  generateLidSTL(): string {
    if (this.config.lidType === "domed") {
      return this.generateDomedDiffuserSTL();
    }
    return this.generateFlatLidSTL();
  }

  /**
   * Generate flat lid STL (traditional design)
   */
  private generateFlatLidSTL(): string {
    const c = this.config;
    const textPath = this.getTextPath();
    const baseContours = this.pathToContours(textPath);
    
    const triangles: Triangle[] = [];
    
    // Lid is the text shape offset by (neonWidth/2 + lipWidth - tolerance)
    const lidOffset = (c.neonWidth / 2) + c.lipWidth - c.lidTolerance;
    
    const lidContours: number[][][] = [];
    for (const contour of baseContours) {
      const lidContour = this.offsetContour(contour, lidOffset);
      lidContours.push(lidContour);
    }
    triangles.push(...this.extrudeContours(lidContours, c.lidThickness, 0));
    
    return this.trianglesToSTL(triangles, "CustomLEDSign_Lid");
  }

  /**
   * Generate domed diffuser STL (curved hollow shell)
   * Based on MakeMesh Python implementation
   */
  generateDomedDiffuserSTL(): string {
    const c = this.config;
    const textPath = this.getTextPath();
    const baseContours = this.pathToContours(textPath);
    
    const triangles: Triangle[] = [];
    
    // Dome configuration from config
    const totalHeight = c.domeHeight;
    const wallThickness = c.domeWallThickness;
    const baseHeight = c.domeBaseHeight;
    const layerResolution = c.domeLayerResolution;
    const domeHeight = totalHeight - baseHeight;
    
    // Outer shape (visible surface)
    const outerOffset = (c.neonWidth / 2) + c.lipWidth - c.lidTolerance;
    
    for (const contour of baseContours) {
      const outerContour = this.offsetContour(contour, outerOffset);
      const innerContour = this.offsetContour(contour, outerOffset - wallThickness);
      
      // Generate layered dome
      const domeLayers = this.generateDomeLayers(
        outerContour,
        innerContour,
        totalHeight,
        baseHeight,
        domeHeight,
        layerResolution,
        wallThickness
      );
      
      triangles.push(...domeLayers);
    }
    
    return this.trianglesToSTL(triangles, "CustomLEDSign_DomedDiffuser");
  }

  /**
   * Generate layered dome structure
   * Creates hollow shell with curved top using stacked layers
   */
  private generateDomeLayers(
    outerContour: number[][],
    innerContour: number[][],
    totalHeight: number,
    baseHeight: number,
    domeHeight: number,
    layerResolution: number,
    wallThickness: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    const steps = Math.floor(domeHeight / layerResolution);
    let currentZ = 0;
    
    // Step A: Vertical base (straight walls)
    const baseRim = this.createRimContour(outerContour, innerContour);
    triangles.push(...this.extrudeContours([baseRim], baseHeight, 0));
    currentZ += baseHeight;
    
    // Step B: Domed layers (curved top)
    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      
      // Parabolic curve for dome shape
      const shrinkAmount = Math.pow(progress, 2) * (totalHeight * 0.4);
      
      // Shrink both outer and inner contours
      const layerOuter = this.offsetContour(outerContour, -shrinkAmount);
      const layerInner = this.offsetContour(innerContour, -shrinkAmount);
      
      // Create rim for this layer
      const layerRim = this.createRimContour(layerOuter, layerInner);
      
      // Extrude thin slice
      triangles.push(...this.extrudeContours([layerRim], layerResolution, currentZ));
      currentZ += layerResolution;
    }
    
    return triangles;
  }

  /**
   * Create rim contour (outer - inner) for hollow shell
   */
  private createRimContour(outer: number[][], inner: number[][]): number[][] {
    // Combine outer and inner contours to create a ring
    // Outer goes clockwise, inner goes counter-clockwise (reversed)
    const rim: number[][] = [...outer];
    
    // Add inner contour in reverse to create hole
    for (let i = inner.length - 1; i >= 0; i--) {
      rim.push(inner[i]);
    }
    
    return rim;
  }
}
