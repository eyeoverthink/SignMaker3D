import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSignage, generateMultiPartExport, generateTwoPartExport, type ExportedPart } from "./stl-generator";
import { generateNeonSignV2 } from "./stl-generator-v2";
import { generatePetTagV2 } from "./pet-tag-generator";
import { generateModularShape } from "./stl-generator-v2";
import { generateEggisonBulb } from "./eggison-bulbs-generator";
import { generateRetroNeonSTL } from "./retro-neon-generator";
import { generateLEDHolder } from "./led-holder-generator";
import { twoPartSystemSchema, defaultTwoPartSystem, petTagSettingsSchema, modularShapeSettingsSchema, eggisonSettingsSchema, retroNeonSettingsSchema, ledHolderSettingsSchema } from "@shared/schema";
import {
  letterSettingsSchema,
  geometrySettingsSchema,
  wiringSettingsSchema,
  mountingSettingsSchema,
  tubeSettingsSchema,
  insertProjectSchema,
  fontOptions,
  baseTemplates,
  defaultGeometrySettings,
  defaultWiringSettings,
  defaultMountingSettings,
  defaultTubeSettings,
} from "@shared/schema";
import { z } from "zod";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import opentype from "opentype.js";

const fontFileMap: Record<string, string> = {
  "aerioz": "Aerioz-Demo.otf",
  "airstream": "Airstream.ttf",
  "airstream-nf": "AirstreamNF.ttf",
  "alliston": "Alliston-Demo.ttf",
  "cookiemonster": "Cookiemonster.ttf",
  "darlington": "Darlington-Demo.ttf",
  "dirtyboy": "Dirtyboy.ttf",
  "future-light": "FutureLight.ttf",
  "future-light-italic": "FutureLightItalic.ttf",
  "halimun": "Halimun.ttf",
  "hershey-sans": "Inter-Bold.ttf",
  "hershey-script": "Inter-Bold.ttf",
  "inter": "Inter-Bold.ttf",
  "roboto": "Roboto-Bold.ttf",
  "poppins": "Poppins-Bold.ttf",
  "montserrat": "Montserrat-Bold.ttf",
  "open-sans": "OpenSans-Bold.ttf",
  "playfair": "PlayfairDisplay-Bold.ttf",
  "merriweather": "Merriweather-Bold.ttf",
  "lora": "Lora-Bold.ttf",
  "space-grotesk": "SpaceGrotesk-Bold.ttf",
  "outfit": "Outfit-Bold.ttf",
  "architects-daughter": "ArchitectsDaughter-Regular.ttf",
  "oxanium": "Oxanium-Bold.ttf",
};

const sketchPathSchema = z.object({
  id: z.string(),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  closed: z.boolean(),
});

const exportRequestSchema = z.object({
  letterSettings: letterSettingsSchema,
  geometrySettings: geometrySettingsSchema.partial().optional(),
  wiringSettings: wiringSettingsSchema.partial().optional(),
  mountingSettings: mountingSettingsSchema.partial().optional(),
  tubeSettings: tubeSettingsSchema.partial().optional(),
  twoPartSystem: twoPartSystemSchema.partial().optional(),
  sketchPaths: z.array(sketchPathSchema).optional(),
  inputMode: z.enum(["text", "draw", "image"]).optional(),
  format: z.enum(["stl", "obj", "3mf"]).default("stl"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/fonts", express.static(path.join(process.cwd(), "public/fonts")));

  app.get("/api/fonts", (_req, res) => {
    res.json(fontOptions);
  });

  app.get("/api/fonts/:fontId/file", (req, res) => {
    const fontId = req.params.fontId;
    const fileName = fontFileMap[fontId];
    if (!fileName) {
      return res.status(404).json({ error: "Font not found" });
    }
    const filePath = path.join(process.cwd(), "public/fonts", fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Font file not found" });
    }
    res.setHeader("Content-Type", "font/ttf");
    fs.createReadStream(filePath).pipe(res);
  });

  app.get("/api/templates", (_req, res) => {
    res.json(baseTemplates);
  });

  app.get("/api/templates/:id/download", (req, res) => {
    const templateId = req.params.id;
    const format = (req.query.format as string) || "stl";
    
    const templateFiles: Record<string, string> = {
      "hex-base": "hex-light-base_1768296418145.stl",
      "triangle-base": "triangle-base_1768296478797.stl",
      "wall-hanging": "wallhanging-lid_1768296478798.stl",
      "control-box": "control-base_1768296478796.stl",
    };
    
    const fileName = templateFiles[templateId];
    if (!fileName) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    const filePath = path.join(process.cwd(), "server/templates", fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Template file not found" });
    }
    
    res.setHeader("Content-Disposition", `attachment; filename="${templateId}.${format}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });

  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const parsed = insertProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const project = await storage.createProject(parsed.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.post("/api/export", async (req, res) => {
    try {
      const parsed = exportRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { letterSettings, format } = parsed.data;
      const geometrySettings = { ...defaultGeometrySettings, ...parsed.data.geometrySettings } as typeof defaultGeometrySettings;
      const wiringSettings = { ...defaultWiringSettings, ...parsed.data.wiringSettings } as typeof defaultWiringSettings;
      const mountingSettings = { ...defaultMountingSettings, ...parsed.data.mountingSettings } as typeof defaultMountingSettings;
      const tubeSettings = { ...defaultTubeSettings, ...parsed.data.tubeSettings } as typeof defaultTubeSettings;
      const twoPartSystem = { ...defaultTwoPartSystem, ...parsed.data.twoPartSystem } as typeof defaultTwoPartSystem;
      const sketchPaths = parsed.data.sketchPaths || [];
      const inputMode = parsed.data.inputMode || "text";
      
      console.log(`[Export] inputMode: ${inputMode}, sketchPaths count: ${sketchPaths.length}`);
      console.log(`[Export] twoPartSystem.enabled: ${twoPartSystem.enabled}, geometrySettings.mode: ${geometrySettings.mode}, format: ${format}`);
      console.log(`[Export] tubeSettings: diameter=${tubeSettings.neonTubeDiameter}, wallHeight=${tubeSettings.wallHeight}`);
      console.log(`[Export] twoPartSystem: wallHeight=${twoPartSystem.baseWallHeight}, wallThickness=${twoPartSystem.baseWallThickness}`);
      if (sketchPaths.length > 0) {
        console.log(`[Export] First path has ${sketchPaths[0].points.length} points`);
      }

      // Use V2 generator for draw/image modes with sketch paths, or for outline mode with two-part system
      const useV2Generator = (inputMode === "draw" || inputMode === "image") && sketchPaths.length > 0;
      const useOutlineMode = twoPartSystem.enabled && geometrySettings.mode === "outline";
      
      // Note: V2 generator outputs STL format; if 3MF requested, we'll output STL instead
      const actualFormat = (useV2Generator && format === "3mf") ? "stl" : format;
      
      if (useV2Generator || useOutlineMode) {
        const exportedParts = generateNeonSignV2(
          letterSettings,
          tubeSettings,
          twoPartSystem,
          (actualFormat === "3mf" ? "stl" : actualFormat) as "stl" | "obj",
          sketchPaths,
          inputMode,
          {
            mirrorX: geometrySettings.mirrorX || false,
            generateDiffuserCap: geometrySettings.generateDiffuserCap || false,
            weldLetters: geometrySettings.weldLetters || false,
            addFeedHoles: geometrySettings.addFeedHoles || false,
            feedHoleDiameter: geometrySettings.feedHoleDiameter || 5,
            // Snap-fit tabs
            snapTabsEnabled: twoPartSystem.snapTabsEnabled || false,
            snapTabHeight: twoPartSystem.snapTabHeight || 2,
            snapTabWidth: twoPartSystem.snapTabWidth || 4,
            snapTabSpacing: twoPartSystem.snapTabSpacing || 25,
            // Registration pins
            registrationPinsEnabled: twoPartSystem.registrationPinsEnabled || false,
            pinDiameter: twoPartSystem.pinDiameter || 2.5,
            pinHeight: twoPartSystem.pinHeight || 3,
            pinSpacing: twoPartSystem.pinSpacing || 30
          }
        );

        if (exportedParts.length > 0) {
          const fileSlug = inputMode === "text" 
            ? letterSettings.text.replace(/\s/g, "_").substring(0, 20)
            : inputMode === "draw" ? "freehand_drawing" : "traced_image";
          const zipFilename = `${fileSlug}_2part_neon_sign.zip`;
          
          res.setHeader("Content-Type", "application/zip");
          res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
          res.setHeader("X-Multi-Part-Export", "true");
          res.setHeader("X-Part-Count", exportedParts.length.toString());
          res.setHeader("X-Two-Part-System", "true");
          
          const archive = archiver("zip", { zlib: { level: 9 } });
          
          archive.on("error", (err) => {
            console.error("Archive error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Failed to create archive" });
            }
          });
          
          res.on("close", () => {
            archive.abort();
          });
          
          archive.pipe(res);
          
          const manifestData = {
            version: "1.0",
            type: "two_part_neon_sign",
            description: "Base holds the light with walls on both sides. Cap snaps on top as diffuser.",
            parts: exportedParts.map(part => ({
              filename: part.filename,
              partType: part.partType,
              material: part.material,
              printNotes: part.partType === "base" 
                ? "Print in opaque material to hold LED/neon light" 
                : "Print in translucent/diffuser material for light diffusion"
            })),
          };
          
          for (const part of exportedParts) {
            if (Buffer.isBuffer(part.content)) {
              archive.append(part.content, { name: part.filename });
            } else {
              archive.append(part.content, { name: part.filename });
            }
          }
          
          archive.append(JSON.stringify(manifestData, null, 2), { name: "manifest.json" });
          await archive.finalize();
          return;
        }
      }

      const shouldExportSeparate = (geometrySettings.separateFiles && 
        (geometrySettings.mode === "layered" || geometrySettings.mode === "raised")) ||
        (geometrySettings.mode === "outline" && tubeSettings.enableOverlay);

      if (shouldExportSeparate && format !== "3mf") {
        const exportedParts = generateMultiPartExport(
          letterSettings,
          geometrySettings,
          wiringSettings,
          mountingSettings,
          format as "stl" | "obj",
          tubeSettings
        );

        const textSlug = letterSettings.text.replace(/\s/g, "_");
        const zipFilename = `${textSlug}_multipart_${geometrySettings.mode}.zip`;
        
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
        res.setHeader("X-Multi-Part-Export", "true");
        res.setHeader("X-Part-Count", exportedParts.length.toString());
        
        const archive = archiver("zip", { zlib: { level: 9 } });
        
        archive.on("error", (err) => {
          console.error("Archive error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to create archive" });
          }
        });
        
        res.on("close", () => {
          archive.abort();
        });
        
        archive.pipe(res);
        
        const manifestData = {
          version: "1.0",
          mode: geometrySettings.mode,
          letterMaterial: geometrySettings.letterMaterial,
          backingMaterial: geometrySettings.backingMaterial,
          parts: exportedParts.map(part => ({
            filename: part.filename,
            partType: part.partType,
            material: part.material,
          })),
        };
        
        for (const part of exportedParts) {
          if (Buffer.isBuffer(part.content)) {
            archive.append(part.content, { name: part.filename });
          } else {
            archive.append(part.content, { name: part.filename });
          }
        }
        
        archive.append(JSON.stringify(manifestData, null, 2), { name: "manifest.json" });
        await archive.finalize();
        return;
      }

      const result = generateSignage(
        letterSettings,
        wiringSettings,
        mountingSettings,
        format,
        geometrySettings,
        tubeSettings
      );

      const filename = `${letterSettings.text.replace(/\s/g, "_")}_signage.${format}`;

      if (format === "obj") {
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(result);
      } else if (format === "3mf") {
        // 3MF is a ZIP file with specific structure
        const archive = archiver("zip", { zlib: { level: 9 } });
        
        archive.on("error", (err) => {
          console.error("3MF Archive error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to create 3MF file" });
          }
        });
        
        res.setHeader("Content-Type", "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        
        archive.pipe(res);
        
        // Add Content_Types.xml (required for 3MF)
        const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
        archive.append(contentTypes, { name: "[Content_Types].xml" });
        
        // Add _rels/.rels (required for 3MF)
        const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
        archive.append(rels, { name: "_rels/.rels" });
        
        // Add the model XML (result contains the model XML)
        archive.append(result, { name: "3D/3dmodel.model" });
        
        await archive.finalize();
        return;
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(result);
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to generate export" });
    }
  });

  app.get("/api/preview/:text", (req, res) => {
    const text = req.params.text || "A";
    const scale = parseFloat(req.query.scale as string) || 1;
    const depth = parseFloat(req.query.depth as string) || 20;

    const charWidth = 30;
    const charHeight = 45;
    const spacing = 5;

    const totalWidth = text.length * (charWidth + spacing) * scale - spacing * scale;
    const totalHeight = charHeight * scale;

    res.json({
      text,
      dimensions: {
        width: Math.round(totalWidth),
        height: Math.round(totalHeight),
        depth: depth,
        unit: "mm",
      },
      estimatedPrintTime: Math.round(text.length * depth * scale * 0.3),
      estimatedMaterial: Math.round(totalWidth * totalHeight * depth * 0.001),
    });
  });

  // Pet tag export endpoint
  app.post("/api/export/pet-tag", async (req, res) => {
    try {
      const result = petTagSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid pet tag settings", details: result.error.errors });
      }
      
      const settings = result.data;
      
      // Import the new V2 generator that creates multi-part mini neon signs
      const { generatePetTagV2 } = await import("./pet-tag-generator");
      const parts = generatePetTagV2(settings);
      
      if (parts.length === 0) {
        return res.status(500).json({ error: "No parts generated" });
      }
      
      // If only one part, return it directly
      if (parts.length === 1) {
        const filename = `${settings.petName || "pet-tag"}-${settings.tagShape}.stl`;
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(parts[0].content);
        return;
      }
      
      // Multiple parts - return as zip
      const zipFilename = `${settings.petName || "pet"}_${settings.tagShape}_mini_neon.zip`;
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
      res.setHeader("X-Multi-Part-Export", "true");
      res.setHeader("X-Part-Count", parts.length.toString());
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      
      archive.on("error", (err) => {
        console.error("Pet tag archive error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to create archive" });
        }
      });
      
      res.on("close", () => {
        archive.abort();
      });
      
      archive.pipe(res);
      
      for (const part of parts) {
        archive.append(part.content, { name: part.filename });
      }
      
      // Add manifest
      const manifest = {
        version: "1.0",
        type: "mini_neon_pet_tag",
        description: "Mini neon sign pet tag with U-channel letters and snap-fit diffuser cap",
        petName: settings.petName,
        shape: settings.tagShape,
        parts: parts.map(p => ({
          filename: p.filename,
          partType: p.partType,
          material: p.material,
          printNotes: p.partType === "base" 
            ? "Print in opaque filament" 
            : "Print in translucent/diffuser filament for light diffusion"
        }))
      };
      
      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      await archive.finalize();
    } catch (error) {
      console.error("Pet tag export error:", error);
      res.status(500).json({ error: "Failed to generate pet tag" });
    }
  });

  // Modular shapes export endpoint (hexagons, triangles, etc.)
  app.post("/api/export/modular-shape", async (req, res) => {
    try {
      const result = modularShapeSettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        console.error("Modular shape validation failed:", result.error.errors);
        return res.status(400).json({ 
          error: "Invalid settings", 
          details: result.error.errors 
        });
      }
      
      const settings = result.data;
      
      // Validation constants matching frontend and schema
      const minChannelWidth = 6;
      const minEdgeLength = 30; // Matches schema minimum
      
      // Server-side validation: enforce minimum channelWidth
      if (settings.channelWidth < minChannelWidth) {
        return res.status(400).json({
          error: "Invalid channel width",
          details: `Channel width (${settings.channelWidth}mm) is below minimum (${minChannelWidth}mm).`
        });
      }
      
      // Server-side validation: channelWidth must not exceed safe limit
      const maxChannelWidth = Math.floor((settings.edgeLength - 10) / 2);
      if (settings.channelWidth > maxChannelWidth) {
        return res.status(400).json({
          error: "Invalid channel width",
          details: `Channel width (${settings.channelWidth}mm) exceeds maximum (${maxChannelWidth}mm) for edge length ${settings.edgeLength}mm. Maximum channel width is (edgeLength - 10) / 2.`
        });
      }
      
      // Validate minimum inner edge length
      const innerEdgeLength = settings.edgeLength - settings.channelWidth * 2;
      if (innerEdgeLength < 10) {
        return res.status(400).json({
          error: "Invalid geometry",
          details: `Inner edge length (${innerEdgeLength}mm) would be less than minimum 10mm. Reduce channel width or increase edge length.`
        });
      }
      
      console.log(`[Modular Export] Shape: ${settings.shapeType}, Edge: ${settings.edgeLength}mm, Channel: ${settings.channelWidth}mm`);
      
      const parts = generateModularShape(settings);
      
      if (parts.length === 0) {
        return res.status(500).json({ error: "No parts generated" });
      }
      
      // Return as zip with base and cap
      const zipFilename = `${settings.shapeType}_tile_${settings.edgeLength}mm.zip`;
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
      res.setHeader("X-Multi-Part-Export", "true");
      res.setHeader("X-Part-Count", parts.length.toString());
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      
      archive.on("error", (err) => {
        console.error("Modular shape archive error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to create archive" });
        }
      });
      
      res.on("close", () => {
        archive.abort();
      });
      
      archive.pipe(res);
      
      for (const part of parts) {
        archive.append(part.content, { name: part.filename });
      }
      
      // Add manifest
      const manifest = {
        version: "1.0",
        type: "modular_light_tile",
        description: "Modular geometric light panel with U-channel and diffuser cap",
        shape: settings.shapeType,
        edgeLength: settings.edgeLength,
        connectors: settings.connectorEnabled,
        parts: parts.map(p => ({
          filename: p.filename,
          partType: p.partType,
          material: p.material,
          printNotes: p.partType === "modular_base" 
            ? "Print in opaque filament" 
            : "Print in translucent/diffuser filament for light diffusion"
        }))
      };
      
      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      await archive.finalize();
    } catch (error) {
      console.error("Modular shape export error:", error);
      res.status(500).json({ error: "Failed to generate modular shape" });
    }
  });

  // Get font stroke paths for neon tube preview
  app.post("/api/fonts/stroke-paths", async (req, res) => {
    try {
      const { text, fontId } = req.body;
      
      if (!text || !fontId) {
        return res.status(400).json({ error: "Text and fontId required" });
      }
      
      const { getTextStrokePaths } = await import("./hershey-fonts");
      const { getTextStrokePathsFromFont } = await import("./font-loader");
      
      let result: any;
      
      // For now, always use Hershey fonts which work reliably
      // TODO: Fix OpenType font path extraction for neon tubes
      console.log(`[API] Getting stroke paths for "${text}" with font ${fontId}`);
      result = getTextStrokePaths(text, 50, 5);
      console.log(`[API] Generated ${result.paths.length} paths`);
      
      res.json(result);
    } catch (error) {
      console.error("Font stroke paths error:", error);
      res.status(500).json({ error: "Failed to get font paths" });
    }
  });

  // Get text paths for custom shape preview (used by Custom Shapes Editor)
  app.post("/api/preview/text-path", (req, res) => {
    try {
      const { text, fontId, fontSize } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const fontFileName = fontFileMap[fontId || "inter"] || "Inter-Bold.ttf";
      
      let fontPath = path.join(process.cwd(), "server/fonts", fontFileName);
      if (!fs.existsSync(fontPath)) {
        fontPath = path.join(process.cwd(), "public/fonts", fontFileName);
      }
      
      if (!fs.existsSync(fontPath)) {
        console.log(`Font not found: ${fontId} -> ${fontFileName}`);
        return res.status(404).json({ error: "Font not found" });
      }
      
      const fontBuffer = fs.readFileSync(fontPath);
      const arrayBuffer = fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength) as ArrayBuffer;
      const font = opentype.parse(arrayBuffer);
      
      const scale = (fontSize || 50) / font.unitsPerEm;
      const paths: { points: { x: number; y: number }[]; closed: boolean }[] = [];
      
      let xOffset = 0;
      for (const char of text) {
        const glyph = font.charToGlyph(char);
        if (!glyph || !glyph.path) {
          xOffset += (glyph?.advanceWidth || font.unitsPerEm * 0.5) * scale;
          continue;
        }
        
        const glyphPath = glyph.getPath(xOffset, 0, fontSize || 50);
        let currentPath: { x: number; y: number }[] = [];
        
        for (const cmd of glyphPath.commands) {
          if (cmd.type === 'M') {
            if (currentPath.length > 0) {
              paths.push({ points: currentPath, closed: false });
            }
            currentPath = [{ x: cmd.x, y: -cmd.y }];
          } else if (cmd.type === 'L') {
            currentPath.push({ x: cmd.x, y: -cmd.y });
          } else if (cmd.type === 'Q') {
            const lastPt = currentPath[currentPath.length - 1];
            for (let t = 0.25; t <= 1; t += 0.25) {
              const mt = 1 - t;
              currentPath.push({
                x: mt * mt * lastPt.x + 2 * mt * t * cmd.x1 + t * t * cmd.x,
                y: -(mt * mt * (-lastPt.y) + 2 * mt * t * cmd.y1 + t * t * cmd.y)
              });
            }
          } else if (cmd.type === 'C') {
            const lastPt = currentPath[currentPath.length - 1];
            for (let t = 0.2; t <= 1; t += 0.2) {
              const mt = 1 - t;
              currentPath.push({
                x: mt * mt * mt * lastPt.x + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x,
                y: -(mt * mt * mt * (-lastPt.y) + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y)
              });
            }
          } else if (cmd.type === 'Z') {
            if (currentPath.length > 0) {
              paths.push({ points: currentPath, closed: true });
              currentPath = [];
            }
          }
        }
        
        if (currentPath.length > 0) {
          paths.push({ points: currentPath, closed: false });
        }
        
        xOffset += (glyph.advanceWidth || font.unitsPerEm * 0.5) * scale;
      }
      
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of paths) {
        for (const pt of p.points) {
          minX = Math.min(minX, pt.x);
          maxX = Math.max(maxX, pt.x);
          minY = Math.min(minY, pt.y);
          maxY = Math.max(maxY, pt.y);
        }
      }
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      for (const p of paths) {
        for (const pt of p.points) {
          pt.x -= centerX;
          pt.y -= centerY;
        }
      }
      
      res.json({
        paths,
        bounds: {
          width: maxX - minX,
          height: maxY - minY,
          centerX: 0,
          centerY: 0
        }
      });
    } catch (error) {
      console.error("Text path preview error:", error);
      res.status(500).json({ error: "Failed to generate text path preview" });
    }
  });

  // Neon tube export endpoint - generates free-floating tube paths
  app.post("/api/export/neon-tube", async (req, res) => {
    try {
      const { neonTubeSettingsSchema } = await import("@shared/schema");
      const result = neonTubeSettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid neon tube settings", 
          details: result.error.errors 
        });
      }
      
      const settings = result.data;
      
      console.log(`[Neon Tube Export] Text: "${settings.text}", Font: ${settings.fontId}, Diameter: ${settings.tubeDiameter}mm`);
      
      const { generateNeonSignV2 } = await import("./stl-generator-v2");
      const { defaultTwoPartSystem } = await import("@shared/schema");
      
      // Convert neon tube settings to letter/tube settings for generator
      const letterSettings = {
        text: settings.text,
        fontId: settings.fontId,
        scale: settings.tubeScale,
        depth: settings.tubeDiameter,
        bevelEnabled: false,
        bevelThickness: 1,
        bevelSize: 0.5,
        templateId: "none",
        lightDiffuserBevel: false,
        diffuserBevelAngle: 45,
        centerlineMode: false,
      };
      
      const tubeSettings = {
        neonTubeDiameter: settings.tubeDiameter,
        wallThickness: settings.casingThickness,
        wallHeight: settings.tubeDiameter + 2,
        channelDepth: settings.tubeDiameter,
        filamentDiameter: settings.ledChannelDiameter,
        tubeWidth: settings.tubeDiameter,
        enableOverlay: settings.separateDiffuser,
        overlayThickness: settings.diffuserThickness,
        continuousPath: true,
      };
      
      const twoPartSystem = {
        ...defaultTwoPartSystem,
        enabled: settings.separateDiffuser,
        baseWallThickness: settings.casingThickness,
        baseWallHeight: settings.tubeDiameter + 2,
        capThickness: settings.diffuserThickness,
        snapTabsEnabled: settings.interlockEnabled,
      };
      
      // Generate tube STL files
      console.log(`[Neon Tube Export] Calling generateNeonSignV2 with:`, {
        text: letterSettings.text,
        fontId: letterSettings.fontId,
        tubeDiameter: tubeSettings.neonTubeDiameter,
        wallHeight: tubeSettings.wallHeight,
        wallThickness: tubeSettings.wallThickness
      });
      
      const parts = generateNeonSignV2(
        letterSettings,
        tubeSettings,
        twoPartSystem,
        "stl",
        [],
        "text",
        {
          weldLetters: true,  // Connect all letters into continuous tube
          addFeedHoles: false,  // No feed holes needed with continuous tube
          simplifyPaths: true  // Merge multiple strokes into single centerlines for clean tubes
        }
      );
      
      console.log(`[Neon Tube Export] Generated ${parts.length} parts:`, parts.map(p => ({ 
        filename: p.filename, 
        size: p.content.length,
        type: p.partType 
      })));
      
      const zipFilename = `${settings.text.replace(/\s/g, "_")}_neon_tubes.zip`;
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
      res.setHeader("X-Multi-Part-Export", "true");
      res.setHeader("X-Part-Count", parts.length.toString());
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      
      archive.on("error", (err) => {
        console.error("Neon tube archive error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to create archive" });
        }
      });
      
      res.on("close", () => {
        archive.abort();
      });
      
      archive.pipe(res);
      
      // Add all generated parts to archive
      for (const part of parts) {
        archive.append(part.content, { name: part.filename });
      }
      
      const manifest = {
        version: "1.0",
        type: "neon_tube_system",
        description: "Free-floating neon tube paths with optional diffuser caps",
        text: settings.text,
        fontId: settings.fontId,
        tubeDiameter: settings.tubeDiameter,
        parts: parts.map(p => ({
          filename: p.filename,
          partType: p.partType,
          material: p.material,
        }))
      };
      
      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      await archive.finalize();
    } catch (error) {
      console.error("Neon tube export error:", error);
      res.status(500).json({ error: "Failed to generate neon tube" });
    }
  });

  // Backing plate export endpoint
  app.post("/api/export/backing-plate", async (req, res) => {
    try {
      const { backingPlateSettingsSchema } = await import("@shared/schema");
      const result = backingPlateSettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid backing plate settings", 
          details: result.error.errors 
        });
      }
      
      const settings = result.data;
      
      console.log(`[Backing Plate Export] ${settings.width}x${settings.height}mm, ${settings.holePattern} holes`);
      
      const { generateBackingPlate } = await import("./backing-plate-generator");
      
      const stlBuffer = generateBackingPlate(settings);
      
      const filename = `backing_plate_${settings.width}x${settings.height}mm.stl`;
      
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(stlBuffer);
      
      console.log(`[Backing Plate Export] Generated ${filename}, ${stlBuffer.length} bytes`);
    } catch (error) {
      console.error("Backing plate export error:", error);
      res.status(500).json({ error: "Failed to generate backing plate" });
    }
  });

  // Helper function for path simplification
  function simplifyPathPoints(points: any[], maxPoints: number): any[] {
    if (points.length <= 2) return points;
    
    // Simple decimation - keep every Nth point
    const step = Math.max(1, Math.floor(points.length / maxPoints));
    const simplified = [];
    
    for (let i = 0; i < points.length; i += step) {
      simplified.push(points[i]);
    }
    
    // Always include last point
    if (simplified[simplified.length - 1] !== points[points.length - 1]) {
      simplified.push(points[points.length - 1]);
    }
    
    return simplified;
  }

  // Shoe string mode export endpoint (pop culture image tracer)
  app.post("/api/export/shoestring", async (req, res) => {
    try {
      const { paths, tubeDiameter, tubeStyle } = req.body;
      
      if (!paths || !Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ 
          error: "Invalid paths data", 
          details: "Paths array is required and must not be empty" 
        });
      }
      
      console.log(`[Shoe String Export] Processing ${paths.length} traced paths, tube diameter: ${tubeDiameter}mm`);
      
      // Filter and sort paths by length to keep only significant ones
      const minPathLength = 10; // Minimum 10 points
      const maxPaths = 50; // Limit to 50 paths max
      const maxPointsPerPath = 200; // Limit points per path
      
      const validPaths = paths
        .filter((p: any) => Array.isArray(p) && p.length >= minPathLength)
        .sort((a: any, b: any) => b.length - a.length) // Longest paths first
        .slice(0, maxPaths); // Take top N paths
      
      console.log(`[Shoe String Export] Filtered to ${validPaths.length} significant paths (from ${paths.length} total)`);
      
      if (validPaths.length === 0) {
        throw new Error("No significant paths found. Try adjusting trace settings.");
      }
      
      // Convert traced paths to 3D tube geometry
      const { generateNeonSignV2 } = await import("./stl-generator-v2");
      
      // Convert image paths to the format expected by generateNeonSignV2
      const convertedPaths: any[] = [];
      
      for (let index = 0; index < validPaths.length; index++) {
        const path = validPaths[index];
        
        try {
          // Simplify path if too many points
          const simplifiedPath = path.length > maxPointsPerPath 
            ? simplifyPathPoints(path, maxPointsPerPath)
            : path;
          
          console.log(`[Shoe String Export] Path ${index}: ${path.length} -> ${simplifiedPath.length} points`);
          
          // Scale down from image pixels to reasonable mm dimensions
          const scale = 200 / 500;
          
          const convertedPath = {
            id: `path-${index}`,
            points: simplifiedPath.map((point: any) => {
              if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
                throw new Error(`Invalid point in path ${index}: ${JSON.stringify(point)}`);
              }
              return {
                x: point.x * scale - 100,  // Center around origin
                y: -(point.y * scale - 100), // Flip Y and center
              };
            }),
            closed: false
          };
          
          convertedPaths.push(convertedPath);
        } catch (conversionError) {
          console.error(`[Shoe String Export] Error converting path ${index}:`, conversionError);
          throw conversionError;
        }
      }
      
      console.log(`[Shoe String Export] Converted ${convertedPaths.length} paths for generation`);
      
      // Log sample of converted data
      if (convertedPaths.length > 0) {
        console.log(`[Shoe String Export] Sample converted path 0:`, {
          id: convertedPaths[0].id,
          pointCount: convertedPaths[0].points.length,
          firstPoint: convertedPaths[0].points[0],
          lastPoint: convertedPaths[0].points[convertedPaths[0].points.length - 1],
          closed: convertedPaths[0].closed
        });
      }
      
      const letterSettings = {
        text: "",
        fontId: "inter",
        depth: 20,
        scale: 1,
        bevelEnabled: false,
        bevelThickness: 2,
        bevelSize: 1,
        templateId: "none",
        lightDiffuserBevel: false,
        diffuserBevelAngle: 45,
        centerlineMode: false,
      };
      
      const tubeSettings = {
        neonTubeDiameter: tubeDiameter || 15,
        channelDepth: 20,
        filamentDiameter: 10,
        wallThickness: 2,
        wallHeight: 15,
        tubeWidth: 20,
        enableOverlay: false,
        overlayThickness: 2,
        continuousPath: true,
      };
      
      console.log(`[Shoe String Export] Calling generateNeonSignV2...`);
      
      const exportedParts = generateNeonSignV2(
        letterSettings,
        tubeSettings,
        defaultTwoPartSystem,
        "stl",
        convertedPaths,
        "draw",
        {
          simplifyPaths: false,
        }
      );
      
      console.log(`[Shoe String Export] Generation complete, parts:`, exportedParts?.length);
      
      if (!exportedParts || exportedParts.length === 0) {
        throw new Error("No parts generated from traced paths");
      }
      
      const stlBuffer = Buffer.from(exportedParts[0].content);
      
      const filename = `shoestring_trace_${Date.now()}.stl`;
      
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(stlBuffer);
      
      console.log(`[Shoe String Export] Generated ${filename}, ${stlBuffer.length} bytes`);
    } catch (error) {
      console.error("Shoe string export error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: "Failed to generate shoe string trace STL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Neon Shapes export endpoint (iconic shapes with Edison bulb bases)
  app.post("/api/export/neonshapes", async (req, res) => {
    try {
      const settings = req.body;
      
      console.log(`[Neon Shapes Export] Generating ${settings.shapeType}, size=${settings.size}mm`);
      
      const { generateNeonShape } = await import("./neon-shapes-generator");
      
      const exportedParts = generateNeonShape(settings);
      
      if (!exportedParts || exportedParts.length === 0) {
        throw new Error("No parts generated from neon shape");
      }
      
      console.log(`[Neon Shapes Export] Generated ${exportedParts.length} parts`);
      
      // For now, send the first part (tube). In the future, could zip multiple parts
      const stlBuffer = Buffer.from(exportedParts[0].content);
      
      const filename = `neon_${settings.shapeType}_${Date.now()}.stl`;
      
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(stlBuffer);
      
      console.log(`[Neon Shapes Export] Sent ${filename}, ${stlBuffer.length} bytes`);
    } catch (error) {
      console.error("Neon shapes export error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: "Failed to generate neon shape STL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Preset shapes export endpoint
  app.post("/api/export/preset-shape", async (req, res) => {
    try {
      const { presetId, extrudeDepth = 15, wallThickness = 2 } = req.body;
      
      if (!presetId) {
        return res.status(400).json({ error: "presetId required" });
      }
      
      console.log(`[Preset Shape Export] Shape: ${presetId}, Depth: ${extrudeDepth}mm`);
      
      const { presetShapes } = await import("@shared/preset-shapes");
      const { parseSVGPath, pointsToPath, simplifyPath } = await import("./svg-path-parser");
      const { generateNeonSignV2 } = await import("./stl-generator-v2");
      const { defaultTwoPartSystem } = await import("@shared/schema");
      
      const preset = presetShapes.find(p => p.id === presetId);
      if (!preset) {
        return res.status(404).json({ error: "Preset shape not found" });
      }
      
      // Parse SVG path to points
      const points = parseSVGPath(preset.pathData, 100);
      const simplified = simplifyPath(points, 0.5);
      
      console.log(`[Preset Shape] Parsed ${points.length} points, simplified to ${simplified.length}`);
      
      // For now, create a simple letter settings object
      // In the future, this could use the actual path data for custom geometry
      const letterSettings = {
        text: preset.name,
        fontId: "inter",
        scale: 1,
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.5,
        templateId: "none",
        lightDiffuserBevel: false,
        diffuserBevelAngle: 45,
        centerlineMode: false,
      };
      
      const tubeSettings = {
        neonTubeDiameter: 10,
        wallThickness: wallThickness,
        wallHeight: extrudeDepth,
        channelDepth: 8,
        filamentDiameter: 5,
        tubeWidth: 10,
        enableOverlay: true,
        overlayThickness: 2,
        continuousPath: false,
      };
      
      const twoPartSystem = {
        ...defaultTwoPartSystem,
        enabled: true,
        baseWallThickness: wallThickness,
        baseWallHeight: extrudeDepth,
        capThickness: 2,
        snapTabsEnabled: true,
      };
      
      // Generate STL files
      const parts = generateNeonSignV2(
        letterSettings,
        tubeSettings,
        twoPartSystem,
        "stl",
        [],
        "text",
        {}
      );
      
      if (!parts || parts.length === 0) {
        throw new Error("No parts generated from preset shape");
      }
      
      console.log(`[Preset Shape Export] Generated ${parts.length} parts`);
      
      // Create zip archive with all parts
      const archive = archiver("zip", { zlib: { level: 9 } });
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="preset_${presetId}_${Date.now()}.zip"`);
      
      archive.pipe(res);
      
      parts.forEach(part => {
        archive.append(part.content, { name: part.filename });
      });
      
      // Add manifest
      const manifest = {
        preset: preset.name,
        category: preset.category,
        description: preset.description,
        parts: parts.map(p => ({
          filename: p.filename,
          type: p.partType,
          material: p.material
        }))
      };
      
      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      await archive.finalize();
      
    } catch (error) {
      console.error("Preset shape export error:", error);
      res.status(500).json({ 
        error: "Failed to generate preset shape STL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Retro Neon export endpoint
  app.post("/api/export/retro-neon", async (req, res) => {
    try {
      const settings = retroNeonSettingsSchema.parse(req.body);
      
      const zipBuffer = await generateRetroNeonSTL(settings);
      
      if (!zipBuffer) {
        return res.status(400).json({ error: "No parts generated" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="retro_neon_${settings.mode}_${Date.now()}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      console.error("Retro Neon export error:", error);
      res.status(500).json({ 
        error: "Failed to generate Retro Neon STL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // LED Holder export endpoint
  app.post("/api/export/led-holder", async (req, res) => {
    try {
      const settings = ledHolderSettingsSchema.parse(req.body);
      
      const zipBuffer = generateLEDHolder(settings);
      
      if (!zipBuffer) {
        return res.status(400).json({ error: "No parts generated" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="led_holder_${settings.ledType}_${Date.now()}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      console.error("LED Holder export error:", error);
      res.status(500).json({ 
        error: "Failed to generate LED Holder STL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Eggison Bulbs export endpoint
  app.post("/api/export/eggison", async (req, res) => {
    try {
      const settings = eggisonSettingsSchema.parse(req.body);
      
      const parts = generateEggisonBulb(settings);
      
      if (parts.length === 0) {
        return res.status(400).json({ error: "No parts generated" });
      }

      // Create ZIP archive
      const archive = archiver("zip", { zlib: { level: 9 } });
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="eggison_${settings.shellStyle}_${Date.now()}.zip"`);
      
      archive.pipe(res);
      
      // Add each part to the archive
      for (const part of parts) {
        archive.append(part.stl, { name: `${part.name}.stl` });
      }
      
      // Add README with assembly instructions
      const readme = `Eggison Bulbs - DIY Light Bulb Shell
=====================================

Shell Style: ${settings.shellStyle}
Shell Dimensions: ${settings.shellHeight}mm x ${settings.shellWidth}mm
Wall Thickness: ${settings.wallThickness}mm
Screw Base: ${settings.baseType}
Light Type: ${settings.lightType}
Filament Channel: ${settings.includeFilamentChannel ? `Yes (${settings.filamentChannelDiameter}mm)` : 'No'}
Accessories: ${[
  settings.includeGlasses && 'Glasses',
  settings.includeFeet && 'Feet',
  settings.includeBatteryHolder && 'Battery Holder'
].filter(Boolean).join(', ') || 'None'}

Parts Included:
${parts.map((p, i) => `${i + 1}. ${p.name}.stl - ${p.description || 'Part'}
   ${p.slicingNotes || ''}`).join('\n\n')}

⚠️ CRITICAL SLICING INSTRUCTIONS ⚠️
=====================================
For GLASS-LIKE CLARITY with clear PETG filament:

SHELL PARTS (egg shell):
- Enable SPIRAL VASE MODE (also called "vase mode") in your slicer
- This creates a single continuous wall with no seams
- Results in maximum light transmission and glass-like appearance
- Use 0.2mm layer height for best results

SCREW BASE PARTS:
- Print with NORMAL settings (NOT vase mode)
- Needs solid infill for functional screw threads
- 3-4 perimeters, 20% infill minimum

Assembly Instructions:
1. Print shell parts in clear/translucent PETG using VASE MODE
2. Print screw base with normal settings for strength
3. Shape your LED filament or WS2812B strip into desired pattern
4. Insert shaped LEDs into shell
5. Solder wire connections to screw base contacts (use copper tape)
6. Attach shell to base (glue or snap fit depending on style)
7. Test your custom light bulb!

Pro Tips:
- Clear PETG + Vase Mode = Best glass-like finish
- Dry your PETG filament before printing (prevents clouding)
- Use copper tape or conductive filament for screw base contacts
- Print at 0.2mm layer height for optimal translucency
- Consider adding a small amount of diffusion with frosted spray paint (optional)
- Use heat-resistant filament if using high-power LEDs

Created with Sign-Sculptor - Eggison Bulbs Generator
`;
      
      archive.append(readme, { name: "README.txt" });
      
      await archive.finalize();
    } catch (error) {
      console.error("Eggison Bulbs export error:", error);
      res.status(500).json({ 
        error: "Failed to generate Eggison Bulb STL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return httpServer;
}
