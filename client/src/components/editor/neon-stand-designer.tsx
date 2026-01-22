import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Download, Zap, Info, 
  Lightbulb, Box, Cable, Battery, Settings2,
  Heart, Star, Circle, Infinity, Moon, Type, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function PreviewFallback({ settings }: { settings: NeonStandSettings }) {
  const designLabel = settings.designMode === "text" ? settings.text || "NEON" : settings.shapeType;
  
  const getShapeIcon = (shapeType: string) => {
    switch (shapeType) {
      case "heart": return Heart;
      case "star": return Star;
      case "circle": return Circle;
      case "infinity": return Infinity;
      case "moon": return Moon;
      case "diamond": return Zap;
      case "lightning": return Zap;
      default: return Circle;
    }
  };
  
  const Icon = settings.designMode === "shape" ? getShapeIcon(settings.shapeType) : Type;
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-900 p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
          <Icon className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Neon Stand Preview</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Design: <span className="font-medium text-foreground capitalize">{settings.designMode}</span></p>
          {settings.designMode === "text" ? (
            <p>Text: <span className="font-medium text-foreground">{settings.text || "—"}</span></p>
          ) : (
            <p>Shape: <span className="font-medium text-foreground capitalize">{settings.shapeType}</span></p>
          )}
          <p>Base: <span className="font-medium text-foreground capitalize">{settings.baseStyle.replace('_', ' ')}</span></p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>3D preview requires WebGL</span>
        </div>
      </div>
    </div>
  );
}

const DESIGN_MODES = ["text", "shape"] as const;
const SHAPE_TYPES = [
  "heart", "star", "circle", "infinity", "moon", "diamond", "lightning",
  "crown", "peace", "rainbow", "leaf", "mickey", "brackets", "pacman", 
  "rocket", "lips", "gingerbread", "dinosaur", "lightbulb",
  "cactus", "pineapple", "planet"
] as const;
const TUBE_DIAMETERS = [6, 8, 10, 12, 14] as const;
const BASE_STYLES = ["minimal", "weighted", "wide", "circular", "custom"] as const;
const ASSEMBLY_TYPES = ["snap_fit", "magnetic", "screw_mount", "groove_slide"] as const;
const LED_TYPES = ["standard_5v", "ws2812b_addressable", "el_wire"] as const;
const POWER_TYPES = ["usb_5v", "battery_3v", "battery_9v", "dc_12v", "cr2032"] as const;
const SWITCH_POSITIONS = ["base_side", "base_back", "inline_wire", "none"] as const;
const CONTROLLER_TYPES = ["xiao_samd21", "arduino_nano", "esp32"] as const;

interface Point2D {
  x: number;
  y: number;
}

interface NeonStandSettings {
  // Design Mode
  designMode: typeof DESIGN_MODES[number];
  
  // Text Design
  text: string;
  fontId: string;
  
  // Shape Design
  shapeType: typeof SHAPE_TYPES[number];
  shapeWidth: number;
  shapeHeight: number;
  
  // Tube
  tubeDiameter: typeof TUBE_DIAMETERS[number];
  tubeHeight: number;
  ledChannelWidth: number;
  splitTube: boolean;
  diffuserThickness: number;
  
  // Base Platform
  baseStyle: typeof BASE_STYLES[number];
  baseThickness: number;
  baseWidth: number;
  baseDepth: number;
  autoSizeBase: boolean;
  stabilityMargin: number;
  
  // Wire Routing
  wireChannelWidth: number;
  wireEntryPosition: "center" | "back" | "side";
  includeWireGuide: boolean;
  
  // Assembly System
  assemblyType: typeof ASSEMBLY_TYPES[number];
  snapFitTolerance: number;
  screwHoleDiameter: number;
  magnetDiameter: number;
  
  // Electrical
  powerType: typeof POWER_TYPES[number];
  includeBatteryHousing: boolean;
  batteryType: "AA" | "AAA" | "9V" | "none";
  batteryCount: number;
  switchPosition: typeof SWITCH_POSITIONS[number];
  includeDimmer: boolean;
  
  // Advanced
  includeControllerMount: boolean;
  controllerType: typeof CONTROLLER_TYPES[number] | "none";
  ledStripType: typeof LED_TYPES[number];
  includeEncoder: boolean;
  ledsPerCharacter: number;
  
  // Export
  exportFormat: "stl" | "3mf";
  includeOpenSCAD: boolean;
  includeWiringDiagram: boolean;
}

const defaultSettings: NeonStandSettings = {
  designMode: "text",
  
  text: "NEON",
  fontId: "Cedarville Cursive",
  
  shapeType: "heart",
  shapeWidth: 100,
  shapeHeight: 100,
  
  tubeDiameter: 10,
  tubeHeight: 100,
  ledChannelWidth: 8,
  splitTube: true,
  diffuserThickness: 2,
  
  baseStyle: "weighted",
  baseThickness: 10,
  baseWidth: 150,
  baseDepth: 80,
  autoSizeBase: true,
  stabilityMargin: 20,
  
  wireChannelWidth: 3,
  wireEntryPosition: "center",
  includeWireGuide: true,
  
  assemblyType: "snap_fit",
  snapFitTolerance: 0.2,
  screwHoleDiameter: 3,
  magnetDiameter: 6,
  
  powerType: "usb_5v",
  includeBatteryHousing: false,
  batteryType: "AA",
  batteryCount: 3,
  switchPosition: "base_side",
  includeDimmer: false,
  
  includeControllerMount: false,
  controllerType: "none",
  ledStripType: "standard_5v",
  includeEncoder: false,
  ledsPerCharacter: 2,
  
  exportFormat: "stl",
  includeOpenSCAD: true,
  includeWiringDiagram: true,
};

/**
 * Generate parametric shape path (inspired by FilamentShapeEditor)
 */
function generateShapePath(shapeType: string, width: number, height: number, segments: number = 64): Point2D[] {
  const points: Point2D[] = [];
  const hw = width / 2;
  const hh = height / 2;
  
  switch (shapeType) {
    case "heart": {
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        points.push({ x: (x / 16) * hw, y: (y / 17) * hh });
      }
      break;
    }
    case "star": {
      const outerRadius = Math.min(hw, hh);
      const innerRadius = outerRadius * 0.4;
      const starPoints = 5;
      for (let i = 0; i <= starPoints * 2; i++) {
        const angle = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
      points.push(points[0]);
      break;
    }
    case "circle": {
      const radius = Math.min(hw, hh);
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
      break;
    }
    case "infinity": {
      const a = hw * 0.8;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (a * Math.cos(t)) / denom;
        const y = (a * Math.sin(t) * Math.cos(t)) / denom;
        points.push({ x, y: y * (hh / hw) });
      }
      break;
    }
    case "moon": {
      const outerR = Math.min(hw, hh);
      const innerR = outerR * 0.65;
      const offset = outerR * 0.35;
      for (let i = 0; i <= segments / 2; i++) {
        const angle = (i / (segments / 2)) * Math.PI - Math.PI / 2;
        points.push({ x: Math.cos(angle) * outerR, y: Math.sin(angle) * outerR });
      }
      for (let i = segments / 2; i >= 0; i--) {
        const angle = (i / (segments / 2)) * Math.PI - Math.PI / 2;
        points.push({ x: Math.cos(angle) * innerR + offset, y: Math.sin(angle) * innerR });
      }
      break;
    }
    case "diamond": {
      points.push({ x: 0, y: hh });
      points.push({ x: hw, y: 0 });
      points.push({ x: 0, y: -hh });
      points.push({ x: -hw, y: 0 });
      points.push({ x: 0, y: hh });
      break;
    }
    case "lightning": {
      points.push({ x: 0, y: hh });
      points.push({ x: -hw * 0.2, y: hh * 0.3 });
      points.push({ x: hw * 0.15, y: hh * 0.35 });
      points.push({ x: -hw * 0.1, y: -hh * 0.2 });
      points.push({ x: hw * 0.2, y: -hh * 0.15 });
      points.push({ x: 0, y: -hh });
      break;
    }
    case "crown": {
      const baseY = -hh * 0.6;
      const topY = hh;
      points.push({ x: -hw, y: baseY });
      points.push({ x: -hw, y: baseY + hh * 0.3 });
      points.push({ x: -hw * 0.6, y: topY * 0.7 });
      points.push({ x: -hw * 0.3, y: baseY + hh * 0.3 });
      points.push({ x: 0, y: topY });
      points.push({ x: hw * 0.3, y: baseY + hh * 0.3 });
      points.push({ x: hw * 0.6, y: topY * 0.7 });
      points.push({ x: hw, y: baseY + hh * 0.3 });
      points.push({ x: hw, y: baseY });
      points.push({ x: -hw, y: baseY });
      break;
    }
    case "peace": {
      const radius = Math.min(hw, hh);
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
      points.push({ x: 0, y: 0 });
      points.push({ x: 0, y: -radius });
      points.push({ x: 0, y: 0 });
      points.push({ x: -radius * 0.7, y: radius * 0.7 });
      points.push({ x: 0, y: 0 });
      points.push({ x: radius * 0.7, y: radius * 0.7 });
      break;
    }
    case "rainbow": {
      const bands = 6;
      const bandWidth = hh / bands;
      for (let band = 0; band < bands; band++) {
        const r = hh - band * bandWidth;
        for (let i = 0; i <= segments / 2; i++) {
          const angle = Math.PI * (i / (segments / 2));
          points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
      }
      break;
    }
    case "leaf": {
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI;
        const x = hw * Math.sin(t) * (1 + 0.3 * Math.sin(4 * t));
        const y = hh * Math.cos(t);
        points.push({ x, y });
      }
      for (let i = segments; i >= 0; i--) {
        const t = (i / segments) * Math.PI;
        const x = -hw * Math.sin(t) * (1 + 0.3 * Math.sin(4 * t));
        const y = hh * Math.cos(t);
        points.push({ x, y });
      }
      break;
    }
    case "mickey": {
      const headR = Math.min(hw, hh) * 0.5;
      const earR = headR * 0.6;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({ x: Math.cos(angle) * headR, y: Math.sin(angle) * headR });
      }
      for (let i = 0; i <= segments / 4; i++) {
        const angle = (i / (segments / 4)) * Math.PI * 2;
        points.push({ x: -hw * 0.5 + Math.cos(angle) * earR, y: hh * 0.5 + Math.sin(angle) * earR });
      }
      for (let i = 0; i <= segments / 4; i++) {
        const angle = (i / (segments / 4)) * Math.PI * 2;
        points.push({ x: hw * 0.5 + Math.cos(angle) * earR, y: hh * 0.5 + Math.sin(angle) * earR });
      }
      break;
    }
    case "brackets": {
      const thickness = hw * 0.15;
      points.push({ x: -hw, y: hh });
      points.push({ x: -hw + thickness, y: hh });
      points.push({ x: -hw + thickness, y: -hh });
      points.push({ x: -hw, y: -hh });
      points.push({ x: -hw, y: hh });
      points.push({ x: hw, y: hh });
      points.push({ x: hw - thickness, y: hh });
      points.push({ x: hw - thickness, y: -hh });
      points.push({ x: hw, y: -hh });
      points.push({ x: hw, y: hh });
      break;
    }
    case "pacman": {
      const radius = Math.min(hw, hh);
      const mouthAngle = Math.PI / 6;
      for (let i = 0; i <= segments; i++) {
        const angle = mouthAngle + (i / segments) * (Math.PI * 2 - mouthAngle * 2);
        points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
      points.push({ x: 0, y: 0 });
      points.push(points[0]);
      break;
    }
    case "rocket": {
      points.push({ x: 0, y: hh });
      points.push({ x: -hw * 0.3, y: hh * 0.5 });
      points.push({ x: -hw * 0.25, y: 0 });
      points.push({ x: -hw * 0.4, y: -hh * 0.3 });
      points.push({ x: -hw * 0.2, y: -hh * 0.3 });
      points.push({ x: -hw * 0.15, y: -hh });
      points.push({ x: 0, y: -hh * 0.7 });
      points.push({ x: hw * 0.15, y: -hh });
      points.push({ x: hw * 0.2, y: -hh * 0.3 });
      points.push({ x: hw * 0.4, y: -hh * 0.3 });
      points.push({ x: hw * 0.25, y: 0 });
      points.push({ x: hw * 0.3, y: hh * 0.5 });
      points.push({ x: 0, y: hh });
      break;
    }
    case "lips": {
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const r = hh * (1 + 0.3 * Math.sin(2 * t));
        points.push({ x: Math.cos(t) * hw, y: Math.sin(t) * r });
      }
      break;
    }
    case "gingerbread": {
      points.push({ x: 0, y: hh });
      points.push({ x: -hw * 0.3, y: hh * 0.7 });
      points.push({ x: -hw * 0.6, y: hh * 0.3 });
      points.push({ x: -hw * 0.4, y: 0 });
      points.push({ x: -hw * 0.7, y: -hh * 0.3 });
      points.push({ x: -hw * 0.5, y: -hh * 0.7 });
      points.push({ x: -hw * 0.3, y: -hh });
      points.push({ x: 0, y: -hh * 0.8 });
      points.push({ x: hw * 0.3, y: -hh });
      points.push({ x: hw * 0.5, y: -hh * 0.7 });
      points.push({ x: hw * 0.7, y: -hh * 0.3 });
      points.push({ x: hw * 0.4, y: 0 });
      points.push({ x: hw * 0.6, y: hh * 0.3 });
      points.push({ x: hw * 0.3, y: hh * 0.7 });
      points.push({ x: 0, y: hh });
      break;
    }
    case "dinosaur": {
      points.push({ x: -hw * 0.8, y: hh * 0.6 });
      points.push({ x: -hw * 0.6, y: hh });
      points.push({ x: -hw * 0.3, y: hh * 0.8 });
      points.push({ x: 0, y: hh * 0.9 });
      points.push({ x: hw * 0.2, y: hh * 0.7 });
      points.push({ x: hw * 0.5, y: hh * 0.4 });
      points.push({ x: hw * 0.7, y: 0 });
      points.push({ x: hw * 0.8, y: -hh * 0.3 });
      points.push({ x: hw * 0.6, y: -hh * 0.5 });
      points.push({ x: hw * 0.4, y: -hh * 0.6 });
      points.push({ x: hw * 0.3, y: -hh });
      points.push({ x: 0, y: -hh * 0.8 });
      points.push({ x: -hw * 0.3, y: -hh });
      points.push({ x: -hw * 0.5, y: -hh * 0.7 });
      points.push({ x: -hw * 0.7, y: -hh * 0.4 });
      points.push({ x: -hw * 0.8, y: 0 });
      points.push({ x: -hw * 0.8, y: hh * 0.6 });
      break;
    }
    case "lightbulb": {
      const bulbR = Math.min(hw, hh) * 0.6;
      for (let i = 0; i <= segments * 0.7; i++) {
        const angle = Math.PI * 0.15 + (i / (segments * 0.7)) * Math.PI * 1.7;
        points.push({ x: Math.cos(angle) * bulbR, y: Math.sin(angle) * bulbR + hh * 0.2 });
      }
      points.push({ x: hw * 0.3, y: -hh * 0.4 });
      points.push({ x: hw * 0.3, y: -hh * 0.6 });
      points.push({ x: hw * 0.4, y: -hh * 0.8 });
      points.push({ x: hw * 0.2, y: -hh });
      points.push({ x: -hw * 0.2, y: -hh });
      points.push({ x: -hw * 0.4, y: -hh * 0.8 });
      points.push({ x: -hw * 0.3, y: -hh * 0.6 });
      points.push({ x: -hw * 0.3, y: -hh * 0.4 });
      break;
    }
    case "cactus": {
      // Main body (vertical trunk)
      for (let i = 0; i <= segments * 0.5; i++) {
        const t = (i / (segments * 0.5));
        const x = hw * 0.25 * Math.sin(t * Math.PI * 0.3);
        const y = -hh + t * hh * 1.6;
        points.push({ x, y });
      }
      // Left arm
      const leftArmStart = points.length - Math.floor(segments * 0.15);
      const leftArmY = points[leftArmStart]?.y || 0;
      for (let i = 0; i <= segments * 0.15; i++) {
        const t = (i / (segments * 0.15));
        const x = -hw * 0.25 - hw * 0.35 * t;
        const y = leftArmY + hh * 0.15 * Math.sin(t * Math.PI);
        points.push({ x, y });
      }
      // Return to trunk
      points.push(points[leftArmStart]);
      // Right arm
      const rightArmStart = points.length - Math.floor(segments * 0.1);
      const rightArmY = points[Math.min(rightArmStart, points.length - 1)]?.y || hh * 0.1;
      for (let i = 0; i <= segments * 0.15; i++) {
        const t = (i / (segments * 0.15));
        const x = hw * 0.25 + hw * 0.35 * t;
        const y = rightArmY + hh * 0.2 * Math.sin(t * Math.PI);
        points.push({ x, y });
      }
      break;
    }
    case "pineapple": {
      // Body (oval)
      for (let i = 0; i <= segments * 0.6; i++) {
        const t = (i / (segments * 0.6)) * Math.PI * 2;
        const x = hw * 0.55 * Math.cos(t);
        const y = hh * 0.4 * Math.sin(t) - hh * 0.25;
        points.push({ x, y });
      }
      // Crown leaves (5 spikes radiating from top)
      const crownSpikes = 5;
      for (let spike = 0; spike < crownSpikes; spike++) {
        const baseAngle = (spike / crownSpikes) * Math.PI - Math.PI * 0.5;
        const tipAngle = baseAngle;
        // From body top to spike tip
        points.push({ x: hw * 0.3 * Math.cos(baseAngle + Math.PI / 2), y: hh * 0.15 });
        points.push({ x: hw * 0.45 * Math.sin(tipAngle), y: hh * 0.85 });
        // Back to body
        points.push({ x: hw * 0.3 * Math.cos(baseAngle + Math.PI / 2), y: hh * 0.15 });
      }
      break;
    }
    case "planet": {
      // Main sphere
      const planetRadius = Math.min(hw, hh) * 0.5;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({ 
          x: Math.cos(angle) * planetRadius, 
          y: Math.sin(angle) * planetRadius 
        });
      }
      // Ring (elliptical orbit)
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * hw * 0.85;
        const y = Math.sin(angle) * hh * 0.25;
        points.push({ x, y });
      }
      break;
    }
    default:
      const radius = Math.min(hw, hh);
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
  }
  
  return points;
}

/**
 * Calculate path length (inspired by FilamentShapeEditor)
 */
function getPathLength(points: Point2D[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Scott 4D Method: Douglas-Peucker Geodesic Distillation (Stage 2)
 * Reduces vertices while maintaining geometric integrity
 * "Reducing 1.2M points to k vectors" - Scott Unified
 */
function douglasPeucker(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length < 3) return points;
  
  // Find point with maximum distance from line segment
  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

function perpendicularDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const norm = Math.sqrt(dx * dx + dy * dy);
  
  if (norm === 0) return Math.sqrt(
    (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
  );
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (norm * norm);
  const projX = lineStart.x + u * dx;
  const projY = lineStart.y + u * dy;
  
  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

function NeonStandPreview({ settings }: { settings: NeonStandSettings }) {
  const scale = 0.01;
  
  // Generate path based on design mode
  const tubePath = useMemo(() => {
    if (settings.designMode === "text") {
      // For text mode, create a simple representative path
      const textWidth = (settings.text.length || 4) * settings.tubeHeight * 0.6;
      const points: THREE.Vector2[] = [];
      const segments = 20;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * textWidth;
        const y = Math.sin(t * Math.PI * 2) * settings.tubeHeight * 0.2;
        points.push(new THREE.Vector2(x, y));
      }
      return points;
    } else {
      // Shape mode: use parametric shape with Scott 4D geodesic distillation
      const rawShapePoints = generateShapePath(settings.shapeType, settings.shapeWidth, settings.shapeHeight, 128);
      
      // Apply Douglas-Peucker simplification (Stage 2: Geodesic Distillation)
      const epsilon = 1.5; // Tolerance for simplification
      const simplified = douglasPeucker(rawShapePoints, epsilon);
      
      return simplified.map(p => new THREE.Vector2(p.x, p.y));
    }
  }, [settings.designMode, settings.text, settings.tubeHeight, settings.shapeType, settings.shapeWidth, settings.shapeHeight]);

  // Tube geometry
  const tubeGeometry = useMemo(() => {
    const group = new THREE.Group();
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1493,
      emissive: 0xff1493,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    
    const radius = (settings.tubeDiameter / 2) * scale;
    const height = settings.tubeHeight * scale * 0.3;
    
    // Create tube along path
    const curve = new THREE.CatmullRomCurve3(
      tubePath.map(p => new THREE.Vector3(p.x * scale, height, p.y * scale))
    );
    
    const tubeGeom = new THREE.TubeGeometry(curve, tubePath.length * 2, radius, 16, false);
    const tubeMesh = new THREE.Mesh(tubeGeom, tubeMaterial);
    group.add(tubeMesh);
    
    return group;
  }, [tubePath, settings.tubeDiameter, settings.tubeHeight, scale]);

  // Base geometry
  const baseGeometry = useMemo(() => {
    const group = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.7,
      metalness: 0.2,
    });
    
    // Calculate base dimensions
    let baseWidth = settings.baseWidth * scale;
    let baseDepth = settings.baseDepth * scale;
    const baseThickness = settings.baseThickness * scale;
    
    if (settings.autoSizeBase) {
      let pathMinX = Infinity;
      let pathMaxX = -Infinity;
      let pathMinY = Infinity;
      let pathMaxY = -Infinity;
      
      tubePath.forEach(p => {
        pathMinX = Math.min(pathMinX, p.x);
        pathMaxX = Math.max(pathMaxX, p.x);
        pathMinY = Math.min(pathMinY, p.y);
        pathMaxY = Math.max(pathMaxY, p.y);
      });
      
      const margin = settings.stabilityMargin * scale;
      baseWidth = (pathMaxX - pathMinX) * scale + margin * 2;
      baseDepth = (pathMaxY - pathMinY) * scale + margin * 2;
    }
    
    // Create base based on style
    let baseGeom: THREE.BufferGeometry;
    if (settings.baseStyle === "circular") {
      const radius = Math.max(baseWidth, baseDepth) / 2;
      baseGeom = new THREE.CylinderGeometry(radius, radius, baseThickness, 32);
    } else if (settings.baseStyle === "weighted") {
      baseGeom = new THREE.BoxGeometry(baseWidth, baseThickness * 1.5, baseDepth);
    } else {
      baseGeom = new THREE.BoxGeometry(baseWidth, baseThickness, baseDepth);
    }
    
    const baseMesh = new THREE.Mesh(baseGeom, baseMaterial);
    baseMesh.position.y = -baseThickness / 2;
    group.add(baseMesh);
    
    // Add battery housing if enabled
    if (settings.includeBatteryHousing && settings.batteryType !== "none") {
      const housingMaterial = new THREE.MeshStandardMaterial({
        color: 0x374151,
        roughness: 0.5,
        metalness: 0.3,
      });
      
      const housingWidth = 50 * scale;
      const housingHeight = 25 * scale;
      const housingDepth = 25 * scale;
      
      const housingGeom = new THREE.BoxGeometry(housingWidth, housingHeight, housingDepth);
      const housingMesh = new THREE.Mesh(housingGeom, housingMaterial);
      housingMesh.position.set(0, -baseThickness - housingHeight / 2, 0);
      group.add(housingMesh);
    }
    
    return group;
  }, [settings.baseStyle, settings.baseWidth, settings.baseDepth, settings.baseThickness, settings.autoSizeBase, settings.stabilityMargin, settings.includeBatteryHousing, settings.batteryType, tubePath, scale]);

  return (
    <group>
      <primitive object={tubeGeometry} />
      <primitive object={baseGeometry} />
    </group>
  );
}

export function NeonStandDesigner() {
  const [settings, setSettings] = useState<NeonStandSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fonts, setFonts] = useState<Array<{ id: string; name: string; commercial: boolean }>>([]);
  const [ledStripLength, setLedStripLength] = useState(0);
  const [estimatedPower, setEstimatedPower] = useState(0);
  const [batteryLife, setBatteryLife] = useState(0);
  const { toast } = useToast();

  const updateSettings = (updates: Partial<NeonStandSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Fetch available fonts
  useEffect(() => {
    fetch("/api/fonts/list")
      .then(res => res.json())
      .then(data => setFonts(data.fonts || []))
      .catch(err => console.error("Failed to load fonts:", err));
  }, []);

  // Calculate LED strip length based on design mode
  useEffect(() => {
    let estimatedLength = 0;
    
    if (settings.designMode === "text" && settings.text) {
      // Text mode: rough estimate based on character count
      const avgCharWidth = settings.tubeHeight * 0.6;
      estimatedLength = settings.text.length * avgCharWidth;
    } else if (settings.designMode === "shape") {
      // Shape mode: calculate actual path length
      const shapePath = generateShapePath(settings.shapeType, settings.shapeWidth, settings.shapeHeight);
      estimatedLength = getPathLength(shapePath);
    }
    
    setLedStripLength(Math.ceil(estimatedLength));
    
    // Power calculation (assuming 60mA per LED, 60 LEDs/meter for standard strips)
    const ledsPerMeter = 60;
    const currentPerLed = 0.06; // 60mA
    const meters = estimatedLength / 1000;
    const totalLeds = meters * ledsPerMeter;
    const totalCurrent = totalLeds * currentPerLed;
    
    setEstimatedPower(totalCurrent);
    
    // Battery life calculation
    if (settings.includeBatteryHousing) {
      const batteryCapacities = {
        "AA": 2500, // mAh
        "AAA": 1200,
        "9V": 500,
        "none": 0,
      };
      const capacity = batteryCapacities[settings.batteryType] * settings.batteryCount;
      const lifeHours = capacity / (totalCurrent * 1000);
      setBatteryLife(lifeHours);
    }
  }, [settings.designMode, settings.text, settings.tubeHeight, settings.shapeType, settings.shapeWidth, settings.shapeHeight, settings.includeBatteryHousing, settings.batteryType, settings.batteryCount]);

  const handleGenerate = async () => {
    if (settings.designMode === "text" && !settings.text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter text for your neon stand sign",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/neon-stand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to generate neon stand");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = settings.exportFormat.toUpperCase();
      a.download = `NeonStand_${settings.text.replace(/\s+/g, '_')}_${ext}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Neon Stand Generated!",
        description: `"${settings.text}" stand sign ready (${ext} format)`,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  if (webglSupported === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* LEFT: 3D Preview */}
      <div className="flex-1 relative bg-gradient-to-br from-purple-900/20 to-pink-900/30">
        {webglSupported ? (
          <Suspense fallback={<PreviewFallback settings={settings} />}>
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[0, 1.5, 3]} fov={50} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
              <pointLight position={[-3, 5, -3]} intensity={0.5} color="#ff1493" />
              <NeonStandPreview settings={settings} />
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={1}
                maxDistance={10}
              />
              <ContactShadows position={[0, -0.5, 0]} opacity={0.3} blur={2} />
              <Environment preset="studio" />
            </Canvas>
          </Suspense>
        ) : (
          <PreviewFallback settings={settings} />
        )}
        
        {/* Preview Info Overlay */}
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">Neon Stand Designer</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {settings.designMode === "text" ? `"${settings.text || "NEON"}"` : `${settings.shapeType} shape`}
          </p>
        </div>
      </div>

      {/* RIGHT: Controls Sidebar */}
      <div className="w-80 border-l bg-background p-4 overflow-y-auto">
        <div className="space-y-4">
        <Tabs defaultValue="tube" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="tube" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Tube
            </TabsTrigger>
            <TabsTrigger value="base" className="text-xs">
              <Box className="h-3 w-3 mr-1" />
              Base
            </TabsTrigger>
            <TabsTrigger value="wiring" className="text-xs">
              <Cable className="h-3 w-3 mr-1" />
              Wiring
            </TabsTrigger>
            <TabsTrigger value="power" className="text-xs">
              <Battery className="h-3 w-3 mr-1" />
              Power
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* TUBE TAB */}
          <TabsContent value="tube" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Neon Tube Design</Label>
              
              {/* Design Mode Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Design Mode</Label>
                <Select
                  value={settings.designMode}
                  onValueChange={(value: typeof DESIGN_MODES[number]) => updateSettings({ designMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Text (Custom Words)
                      </div>
                    </SelectItem>
                    <SelectItem value="shape">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Shape (Heart, Star, etc.)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Mode Controls */}
              {settings.designMode === "text" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Text</Label>
                    <Input
                      type="text"
                      value={settings.text}
                      onChange={(e) => updateSettings({ text: e.target.value })}
                      placeholder="Enter your text..."
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Font</Label>
                    <Select
                      value={settings.fontId}
                      onValueChange={(value) => updateSettings({ fontId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fonts.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
                            {font.name} {!font.commercial && "(Personal Use)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Tube Height</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.tubeHeight}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.tubeHeight]}
                      onValueChange={([v]) => updateSettings({ tubeHeight: v })}
                      min={50}
                      max={300}
                      step={10}
                      className="py-2"
                    />
                  </div>
                </>
              )}

              {/* Shape Mode Controls */}
              {settings.designMode === "shape" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Shape Type</Label>
                    <Select
                      value={settings.shapeType}
                      onValueChange={(value: typeof SHAPE_TYPES[number]) => updateSettings({ shapeType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heart">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Heart
                          </div>
                        </SelectItem>
                        <SelectItem value="star">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Star
                          </div>
                        </SelectItem>
                        <SelectItem value="circle">
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4" />
                            Circle
                          </div>
                        </SelectItem>
                        <SelectItem value="infinity">
                          <div className="flex items-center gap-2">
                            <Infinity className="h-4 w-4" />
                            Infinity
                          </div>
                        </SelectItem>
                        <SelectItem value="moon">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Crescent Moon
                          </div>
                        </SelectItem>
                        <SelectItem value="diamond">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Diamond
                          </div>
                        </SelectItem>
                        <SelectItem value="lightning">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Lightning Bolt
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Shape Width</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.shapeWidth}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.shapeWidth]}
                      onValueChange={([v]) => updateSettings({ shapeWidth: v })}
                      min={50}
                      max={200}
                      step={10}
                      className="py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Shape Height</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.shapeHeight}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.shapeHeight]}
                      onValueChange={([v]) => updateSettings({ shapeHeight: v })}
                      min={50}
                      max={200}
                      step={10}
                      className="py-2"
                    />
                  </div>
                </>
              )}

              {/* Common Tube Settings */}
              <div className="space-y-2 pt-3 border-t">
                <Label className="text-sm font-medium">Tube Diameter</Label>
                <Select
                  value={settings.tubeDiameter.toString()}
                  onValueChange={(value) => updateSettings({ tubeDiameter: parseInt(value) as typeof TUBE_DIAMETERS[number] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TUBE_DIAMETERS.map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        {d}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">LED Channel Width</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.ledChannelWidth}mm
                  </span>
                </div>
                <Slider
                  value={[settings.ledChannelWidth]}
                  onValueChange={([v]) => updateSettings({ ledChannelWidth: v })}
                  min={6}
                  max={14}
                  step={2}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Standard LED strips: 8mm, Wide strips: 10-12mm
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="split-tube" className="text-sm font-medium">
                    Split Tube Design
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[220px]">
                      <p className="text-xs">
                        Tube splits in half (sandwich style) for easy LED strip installation
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id="split-tube"
                  checked={settings.splitTube}
                  onCheckedChange={(v) => updateSettings({ splitTube: v })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Diffuser Thickness</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.diffuserThickness}mm
                  </span>
                </div>
                <Slider
                  value={[settings.diffuserThickness]}
                  onValueChange={([v]) => updateSettings({ diffuserThickness: v })}
                  min={1}
                  max={4}
                  step={0.5}
                  className="py-2"
                />
              </div>
            </div>
          </TabsContent>

          {/* BASE TAB */}
          <TabsContent value="base" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Base Platform</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Base Style</Label>
                <Select
                  value={settings.baseStyle}
                  onValueChange={(value: typeof BASE_STYLES[number]) =>
                    updateSettings({ baseStyle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal (Compact)</SelectItem>
                    <SelectItem value="weighted">Weighted (Heavy Bottom)</SelectItem>
                    <SelectItem value="wide">Wide (Maximum Stability)</SelectItem>
                    <SelectItem value="circular">Circular (360° View)</SelectItem>
                    <SelectItem value="custom">Custom Dimensions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-size" className="text-sm font-medium">
                  Auto-Size Base
                </Label>
                <Switch
                  id="auto-size"
                  checked={settings.autoSizeBase}
                  onCheckedChange={(v) => updateSettings({ autoSizeBase: v })}
                />
              </div>

              {!settings.autoSizeBase && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Base Width</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.baseWidth}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.baseWidth]}
                      onValueChange={([v]) => updateSettings({ baseWidth: v })}
                      min={50}
                      max={300}
                      step={10}
                      className="py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Base Depth</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.baseDepth}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.baseDepth]}
                      onValueChange={([v]) => updateSettings({ baseDepth: v })}
                      min={50}
                      max={200}
                      step={10}
                      className="py-2"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Base Thickness</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.baseThickness}mm
                  </span>
                </div>
                <Slider
                  value={[settings.baseThickness]}
                  onValueChange={([v]) => updateSettings({ baseThickness: v })}
                  min={5}
                  max={20}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Stability Margin</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.stabilityMargin}mm
                  </span>
                </div>
                <Slider
                  value={[settings.stabilityMargin]}
                  onValueChange={([v]) => updateSettings({ stabilityMargin: v })}
                  min={10}
                  max={50}
                  step={5}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Extra base size beyond tube footprint for stability
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-semibold">Assembly System</Label>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assembly Type</Label>
                  <Select
                    value={settings.assemblyType}
                    onValueChange={(value: typeof ASSEMBLY_TYPES[number]) =>
                      updateSettings({ assemblyType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snap_fit">Snap-Fit (Friction)</SelectItem>
                      <SelectItem value="magnetic">Magnetic Mount</SelectItem>
                      <SelectItem value="screw_mount">Screw Mount</SelectItem>
                      <SelectItem value="groove_slide">Groove Slide-In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.assemblyType === "snap_fit" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Snap-Fit Tolerance</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.snapFitTolerance}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.snapFitTolerance]}
                      onValueChange={([v]) => updateSettings({ snapFitTolerance: v })}
                      min={0.1}
                      max={0.5}
                      step={0.05}
                      className="py-2"
                    />
                  </div>
                )}

                {settings.assemblyType === "screw_mount" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Screw Hole Diameter</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.screwHoleDiameter}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.screwHoleDiameter]}
                      onValueChange={([v]) => updateSettings({ screwHoleDiameter: v })}
                      min={2}
                      max={5}
                      step={0.5}
                      className="py-2"
                    />
                  </div>
                )}

                {settings.assemblyType === "magnetic" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Magnet Diameter</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {settings.magnetDiameter}mm
                      </span>
                    </div>
                    <Slider
                      value={[settings.magnetDiameter]}
                      onValueChange={([v]) => updateSettings({ magnetDiameter: v })}
                      min={4}
                      max={10}
                      step={1}
                      className="py-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* WIRING TAB */}
          <TabsContent value="wiring" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Wire Routing</Label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Wire Channel Width</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.wireChannelWidth}mm
                  </span>
                </div>
                <Slider
                  value={[settings.wireChannelWidth]}
                  onValueChange={([v]) => updateSettings({ wireChannelWidth: v })}
                  min={2}
                  max={6}
                  step={0.5}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Wire Entry Position</Label>
                <Select
                  value={settings.wireEntryPosition}
                  onValueChange={(value: typeof settings.wireEntryPosition) =>
                    updateSettings({ wireEntryPosition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center (Through Base)</SelectItem>
                    <SelectItem value="back">Back (Hidden)</SelectItem>
                    <SelectItem value="side">Side (Easy Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="wire-guide" className="text-sm font-medium">
                  Include Wire Guide
                </Label>
                <Switch
                  id="wire-guide"
                  checked={settings.includeWireGuide}
                  onCheckedChange={(v) => updateSettings({ includeWireGuide: v })}
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-semibold">LED Strip Type</Label>
                
                <div className="space-y-2">
                  <Select
                    value={settings.ledStripType}
                    onValueChange={(value: typeof settings.ledStripType) =>
                      updateSettings({ ledStripType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard_5v">Standard 5V LED Strip</SelectItem>
                      <SelectItem value="ws2812b_addressable">WS2812B Addressable RGB</SelectItem>
                      <SelectItem value="el_wire">EL Wire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.ledStripType === "ws2812b_addressable" && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="controller-mount" className="text-sm font-medium">
                      Include Controller Mount
                    </Label>
                    <Switch
                      id="controller-mount"
                      checked={settings.includeControllerMount}
                      onCheckedChange={(v) => updateSettings({ includeControllerMount: v })}
                    />
                  </div>
                )}

                {settings.includeControllerMount && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Controller Type</Label>
                    <Select
                      value={settings.controllerType}
                      onValueChange={(value: typeof settings.controllerType) =>
                        updateSettings({ controllerType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="esp32">ESP32</SelectItem>
                        <SelectItem value="arduino_nano">Arduino Nano</SelectItem>
                        <SelectItem value="attiny">ATtiny85</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="bg-muted/30 p-3 rounded-md space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated LED Strip Length:</span>
                  <span className="font-medium">{ledStripLength}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Power Draw:</span>
                  <span className="font-medium">{estimatedPower.toFixed(2)}A</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* POWER TAB */}
          <TabsContent value="power" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Power System</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Power Type</Label>
                <Select
                  value={settings.powerType}
                  onValueChange={(value: typeof POWER_TYPES[number]) =>
                    updateSettings({ powerType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb_5v">USB 5V (Most Common)</SelectItem>
                    <SelectItem value="battery_3v">Battery 3V (Portable)</SelectItem>
                    <SelectItem value="battery_9v">Battery 9V (High Power)</SelectItem>
                    <SelectItem value="dc_12v">DC 12V (Bright)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(settings.powerType === "battery_3v" || settings.powerType === "battery_9v") && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="battery-housing" className="text-sm font-medium">
                      Include Battery Housing
                    </Label>
                    <Switch
                      id="battery-housing"
                      checked={settings.includeBatteryHousing}
                      onCheckedChange={(v) => updateSettings({ includeBatteryHousing: v })}
                    />
                  </div>

                  {settings.includeBatteryHousing && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Battery Type</Label>
                        <Select
                          value={settings.batteryType}
                          onValueChange={(value: typeof settings.batteryType) =>
                            updateSettings({ batteryType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AA">AA (2500mAh)</SelectItem>
                            <SelectItem value="AAA">AAA (1200mAh)</SelectItem>
                            <SelectItem value="9V">9V (500mAh)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Battery Count</Label>
                          <span className="text-sm font-mono text-muted-foreground">
                            {settings.batteryCount}
                          </span>
                        </div>
                        <Slider
                          value={[settings.batteryCount]}
                          onValueChange={([v]) => updateSettings({ batteryCount: v })}
                          min={1}
                          max={6}
                          step={1}
                          className="py-2"
                        />
                      </div>

                      <div className="bg-muted/30 p-3 rounded-md space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Battery Life:</span>
                          <span className="font-medium">{batteryLife.toFixed(1)} hours</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-semibold">Controls</Label>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Switch Position</Label>
                  <Select
                    value={settings.switchPosition}
                    onValueChange={(value: typeof SWITCH_POSITIONS[number]) =>
                      updateSettings({ switchPosition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base_side">Base Side</SelectItem>
                      <SelectItem value="base_back">Base Back</SelectItem>
                      <SelectItem value="inline_wire">Inline Wire</SelectItem>
                      <SelectItem value="none">None (Always On)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dimmer" className="text-sm font-medium">
                      Include Dimmer
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[220px]">
                        <p className="text-xs">
                          Adds potentiometer for brightness control
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="dimmer"
                    checked={settings.includeDimmer}
                    onCheckedChange={(v) => updateSettings({ includeDimmer: v })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Export Options</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">File Format</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value: typeof settings.exportFormat) =>
                    updateSettings({ exportFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stl">STL (Standard)</SelectItem>
                    <SelectItem value="3mf">3MF (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-scad" className="text-sm font-medium">
                  Include OpenSCAD Source
                </Label>
                <Switch
                  id="include-scad"
                  checked={settings.includeOpenSCAD}
                  onCheckedChange={(v) => updateSettings({ includeOpenSCAD: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="wiring-diagram" className="text-sm font-medium">
                  Include Wiring Diagram
                </Label>
                <Switch
                  id="wiring-diagram"
                  checked={settings.includeWiringDiagram}
                  onCheckedChange={(v) => updateSettings({ includeWiringDiagram: v })}
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-semibold">Export Package Contents</Label>
                <div className="bg-muted/30 p-3 rounded-md space-y-1 text-xs">
                  <div className="font-medium mb-2">ZIP will include:</div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>• Tube Body ({settings.splitTube ? "2 halves" : "1 piece"})</div>
                    <div>• Tube Diffuser/Lid</div>
                    <div>• Base Platform</div>
                    {settings.includeWireGuide && <div>• Wire Guide Channel</div>}
                    {settings.includeBatteryHousing && <div>• Battery Housing</div>}
                    {settings.includeControllerMount && <div>• Controller Mount</div>}
                    <div>• Assembly Instructions (MD)</div>
                    {settings.includeWiringDiagram && <div>• Wiring Diagram (MD)</div>}
                    <div>• Bill of Materials (BOM.txt)</div>
                    {settings.includeOpenSCAD && <div>• OpenSCAD Source (.scad)</div>}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (settings.designMode === "text" && !settings.text.trim())}
          className="w-full mt-6"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Neon Stand...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Neon Stand
            </>
          )}
        </Button>

        {/* Info Display */}
        <div className="space-y-2 pt-3 border-t bg-muted/30 p-3 rounded-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Design Mode:</span>
              <span className="font-medium capitalize">{settings.designMode}</span>
            </div>
            {settings.designMode === "text" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Text:</span>
                  <span className="font-medium">{settings.text || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tube Height:</span>
                  <span className="font-medium">{settings.tubeHeight}mm</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shape:</span>
                  <span className="font-medium capitalize">{settings.shapeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium">{settings.shapeWidth}×{settings.shapeHeight}mm</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Style:</span>
              <span className="font-medium capitalize">{settings.baseStyle.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assembly:</span>
              <span className="font-medium capitalize">{settings.assemblyType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Power:</span>
              <span className="font-medium">{settings.powerType.toUpperCase().replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LED Strip:</span>
              <span className="font-medium">~{ledStripLength}mm</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
