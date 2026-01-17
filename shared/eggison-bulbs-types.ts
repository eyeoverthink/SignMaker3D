// Eggison Bulbs - Custom 3D-printed light bulb shells
// For DIY LED filament bulbs with shaped interiors

import { z } from "zod";

// Shell shape types
export const eggisonShellShapes = ["egg", "sphere", "teardrop", "pear", "tube", "dome", "custom"] as const;
export type EggisonShellShape = typeof eggisonShellShapes[number];

// Screw base types (standard bulb bases)
export const eggisonScrewBases = ["e26", "e27", "e14", "e12", "gu10", "none"] as const;
export type EggisonScrewBase = typeof eggisonScrewBases[number];

// Filament guide types (internal structure for shaping LEDs)
export const filamentGuideTypes = ["none", "heart", "infinity", "spiral", "zigzag", "letter", "custom_path"] as const;
export type FilamentGuideType = typeof filamentGuideTypes[number];

// Material finish
export const shellFinishes = ["clear", "frosted", "translucent", "opaque"] as const;
export type ShellFinish = typeof shellFinishes[number];

// Eggison Bulbs Settings Schema
export const eggisonBulbsSettingsSchema = z.object({
  // Shell properties
  shellShape: z.enum(eggisonShellShapes),
  shellHeight: z.number().min(40).max(200),
  shellWidth: z.number().min(30).max(150),
  shellWallThickness: z.number().min(1).max(5),
  shellFinish: z.enum(shellFinishes),
  
  // Screw base
  screwBase: z.enum(eggisonScrewBases),
  baseHeight: z.number().min(10).max(40),
  baseDiameter: z.number().min(20).max(30),
  threadPitch: z.number().min(2).max(5),
  
  // Wire channels for conductive paths
  wireCenterHole: z.boolean(),
  wireHoleDiameter: z.number().min(2).max(8),
  conductivePathGroove: z.boolean(),
  grooveWidth: z.number().min(1).max(3),
  grooveDepth: z.number().min(0.5).max(2),
  
  // Filament guide (internal structure)
  filamentGuide: z.enum(filamentGuideTypes),
  guideHeight: z.number().min(20).max(150),
  guideThickness: z.number().min(1).max(3),
  guideMountPoints: z.number().min(2).max(8),
  
  // Custom filament path (for custom_path guide type)
  customFilamentPath: z.string().optional(),
  
  // Assembly features
  splitHorizontal: z.boolean(),
  splitHeight: z.number().min(0).max(100),
  snapFitTabs: z.boolean(),
  tabCount: z.number().min(2).max(8),
  
  // Top opening (for inserting filament)
  topOpening: z.boolean(),
  openingDiameter: z.number().min(10).max(40),
  
  // Mounting features
  hangingLoop: z.boolean(),
  loopDiameter: z.number().min(3).max(8),
});

export type EggisonBulbsSettings = z.infer<typeof eggisonBulbsSettingsSchema>;

// Default settings
export const defaultEggisonBulbsSettings: EggisonBulbsSettings = {
  shellShape: "egg",
  shellHeight: 80,
  shellWidth: 60,
  shellWallThickness: 2,
  shellFinish: "translucent",
  
  screwBase: "e26",
  baseHeight: 25,
  baseDiameter: 26,
  threadPitch: 3.5,
  
  wireCenterHole: true,
  wireHoleDiameter: 4,
  conductivePathGroove: true,
  grooveWidth: 2,
  grooveDepth: 1,
  
  filamentGuide: "heart",
  guideHeight: 50,
  guideThickness: 2,
  guideMountPoints: 4,
  
  customFilamentPath: "",
  
  splitHorizontal: true,
  splitHeight: 50,
  snapFitTabs: true,
  tabCount: 4,
  
  topOpening: true,
  openingDiameter: 20,
  
  hangingLoop: false,
  loopDiameter: 5,
};
