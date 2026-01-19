// LED Holder type definitions
// Extracted from Replit additions

import { z } from "zod";

export const ledHolderLedTypes = ["3mm", "5mm", "ws2812b", "ws2812b_strip", "10mm_uv"] as const;
export type LEDHolderLedType = typeof ledHolderLedTypes[number];

export const ledHolderStyles = ["socket", "clip", "cradle", "wash"] as const;
export type LEDHolderStyle = typeof ledHolderStyles[number];

export const ledHolderMountTypes = ["magnetic", "screw", "adhesive", "clip_on"] as const;
export type LEDHolderMountType = typeof ledHolderMountTypes[number];

export const ledHolderSettingsSchema = z.object({
  ledType: z.enum(ledHolderLedTypes),
  holderStyle: z.enum(ledHolderStyles),
  mountType: z.enum(ledHolderMountTypes),
  wireChannelDiameter: z.number().min(1).max(10),
  magnetDiameter: z.number().min(3).max(15),
  magnetDepth: z.number().min(1).max(5),
  screwHoleDiameter: z.number().min(2).max(6),
  wallThickness: z.number().min(1).max(5),
  tiltAngle: z.number().min(0).max(90),
  quantity: z.number().min(1).max(20),
  adjustableHeight: z.boolean().optional(),
  minHeight: z.number().min(10).max(50).optional(),
  maxHeight: z.number().min(20).max(100).optional(),
  reflectorDepth: z.number().min(5).max(25).default(12),
  beamAngle: z.number().min(15).max(120).default(45),
  hasDiffuser: z.boolean().default(true),
  washWidth: z.number().min(20).max(50).default(30),
  washHeight: z.number().min(5).max(20).default(10),
  duckbillDepth: z.number().min(10).max(30).default(20),
});

export type LEDHolderSettings = z.infer<typeof ledHolderSettingsSchema>;

export const defaultLEDHolderSettings: LEDHolderSettings = {
  ledType: "5mm",
  holderStyle: "socket",
  mountType: "magnetic",
  wireChannelDiameter: 3,
  magnetDiameter: 8.2,
  magnetDepth: 3.2,
  screwHoleDiameter: 3,
  wallThickness: 2,
  tiltAngle: 45,
  quantity: 1,
  reflectorDepth: 12,
  beamAngle: 45,
  hasDiffuser: true,
  washWidth: 30,
  washHeight: 10,
  duckbillDepth: 20,
};
