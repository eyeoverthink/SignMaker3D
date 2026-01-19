import { useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useEditorStore } from "@/lib/editor-store";
import { 
  type EggisonSettings,
  type EggisonBaseType,
  type EggisonShellStyle,
  type EggisonLightType,
  type DiffusionPattern,
  eggisonBaseTypes,
  eggisonShellStyles,
  eggisonLightTypes,
  diffusionPatterns,
  defaultEggisonSettings,
} from "@shared/schema";
import { 
  Egg, 
  Download, 
  Glasses, 
  Footprints, 
  Battery, 
  Lightbulb,
  Zap,
  Cable,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Upload,
} from "lucide-react";

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

const baseTypeLabels: Record<EggisonBaseType, string> = {
  "E26": "E26 (US Standard)",
  "E27": "E27 (European)",
  "E14": "E14 (Small/Candelabra)",
};

const shellStyleLabels: Record<EggisonShellStyle, string> = {
  "classic": "Classic Egg",
  "tall": "Tall Egg",
  "wide": "Wide Egg",
  "mini": "Mini Egg",
  "cracked": "Cracked/Hatched",
  "split": "Split (2 Halves)",
};

const lightTypeLabels: Record<EggisonLightType, string> = {
  "none": "None (Decorative)",
  "filament_tube": "LED Filament Coil",
  "rgb_led_strip": "RGB LED Strip",
  "central_led": "Central LED",
  "vase_mode": "Vase Mode Shell",
};

const diffusionPatternLabels: Record<DiffusionPattern, string> = {
  "spiral": "Spiral Grooves",
  "honeycomb": "Honeycomb",
  "waves": "Wave Pattern",
  "organic": "Organic Texture",
  "smooth": "Smooth",
};

function getShellDimensions(style: EggisonShellStyle): { height: number; width: number } {
  switch (style) {
    case "classic": return { height: 100, width: 70 };
    case "tall": return { height: 130, width: 60 };
    case "wide": return { height: 80, width: 90 };
    case "mini": return { height: 50, width: 35 };
    case "cracked": return { height: 80, width: 70 };
    case "split": return { height: 100, width: 70 };
    default: return { height: 100, width: 70 };
  }
}

// Generate filament coil geometry
function generateFilamentCoil(settings: EggisonSettings): THREE.Mesh {
  const { filamentCoilDiameter, filamentCoilTurns, filamentCoilHeight, filamentCoilPitch } = settings;
  
  const points: THREE.Vector3[] = [];
  const segments = filamentCoilTurns * 20;
  const radius = filamentCoilDiameter / 2;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * filamentCoilTurns * Math.PI * 2;
    const y = 15 + t * filamentCoilHeight;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }
  
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.8, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xff8c00,
    emissiveIntensity: 0.7,
  });
  
  return new THREE.Mesh(tubeGeometry, material);
}

// Generate RGB LED strip path
function generateLEDStrip(settings: EggisonSettings): THREE.Group {
  const group = new THREE.Group();
  const { ledStripWidth, ledStripLedCount, ledStripPattern, ledStripSpacing, shellHeight, shellWidth } = settings;
  
  const stripMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.3,
  });
  
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.5,
  });
  
  if (ledStripPattern === "spiral") {
    const radius = (shellWidth - 20) / 2;
    const turns = 3;
    
    for (let i = 0; i < ledStripLedCount; i++) {
      const t = i / ledStripLedCount;
      const angle = t * turns * Math.PI * 2;
      const y = 15 + t * (shellHeight - 30);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        ledMaterial
      );
      led.position.set(x, y, z);
      group.add(led);
    }
  } else if (ledStripPattern === "vertical") {
    const strips = 4;
    const ledsPerStrip = Math.floor(ledStripLedCount / strips);
    const radius = (shellWidth - 20) / 2;
    
    for (let strip = 0; strip < strips; strip++) {
      const angle = (strip / strips) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      for (let i = 0; i < ledsPerStrip; i++) {
        const y = 15 + (i / ledsPerStrip) * (shellHeight - 30);
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 8, 8),
          ledMaterial
        );
        led.position.set(x, y, z);
        group.add(led);
      }
    }
  }
  
  return group;
}

// Generate central LED mount
function generateCentralLED(settings: EggisonSettings): THREE.Group {
  const group = new THREE.Group();
  const { centralLedSize, centralLedCount, centralLedMountHeight } = settings;
  
  // LED mount platform
  const mountGeometry = new THREE.CylinderGeometry(15, 15, 3, 16);
  const mountMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.6,
    metalness: 0.4,
  });
  const mount = new THREE.Mesh(mountGeometry, mountMaterial);
  mount.position.y = centralLedMountHeight;
  group.add(mount);
  
  // LEDs
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffaa,
    emissiveIntensity: 0.8,
  });
  
  if (centralLedCount === 1) {
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(centralLedSize / 2, 16, 16),
      ledMaterial
    );
    led.position.y = centralLedMountHeight + 2;
    group.add(led);
  } else {
    const radius = centralLedSize;
    for (let i = 0; i < centralLedCount; i++) {
      const angle = (i / centralLedCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(centralLedSize / 3, 12, 12),
        ledMaterial
      );
      led.position.set(x, centralLedMountHeight + 2, z);
      group.add(led);
    }
  }
  
  return group;
}

// Generate vase mode shell with diffusion pattern
function generateVaseModeShell(settings: EggisonSettings): THREE.Mesh {
  const { shellHeight, shellWidth, diffusionPattern, diffusionDepth, diffusionSpacing } = settings;
  
  const geometry = new THREE.SphereGeometry(shellWidth / 2, 64, 64);
  geometry.scale(1, shellHeight / shellWidth, 1);
  
  // Apply diffusion pattern by modifying vertices
  const positions = geometry.attributes.position;
  
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    let offset = 0;
    
    if (diffusionPattern === "spiral") {
      const angle = Math.atan2(z, x);
      const height = y / shellHeight;
      offset = Math.sin(angle * 8 + height * 20) * diffusionDepth;
    } else if (diffusionPattern === "honeycomb") {
      const scale = diffusionSpacing;
      offset = (Math.sin(x * scale) + Math.sin(z * scale) + Math.sin(y * scale)) * diffusionDepth / 3;
    } else if (diffusionPattern === "waves") {
      offset = Math.sin(y * 0.5) * Math.cos(Math.atan2(z, x) * 4) * diffusionDepth;
    } else if (diffusionPattern === "organic") {
      offset = (Math.sin(x * 2) * Math.cos(z * 2) * Math.sin(y * 1.5)) * diffusionDepth;
    }
    
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length > 0) {
      positions.setXYZ(i, x + (x / length) * offset, y + (y / length) * offset, z + (z / length) * offset);
    }
  }
  
  geometry.computeVertexNormals();
  
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = shellHeight / 2 + 10;
  
  return mesh;
}

function EggisonPreview({ settings }: { settings: EggisonSettings }) {
  const scale = 0.012;

  const eggGeometry = useMemo(() => {
    const group = new THREE.Group();
    
    const shellMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: settings.vaseModeEnabled ? 0.4 : 0.6,
      side: THREE.DoubleSide,
    });
    
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6b7280,
      roughness: 0.4,
      metalness: 0.5,
    });
    
    const threadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xb8860b,
      roughness: 0.3,
      metalness: 0.8,
    });

    const { shellHeight, shellWidth } = settings;
    
    // Shell geometry (vase mode or regular)
    if (settings.vaseModeEnabled) {
      const vaseModeShell = generateVaseModeShell(settings);
      group.add(vaseModeShell);
    } else if (settings.shellStyle === "split") {
      const halfHeight = shellHeight / 2;
      const gap = 15;
      
      const bottomGeom = new THREE.SphereGeometry(shellWidth / 2, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      bottomGeom.scale(1, shellHeight / shellWidth, 1);
      const bottomMesh = new THREE.Mesh(bottomGeom, shellMaterial);
      bottomMesh.position.set(-shellWidth / 2 - gap / 2, halfHeight / 2 + 10, 0);
      group.add(bottomMesh);
      
      const topGeom = new THREE.SphereGeometry(shellWidth / 2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      topGeom.scale(1, shellHeight / shellWidth, 1);
      const topMesh = new THREE.Mesh(topGeom, shellMaterial);
      topMesh.position.set(shellWidth / 2 + gap / 2, halfHeight / 2 + 10, 0);
      group.add(topMesh);
    } else {
      const eggGeom = new THREE.SphereGeometry(shellWidth / 2, 32, 32);
      eggGeom.scale(1, shellHeight / shellWidth, 1);
      const eggMesh = new THREE.Mesh(eggGeom, shellMaterial);
      eggMesh.position.set(0, shellHeight / 2 + 10, 0);
      group.add(eggMesh);
    }

    // Base geometry
    const baseDiameter = settings.baseType === "E14" ? 14 : settings.baseType === "E26" ? 26 : 27;
    const baseRadius = baseDiameter / 2;
    const collarHeight = 10;
    const collarRadius = baseRadius + 4;
    
    const collarGeom = new THREE.CylinderGeometry(collarRadius, collarRadius, collarHeight, 32, 1, true);
    const collarMesh = new THREE.Mesh(collarGeom, baseMaterial);
    collarMesh.position.set(0, collarHeight / 2, 0);
    group.add(collarMesh);

    const threadHeight = settings.baseHeight - collarHeight;
    const threadGeom = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.9, threadHeight, 32, 1, true);
    const threadMesh = new THREE.Mesh(threadGeom, threadMaterial);
    threadMesh.position.set(0, -threadHeight / 2, 0);
    group.add(threadMesh);

    // Light source geometry
    if (settings.lightType === "filament_tube") {
      const filamentCoil = generateFilamentCoil(settings);
      group.add(filamentCoil);
    } else if (settings.lightType === "rgb_led_strip") {
      const ledStrip = generateLEDStrip(settings);
      group.add(ledStrip);
    } else if (settings.lightType === "central_led") {
      const centralLED = generateCentralLED(settings);
      group.add(centralLED);
    }

    // Accessories (glasses, feet, battery holder)
    if (settings.includeGlasses) {
      const eyeLevel = shellHeight * 0.65 + 10;
      const eyeSpacing = shellWidth * 0.22;
      const lensRadius = shellWidth * 0.1;
      const accessoryMaterial = new THREE.MeshStandardMaterial({
        color: 0x374151,
        roughness: 0.5,
        metalness: 0.3,
      });
      
      for (let side = -1; side <= 1; side += 2) {
        const frameGeom = new THREE.TorusGeometry(lensRadius, 2, 8, 24);
        const frameMesh = new THREE.Mesh(frameGeom, accessoryMaterial);
        frameMesh.position.set(side * eyeSpacing, eyeLevel, shellWidth * 0.35);
        group.add(frameMesh);
      }
    }

    if (settings.includeFeet) {
      // Simple feet geometry
      const footMaterial = new THREE.MeshStandardMaterial({
        color: 0xffa500,
        roughness: 0.6,
        metalness: 0.2,
      });
      
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const radius = baseRadius * 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const footGeom = new THREE.CylinderGeometry(3, 2, 20, 8);
        const footMesh = new THREE.Mesh(footGeom, footMaterial);
        footMesh.position.set(x, -threadHeight - 10, z);
        group.add(footMesh);
      }
    }

    return group;
  }, [settings]);

  return <primitive object={eggGeometry} scale={scale} />;
}

export default function EggisonBulbsEditorEnhanced() {
  const { toast } = useToast();
  const [webglSupported] = useState(checkWebGLSupport());
  const [isExporting, setIsExporting] = useState(false);
  const [eggisonSettings, setEggisonSettingsState] = useState<EggisonSettings>(defaultEggisonSettings);

  const setEggisonSettings = (updates: Partial<EggisonSettings>) => {
    setEggisonSettingsState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const dims = getShellDimensions(eggisonSettings.shellStyle);
    if (eggisonSettings.shellHeight !== dims.height || eggisonSettings.shellWidth !== dims.width) {
      setEggisonSettings({
        shellHeight: dims.height,
        shellWidth: dims.width,
      });
    }
  }, [eggisonSettings.shellStyle]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/eggison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eggisonSettings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `eggison_${eggisonSettings.lightType}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded ${filename} with light source components`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex" data-testid="eggison-editor-enhanced">
      <div className="flex-1 relative bg-gradient-to-br from-amber-900/20 to-orange-900/30">
        {webglSupported ? (
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 1, 4]} fov={50} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
            <pointLight position={[-3, 5, -3]} intensity={0.5} color="#ffa500" />
            <EggisonPreview settings={eggisonSettings} />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={10}
            />
            <gridHelper args={[10, 20, 0x444444, 0x222222]} rotation={[0, 0, 0]} position={[0, -2, 0]} />
          </Canvas>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <Egg className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <p className="text-muted-foreground">WebGL not supported. Preview unavailable.</p>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">Eggison Functional Lights</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Egg-shaped bulbs with real illumination</p>
        </div>
      </div>

      <div className="w-96 border-l bg-background overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Egg className="w-5 h-5 text-amber-500" />
              Eggison Light Settings
            </h2>
          </div>

          <Tabs defaultValue="shell" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="shell">Shell</TabsTrigger>
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="lithophane">Image</TabsTrigger>
              <TabsTrigger value="accessories">Extra</TabsTrigger>
            </TabsList>

            <TabsContent value="shell" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Egg className="w-4 h-4" />
                    Shell Design
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Shell Style</Label>
                    <Select
                      value={eggisonSettings.shellStyle}
                      onValueChange={(value) => setEggisonSettings({ shellStyle: value as EggisonShellStyle })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eggisonShellStyles.map((style) => (
                          <SelectItem key={style} value={style}>
                            {shellStyleLabels[style]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Height: {eggisonSettings.shellHeight}mm
                    </Label>
                    <Slider
                      value={[eggisonSettings.shellHeight]}
                      onValueChange={([value]) => setEggisonSettings({ shellHeight: value })}
                      min={40}
                      max={150}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Width: {eggisonSettings.shellWidth}mm
                    </Label>
                    <Slider
                      value={[eggisonSettings.shellWidth]}
                      onValueChange={([value]) => setEggisonSettings({ shellWidth: value })}
                      min={30}
                      max={120}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Wall Thickness: {eggisonSettings.wallThickness}mm
                    </Label>
                    <Slider
                      value={[eggisonSettings.wallThickness]}
                      onValueChange={([value]) => setEggisonSettings({ wallThickness: value })}
                      min={0.4}
                      max={4}
                      step={0.2}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Base Type</Label>
                    <Select
                      value={eggisonSettings.baseType}
                      onValueChange={(value) => setEggisonSettings({ baseType: value as EggisonBaseType })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eggisonBaseTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {baseTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="light" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Light Source Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Light Type</Label>
                    <Select
                      value={eggisonSettings.lightType}
                      onValueChange={(value) => setEggisonSettings({ lightType: value as EggisonLightType })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eggisonLightTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {lightTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {eggisonSettings.lightType === "filament_tube" && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Coil Diameter: {eggisonSettings.filamentCoilDiameter}mm
                        </Label>
                        <Slider
                          value={[eggisonSettings.filamentCoilDiameter]}
                          onValueChange={([value]) => setEggisonSettings({ filamentCoilDiameter: value })}
                          min={2}
                          max={8}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Coil Turns: {eggisonSettings.filamentCoilTurns}
                        </Label>
                        <Slider
                          value={[eggisonSettings.filamentCoilTurns]}
                          onValueChange={([value]) => setEggisonSettings({ filamentCoilTurns: value })}
                          min={3}
                          max={12}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Coil Height: {eggisonSettings.filamentCoilHeight}mm
                        </Label>
                        <Slider
                          value={[eggisonSettings.filamentCoilHeight]}
                          onValueChange={([value]) => setEggisonSettings({ filamentCoilHeight: value })}
                          min={20}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}

                  {eggisonSettings.lightType === "rgb_led_strip" && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          LED Count: {eggisonSettings.ledStripLedCount}
                        </Label>
                        <Slider
                          value={[eggisonSettings.ledStripLedCount]}
                          onValueChange={([value]) => setEggisonSettings({ ledStripLedCount: value })}
                          min={10}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pattern</Label>
                        <Select
                          value={eggisonSettings.ledStripPattern}
                          onValueChange={(value) => setEggisonSettings({ ledStripPattern: value as "spiral" | "vertical" | "zigzag" })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spiral">Spiral</SelectItem>
                            <SelectItem value="vertical">Vertical Strips</SelectItem>
                            <SelectItem value="zigzag">Zigzag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {eggisonSettings.lightType === "central_led" && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          LED Size: {eggisonSettings.centralLedSize}mm
                        </Label>
                        <Slider
                          value={[eggisonSettings.centralLedSize]}
                          onValueChange={([value]) => setEggisonSettings({ centralLedSize: value })}
                          min={5}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          LED Count: {eggisonSettings.centralLedCount}
                        </Label>
                        <Slider
                          value={[eggisonSettings.centralLedCount]}
                          onValueChange={([value]) => setEggisonSettings({ centralLedCount: value })}
                          min={1}
                          max={9}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}

                  {eggisonSettings.lightType === "vase_mode" && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Enable Vase Mode</Label>
                        <Switch
                          checked={eggisonSettings.vaseModeEnabled}
                          onCheckedChange={(checked) => setEggisonSettings({ vaseModeEnabled: checked })}
                        />
                      </div>
                      {eggisonSettings.vaseModeEnabled && (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Diffusion Pattern</Label>
                            <Select
                              value={eggisonSettings.diffusionPattern}
                              onValueChange={(value) => setEggisonSettings({ diffusionPattern: value as DiffusionPattern })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {diffusionPatterns.map((pattern) => (
                                  <SelectItem key={pattern} value={pattern}>
                                    {diffusionPatternLabels[pattern]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Pattern Depth: {eggisonSettings.diffusionDepth}mm
                            </Label>
                            <Slider
                              value={[eggisonSettings.diffusionDepth]}
                              onValueChange={([value]) => setEggisonSettings({ diffusionDepth: value })}
                              min={0.2}
                              max={2}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lithophane" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Lithophane Core
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Enable Lithophane</Label>
                    <Switch
                      checked={eggisonSettings.lithophaneEnabled}
                      onCheckedChange={(checked) => setEggisonSettings({ lithophaneEnabled: checked })}
                    />
                  </div>

                  {eggisonSettings.lithophaneEnabled && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">Position</Label>
                        <Select
                          value={eggisonSettings.lithophanePosition}
                          onValueChange={(value) => setEggisonSettings({ lithophanePosition: value as "none" | "center" | "inner_shell" })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="center">Center Core</SelectItem>
                            <SelectItem value="inner_shell">Inner Shell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Upload Image</Label>
                        <Button variant="outline" className="w-full" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload image for lithophane carving
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Min Thickness: {eggisonSettings.lithophaneThicknessMin}mm
                        </Label>
                        <Slider
                          value={[eggisonSettings.lithophaneThicknessMin]}
                          onValueChange={([value]) => setEggisonSettings({ lithophaneThicknessMin: value })}
                          min={0.8}
                          max={3}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Max Thickness: {eggisonSettings.lithophaneThicknessMax}mm
                        </Label>
                        <Slider
                          value={[eggisonSettings.lithophaneThicknessMax]}
                          onValueChange={([value]) => setEggisonSettings({ lithophaneThicknessMax: value })}
                          min={2}
                          max={8}
                          step={0.2}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accessories" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Accessories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Glasses className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Glasses</Label>
                    </div>
                    <Switch
                      checked={eggisonSettings.includeGlasses}
                      onCheckedChange={(checked) => setEggisonSettings({ includeGlasses: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Feet</Label>
                    </div>
                    <Switch
                      checked={eggisonSettings.includeFeet}
                      onCheckedChange={(checked) => setEggisonSettings({ includeFeet: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Battery Holder (3V)</Label>
                    </div>
                    <Switch
                      checked={eggisonSettings.includeBatteryHolder}
                      onCheckedChange={(checked) => setEggisonSettings({ includeBatteryHolder: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button
            className="w-full"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Complete Assembly"}
          </Button>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Export Includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Shell STL (with light diffusion if enabled)</li>
              <li>Light source insert STL</li>
              <li>Base with screw threads STL</li>
              <li>Wiring diagram PDF</li>
              <li>Bill of materials (LEDs, wire, battery)</li>
              <li>Assembly instructions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
