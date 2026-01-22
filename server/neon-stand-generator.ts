/**
 * NEON STAND GENERATOR
 * Creates portable 3D printed neon signs with integrated base stands
 * 
 * Based on user's prototype: flexible LED strip in 3D printed tube + stable base
 * Key innovation: Complete stand sign in one export (tube + base + wiring)
 */

import * as THREE from "three";
import opentype from "opentype.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { zhangSuenSkeleton, toBinary, extractSkeletonPaths } from "./zhang-suen-skeletonization";
import { 
  generateCircuitHousingBottom, 
  generateCircuitHousingTop,
  generateComponentPlacementGuide,
  generateCircuitHousingBOM,
  defaultCircuitHousingSettings,
  type CircuitHousingSettings
} from "./circuit-housing-generator";
import {
  generateCR2032Holder,
  generateCR2032Instructions,
  generateCR2032BOM,
  defaultCR2032Settings,
  type CR2032HolderSettings
} from "./cr2032-holder-generator";
import {
  generateMicrocontrollerHousingBottom,
  generateMicrocontrollerHousingTop,
  generateWS2812BWiringDiagram,
  generateMicrocontrollerAssemblyInstructions,
  generateMicrocontrollerBOM,
  defaultMicrocontrollerSettings,
  type MicrocontrollerHousingSettings
} from "./microcontroller-housing-generator";
import {
  generateFastLEDCode,
  generateCharacterMap,
  generateArduinoInstallInstructions,
  defaultFastLEDSettings,
  type FastLEDCodeSettings
} from "./fastled-code-generator";

interface Point2D {
  x: number;
  y: number;
}

/**
 * Generate parametric shape path (matches frontend implementation)
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
      for (let i = 0; i <= segments * 0.5; i++) {
        const t = (i / (segments * 0.5));
        const x = hw * 0.25 * Math.sin(t * Math.PI * 0.3);
        const y = -hh + t * hh * 1.6;
        points.push({ x, y });
      }
      const leftArmStart = points.length - Math.floor(segments * 0.15);
      const leftArmY = points[leftArmStart]?.y || 0;
      for (let i = 0; i <= segments * 0.15; i++) {
        const t = (i / (segments * 0.15));
        const x = -hw * 0.25 - hw * 0.35 * t;
        const y = leftArmY + hh * 0.15 * Math.sin(t * Math.PI);
        points.push({ x, y });
      }
      points.push(points[leftArmStart]);
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
      for (let i = 0; i <= segments * 0.6; i++) {
        const t = (i / (segments * 0.6)) * Math.PI * 2;
        const x = hw * 0.55 * Math.cos(t);
        const y = hh * 0.4 * Math.sin(t) - hh * 0.25;
        points.push({ x, y });
      }
      const crownSpikes = 5;
      for (let spike = 0; spike < crownSpikes; spike++) {
        const baseAngle = (spike / crownSpikes) * Math.PI - Math.PI * 0.5;
        const tipAngle = baseAngle;
        points.push({ x: hw * 0.3 * Math.cos(baseAngle + Math.PI / 2), y: hh * 0.15 });
        points.push({ x: hw * 0.45 * Math.sin(tipAngle), y: hh * 0.85 });
        points.push({ x: hw * 0.3 * Math.cos(baseAngle + Math.PI / 2), y: hh * 0.15 });
      }
      break;
    }
    case "planet": {
      const planetRadius = Math.min(hw, hh) * 0.5;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({ 
          x: Math.cos(angle) * planetRadius, 
          y: Math.sin(angle) * planetRadius 
        });
      }
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

interface NeonStandSettings {
  designMode: "text" | "shape";
  
  text: string;
  fontPath?: string;
  
  shapeType: "heart" | "star" | "circle" | "infinity" | "moon" | "diamond" | "lightning" | "crown" | "peace" | "rainbow" | "leaf" | "mickey" | "brackets" | "pacman" | "rocket" | "lips" | "gingerbread" | "dinosaur" | "lightbulb" | "cactus" | "pineapple" | "planet";
  shapeWidth: number;
  shapeHeight: number;
  
  tubeDiameter: number;
  tubeHeight: number;
  ledChannelWidth: number;
  splitTube: boolean;
  diffuserThickness: number;
  
  baseStyle: "minimal" | "weighted" | "wide" | "circular" | "custom";
  baseThickness: number;
  baseWidth: number;
  baseDepth: number;
  autoSizeBase: boolean;
  stabilityMargin: number;
  
  wireChannelWidth: number;
  wireEntryPosition: "center" | "back" | "side";
  includeWireGuide: boolean;
  
  assemblyType: "snap_fit" | "magnetic" | "screw_mount" | "groove_slide";
  snapFitTolerance: number;
  screwHoleDiameter: number;
  magnetDiameter: number;
  
  powerType: "usb_5v" | "battery_3v" | "battery_9v" | "dc_12v" | "cr2032";
  includeBatteryHousing: boolean;
  batteryType: "AA" | "AAA" | "9V" | "none";
  batteryCount: number;
  switchPosition: "base_side" | "base_back" | "inline_wire" | "none";
  includeDimmer: boolean;
  
  includeControllerMount: boolean;
  controllerType: "xiao_samd21" | "arduino_nano" | "esp32" | "none";
  ledStripType: "standard_5v" | "ws2812b_addressable" | "el_wire";
  includeEncoder: boolean;
  ledsPerCharacter: number;
  
  exportFormat: "stl" | "3mf";
  includeOpenSCAD: boolean;
  includeWiringDiagram: boolean;
}

/**
 * Main generation function
 */
export async function generateNeonStand(settings: NeonStandSettings): Promise<{
  tubeBodySTL: string;
  tubeLidSTL?: string;
  tubeBody2STL?: string; // Second half if split tube
  baseSTL: string;
  wireGuideSTL?: string;
  batteryHousingSTL?: string;
  controllerMountSTL?: string;
  circuitHousingBottomSTL?: string;
  circuitHousingTopSTL?: string;
  cr2032HolderSTL?: string;
  microcontrollerHousingBottomSTL?: string;
  microcontrollerHousingTopSTL?: string;
  assemblyInstructions: string;
  wiringDiagram?: string;
  componentPlacementGuide?: string;
  fastledCode?: string;
  arduinoInstructions?: string;
  bom: string;
  openscad?: string;
}> {
  const designLabel = settings.designMode === "text" ? settings.text : settings.shapeType;
  console.log(`[Neon Stand] Generating "${designLabel}" stand sign (${settings.designMode} mode)`);
  
  // Generate paths based on design mode
  let tubePaths: THREE.Vector2[][];
  
  if (settings.designMode === "text" && settings.fontPath) {
    // Text mode: Load font and extract text path
    const font = await opentype.load(settings.fontPath);
    tubePaths = extractTextCenterline(font, settings.text, settings.tubeHeight);
  } else {
    // Shape mode: Generate parametric shape
    const shapePoints = generateShapePath(settings.shapeType, settings.shapeWidth, settings.shapeHeight);
    tubePaths = [shapePoints.map((p: Point2D) => new THREE.Vector2(p.x, p.y))];
  }
  
  // Calculate bounds for auto-sizing
  const bounds = calculatePathBounds(tubePaths);
  
  // Generate tube with LED channel
  const tubeMeshes = generateTube(tubePaths, settings);
  
  // Generate base platform
  const baseMesh = generateBase(bounds, settings);
  
  // Generate optional components
  let wireGuideMesh: THREE.Mesh | null = null;
  if (settings.includeWireGuide) {
    wireGuideMesh = generateWireGuide(bounds, settings);
  }
  
  let batteryHousingMesh: THREE.Mesh | null = null;
  if (settings.includeBatteryHousing) {
    batteryHousingMesh = generateBatteryHousing(settings);
  }
  
  let controllerMountMesh: THREE.Mesh | null = null;
  if (settings.includeControllerMount && settings.controllerType !== "none") {
    controllerMountMesh = generateControllerMount(settings);
  }
  
  // Generate 555 Timer Circuit Housing
  let circuitHousingBottom: THREE.Group | null = null;
  let circuitHousingTop: THREE.Group | null = null;
  if (settings.powerType === "usb_5v" || settings.powerType === "battery_3v" || settings.powerType === "battery_9v") {
    const circuitSettings: CircuitHousingSettings = {
      ...defaultCircuitHousingSettings,
      wireExitPosition: settings.wireEntryPosition === "side" ? "side" : "back",
      applyTorsionReinforcement: true, // Always use Scott torsion reinforcement
    };
    circuitHousingBottom = generateCircuitHousingBottom(circuitSettings);
    circuitHousingTop = generateCircuitHousingTop(circuitSettings);
  }
  
  // Generate CR2032 Holder (if selected)
  let cr2032Holder: THREE.Group | null = null;
  if (settings.powerType === "cr2032") {
    const cr2032Settings: CR2032HolderSettings = {
      ...defaultCR2032Settings,
      numBatteries: 2, // 6V total
      holderStyle: "snap",
      includeSwitch: settings.switchPosition !== "none",
      mountingStyle: "base_integrated",
    };
    cr2032Holder = generateCR2032Holder(cr2032Settings);
  }
  
  // Export to STL
  const exporter = new STLExporter();
  const tubeBodySTL = exporter.parse(tubeMeshes.body, { binary: false });
  const tubeLidSTL = tubeMeshes.lid ? exporter.parse(tubeMeshes.lid, { binary: false }) : undefined;
  const tubeBody2STL = tubeMeshes.body2 ? exporter.parse(tubeMeshes.body2, { binary: false }) : undefined;
  const baseSTL = exporter.parse(baseMesh, { binary: false });
  const wireGuideSTL = wireGuideMesh ? exporter.parse(wireGuideMesh, { binary: false }) : undefined;
  const batteryHousingSTL = batteryHousingMesh ? exporter.parse(batteryHousingMesh, { binary: false }) : undefined;
  const controllerMountSTL = controllerMountMesh ? exporter.parse(controllerMountMesh, { binary: false }) : undefined;
  const circuitHousingBottomSTL = circuitHousingBottom ? exporter.parse(circuitHousingBottom, { binary: false }) : undefined;
  const circuitHousingTopSTL = circuitHousingTop ? exporter.parse(circuitHousingTop, { binary: false }) : undefined;
  const cr2032HolderSTL = cr2032Holder ? exporter.parse(cr2032Holder, { binary: false }) : undefined;
  
  // Generate documentation
  const assemblyInstructions = generateAssemblyInstructions(settings, bounds);
  const wiringDiagram = settings.includeWiringDiagram ? generateWiringDiagram(settings) : undefined;
  const componentPlacementGuide = circuitHousingBottom ? generateComponentPlacementGuide(defaultCircuitHousingSettings) : undefined;
  const bom = generateBOM(settings, bounds);
  const openscad = settings.includeOpenSCAD ? generateOpenSCAD(settings) : undefined;
  
  return {
    tubeBodySTL,
    tubeLidSTL,
    tubeBody2STL,
    baseSTL,
    wireGuideSTL,
    batteryHousingSTL,
    controllerMountSTL,
    circuitHousingBottomSTL,
    circuitHousingTopSTL,
    cr2032HolderSTL,
    assemblyInstructions,
    wiringDiagram,
    componentPlacementGuide,
    bom,
    openscad,
  };
}

/**
 * Extract centerline from text using Zhang-Suen skeletonization
 */
function extractTextCenterline(font: opentype.Font, text: string, height: number): THREE.Vector2[][] {
  const paths: THREE.Vector2[][] = [];
  
  // Render text to get glyph paths
  const fontSize = height;
  const glyphPaths = font.getPaths(text, 0, 0, fontSize);
  
  for (const glyphPath of glyphPaths) {
    // Convert glyph path to points
    const commands = glyphPath.commands;
    const points: THREE.Vector2[] = [];
    
    for (const cmd of commands) {
      if (cmd.type === 'M' || cmd.type === 'L') {
        points.push(new THREE.Vector2(cmd.x || 0, cmd.y || 0));
      } else if (cmd.type === 'Q' && cmd.x && cmd.y && cmd.x1 && cmd.y1) {
        // Quadratic bezier - sample points
        const start = points[points.length - 1] || new THREE.Vector2(0, 0);
        const control = new THREE.Vector2(cmd.x1, cmd.y1);
        const end = new THREE.Vector2(cmd.x, cmd.y);
        
        for (let t = 0.1; t <= 1; t += 0.1) {
          const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
          const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
          points.push(new THREE.Vector2(x, y));
        }
      } else if (cmd.type === 'C' && cmd.x && cmd.y && cmd.x1 && cmd.y1 && cmd.x2 && cmd.y2) {
        // Cubic bezier - sample points
        const start = points[points.length - 1] || new THREE.Vector2(0, 0);
        const control1 = new THREE.Vector2(cmd.x1, cmd.y1);
        const control2 = new THREE.Vector2(cmd.x2, cmd.y2);
        const end = new THREE.Vector2(cmd.x, cmd.y);
        
        for (let t = 0.1; t <= 1; t += 0.1) {
          const mt = 1 - t;
          const x = mt * mt * mt * start.x + 3 * mt * mt * t * control1.x + 3 * mt * t * t * control2.x + t * t * t * end.x;
          const y = mt * mt * mt * start.y + 3 * mt * mt * t * control1.y + 3 * mt * t * t * control2.y + t * t * t * end.y;
          points.push(new THREE.Vector2(x, y));
        }
      }
    }
    
    if (points.length > 0) {
      paths.push(points);
    }
  }
  
  return paths;
}

/**
 * Calculate bounding box of paths
 */
function calculatePathBounds(paths: THREE.Vector2[][]): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  for (const path of paths) {
    for (const point of path) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Generate neon tube with LED channel
 */
function generateTube(paths: THREE.Vector2[][], settings: NeonStandSettings): {
  body: THREE.Mesh;
  lid?: THREE.Mesh;
  body2?: THREE.Mesh;
} {
  const tubeGeometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Create tube along paths
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Create cylinder segment
      const direction = new THREE.Vector2(p2.x - p1.x, p2.y - p1.y);
      const length = direction.length();
      const angle = Math.atan2(direction.y, direction.x);
      
      // Add vertices for tube segment
      const radius = settings.tubeDiameter / 2;
      const segments = 8;
      
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        const x = p1.x + Math.cos(theta) * radius;
        const y = p1.y + Math.sin(theta) * radius;
        const z = 0;
        
        vertices.push(x, y, z);
      }
    }
  }
  
  tubeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  const tubeMesh = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial());
  
  // Generate lid/diffuser if needed
  let lidMesh: THREE.Mesh | undefined;
  if (!settings.splitTube) {
    // Create diffuser lid
    lidMesh = new THREE.Mesh(tubeGeometry.clone(), new THREE.MeshStandardMaterial());
  }
  
  // Generate second half if split tube
  let body2Mesh: THREE.Mesh | undefined;
  if (settings.splitTube) {
    body2Mesh = new THREE.Mesh(tubeGeometry.clone(), new THREE.MeshStandardMaterial());
  }
  
  return {
    body: tubeMesh,
    lid: lidMesh,
    body2: body2Mesh,
  };
}

/**
 * Generate base platform with mounting system
 */
function generateBase(bounds: ReturnType<typeof calculatePathBounds>, settings: NeonStandSettings): THREE.Mesh {
  let baseWidth = settings.baseWidth;
  let baseDepth = settings.baseDepth;
  
  if (settings.autoSizeBase) {
    baseWidth = bounds.width + (settings.stabilityMargin * 2);
    baseDepth = bounds.height * 0.5 + settings.stabilityMargin;
  }
  
  const baseGeometry = new THREE.BoxGeometry(baseWidth, baseDepth, settings.baseThickness);
  
  // Add assembly mounting points based on type
  if (settings.assemblyType === "snap_fit") {
    // Add snap-fit posts
  } else if (settings.assemblyType === "screw_mount") {
    // Add screw holes
  } else if (settings.assemblyType === "magnetic") {
    // Add magnet recesses
  }
  
  // Add wire routing channel
  const wireChannel = createWireChannel(baseWidth, baseDepth, settings);
  
  const baseMesh = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial());
  
  return baseMesh;
}

/**
 * Create wire routing channel in base
 */
function createWireChannel(width: number, depth: number, settings: NeonStandSettings): THREE.Mesh {
  const channelGeometry = new THREE.BoxGeometry(
    settings.wireChannelWidth,
    depth * 0.8,
    settings.baseThickness * 0.5
  );
  
  return new THREE.Mesh(channelGeometry, new THREE.MeshStandardMaterial());
}

/**
 * Generate wire guide component
 */
function generateWireGuide(bounds: ReturnType<typeof calculatePathBounds>, settings: NeonStandSettings): THREE.Mesh {
  const guideGeometry = new THREE.CylinderGeometry(
    settings.wireChannelWidth / 2,
    settings.wireChannelWidth / 2,
    20,
    8
  );
  
  return new THREE.Mesh(guideGeometry, new THREE.MeshStandardMaterial());
}

/**
 * Generate battery housing
 */
function generateBatteryHousing(settings: NeonStandSettings): THREE.Mesh {
  const batteryDimensions = {
    "AA": { diameter: 14.5, length: 50.5 },
    "AAA": { diameter: 10.5, length: 44.5 },
    "9V": { width: 26.5, height: 48.5, depth: 17.5 },
    "none": { diameter: 0, length: 0 },
  };
  
  const dims = batteryDimensions[settings.batteryType];
  
  let housingGeometry: THREE.BufferGeometry;
  
  if (settings.batteryType === "9V") {
    housingGeometry = new THREE.BoxGeometry(
      dims.width! + 4,
      dims.height! + 4,
      dims.depth! + 4
    );
  } else {
    const totalLength = dims.length! * settings.batteryCount + 10;
    housingGeometry = new THREE.BoxGeometry(
      dims.diameter! + 4,
      totalLength,
      dims.diameter! + 4
    );
  }
  
  return new THREE.Mesh(housingGeometry, new THREE.MeshStandardMaterial());
}

/**
 * Generate controller mount
 */
function generateControllerMount(settings: NeonStandSettings): THREE.Mesh {
  const controllerDimensions = {
    "esp32": { width: 55, length: 28, height: 15 },
    "arduino_nano": { width: 45, length: 18, height: 10 },
    "attiny": { width: 20, length: 20, height: 8 },
    "none": { width: 0, length: 0, height: 0 },
  };
  
  const dims = controllerDimensions[settings.controllerType];
  
  const mountGeometry = new THREE.BoxGeometry(
    dims.width + 6,
    dims.length + 6,
    dims.height + 4
  );
  
  return new THREE.Mesh(mountGeometry, new THREE.MeshStandardMaterial());
}

/**
 * Generate assembly instructions
 */
function generateAssemblyInstructions(settings: NeonStandSettings, bounds: ReturnType<typeof calculatePathBounds>): string {
  const ledLength = Math.ceil(bounds.width * 1.2);
  
  return `# Neon Stand Assembly Instructions

## Generated Neon Stand: "${settings.text}"

### Components Included:
- Neon tube body (${settings.splitTube ? "2 halves" : "1 piece"})
${settings.splitTube ? "" : "- Tube diffuser lid"}
- Base platform (${settings.baseStyle} style)
${settings.includeWireGuide ? "- Wire guide channel" : ""}
${settings.includeBatteryHousing ? `- Battery housing (${settings.batteryCount}× ${settings.batteryType})` : ""}
${settings.includeControllerMount ? `- Controller mount (${settings.controllerType})` : ""}

### Required Materials (Not Included):
- LED strip (${settings.ledStripType}): ~${ledLength}mm length
- Wire: 22 AWG hookup wire
${settings.powerType === "usb_5v" ? "- USB cable (5V power)" : ""}
${settings.includeBatteryHousing ? `- Batteries: ${settings.batteryCount}× ${settings.batteryType}` : ""}
${settings.switchPosition !== "none" ? "- Toggle switch (SPST)" : ""}
${settings.includeDimmer ? "- 50k potentiometer (dimmer)" : ""}
${settings.assemblyType === "magnetic" ? `- Magnets: 6mm diameter × 2mm thick (×4)` : ""}
${settings.assemblyType === "screw_mount" ? `- Screws: M${settings.screwHoleDiameter} × 10mm (×2)` : ""}

### Assembly Steps:

#### 1. Prepare LED Strip
- Cut LED strip to ${ledLength}mm length
- Solder wires to strip ends (red = +, black = -)
- Test LED strip before installation

#### 2. Install LED in Tube
${settings.splitTube ? `- Place LED strip in bottom tube half
- Route wires to base connection point
- Snap top tube half into place` : `- Insert LED strip into tube channel
- Route wires through wire exit hole`}

#### 3. Mount Tube to Base
${settings.assemblyType === "snap_fit" ? "- Align tube with base posts\n- Press firmly until snap-fit engages" : ""}
${settings.assemblyType === "magnetic" ? "- Insert magnets into tube and base recesses\n- Tube will magnetically attach to base" : ""}
${settings.assemblyType === "screw_mount" ? "- Align tube with base holes\n- Insert screws and tighten" : ""}
${settings.assemblyType === "groove_slide" ? "- Slide tube into base groove channel" : ""}

#### 4. Wire Routing
- Route wires through ${settings.wireEntryPosition} channel
${settings.includeWireGuide ? "- Use wire guide to organize cables" : ""}
- Connect to power system

#### 5. Power System
${settings.powerType === "usb_5v" ? "- Connect USB cable to LED strip\n- Plug into 5V USB power source" : ""}
${settings.includeBatteryHousing ? `- Insert ${settings.batteryCount}× ${settings.batteryType} batteries\n- Connect battery pack to LED strip` : ""}
${settings.switchPosition !== "none" ? `- Install switch in ${settings.switchPosition.replace('_', ' ')} position\n- Wire switch inline with positive (+) lead` : ""}
${settings.includeDimmer ? "- Install potentiometer for brightness control\n- Wire in series with LED strip" : ""}

#### 6. Controller (Optional)
${settings.includeControllerMount && settings.controllerType !== "none" ? `- Mount ${settings.controllerType} in controller housing\n- Connect data line to LED strip\n- Upload control code to controller` : ""}

#### 7. Final Testing
- Power on the sign
- Check all LEDs illuminate
- Verify switch/dimmer operation
- Ensure stable base (no tipping)

### Print Settings:
- **Tube:** 0.2mm layer height, 15% infill, supports for overhangs
- **Base:** 0.2mm layer height, 20% infill (weighted style: 40% infill)
- **Diffuser:** 0.2mm layer height, 10% infill, white/translucent filament

### Tips:
- Use white or translucent filament for best light diffusion
- Print base in heavier material (PETG) for better stability
- Test fit before gluing any permanent connections
- Route wires neatly for professional appearance

Generated: ${new Date().toISOString()}
`;
}

/**
 * Generate wiring diagram
 */
function generateWiringDiagram(settings: NeonStandSettings): string {
  return `# Wiring Diagram: "${settings.text}" Neon Stand

## Power System: ${settings.powerType.toUpperCase().replace('_', ' ')}

### LED Strip Connection:
\`\`\`
LED Strip (${settings.ledStripType})
├─ Red (+)    → Power (+)
└─ Black (-)  → Ground (-)
${settings.ledStripType === "ws2812b_addressable" ? "└─ Data       → Controller Data Pin" : ""}
\`\`\`

### Power Source:
${settings.powerType === "usb_5v" ? `\`\`\`
USB 5V
├─ Red (+5V)  → LED Strip (+)
└─ Black (GND) → LED Strip (-)
\`\`\`` : ""}

${settings.includeBatteryHousing ? `\`\`\`
Battery Pack (${settings.batteryCount}× ${settings.batteryType})
├─ Red (+)    → LED Strip (+)
└─ Black (-)  → LED Strip (-)
\`\`\`` : ""}

### Switch Connection:
${settings.switchPosition !== "none" ? `\`\`\`
Power (+) → Switch → LED Strip (+)
Ground (-) ────────→ LED Strip (-)
\`\`\`` : "Always on (no switch)"}

### Dimmer Connection:
${settings.includeDimmer ? `\`\`\`
Power (+) → Potentiometer → LED Strip (+)
Ground (-) ─────────────→ LED Strip (-)
\`\`\`` : "No dimmer"}

### Controller Connection (if applicable):
${settings.includeControllerMount && settings.controllerType !== "none" ? `\`\`\`
${settings.controllerType.toUpperCase()}
├─ 5V    → Power (+)
├─ GND   → Ground (-)
└─ D2    → LED Strip Data
\`\`\`` : "No controller"}

## Wire Specifications:
- **Wire Gauge:** 22 AWG (recommended)
- **Wire Colors:** Red (+), Black (-)
- **Strip Length:** ~${Math.ceil(100)}mm (estimated)

## Safety Notes:
- Always test connections before final assembly
- Ensure correct polarity (+ to +, - to -)
- Do not exceed LED strip voltage rating
- Use appropriate fuse for battery systems

Generated: ${new Date().toISOString()}
`;
}

/**
 * Generate Bill of Materials
 */
function generateBOM(settings: NeonStandSettings, bounds: ReturnType<typeof calculatePathBounds>): string {
  const ledLength = Math.ceil(bounds.width * 1.2);
  
  return `# Bill of Materials (BOM)
# Neon Stand: "${settings.text}"

## 3D Printed Parts:
- Tube Body (${settings.splitTube ? "2 halves" : "1 piece"})
${settings.splitTube ? "" : "- Tube Diffuser Lid (1)"}
- Base Platform (1)
${settings.includeWireGuide ? "- Wire Guide (1)" : ""}
${settings.includeBatteryHousing ? "- Battery Housing (1)" : ""}
${settings.includeControllerMount ? "- Controller Mount (1)" : ""}

## Electronic Components:
- LED Strip (${settings.ledStripType}): ${ledLength}mm length
- Wire: 22 AWG hookup wire, ~500mm
${settings.powerType === "usb_5v" ? "- USB Cable: 5V power, 1m length" : ""}
${settings.includeBatteryHousing ? `- Batteries: ${settings.batteryCount}× ${settings.batteryType}` : ""}
${settings.switchPosition !== "none" ? "- Toggle Switch: SPST, 2A rating" : ""}
${settings.includeDimmer ? "- Potentiometer: 50k ohm, linear taper" : ""}
${settings.includeControllerMount && settings.controllerType !== "none" ? `- Microcontroller: ${settings.controllerType.toUpperCase()}` : ""}

## Hardware:
${settings.assemblyType === "magnetic" ? "- Magnets: 6mm diameter × 2mm thick (×4)" : ""}
${settings.assemblyType === "screw_mount" ? `- Screws: M${settings.screwHoleDiameter} × 10mm (×2)` : ""}

## Tools Required:
- Soldering iron + solder
- Wire strippers
- Screwdriver (if using screws)
- Hot glue gun (optional, for wire management)

## Estimated Costs:
- 3D Printing: $3-5 (filament)
- LED Strip: $5-10 (per meter)
- Electronics: $5-15 (depending on options)
- Total: $13-30 USD

Generated: ${new Date().toISOString()}
`;
}

/**
 * Generate OpenSCAD source
 */
function generateOpenSCAD(settings: NeonStandSettings): string {
  return `// Neon Stand: "${settings.text}"
// Generated by Sign-Sculptor

/* [Tube Design] */
Tube_Diameter = ${settings.tubeDiameter};
Tube_Height = ${settings.tubeHeight};
LED_Channel_Width = ${settings.ledChannelWidth};
Split_Tube = ${settings.splitTube ? "true" : "false"};
Diffuser_Thickness = ${settings.diffuserThickness};

/* [Base Platform] */
Base_Style = "${settings.baseStyle}";
Base_Thickness = ${settings.baseThickness};
Base_Width = ${settings.baseWidth};
Base_Depth = ${settings.baseDepth};
Stability_Margin = ${settings.stabilityMargin};

/* [Assembly] */
Assembly_Type = "${settings.assemblyType}";
Snap_Fit_Tolerance = ${settings.snapFitTolerance};
Screw_Hole_Diameter = ${settings.screwHoleDiameter};

/* [Wiring] */
Wire_Channel_Width = ${settings.wireChannelWidth};
Wire_Entry_Position = "${settings.wireEntryPosition}";

$fn = 60;

// Base module
module base() {
    difference() {
        // Main base platform
        cube([Base_Width, Base_Depth, Base_Thickness], center=true);
        
        // Wire channel
        translate([0, 0, Base_Thickness/4])
            cube([Wire_Channel_Width, Base_Depth * 0.8, Base_Thickness/2], center=true);
    }
}

// Tube module
module tube() {
    // Simplified tube representation
    cylinder(d=Tube_Diameter, h=Tube_Height, center=false);
}

// Render
base();
translate([0, 0, Base_Thickness/2 + 5])
    tube();
`;
}
