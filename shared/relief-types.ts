// 2.5D Relief Generator Type Definitions
// Standalone schema for relief/embossing feature

import { z } from "zod";

// Relief extrusion styles
export const reliefStyles = ["raised", "recessed", "both"] as const;
export type ReliefStyle = typeof reliefStyles[number];

// LED placement options
export const ledPlacements = ["edges", "contours", "grid", "none"] as const;
export type LedPlacement = typeof ledPlacements[number];

// Relief settings schema
export const reliefSettingsSchema = z.object({
  // Image processing
  maxDepth: z.number().min(1).max(50),              // Maximum extrusion depth in mm
  smoothing: z.number().min(0).max(10),             // Smoothing iterations
  threshold: z.number().min(0).max(255),            // Brightness threshold
  
  // Relief style
  reliefStyle: z.enum(reliefStyles),                // Raised, recessed, or both
  invertDepth: z.boolean(),                         // Invert height map
  
  // Dimensions
  baseWidth: z.number().min(50).max(500),           // Base width in mm
  baseHeight: z.number().min(50).max(500),          // Base height in mm
  baseThickness: z.number().min(2).max(10),         // Base plate thickness
  
  // LED integration
  ledPlacement: z.enum(ledPlacements),              // Where to place LEDs
  ledChannelWidth: z.number().min(3).max(15),       // LED channel width
  ledChannelDepth: z.number().min(2).max(10),       // LED channel depth
  
  // Splitting
  splitHorizontal: z.boolean(),                     // Split into left/right halves
  splitVertical: z.boolean(),                       // Split into top/bottom halves
  snapFit: z.boolean(),                             // Add snap-fit connectors
  
  // Diffuser
  includeDiffuser: z.boolean(),                     // Add translucent diffuser layer
  diffuserThickness: z.number().min(1).max(5),      // Diffuser thickness
  diffuserOffset: z.number().min(0).max(10),        // Gap between relief and diffuser
});

export type ReliefSettings = z.infer<typeof reliefSettingsSchema>;

// Default settings
export const defaultReliefSettings: ReliefSettings = {
  // Image processing
  maxDepth: 10,
  smoothing: 2,
  threshold: 128,
  
  // Relief style
  reliefStyle: "raised",
  invertDepth: false,
  
  // Dimensions
  baseWidth: 200,
  baseHeight: 200,
  baseThickness: 3,
  
  // LED integration
  ledPlacement: "edges",
  ledChannelWidth: 8,
  ledChannelDepth: 5,
  
  // Splitting
  splitHorizontal: true,
  splitVertical: false,
  snapFit: true,
  
  // Diffuser
  includeDiffuser: true,
  diffuserThickness: 2,
  diffuserOffset: 2,
};
