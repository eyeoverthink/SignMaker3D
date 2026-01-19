// Eggison Bulbs - Egg-shaped Edison bulb shells with screw bases and accessories
// Based on reference implementation from egg-refrence-updates

import { z } from "zod";

// Shell style types (from reference)
export const eggisonShellStyles = ["classic", "tall", "wide", "mini", "cracked", "split"] as const;
export type EggisonShellStyle = typeof eggisonShellStyles[number];

// Screw base types (from reference)
export const eggisonBaseTypes = ["E26", "E27", "E14"] as const;
export type EggisonBaseType = typeof eggisonBaseTypes[number];

// Light source types - comprehensive options for functional illumination
export const eggisonLightTypes = ["none", "filament_tube", "rgb_led_strip", "central_led", "vase_mode"] as const;
export type EggisonLightType = typeof eggisonLightTypes[number];

// Diffusion pattern types for vase mode
export const diffusionPatterns = ["spiral", "honeycomb", "waves", "organic", "smooth"] as const;
export type DiffusionPattern = typeof diffusionPatterns[number];

// Lithophane position options
export const lithophanePositions = ["none", "center", "inner_shell"] as const;
export type LithophanePosition = typeof lithophanePositions[number];

// Eggison Settings Schema - Enhanced with functional light sources
export const eggisonSettingsSchema = z.object({
  // Shell geometry
  shellHeight: z.number().min(40).max(150),
  shellWidth: z.number().min(30).max(120),
  wallThickness: z.number().min(0.4).max(4), // Allow thin walls for vase mode
  shellStyle: z.enum(eggisonShellStyles),
  
  // Base configuration
  baseType: z.enum(eggisonBaseTypes),
  baseHeight: z.number().min(15).max(40),
  
  // Light source selection
  lightType: z.enum(eggisonLightTypes),
  
  // Filament tube coil parameters
  filamentCoilDiameter: z.number().min(2).max(8),
  filamentCoilTurns: z.number().min(3).max(12),
  filamentCoilHeight: z.number().min(20).max(100),
  filamentCoilPitch: z.number().min(5).max(20),
  
  // RGB LED strip parameters
  ledStripWidth: z.number().min(5).max(15),
  ledStripLedCount: z.number().min(10).max(100),
  ledStripPattern: z.enum(["spiral", "vertical", "zigzag"]),
  ledStripSpacing: z.number().min(5).max(20),
  
  // Central LED parameters
  centralLedSize: z.number().min(5).max(20),
  centralLedCount: z.number().min(1).max(9),
  centralLedMountHeight: z.number().min(10).max(50),
  
  // Vase mode shell parameters
  vaseModeEnabled: z.boolean(),
  diffusionPattern: z.enum(diffusionPatterns),
  diffusionDepth: z.number().min(0.2).max(2),
  diffusionSpacing: z.number().min(2).max(10),
  
  // Lithophane core options
  lithophaneEnabled: z.boolean(),
  lithophanePosition: z.enum(lithophanePositions),
  lithophaneThicknessMin: z.number().min(0.8).max(3),
  lithophaneThicknessMax: z.number().min(2).max(8),
  lithophaneImageUrl: z.string().optional(),
  
  // Accessories
  includeGlasses: z.boolean(),
  includeFeet: z.boolean(),
  includeBatteryHolder: z.boolean(),
  
  // Legacy compatibility
  includeFilamentChannel: z.boolean(),
  filamentChannelDiameter: z.number().min(2).max(8),
});

export type EggisonSettings = z.infer<typeof eggisonSettingsSchema>;

// Default settings - Enhanced with light source defaults
export const defaultEggisonSettings: EggisonSettings = {
  // Shell geometry
  shellHeight: 100,
  shellWidth: 70,
  wallThickness: 2,
  shellStyle: "classic",
  
  // Base configuration
  baseType: "E26",
  baseHeight: 25,
  
  // Light source
  lightType: "filament_tube",
  
  // Filament tube coil defaults
  filamentCoilDiameter: 4,
  filamentCoilTurns: 6,
  filamentCoilHeight: 60,
  filamentCoilPitch: 10,
  
  // RGB LED strip defaults
  ledStripWidth: 10,
  ledStripLedCount: 30,
  ledStripPattern: "spiral",
  ledStripSpacing: 10,
  
  // Central LED defaults
  centralLedSize: 10,
  centralLedCount: 1,
  centralLedMountHeight: 20,
  
  // Vase mode defaults
  vaseModeEnabled: false,
  diffusionPattern: "spiral",
  diffusionDepth: 0.5,
  diffusionSpacing: 5,
  
  // Lithophane defaults
  lithophaneEnabled: false,
  lithophanePosition: "none",
  lithophaneThicknessMin: 1.2,
  lithophaneThicknessMax: 4,
  
  // Accessories
  includeGlasses: false,
  includeFeet: false,
  includeBatteryHolder: true,
  
  // Legacy compatibility
  includeFilamentChannel: true,
  filamentChannelDiameter: 4,
};

// Legacy exports for backward compatibility
export const eggisonBulbsSettingsSchema = eggisonSettingsSchema;
export type EggisonBulbsSettings = EggisonSettings;
export const defaultEggisonBulbsSettings = defaultEggisonSettings;
