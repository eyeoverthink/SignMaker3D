// Eggison Bulbs - Egg-shaped Edison bulb shells with screw bases and accessories
// Based on reference implementation from egg-refrence-updates

import { z } from "zod";

// Shell style types (from reference)
export const eggisonShellStyles = ["classic", "tall", "wide", "mini", "cracked", "split"] as const;
export type EggisonShellStyle = typeof eggisonShellStyles[number];

// Screw base types (from reference)
export const eggisonBaseTypes = ["E26", "E27", "E14"] as const;
export type EggisonBaseType = typeof eggisonBaseTypes[number];

// Light types supported (from reference)
export const eggisonLightTypes = ["filament", "ws2812b", "led_strip", "fairy_lights"] as const;
export type EggisonLightType = typeof eggisonLightTypes[number];

// Eggison Settings Schema (matching reference implementation)
export const eggisonSettingsSchema = z.object({
  shellHeight: z.number().min(40).max(150),
  shellWidth: z.number().min(30).max(120),
  wallThickness: z.number().min(1).max(4),
  shellStyle: z.enum(eggisonShellStyles),
  baseType: z.enum(eggisonBaseTypes),
  baseHeight: z.number().min(15).max(40),
  lightType: z.enum(eggisonLightTypes),
  filamentChannelDiameter: z.number().min(2).max(8),
  includeGlasses: z.boolean(),
  includeFeet: z.boolean(),
  includeBatteryHolder: z.boolean(),
  includeFilamentChannel: z.boolean(),
});

export type EggisonSettings = z.infer<typeof eggisonSettingsSchema>;

// Default settings (matching reference)
export const defaultEggisonSettings: EggisonSettings = {
  shellHeight: 100,
  shellWidth: 70,
  wallThickness: 2,
  shellStyle: "classic",
  baseType: "E26",
  baseHeight: 25,
  lightType: "filament",
  filamentChannelDiameter: 4,
  includeGlasses: false,
  includeFeet: false,
  includeBatteryHolder: false,
  includeFilamentChannel: true,
};

// Legacy exports for backward compatibility
export const eggisonBulbsSettingsSchema = eggisonSettingsSchema;
export type EggisonBulbsSettings = EggisonSettings;
export const defaultEggisonBulbsSettings = defaultEggisonSettings;
