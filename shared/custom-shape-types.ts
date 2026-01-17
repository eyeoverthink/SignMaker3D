// Custom Shape type definitions
// Extracted from Replit additions

import { z } from "zod";

// Custom input modes for custom shapes editor
export const customInputModes = ["text", "draw", "trace"] as const;
export type CustomInputMode = typeof customInputModes[number];

// LED strip types
export const ledStripTypes = ["simple", "ws2812", "cob", "filament"] as const;
export type LedStripType = typeof ledStripTypes[number];

// Sketch path schema (defined here to avoid circular dependency)
const sketchPathSchema = z.object({
  id: z.string(),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  closed: z.boolean(),
});

// Custom Shape Settings - for creating split-half channels for LED insertion
export const customShapeSettingsSchema = z.object({
  inputMode: z.enum(customInputModes),
  text: z.string().min(0).max(200),
  fontId: z.string(),
  fontSize: z.number().min(10).max(200),
  paths: z.array(sketchPathSchema),
  traceThreshold: z.number().min(0).max(255),
  traceSmoothing: z.number().min(0).max(10),
  autoTrace: z.boolean(),
  channelWidth: z.number().min(8).max(30),
  channelDepth: z.number().min(4).max(20),
  wallThickness: z.number().min(1.2).max(4),
  ledType: z.enum(ledStripTypes),
  splitHalf: z.boolean(),
  snapFitTolerance: z.number().min(0.1).max(0.5),
  modularConnectors: z.boolean(),
  connectorLength: z.number().min(3).max(10),
  wireChannel: z.boolean(),
  wireChannelDiameter: z.number().min(2).max(6),
  scale: z.number().min(0.5).max(5),
});

export type CustomShapeSettings = z.infer<typeof customShapeSettingsSchema>;

export const defaultCustomShapeSettings: CustomShapeSettings = {
  inputMode: "text",
  text: "HELLO",
  fontId: "inter",
  fontSize: 50,
  paths: [],
  traceThreshold: 128,
  traceSmoothing: 2,
  autoTrace: true,
  channelWidth: 12,
  channelDepth: 8,
  wallThickness: 2,
  ledType: "ws2812",
  splitHalf: true,
  snapFitTolerance: 0.2,
  modularConnectors: true,
  connectorLength: 5,
  wireChannel: true,
  wireChannelDiameter: 3,
  scale: 1.0,
};
