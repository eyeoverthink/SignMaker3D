import { z } from "zod";

export const fontOptions = [
  { id: "architects-daughter", name: "Architects Daughter", family: "Architects Daughter" },
  { id: "hershey-sans", name: "Hershey Sans (Single-Stroke)", family: "Hershey Sans" },
  { id: "hershey-script", name: "Hershey Script (Single-Stroke)", family: "Hershey Script" },
  { id: "inter", name: "Inter", family: "Inter" },
  { id: "lora", name: "Lora", family: "Lora" },
  { id: "merriweather", name: "Merriweather", family: "Merriweather" },
  { id: "montserrat", name: "Montserrat", family: "Montserrat" },
  { id: "open-sans", name: "Open Sans", family: "Open Sans" },
  { id: "outfit", name: "Outfit", family: "Outfit" },
  { id: "oxanium", name: "Oxanium", family: "Oxanium" },
  { id: "playfair", name: "Playfair Display", family: "Playfair Display" },
  { id: "poppins", name: "Poppins", family: "Poppins" },
  { id: "roboto", name: "Roboto", family: "Roboto" },
  { id: "space-grotesk", name: "Space Grotesk", family: "Space Grotesk" },
] as const;

export type FontOption = typeof fontOptions[number];

export const wiringChannelTypes = ["none", "center", "back", "ws2812b", "filament", "custom"] as const;
export type WiringChannelType = typeof wiringChannelTypes[number];

export const mountingHolePatterns = ["none", "2-point", "4-corner", "6-point", "custom"] as const;
export type MountingHolePattern = typeof mountingHolePatterns[number];

export const baseTemplates = [
  { id: "none", name: "Custom Text Only", description: "Generate letters from your text" },
  { id: "hex-base", name: "Hex Light Base", description: "Hexagonal LED panel base" },
  { id: "triangle-base", name: "Triangle Base", description: "Triangular LED panel base" },
  { id: "wall-hanging", name: "Wall Hanging", description: "Wall-mountable sign with lid" },
  { id: "control-box", name: "Control Box", description: "Electronics housing for LED controller" },
] as const;

export type BaseTemplate = typeof baseTemplates[number];

export const exportFormats = ["stl", "obj", "3mf"] as const;
export type ExportFormat = typeof exportFormats[number];

export const geometryModes = ["raised", "stencil", "layered", "flat", "outline"] as const;
export type GeometryMode = typeof geometryModes[number];

export const materialTypes = ["opaque", "transparent", "diffuser"] as const;
export type MaterialType = typeof materialTypes[number];

export const geometrySettingsSchema = z.object({
  mode: z.enum(geometryModes),
  letterHeight: z.number().min(2).max(50),
  backingThickness: z.number().min(2).max(30),
  letterOffset: z.number().min(0).max(20),
  letterMaterial: z.enum(materialTypes),
  backingMaterial: z.enum(materialTypes),
  separateFiles: z.boolean(),
  enableBacking: z.boolean().optional(),
  mirrorX: z.boolean().optional(),  // Mirror on X axis
  generateDiffuserCap: z.boolean().optional(),  // Generate matching cap piece
  weldLetters: z.boolean().optional(),  // Connect all letters with bridges
  addFeedHoles: z.boolean().optional(),  // Add entry/exit holes for LED wiring
  feedHoleDiameter: z.number().min(3).max(12).optional(),  // Diameter of feed holes
});

export type GeometrySettings = z.infer<typeof geometrySettingsSchema>;

export const neonTubeSizes = ["8mm", "10mm", "12mm", "15mm", "custom"] as const;
export type NeonTubeSize = typeof neonTubeSizes[number];

export const lightTypes = ["led_strip", "filament"] as const;
export type LightType = typeof lightTypes[number];

export const tubeSettingsSchema = z.object({
  neonTubeSize: z.enum(neonTubeSizes).optional(),
  neonTubeDiameter: z.number().min(6).max(20),
  channelDepth: z.number().min(10).max(40),
  filamentDiameter: z.number().min(8).max(20),
  wallThickness: z.number().min(1).max(5),
  wallHeight: z.number().min(5).max(30),
  tubeWidth: z.number().min(15).max(50),
  enableOverlay: z.boolean(),
  overlayThickness: z.number().min(1).max(5),
  continuousPath: z.boolean(),
  channelType: z.enum(lightTypes).optional(),
});

export type TubeSettings = z.infer<typeof tubeSettingsSchema>;

export const sketchPathSchema = z.object({
  id: z.string(),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  closed: z.boolean(),
});

export type SketchPath = z.infer<typeof sketchPathSchema>;

export const inputModes = ["text", "draw", "image", "pettag", "modular", "neontube", "backingplate"] as const;
export type InputMode = typeof inputModes[number];

// Pet Tag specific types
export const petTagShapes = ["bone", "round", "heart", "rectangle", "military", "paw"] as const;
export type PetTagShape = typeof petTagShapes[number];

// Hang positions for the attachment loop
export const hangPositions = ["top", "top-left", "top-right", "left", "right"] as const;
export type HangPosition = typeof hangPositions[number];

export const petTagSettingsSchema = z.object({
  petName: z.string().min(0).max(20),
  tagShape: z.enum(petTagShapes),
  tagWidth: z.number().min(20).max(100),
  tagHeight: z.number().min(15).max(80),
  tagThickness: z.number().min(2).max(10),
  ledChannelEnabled: z.boolean(),
  ledChannelWidth: z.number().min(4).max(12),  // Same range as main neon signs
  ledChannelDepth: z.number().min(4).max(15),  // Wall height for U-channel
  glowInDark: z.boolean(),
  holeEnabled: z.boolean(),
  holeDiameter: z.number().min(3).max(10),
  fontScale: z.number().min(0.5).max(2.0),
  fontId: z.string(),  // Font selection for pet tag text
  hangPosition: z.enum(hangPositions).optional(),  // Where the loop attaches (default: top)
});

export type PetTagSettings = z.infer<typeof petTagSettingsSchema>;

// Modular Shapes (geometric light panels like Nanoleaf)
export const modularShapeTypes = ["hexagon", "triangle", "square", "pentagon", "octagon"] as const;
export type ModularShapeType = typeof modularShapeTypes[number];

export const modularShapeSettingsSchema = z.object({
  shapeType: z.enum(modularShapeTypes),
  edgeLength: z.number().min(30).max(200),  // Length of each edge in mm
  channelWidth: z.number().min(6).max(20),  // Width of the LED channel
  wallHeight: z.number().min(8).max(30),    // Height of channel walls
  wallThickness: z.number().min(1.5).max(4), // Wall thickness
  baseThickness: z.number().min(2).max(6),   // Base plate thickness
  capThickness: z.number().min(1.5).max(4),  // Diffuser cap thickness
  connectorEnabled: z.boolean(),             // Enable edge connectors
  connectorTabWidth: z.number().min(5).max(20), // Width of connector tabs
  connectorTabDepth: z.number().min(2).max(8),  // Depth of connector tabs
  connectorTolerance: z.number().min(0.1).max(0.4), // Fit tolerance
  tileCount: z.number().min(1).max(20),      // Number of tiles to generate
});

export type ModularShapeSettings = z.infer<typeof modularShapeSettingsSchema>;

export const defaultModularShapeSettings: ModularShapeSettings = {
  shapeType: "hexagon",
  edgeLength: 80,
  channelWidth: 12,
  wallHeight: 15,
  wallThickness: 2,
  baseThickness: 3,
  capThickness: 2,
  connectorEnabled: true,
  connectorTabWidth: 10,
  connectorTabDepth: 4,
  connectorTolerance: 0.2,
  tileCount: 1,
};

// Neon Tube (realistic glass tube neon with 3D printed casings)
export const neonTubeSettingsSchema = z.object({
  text: z.string().min(0).max(200),
  fontId: z.string(),
  tubeDiameter: z.number().min(8).max(25),      // Outer diameter of tube
  casingThickness: z.number().min(2).max(5),    // Wall thickness of casing
  diffuserThickness: z.number().min(1.5).max(4), // Diffuser cap thickness
  segmentLength: z.number().min(20).max(100),   // Length of interlocking segments
  interlockEnabled: z.boolean(),                // Enable interlocking connectors
  interlockType: z.enum(["snap", "thread", "friction"]), // Type of connector
  interlockTolerance: z.number().min(0.1).max(0.5), // Fit tolerance
  endCapStyle: z.enum(["flat", "rounded", "dome"]), // End cap style
  mountingClipsEnabled: z.boolean(),            // Add mounting clips
  clipSpacing: z.number().min(50).max(300),     // Distance between clips
  ledChannelDiameter: z.number().min(3).max(12), // Inner LED channel size
  separateDiffuser: z.boolean(),                // Generate separate diffuser pieces
  tubeScale: z.number().min(0.5).max(3),        // Overall scale multiplier
});

export type NeonTubeSettings = z.infer<typeof neonTubeSettingsSchema>;

export const defaultNeonTubeSettings: NeonTubeSettings = {
  text: "NEON",
  fontId: "aerioz",
  tubeDiameter: 15,
  casingThickness: 3,
  diffuserThickness: 2,
  segmentLength: 50,
  interlockEnabled: true,
  interlockType: "snap",
  interlockTolerance: 0.2,
  endCapStyle: "rounded",
  mountingClipsEnabled: true,
  clipSpacing: 150,
  ledChannelDiameter: 6,
  separateDiffuser: true,
  tubeScale: 1,
};

// Backing Plate (separate mounting plates for neon signs)
export const backingPlateShapes = ["rectangle", "square", "circle", "rounded-rect", "custom"] as const;
export type BackingPlateShape = typeof backingPlateShapes[number];

export const holePatterns = ["none", "corners", "grid", "perimeter", "custom"] as const;
export type HolePattern = typeof holePatterns[number];

export const backingPlateSettingsSchema = z.object({
  shape: z.enum(backingPlateShapes),
  width: z.number().min(50).max(500),
  height: z.number().min(50).max(500),
  thickness: z.number().min(2).max(10),
  cornerRadius: z.number().min(0).max(50),
  margin: z.number().min(0).max(50),
  holePattern: z.enum(holePatterns),
  holeDiameter: z.number().min(3).max(15),
  holeInset: z.number().min(5).max(50),
  gridSpacing: z.number().min(20).max(100),
  customHoles: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

export type BackingPlateSettings = z.infer<typeof backingPlateSettingsSchema>;

export const defaultBackingPlateSettings: BackingPlateSettings = {
  shape: "rectangle",
  width: 200,
  height: 100,
  thickness: 3,
  cornerRadius: 5,
  margin: 20,
  holePattern: "corners",
  holeDiameter: 5,
  holeInset: 10,
  gridSpacing: 50,
};

export const defaultPetTagSettings: PetTagSettings = {
  petName: "Max",
  tagShape: "bone",
  tagWidth: 45,
  tagHeight: 25,
  tagThickness: 4,
  ledChannelEnabled: true,
  ledChannelWidth: 6,
  ledChannelDepth: 8,
  glowInDark: false,
  holeEnabled: true,
  holeDiameter: 5,
  fontScale: 1.0,
  fontId: "aerioz",  // Default to neon script font
  hangPosition: "top",  // Top center for proper front-facing hang
};

export const letterSettingsSchema = z.object({
  text: z.string().min(0).max(200),
  fontId: z.string(),
  depth: z.number().min(5).max(100),
  scale: z.number().min(0.1).max(10),
  bevelEnabled: z.boolean(),
  bevelThickness: z.number().min(0).max(10),
  bevelSize: z.number().min(0).max(5),
  templateId: z.string().optional(),
  lightDiffuserBevel: z.boolean().optional(),
  diffuserBevelAngle: z.number().min(15).max(60).optional(),
});

export type LetterSettings = z.infer<typeof letterSettingsSchema>;

export const twoPartSystemSchema = z.object({
  enabled: z.boolean(),
  baseWallHeight: z.number().min(5).max(40),
  baseWallThickness: z.number().min(1).max(5),
  capOverhang: z.number().min(0.5).max(3),
  capThickness: z.number().min(1).max(5),
  snapTolerance: z.number().min(0.1).max(0.5),
  snapTabsEnabled: z.boolean(),
  snapTabHeight: z.number().min(1).max(4),
  snapTabWidth: z.number().min(2).max(8),
  snapTabSpacing: z.number().min(10).max(50),
  chamferAngle: z.number().min(30).max(60),
  registrationPinsEnabled: z.boolean(),
  pinDiameter: z.number().min(1.5).max(4),
  pinHeight: z.number().min(2).max(6),
  pinSpacing: z.number().min(15).max(60),
  diffusionRibsEnabled: z.boolean(),
  ribHeight: z.number().min(0.5).max(2),
  ribSpacing: z.number().min(3).max(10),
  cableChannelEnabled: z.boolean(),
  cableChannelWidth: z.number().min(3).max(8),
  cableChannelDepth: z.number().min(2).max(5),
});

export type TwoPartSystem = z.infer<typeof twoPartSystemSchema>;

export const defaultTwoPartSystem: TwoPartSystem = {
  enabled: true,
  baseWallHeight: 15,
  baseWallThickness: 2,
  capOverhang: 1,
  capThickness: 2,
  snapTolerance: 0.2,
  snapTabsEnabled: true,
  snapTabHeight: 2,
  snapTabWidth: 4,
  snapTabSpacing: 25,
  chamferAngle: 45,
  registrationPinsEnabled: true,
  pinDiameter: 2.5,
  pinHeight: 3,
  pinSpacing: 30,
  diffusionRibsEnabled: true,
  ribHeight: 1,
  ribSpacing: 5,
  cableChannelEnabled: true,
  cableChannelWidth: 5,
  cableChannelDepth: 3,
};

export const wiringSettingsSchema = z.object({
  channelType: z.enum(wiringChannelTypes),
  channelDiameter: z.number().min(3).max(20),
  channelDepth: z.number().min(0).max(100),
  channelWidth: z.number().min(5).max(30).optional(),
  ledCount: z.number().min(1).max(100).optional(),
});

export type WiringSettings = z.infer<typeof wiringSettingsSchema>;

export const mountingSettingsSchema = z.object({
  pattern: z.enum(mountingHolePatterns),
  holeDiameter: z.number().min(2).max(10),
  holeDepth: z.number().min(5).max(50),
  holeCount: z.number().min(0).max(8),
  insetFromEdge: z.number().min(2).max(20),
});

export type MountingSettings = z.infer<typeof mountingSettingsSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  letterSettings: letterSettingsSchema,
  geometrySettings: geometrySettingsSchema,
  wiringSettings: wiringSettingsSchema,
  mountingSettings: mountingSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

export const insertProjectSchema = projectSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const defaultLetterSettings: LetterSettings = {
  text: "A",
  fontId: "inter",
  depth: 20,
  scale: 1,
  bevelEnabled: true,
  bevelThickness: 2,
  bevelSize: 1,
  templateId: "none",
  lightDiffuserBevel: false,
  diffuserBevelAngle: 45,
};

export const defaultWiringSettings: WiringSettings = {
  channelType: "none",
  channelDiameter: 6,
  channelDepth: 4,
  channelWidth: 12,
  ledCount: 10,
};

export const defaultMountingSettings: MountingSettings = {
  pattern: "none",
  holeDiameter: 4,
  holeDepth: 15,
  holeCount: 4,
  insetFromEdge: 8,
};

export const defaultGeometrySettings: GeometrySettings = {
  mode: "raised",
  letterHeight: 15,
  backingThickness: 5,
  letterOffset: 0,
  letterMaterial: "transparent",
  backingMaterial: "opaque",
  separateFiles: true,
  enableBacking: true,
};

export const defaultTubeSettings: TubeSettings = {
  neonTubeSize: "12mm",
  neonTubeDiameter: 12,
  channelDepth: 20,
  filamentDiameter: 12,
  wallThickness: 2,
  wallHeight: 15,
  tubeWidth: 25,
  enableOverlay: true,
  overlayThickness: 2,
  continuousPath: true,
  channelType: "filament",
};

export { users, insertUserSchema } from "./users";
export type { InsertUser, User } from "./users";
