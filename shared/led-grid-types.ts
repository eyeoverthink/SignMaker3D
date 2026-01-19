// LED Grid Sign System - WS2812B Matrix Display Types
// Supports 8x7, 32x8, and custom grid sizes with serpentine wiring

import { z } from "zod";

// Predefined grid sizes
export const ledGridSizes = ["8x7", "32x8", "16x16", "8x32", "custom"] as const;
export type LEDGridSize = typeof ledGridSizes[number];

// Wiring patterns for LED matrices
export const wiringPatterns = ["serpentine", "parallel", "zigzag"] as const;
export type WiringPattern = typeof wiringPatterns[number];

// Pixel spacing (mm between LED centers)
export const pixelSpacings = [5, 6.25, 7.5, 10, 12.5, 15] as const;
export type PixelSpacing = typeof pixelSpacings[number];

// Diffuser types for LED grids
export const ledDiffuserTypes = ["frosted_acrylic", "white_pla", "translucent_petg", "none"] as const;
export type LEDDiffuserType = typeof ledDiffuserTypes[number];

// Mounting styles
export const mountingStyles = ["wall_mount", "stand", "hanging", "magnetic"] as const;
export type MountingStyle = typeof mountingStyles[number];

// LED installation types (matching OpenSCAD Light_Type)
export const ledInstallationTypes = [
  "silicone_neon_6mm",
  "silicone_neon_8mm", 
  "led_strip_10mm",
  "individual_pixels",
  "led_grid",
  "discrete_leds"
] as const;
export type LEDInstallationType = typeof ledInstallationTypes[number];

// Wire pass-through options for modular letters
export const wirePassThroughOptions = ["none", "left", "right", "both"] as const;
export type WirePassThrough = typeof wirePassThroughOptions[number];

// Sign mode (grid matrix vs custom shaped sign)
export const signModes = ["grid_matrix", "custom_shape"] as const;
export type SignMode = typeof signModes[number];

// LED Grid Settings Schema
export const ledGridSettingsSchema = z.object({
  // Mode selection
  signMode: z.enum(signModes),
  
  // LED installation type
  ledInstallationType: z.enum(ledInstallationTypes),
  
  // Grid dimensions (for grid_matrix mode)
  gridSize: z.enum(ledGridSizes),
  customWidth: z.number().min(1).max(64).optional(), // For custom grids
  customHeight: z.number().min(1).max(64).optional(),
  
  // Physical dimensions
  pixelSpacing: z.number().min(5).max(15), // mm between LED centers
  ledDiameter: z.number().min(3).max(8), // Individual LED size
  
  // Wiring configuration
  wiringPattern: z.enum(wiringPatterns),
  dataInputSide: z.enum(["top_left", "top_right", "bottom_left", "bottom_right"]),
  
  // Housing design
  housingDepth: z.number().min(10).max(30), // Depth of box
  wallThickness: z.number().min(2).max(5),
  mountingStyle: z.enum(mountingStyles),
  
  // Diffuser settings
  diffuserType: z.enum(ledDiffuserTypes),
  diffuserThickness: z.number().min(1).max(5),
  diffuserOffset: z.number().min(2).max(10), // Distance from LEDs to diffuser
  
  // Electronics compartment
  includeControllerSpace: z.boolean(),
  controllerWidth: z.number().min(20).max(60),
  controllerHeight: z.number().min(20).max(60),
  
  // Wire management
  wireChannelWidth: z.number().min(3).max(8),
  includeWireGuides: z.boolean(),
  
  // Sign content (what to display on the grid)
  contentType: z.enum(["text", "image", "animation", "custom_pixels"]),
  textContent: z.string().optional(),
  fontSize: z.number().min(5).max(32).optional(),
  
  // Mounting hardware
  includeMountingHoles: z.boolean(),
  mountingHoleDiameter: z.number().min(3).max(6),
  
  // Advanced features (for custom shape mode)
  enableFrictionLip: z.boolean().optional(), // Narrower top for neon retention
  lipOverhang: z.number().min(0).max(1).optional(), // 0.4mm default for neon
  wirePassThrough: z.enum(wirePassThroughOptions).optional(), // For modular letters
  wireHoleHeight: z.number().min(3).max(15).optional(), // Height from base
  wireHoleSize: z.number().min(3).max(8).optional(), // Diameter
  enablePowerHole: z.boolean().optional(), // Punch hole at origin
  powerHoleSize: z.number().min(3).max(10).optional(), // Cable diameter
  lipWidth: z.number().min(1).max(3).optional(), // Shelf width for lid (1.5mm default)
});

export type LEDGridSettings = z.infer<typeof ledGridSettingsSchema>;

// Default settings for 8x7 grid (from user's sketch)
export const defaultLEDGridSettings: LEDGridSettings = {
  signMode: "grid_matrix",
  ledInstallationType: "led_grid",
  gridSize: "8x7",
  pixelSpacing: 10, // 10mm spacing
  ledDiameter: 5, // 5mm WS2812B
  wiringPattern: "serpentine",
  dataInputSide: "top_left",
  housingDepth: 15,
  wallThickness: 3,
  mountingStyle: "wall_mount",
  diffuserType: "frosted_acrylic" as LEDDiffuserType,
  diffuserThickness: 2,
  diffuserOffset: 5,
  includeControllerSpace: true,
  controllerWidth: 50,
  controllerHeight: 30,
  wireChannelWidth: 5,
  includeWireGuides: true,
  contentType: "text",
  textContent: "",
  fontSize: 8,
  includeMountingHoles: true,
  mountingHoleDiameter: 4,
  enableFrictionLip: false,
  lipOverhang: 0.4,
  wirePassThrough: "none",
  wireHoleHeight: 5,
  wireHoleSize: 5,
  enablePowerHole: false,
  powerHoleSize: 5,
  lipWidth: 1.5,
};

// Grid dimension helper
export function getGridDimensions(settings: LEDGridSettings): { width: number; height: number; totalLEDs: number } {
  let width = 0;
  let height = 0;
  
  switch (settings.gridSize) {
    case "8x7":
      width = 8;
      height = 7;
      break;
    case "32x8":
      width = 32;
      height = 8;
      break;
    case "16x16":
      width = 16;
      height = 16;
      break;
    case "8x32":
      width = 8;
      height = 32;
      break;
    case "custom":
      width = settings.customWidth || 8;
      height = settings.customHeight || 8;
      break;
  }
  
  return {
    width,
    height,
    totalLEDs: width * height
  };
}

// Calculate physical size in mm
export function getPhysicalSize(settings: LEDGridSettings): { width: number; height: number } {
  const { width, height } = getGridDimensions(settings);
  const spacing = settings.pixelSpacing as number;
  const ledDiameter = settings.ledDiameter as number;
  
  return {
    width: (width - 1) * spacing + ledDiameter,
    height: (height - 1) * spacing + ledDiameter
  };
}

// Generate serpentine wiring map (LED index to grid position)
export function generateWiringMap(settings: LEDGridSettings): Array<{ x: number; y: number; index: number }> {
  const { width, height } = getGridDimensions(settings);
  const map: Array<{ x: number; y: number; index: number }> = [];
  
  let index = 0;
  
  if (settings.wiringPattern === "serpentine") {
    // Snake pattern: left-to-right, then right-to-left, alternating
    for (let y = 0; y < height; y++) {
      if (y % 2 === 0) {
        // Even rows: left to right
        for (let x = 0; x < width; x++) {
          map.push({ x, y, index: index++ });
        }
      } else {
        // Odd rows: right to left
        for (let x = width - 1; x >= 0; x--) {
          map.push({ x, y, index: index++ });
        }
      }
    }
  } else if (settings.wiringPattern === "parallel") {
    // All rows left-to-right
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        map.push({ x, y, index: index++ });
      }
    }
  } else {
    // Zigzag: columns alternating
    for (let x = 0; x < width; x++) {
      if (x % 2 === 0) {
        for (let y = 0; y < height; y++) {
          map.push({ x, y, index: index++ });
        }
      } else {
        for (let y = height - 1; y >= 0; y--) {
          map.push({ x, y, index: index++ });
        }
      }
    }
  }
  
  return map;
}

// Convert text to pixel grid (simple 5x7 font)
export function textToPixelGrid(text: string, gridWidth: number, gridHeight: number): boolean[][] {
  const grid: boolean[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));
  
  // Simple 5x7 bitmap font for basic characters
  const font5x7: Record<string, number[]> = {
    'A': [0x7E, 0x11, 0x11, 0x11, 0x7E],
    'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
    'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
    'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
    'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
    'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
    'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
    'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
    'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
    'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
    'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
    'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
    'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F],
    'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
    'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
    'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
    'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
    'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
    'S': [0x46, 0x49, 0x49, 0x49, 0x31],
    'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
    'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
    'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
    'W': [0x3F, 0x40, 0x38, 0x40, 0x3F],
    'X': [0x63, 0x14, 0x08, 0x14, 0x63],
    'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
    'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
    '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
    '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
    '2': [0x42, 0x61, 0x51, 0x49, 0x46],
    '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
    '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
    '5': [0x27, 0x45, 0x45, 0x45, 0x39],
    '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
    '7': [0x01, 0x71, 0x09, 0x05, 0x03],
    '8': [0x36, 0x49, 0x49, 0x49, 0x36],
    '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
  };
  
  const upperText = text.toUpperCase();
  let xOffset = 0;
  
  for (const char of upperText) {
    const bitmap = font5x7[char];
    if (!bitmap) continue;
    
    // Draw character
    for (let col = 0; col < 5; col++) {
      if (xOffset + col >= gridWidth) break;
      
      const colData = bitmap[col];
      for (let row = 0; row < 7; row++) {
        if (row >= gridHeight) break;
        
        const bit = (colData >> row) & 1;
        if (bit) {
          grid[row][xOffset + col] = true;
        }
      }
    }
    
    xOffset += 6; // 5 pixels + 1 space
    if (xOffset >= gridWidth) break;
  }
  
  return grid;
}
