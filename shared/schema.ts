import { z } from "zod";

export const fontOptions = [
  { id: "aguafina-script", name: "Aguafina Script", family: "Aguafina Script" },
  { id: "alex-brush", name: "Alex Brush", family: "Alex Brush" },
  { id: "allison", name: "Allison", family: "Allison" },
  { id: "allura", name: "Allura", family: "Allura" },
  { id: "amatic-sc", name: "Amatic SC", family: "Amatic SC" },
  { id: "amita", name: "Amita", family: "Amita" },
  { id: "annie-use-your-telescope", name: "Annie Use Your Telescope", family: "Annie Use Your Telescope" },
  { id: "architects-daughter", name: "Architects Daughter", family: "Architects Daughter" },
  { id: "archivo-black", name: "Archivo Black", family: "Archivo Black" },
  { id: "archivo-narrow", name: "Archivo Narrow", family: "Archivo Narrow" },
  { id: "are-you-serious", name: "Are You Serious", family: "Are You Serious" },
  { id: "arizonia", name: "Arizonia", family: "Arizonia" },
  { id: "babylonica", name: "Babylonica", family: "Babylonica" },
  { id: "bad-script", name: "Bad Script", family: "Bad Script" },
  { id: "ballet", name: "Ballet", family: "Ballet" },
  { id: "beau-rivage", name: "Beau Rivage", family: "Beau Rivage" },
  { id: "berkshire-swash", name: "Berkshire Swash", family: "Berkshire Swash" },
  { id: "beth-ellen", name: "Beth Ellen", family: "Beth Ellen" },
  { id: "bilbo", name: "Bilbo", family: "Bilbo" },
  { id: "bilbo-swash-caps", name: "Bilbo Swash Caps", family: "Bilbo Swash Caps" },
  { id: "birthstone", name: "Birthstone", family: "Birthstone" },
  { id: "birthstone-bounce", name: "Birthstone Bounce", family: "Birthstone Bounce" },
  { id: "bonbon", name: "Bonbon", family: "Bonbon" },
  { id: "bonheur-royale", name: "Bonheur Royale", family: "Bonheur Royale" },
  { id: "borel", name: "Borel", family: "Borel" },
  { id: "butterfly-kids", name: "Butterfly Kids", family: "Butterfly Kids" },
  { id: "calligraffitti", name: "Calligraffitti", family: "Calligraffitti" },
  { id: "caramel", name: "Caramel", family: "Caramel" },
  { id: "cause", name: "Cause", family: "Cause" },
  { id: "caveat", name: "Caveat", family: "Caveat" },
  { id: "caveat-brush", name: "Caveat Brush", family: "Caveat Brush" },
  { id: "cedarville-cursive", name: "Cedarville Cursive", family: "Cedarville Cursive" },
  { id: "charm", name: "Charm", family: "Charm" },
  { id: "charmonman", name: "Charmonman", family: "Charmonman" },
  { id: "chilanka", name: "Chilanka", family: "Chilanka" },
  { id: "edu-nsw-act-cursive", name: "EDU NSW ACT Cursive", family: "EDU NSW ACT Cursive" },
  { id: "hershey-sans", name: "Hershey Sans", family: "Hershey Sans" },
  { id: "hershey-script", name: "Hershey Script", family: "Hershey Script" },
  { id: "inter", name: "Inter", family: "Inter" },
  { id: "inter-tight", name: "Inter Tight", family: "Inter Tight" },
  { id: "lora", name: "Lora", family: "Lora" },
  { id: "montserrat", name: "Montserrat", family: "Montserrat" },
  { id: "neonderthaw", name: "Neonderthaw", family: "Neonderthaw" },
  { id: "open-sans", name: "Open Sans", family: "Open Sans" },
  { id: "outfit", name: "Outfit", family: "Outfit" },
  { id: "playfair-display", name: "Playfair Display", family: "Playfair Display" },
  { id: "recursive", name: "Recursive", family: "Recursive" },
  { id: "tilt-neon", name: "Tilt Neon", family: "Tilt Neon" },
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

export const inputModes = ["text", "draw", "image", "pettag", "modular", "neontube", "backingplate", "shoestring", "neonshapes", "presets", "custom", "retro", "ledholder", "eggison", "relief"] as const;
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

// Connector types for modular panels - male tabs protrude, female slots receive
export const connectorTypes = ["male", "female"] as const;
export type ConnectorType = typeof connectorTypes[number];

// Diffuser types - outline (edge only) or shell (full cover)
export const diffuserTypes = ["outline", "shell"] as const;
export type DiffuserType = typeof diffuserTypes[number];

export const modularShapeSettingsSchema = z.object({
  shapeType: z.enum(modularShapeTypes),
  edgeLength: z.number().min(30).max(200),  // Length of each edge in mm
  channelWidth: z.number().min(6).max(20),  // Width of the LED channel
  wallHeight: z.number().min(8).max(30),    // Height of channel walls
  wallThickness: z.number().min(1.5).max(4), // Wall thickness
  baseThickness: z.number().min(2).max(6),   // Base plate thickness
  capThickness: z.number().min(1.5).max(4),  // Diffuser cap thickness
  diffuserType: z.enum(diffuserTypes),       // Outline (edge only) or Shell (full cover)
  connectorEnabled: z.boolean(),             // Enable edge connectors
  connectorType: z.enum(connectorTypes),     // Male (tabs) or Female (slots)
  connectorTabWidth: z.number().min(5).max(20), // Width of connector tabs/slots
  connectorTabDepth: z.number().min(2).max(8),  // Depth of connector tabs/slots
  connectorTolerance: z.number().min(0.1).max(0.4), // Fit tolerance for snap fit
  tileCount: z.number().min(1).max(20),      // Number of tiles to generate
  framedDiffuser: z.boolean(),               // Generate framed diffuser cap that covers entire panel
  frameWidth: z.number().min(2).max(10),     // Width of the frame around diffuser
  frameSnapFit: z.boolean(),                 // Add snap-fit clips to frame
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
  diffuserType: "shell",
  connectorEnabled: true,
  connectorType: "male",
  connectorTabWidth: 10,
  connectorTabDepth: 4,
  connectorTolerance: 0.2,
  tileCount: 1,
  framedDiffuser: false,
  frameWidth: 4,
  frameSnapFit: true,
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
export const backingPlateShapes = ["rectangle", "square", "circle", "rounded-rect", "hexagon", "custom"] as const;
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

// Neon Shapes (Simple iconic neon signs with primitive shapes)
export const neonShapesSettingsSchema = z.object({
  shapeType: z.string(),                              // Shape from neon-shapes library
  size: z.number().min(50).max(300),                  // Overall size in mm
  tubeDiameter: z.number().min(8).max(25),            // Neon tube diameter
  
  // Tube Design
  splitTube: z.boolean(),                             // Split tube in half for easy LED insertion
  snapFit: z.boolean(),                               // Add snap-fit clips (vs screws)
  
  // Diffuser Cap
  includeDiffuser: z.boolean(),                       // Add diffuser cap over shape
  diffuserType: z.enum(diffuserTypes),                // Shell (full cover) or Outline (edge only)
  diffuserThickness: z.number().min(1.5).max(4),      // Diffuser cap thickness
  
  // LED Type
  ledType: z.enum(["neon_strip", "ws2812b", "attiny", "el_wire", "standard_3mm", "standard_5mm"]),
  ledChannel: z.boolean(),                            // Add LED channel in tube
  ledChannelDiameter: z.number().min(3).max(12),      // LED channel size
  
  // Base/Holder
  baseStyle: z.enum(["cylinder", "round", "square"]), // Base style
  baseDiameter: z.number().min(40).max(150),          // Base diameter/width
  baseHeight: z.number().min(10).max(40),             // Base height
  tubeHolderHeight: z.number().min(20).max(80),       // Height of tube holder above base
  tubeHolderDiameter: z.number().min(15).max(40),     // Diameter of tube holder
  mountingHole: z.boolean(),                          // Add mounting hole in base
  mountingHoleDiameter: z.number().min(3).max(10),    // Mounting hole size
  
  // Border/Frame
  includeBorder: z.boolean(),                         // Add decorative border around sign
  borderOffset: z.number().min(10).max(50),           // Distance from sign to border
  borderStyle: z.enum(["simple", "art_deco", "vintage", "modern"]),
  borderThickness: z.number().min(5).max(20),         // Border tube thickness
  
  // Backing Plate
  includeBackingPlate: z.boolean(),                   // Auto-generate backing plate
  backingPlateMargin: z.number().min(20).max(100),    // Margin around sign
  backingPlateThickness: z.number().min(3).max(10),   // Plate thickness
  backingPlateMountingHoles: z.boolean(),             // Add mounting holes to plate
  
  // Controller Housing
  includeController: z.boolean(),                     // Generate controller housing
  controllerType: z.enum(["555_timer", "ws2812b_esp32", "ws2812b_arduino", "attiny", "el_wire", "simple_led"]),
  controllerPowerSource: z.enum(["usb_5v", "battery_4xaa", "usb_battery_dual", "barrel_jack_12v"]),
  
  // Wire Management
  wireChannels: z.boolean(),                          // Add wire routing channels
  wireChannelWidth: z.number().min(3).max(10),        // Wire channel width
});

export type NeonShapesSettings = z.infer<typeof neonShapesSettingsSchema>;

export const defaultNeonShapesSettings: NeonShapesSettings = {
  shapeType: "heart",
  size: 120,
  tubeDiameter: 15,
  
  // Tube Design
  splitTube: true,
  snapFit: true,
  
  // Diffuser Cap
  includeDiffuser: true,
  diffuserType: "shell",
  diffuserThickness: 2,
  
  // LED Type
  ledType: "neon_strip",
  ledChannel: true,
  ledChannelDiameter: 8,
  
  // Base/Holder
  baseStyle: "cylinder",
  baseDiameter: 80,
  baseHeight: 20,
  tubeHolderHeight: 40,
  tubeHolderDiameter: 20,
  mountingHole: true,
  mountingHoleDiameter: 5,
  
  // Border/Frame
  includeBorder: false,
  borderOffset: 20,
  borderStyle: "simple",
  borderThickness: 10,
  
  // Backing Plate
  includeBackingPlate: true,
  backingPlateMargin: 30,
  backingPlateThickness: 5,
  backingPlateMountingHoles: true,
  
  // Controller Housing
  includeController: true,
  controllerType: "555_timer",
  controllerPowerSource: "usb_battery_dual",
  
  // Wire Management
  wireChannels: true,
  wireChannelWidth: 5,
};

// Shoe String Mode (Pop Culture Image Tracer)
export const shoeStringSettingsSchema = z.object({
  simplificationLevel: z.number().min(1).max(10),     // How loose/simplified the trace is
  edgeThreshold: z.number().min(1).max(255),          // Edge detection sensitivity
  minPathLength: z.number().min(5).max(100),          // Minimum path length to keep
  tubeDiameter: z.number().min(8).max(25),            // Neon tube diameter
  tubeStyle: z.enum(["outline", "filled", "sketch"]), // Rendering style
  autoSimplify: z.boolean(),                          // Auto-simplify complex paths
  preserveDetails: z.boolean(),                       // Keep fine details vs smooth curves
  invertColors: z.boolean(),                          // Invert image before tracing
});

export type ShoeStringSettings = z.infer<typeof shoeStringSettingsSchema>;

export const defaultShoeStringSettings: ShoeStringSettings = {
  simplificationLevel: 5,
  edgeThreshold: 128,
  minPathLength: 20,
  tubeDiameter: 15,
  tubeStyle: "outline",
  autoSimplify: true,
  preserveDetails: false,
  invertColors: false,
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
  text: z.string().min(1).max(100),
  fontId: z.string(),
  depth: z.number().min(5).max(100),
  scale: z.number().min(0.1).max(5),
  bevelEnabled: z.boolean(),
  bevelThickness: z.number().min(0).max(10),
  bevelSize: z.number().min(0).max(10),
  templateId: z.string(),
  lightDiffuserBevel: z.boolean().optional(),
  diffuserBevelAngle: z.number().min(15).max(75).optional(),
  centerlineMode: z.boolean().optional(), // Use skeletonization for single-stroke neon paths
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
  text: "",
  fontId: "aguafina-script",
  depth: 20,
  scale: 1,
  bevelEnabled: true,
  bevelThickness: 2,
  bevelSize: 1,
  templateId: "none",
  lightDiffuserBevel: false,
  diffuserBevelAngle: 45,
  centerlineMode: false, // Default OFF - experimental feature, opt-in only
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

// Controller Housing (Electronics enclosures for LED drivers)
export const controllerHousingSettingsSchema = z.object({
  controllerType: z.enum(["555_timer", "ws2812b_esp32", "ws2812b_arduino", "attiny", "el_wire", "simple_led"]),
  powerSource: z.enum(["usb_5v", "battery_4xaa", "usb_battery_dual", "barrel_jack_12v", "screw_terminal"]),
  includeSwitch: z.boolean(),
  includePotentiometer: z.boolean(),
  outputConnectors: z.number().min(1).max(8),
  housingStyle: z.enum(["compact", "standard", "spacious"]),
  mountingStyle: z.enum(["screws", "clips", "magnets"]),
  ventilation: z.boolean(),
  accessPanel: z.boolean(),
  wallThickness: z.number().min(1.5).max(4),
  cornerRadius: z.number().min(0).max(10),
});

export type ControllerHousingSettings = z.infer<typeof controllerHousingSettingsSchema>;

export const defaultControllerHousingSettings: ControllerHousingSettings = {
  controllerType: "555_timer",
  powerSource: "usb_battery_dual",
  includeSwitch: true,
  includePotentiometer: true,
  outputConnectors: 1,
  housingStyle: "standard",
  mountingStyle: "screws",
  ventilation: true,
  accessPanel: true,
  wallThickness: 2,
  cornerRadius: 3,
};

// Import and re-export types from modular type files
export {
  type RetroNeonSettings,
  type EdisonBulbSettings,
  type NeonSignSettings,
  type ElectronicsHousingSettings,
  defaultRetroNeonSettings,
  defaultEdisonBulbSettings,
  defaultNeonSignSettings,
  defaultElectronicsHousingSettings,
  retroNeonSettingsSchema,
  edisonBulbSettingsSchema,
  neonSignSettingsSchema,
  electronicsHousingSettingsSchema,
  primitiveShapes,
  type PrimitiveShape,
  classicBulbShapes,
  type ClassicBulbShape,
  shellShapeTypes,
  type ShellShapeType,
  glassMaterialTypes,
  type GlassMaterialType,
  screwBaseTypes,
  type ScrewBaseType,
  standTypes,
  type StandType,
} from "./retro-neon-types";

export {
  type LEDHolderSettings,
  type LEDHolderLedType,
  type LEDHolderStyle,
  type LEDHolderMountType,
  defaultLEDHolderSettings,
  ledHolderSettingsSchema,
  ledHolderLedTypes,
  ledHolderStyles,
  ledHolderMountTypes,
} from "./led-holder-types";

export {
  type CustomShapeSettings,
  type CustomInputMode,
  type LedStripType,
  defaultCustomShapeSettings,
  customShapeSettingsSchema,
  customInputModes,
  ledStripTypes,
} from "./custom-shape-types";

export {
  eggisonShellStyles,
  eggisonBaseTypes,
  eggisonLightTypes,
  eggisonSettingsSchema,
  defaultEggisonSettings,
  eggisonBulbsSettingsSchema,
  defaultEggisonBulbsSettings,
} from "./eggison-bulbs-types";
export type {
  EggisonShellStyle,
  EggisonBaseType,
  EggisonLightType,
  EggisonSettings,
  EggisonBulbsSettings,
} from "./eggison-bulbs-types";

export { users, insertUserSchema } from "./users";
export type { InsertUser, User } from "./users";
export { neonShapes, neonShapeTypes } from "./neon-shapes";
export type { NeonShapeType, NeonShapeDefinition } from "./neon-shapes";
export { controllerTypes, controllerConfigs, componentLibrary } from "./controller-specs";
export type { ControllerType, ControllerConfig, ComponentDimensions } from "./controller-specs";
