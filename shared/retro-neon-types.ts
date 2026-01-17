// Retro Neon and Edison Bulb type definitions
// Extracted from Replit additions for modular integration

import { z } from "zod";

// LED strip types
export const ledStripTypes = ["simple", "ws2812", "cob", "filament"] as const;
export type LedStripType = typeof ledStripTypes[number];

// Primitive shape types for filaments and neon signs
export const primitiveShapes = [
  // Classic
  "heart", "star", "arrow", "moon", "crown", "lightning", "leaf", 
  "mushroom", "cactus", "cat", "diamond", "circle", "infinity", 
  "flame", "music", "peace",
  // Retro Tech
  "glasses", "floppy", "cd", "computer", "brickphone", "sodacan",
  // Space & Planets
  "saturn", "jupiter", "orbit",
  // Nature & Food
  "spaghetti", "brain", "dinosaur",
  // Dice
  "dice1", "dice2", "dice3", "dice4", "dice5", "dice6",
  // Clocks
  "clock3", "clock6", "clock9", "clock12",
  // Stick Figures
  "stickStand", "stickWave", "stickJump", "stickDance", "stickSit", "stickRun",
  // Emoji Faces
  "emojiHappy", "emojiSad", "emojiWink", "emojiLove", "emojiCool", "emojiShock",
  // 8-bit Pixel Art
  "bit8Heart", "bit8Star", "bit8Person", "bit8Invader"
] as const;
export type PrimitiveShape = typeof primitiveShapes[number];

// Classic bulb shapes
export const classicBulbShapes = ["tube", "globe", "flame", "vintage", "pear"] as const;
export type ClassicBulbShape = typeof classicBulbShapes[number];

// All available shell shapes - classic bulb shapes + primitives
export const shellShapeTypes = [
  // Classic bulb shapes (lathe-generated)
  "tube", "globe", "flame", "vintage", "pear",
  // Primitive shapes (extruded and hollowed)
  ...primitiveShapes
] as const;
export type ShellShapeType = typeof shellShapeTypes[number];

// Material types for glass printing
export const glassMaterialTypes = ["clear", "frosted", "white_diffused"] as const;
export type GlassMaterialType = typeof glassMaterialTypes[number];

// Screw base standards
export const screwBaseTypes = ["e26", "e27", "e14", "none"] as const;
export type ScrewBaseType = typeof screwBaseTypes[number];

// Stand types for separate electronics housing
export const standTypes = ["round", "square", "hexagon"] as const;
export type StandType = typeof standTypes[number];

// Edison Bulb Settings
export const edisonBulbSettingsSchema = z.object({
  shellShape: z.string(),
  shellScale: z.number().min(0.5).max(3),
  shellHeight: z.number().min(30).max(150),
  shellWallThickness: z.number().min(1).max(4),
  shellMaterial: z.enum(glassMaterialTypes),
  openingDiameter: z.number().min(15).max(50),
  screwBase: z.enum(screwBaseTypes),
  baseHeight: z.number().min(10).max(35),
  wireCenterHole: z.boolean(),
  wireHoleDiameter: z.number().min(3).max(10),
});

export type EdisonBulbSettings = z.infer<typeof edisonBulbSettingsSchema>;

export const defaultEdisonBulbSettings: EdisonBulbSettings = {
  shellShape: "globe",
  shellScale: 1.0,
  shellHeight: 80,
  shellWallThickness: 2,
  shellMaterial: "clear",
  openingDiameter: 25,
  screwBase: "e26",
  baseHeight: 20,
  wireCenterHole: true,
  wireHoleDiameter: 5,
};

// Neon Sign Settings
export const neonSignSettingsSchema = z.object({
  shape: z.enum(primitiveShapes),
  customSvgPath: z.string().optional(),
  scale: z.number().min(0.5).max(3),
  tubeWidth: z.number().min(8).max(25),
  tubeDepth: z.number().min(6).max(20),
  wallThickness: z.number().min(1.2).max(3),
  hollow: z.boolean(),
  splitHalf: z.boolean(),
});

export type NeonSignSettings = z.infer<typeof neonSignSettingsSchema>;

export const defaultNeonSignSettings: NeonSignSettings = {
  shape: "heart",
  customSvgPath: "",
  scale: 1.0,
  tubeWidth: 12,
  tubeDepth: 10,
  wallThickness: 2,
  hollow: true,
  splitHalf: true,
};

// Electronics Housing Settings
export const electronicsHousingSettingsSchema = z.object({
  enabled: z.boolean(),
  shape: z.enum(standTypes),
  diameter: z.number().min(50).max(150),
  height: z.number().min(20).max(60),
  wallThickness: z.number().min(2).max(4),
  usbPort: z.boolean(),
  powerSwitch: z.boolean(),
  potentiometer: z.boolean(),
  batteryCompartment: z.boolean(),
  wirePassthrough: z.boolean(),
  wireHoleDiameter: z.number().min(3).max(10),
});

export type ElectronicsHousingSettings = z.infer<typeof electronicsHousingSettingsSchema>;

export const defaultElectronicsHousingSettings: ElectronicsHousingSettings = {
  enabled: false,
  shape: "round",
  diameter: 80,
  height: 35,
  wallThickness: 3,
  usbPort: true,
  powerSwitch: true,
  potentiometer: false,
  batteryCompartment: false,
  wirePassthrough: true,
  wireHoleDiameter: 6,
};

// Complete Retro/Edison Settings
export const retroNeonSettingsSchema = z.object({
  mode: z.enum(["neon_sign", "edison_bulb"]),
  edison: edisonBulbSettingsSchema,
  neonSign: neonSignSettingsSchema,
  housing: electronicsHousingSettingsSchema,
  backPlateEnabled: z.boolean(),
  backPlateWidth: z.number().min(60).max(200),
  backPlateHeight: z.number().min(60).max(200),
  backPlateThickness: z.number().min(2).max(6),
  backPlateMountHoles: z.boolean(),
});

export type RetroNeonSettings = z.infer<typeof retroNeonSettingsSchema>;

export const defaultRetroNeonSettings: RetroNeonSettings = {
  mode: "edison_bulb",
  edison: defaultEdisonBulbSettings,
  neonSign: defaultNeonSignSettings,
  housing: defaultElectronicsHousingSettings,
  backPlateEnabled: false,
  backPlateWidth: 100,
  backPlateHeight: 100,
  backPlateThickness: 3,
  backPlateMountHoles: true,
};
