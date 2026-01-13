import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSignage, generateMultiPartExport, type ExportedPart } from "./stl-generator";
import {
  letterSettingsSchema,
  geometrySettingsSchema,
  wiringSettingsSchema,
  mountingSettingsSchema,
  insertProjectSchema,
  fontOptions,
  baseTemplates,
  defaultGeometrySettings,
  defaultWiringSettings,
  defaultMountingSettings,
} from "@shared/schema";
import { z } from "zod";
import archiver from "archiver";
import path from "path";
import fs from "fs";

const exportRequestSchema = z.object({
  letterSettings: letterSettingsSchema,
  geometrySettings: geometrySettingsSchema.optional(),
  wiringSettings: wiringSettingsSchema.optional(),
  mountingSettings: mountingSettingsSchema.optional(),
  format: z.enum(["stl", "obj", "3mf"]).default("stl"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/fonts", (_req, res) => {
    res.json(fontOptions);
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
      const geometrySettings = parsed.data.geometrySettings || defaultGeometrySettings;
      const wiringSettings = parsed.data.wiringSettings || defaultWiringSettings;
      const mountingSettings = parsed.data.mountingSettings || defaultMountingSettings;

      const shouldExportSeparate = geometrySettings.separateFiles && 
        (geometrySettings.mode === "layered" || geometrySettings.mode === "raised");

      if (shouldExportSeparate && format !== "3mf") {
        const exportedParts = generateMultiPartExport(
          letterSettings,
          geometrySettings,
          wiringSettings,
          mountingSettings,
          format as "stl" | "obj"
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
        geometrySettings
      );

      const filename = `${letterSettings.text.replace(/\s/g, "_")}_signage.${format}`;

      if (format === "obj") {
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(result);
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

  return httpServer;
}
