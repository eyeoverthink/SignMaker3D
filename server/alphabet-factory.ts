/**
 * ALPHABET FACTORY
 * Batch-generates modular letter files (A-Z) with wire pass-through holes
 * Based on Python script for OpenSCAD alphabet generation
 */

import { CustomLEDSignGenerator } from "./custom-led-sign-generator";
import type { LEDInstallationType } from "../shared/led-grid-types";

interface AlphabetFactoryConfig {
  fontSize: number;
  fontName: string;
  ledType: LEDInstallationType;
  signHeight: number;
  wallThickness: number;
  baseThickness: number;
  lidTolerance: number;
  wireHoleHeight: number;
  wireHoleSize: number;
  enableFrictionLip: boolean;
  lipOverhang: number;
  lidType: "flat" | "domed";
  domeHeight: number;
  domeWallThickness: number;
  domeBaseHeight: number;
  domeLayerResolution: number;
}

export interface GeneratedLetter {
  letter: string;
  bodySTL: string;
  lidSTL: string;
  scadFile: string;
  filename: string;
}

export class AlphabetFactory {
  private config: AlphabetFactoryConfig;

  constructor(config: Partial<AlphabetFactoryConfig> = {}) {
    this.config = {
      fontSize: config.fontSize || 100,
      fontName: config.fontName || "Arial",
      ledType: config.ledType || "silicone_neon_6mm",
      signHeight: config.signHeight || 30,
      wallThickness: config.wallThickness || 2,
      baseThickness: config.baseThickness || 2,
      lidTolerance: config.lidTolerance || 0.15,
      wireHoleHeight: config.wireHoleHeight || 5,
      wireHoleSize: config.wireHoleSize || 5,
      enableFrictionLip: config.enableFrictionLip !== undefined ? config.enableFrictionLip : true,
      lipOverhang: config.lipOverhang || 0.4,
      lidType: config.lidType || "flat",
      domeHeight: config.domeHeight || 10.0,
      domeWallThickness: config.domeWallThickness || 1.2,
      domeBaseHeight: config.domeBaseHeight || 2.0,
      domeLayerResolution: config.domeLayerResolution || 0.5,
    };
  }

  /**
   * Generate all 26 letters (A-Z) with consistent dimensions
   */
  generateAlphabet(): GeneratedLetter[] {
    const letters: GeneratedLetter[] = [];
    
    // ASCII A-Z is 65-90
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      const generatedLetter = this.generateLetter(letter);
      letters.push(generatedLetter);
    }
    
    return letters;
  }

  /**
   * Generate a single letter with wire pass-through holes
   */
  generateLetter(letter: string): GeneratedLetter {
    const generator = new CustomLEDSignGenerator({
      text: letter,
      fontSize: this.config.fontSize,
      fontName: this.config.fontName,
      ledType: this.config.ledType,
      signHeight: this.config.signHeight,
      wallThickness: this.config.wallThickness,
      baseThickness: this.config.baseThickness,
      lidTolerance: this.config.lidTolerance,
      lidThickness: 2,
      lipWidth: 1.5,
      enableFrictionLip: this.config.enableFrictionLip,
      lipOverhang: this.config.lipOverhang,
      wirePassThrough: "both", // All letters have both left and right holes
      wireHoleHeight: this.config.wireHoleHeight,
      wireHoleSize: this.config.wireHoleSize,
      enablePowerHole: false, // No power hole for individual letters
      enableBackplate: false, // Individual letters don't need backplate
      backplateOffset: 0,
      lidType: this.config.lidType,
      domeHeight: this.config.domeHeight,
      domeWallThickness: this.config.domeWallThickness,
      domeBaseHeight: this.config.domeBaseHeight,
      domeLayerResolution: this.config.domeLayerResolution,
    });

    return {
      letter: letter,
      bodySTL: generator.generateBodySTL(),
      lidSTL: generator.generateLidSTL(),
      scadFile: generator.generateOpenSCAD(),
      filename: `Letter_${letter}`,
    };
  }

  /**
   * Generate specific letters (e.g., "HELLO" generates H, E, L, O)
   */
  generateWord(word: string): GeneratedLetter[] {
    const letters: GeneratedLetter[] = [];
    const uniqueLetters = Array.from(new Set(word.toUpperCase().split(''))).filter(c => /[A-Z]/.test(c));
    
    for (const letter of uniqueLetters) {
      const generatedLetter = this.generateLetter(letter);
      letters.push(generatedLetter);
    }
    
    return letters;
  }

  /**
   * Generate assembly instructions for modular letters
   */
  generateAssemblyInstructions(word: string): string {
    const c = this.config;
    const letters = word.toUpperCase().split('').filter(c => /[A-Z]/.test(c));
    
    return `# Modular Letter Assembly: ${word}

## Overview
This is a modular letter system where each letter can be connected to its neighbors using internal wire routing channels.

## Letters Required
${letters.map(l => `- Letter ${l}`).join('\n')}

## Specifications
- Font Size: ${c.fontSize}mm
- Sign Height: ${c.signHeight}mm
- LED Type: ${c.ledType}
- Wire Hole Size: ${c.wireHoleSize}mm
- Wire Hole Height: ${c.wireHoleHeight}mm from base
${c.enableFrictionLip ? `- Friction Lip: ${c.lipOverhang}mm overhang` : ''}

## Assembly Steps

### 1. Print All Letters
For each letter (${letters.join(', ')}):
- Print Body: PLA/PETG, 0.2mm layers, 20% infill
- Print Lid: White PLA, 0.2mm layers, 100% infill, sand with 400-800 grit

### 2. Install LEDs
${c.ledType === "silicone_neon_6mm" || c.ledType === "silicone_neon_8mm" ? `
**Silicone Neon Installation:**
1. Cut neon tube to length for each letter
2. Push tube into channel - friction lip holds it in place
3. Leave 50-100mm extra at each end for connections
` : `
**LED Strip Installation:**
1. Measure LED channel length for each letter
2. Cut strip with extra length for connections
3. Route through channels
4. Secure with hot glue at corners
`}

### 3. Wire Routing (The Magic Part)
Each letter has wire pass-through holes on both sides at ${c.wireHoleHeight}mm height.

**Connection Pattern:**
\`\`\`
${letters.map((l, i) => {
  if (i === 0) return `${l} [Right Hole] →`;
  if (i === letters.length - 1) return `→ [Left Hole] ${l}`;
  return `→ [Both Holes] ${l} →`;
}).join(' ')}
\`\`\`

**Wiring Steps:**
1. Start with first letter (${letters[0]})
2. Route wire through RIGHT hole
3. Connect to second letter (${letters[1]}) through LEFT hole
4. Continue pattern for all letters
5. All letters share same power bus internally

### 4. Alignment & Spacing
- Align letters at base (all sit on same plane)
- Recommended spacing: 5-10mm between letters
- Wire holes automatically align at ${c.wireHoleHeight}mm height
- Use small dabs of hot glue to secure letter positions

### 5. Power Connection
- Connect power to FIRST letter (${letters[0]})
- Power flows through wire channels to all letters
- No external wiring visible between letters

### 6. Final Assembly
1. Test all LEDs before sealing
2. Snap diffuser lids onto each letter
3. Mount entire word as one unit
4. Enjoy your modular LED sign!

## Advantages of Modular System
✅ Reusable letters - spell different words
✅ Easy repairs - replace single letters
✅ Clean wiring - all internal
✅ Consistent appearance - same dimensions
✅ Scalable - add more letters anytime

## Wire Hole Specifications
- **Location:** Left and right sides of each letter
- **Height:** ${c.wireHoleHeight}mm from base
- **Diameter:** ${c.wireHoleSize}mm
- **Purpose:** Internal wire routing between letters
- **Alignment:** Automatically aligned across all letters

## Power Requirements
${c.ledType === "silicone_neon_6mm" || c.ledType === "silicone_neon_8mm" ? `
**Silicone Neon:**
- Voltage: 12V DC
- Current: ~10W per meter
- Total for "${word}": Estimate 50-100W
- Recommended PSU: 12V 10A
` : `
**LED Strip:**
- Voltage: 5V DC
- Current: 60mA per LED (max)
- Estimate: ${letters.length * 20} LEDs total
- Max Current: ${(letters.length * 20 * 0.06).toFixed(1)}A
- Recommended PSU: 5V ${Math.ceil(letters.length * 20 * 0.06 / 5) * 5}A
`}

## Troubleshooting

**Wire won't fit through hole:**
- Increase Hole_Size in OpenSCAD file
- Drill hole slightly larger with 6mm bit

**Letters don't align:**
- Check all letters printed with same settings
- Verify base is flat on all letters
- Use spacers if needed

**LEDs not lighting:**
- Check wire connections through holes
- Verify power reaches all letters
- Test each letter individually first

## Customization
All letters generated with OpenSCAD files included.
To modify:
1. Open Letter_X.scad in OpenSCAD
2. Adjust parameters (Hole_Size, Hole_Height, etc.)
3. Re-export STL
4. Maintain consistency across all letters
`;
  }

  /**
   * Generate bill of materials for alphabet set
   */
  generateBOM(letterCount: number = 26): Array<{ component: string; quantity: string; notes: string }> {
    const c = this.config;
    const bom: Array<{ component: string; quantity: string; notes: string }> = [
      {
        component: "3D Printed Letter Bodies",
        quantity: `${letterCount}`,
        notes: `PLA/PETG, ${c.signHeight}mm height, ${c.wallThickness}mm walls`
      },
      {
        component: "3D Printed Lids/Diffusers",
        quantity: `${letterCount}`,
        notes: `White PLA, 2mm thick, 100% infill, sanded`
      }
    ];

    if (c.ledType === "silicone_neon_6mm" || c.ledType === "silicone_neon_8mm") {
      bom.push(
        { component: `Silicone Neon Tube`, quantity: "5-10m", notes: `${c.ledType === "silicone_neon_6mm" ? "6mm" : "8mm"} diameter` },
        { component: "12V DC Power Supply", quantity: "1", notes: "12V 10A recommended" },
        { component: "Neon Controller", quantity: "1", notes: "Optional for dimming" }
      );
    } else if (c.ledType === "led_strip_10mm") {
      bom.push(
        { component: "WS2812B LED Strip", quantity: "5m", notes: "60 LEDs/m, 10mm wide" },
        { component: "5V Power Supply", quantity: "1", notes: "5V 20A recommended" },
        { component: "ESP32 or Arduino", quantity: "1", notes: "For addressable control" },
        { component: "Wire (22 AWG)", quantity: "10m", notes: "For connections through holes" }
      );
    } else if (c.ledType === "individual_pixels") {
      bom.push(
        { component: "Individual NeoPixels", quantity: "500-1000", notes: "Depends on letter density" },
        { component: "5V Power Supply", quantity: "1", notes: "5V 15A recommended" },
        { component: "ESP32 or Arduino", quantity: "1", notes: "For addressable control" },
        { component: "Wire (22 AWG)", quantity: "20m", notes: "For data and power bus" }
      );
    }

    bom.push(
      { component: "Hot Glue Gun", quantity: "1", notes: "For securing LEDs and letter alignment" },
      { component: "Wire Connectors", quantity: "50", notes: "For pass-through connections" },
      { component: "Mounting Hardware", quantity: "1 set", notes: "Screws or command strips" }
    );

    return bom;
  }
}
