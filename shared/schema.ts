import { z } from "zod";

export const fontOptions = [
  { id: "inter", name: "Inter", family: "Inter" },
  { id: "roboto", name: "Roboto", family: "Roboto" },
  { id: "poppins", name: "Poppins", family: "Poppins" },
  { id: "montserrat", name: "Montserrat", family: "Montserrat" },
  { id: "open-sans", name: "Open Sans", family: "Open Sans" },
  { id: "playfair", name: "Playfair Display", family: "Playfair Display" },
  { id: "merriweather", name: "Merriweather", family: "Merriweather" },
  { id: "lora", name: "Lora", family: "Lora" },
  { id: "space-grotesk", name: "Space Grotesk", family: "Space Grotesk" },
  { id: "outfit", name: "Outfit", family: "Outfit" },
  { id: "architects-daughter", name: "Architects Daughter", family: "Architects Daughter" },
  { id: "oxanium", name: "Oxanium", family: "Oxanium" },
] as const;

export type FontOption = typeof fontOptions[number];

export const wiringChannelTypes = ["none", "center", "back", "custom"] as const;
export type WiringChannelType = typeof wiringChannelTypes[number];

export const mountingHolePatterns = ["none", "2-point", "4-corner", "6-point", "custom"] as const;
export type MountingHolePattern = typeof mountingHolePatterns[number];

export const exportFormats = ["stl", "obj", "3mf"] as const;
export type ExportFormat = typeof exportFormats[number];

export const geometryModes = ["raised", "stencil", "layered", "flat"] as const;
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
});

export type GeometrySettings = z.infer<typeof geometrySettingsSchema>;

export const letterSettingsSchema = z.object({
  text: z.string().min(1).max(10),
  fontId: z.string(),
  depth: z.number().min(5).max(100),
  scale: z.number().min(0.1).max(10),
  bevelEnabled: z.boolean(),
  bevelThickness: z.number().min(0).max(10),
  bevelSize: z.number().min(0).max(5),
});

export type LetterSettings = z.infer<typeof letterSettingsSchema>;

export const wiringSettingsSchema = z.object({
  channelType: z.enum(wiringChannelTypes),
  channelDiameter: z.number().min(3).max(20),
  channelDepth: z.number().min(0).max(100),
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
};

export const defaultWiringSettings: WiringSettings = {
  channelType: "none",
  channelDiameter: 6,
  channelDepth: 15,
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
};

export { users, insertUserSchema } from "./users";
export type { InsertUser, User } from "./users";
