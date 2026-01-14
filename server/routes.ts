import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSignage, generateMultiPartExport, generateTwoPartExport, type ExportedPart } from "./stl-generator";
import { generateNeonSignV2 } from "./stl-generator-v2";
import { generatePetTagV2 } from "./pet-tag-generator";
import { twoPartSystemSchema, defaultTwoPartSystem, petTagSettingsSchema } from "@shared/schema";
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

  return httpServer;
}
