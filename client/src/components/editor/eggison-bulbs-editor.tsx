import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEditorStore } from "@/lib/editor-store";
import { Lightbulb, Download } from "lucide-react";
import type { EggisonShellStyle, EggisonBaseType, EggisonLightType } from "@shared/schema";

// 3D Preview Component
function BulbPreview({ settings }: { settings: any }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Generate shell geometry based on style
  const generateShellGeometry = () => {
    const height = settings.shellHeight / 10; // Scale down for preview
    const width = settings.shellWidth / 10;
    const segments = 32;
    
    const points: THREE.Vector2[] = [];
    
    switch (settings.shellStyle) {
      case "classic":
        // Classic egg shape - wider at bottom (60% down), tapered to point at top
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          let radius;
          if (t < 0.6) {
            // Bottom 60% - gradual widening
            const localT = t / 0.6;
            const angle = localT * Math.PI * 0.5;
            radius = (width / 2) * Math.sin(angle);
          } else {
            // Top 40% - sharper taper to point
            const localT = (t - 0.6) / 0.4;
            const angle = Math.PI * 0.5 + localT * Math.PI * 0.5;
            radius = (width / 2) * Math.sin(angle) * (1 - localT * 0.4);
          }
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "tall":
        // Tall and narrow
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle) * 0.8;
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "wide":
        // Wide and short
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle) * 1.2;
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "mini":
        // Mini rounded
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle);
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "cracked":
      case "split":
        // Same as classic for preview
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          let radius;
          if (t < 0.6) {
            const localT = t / 0.6;
            const angle = localT * Math.PI * 0.5;
            radius = (width / 2) * Math.sin(angle);
          } else {
            const localT = (t - 0.6) / 0.4;
            const angle = Math.PI * 0.5 + localT * Math.PI * 0.5;
            radius = (width / 2) * Math.sin(angle) * (1 - localT * 0.4);
          }
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      default:
        // Default egg shape
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle);
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
    }
    
    return new THREE.LatheGeometry(points, 32);
  };

  const geometry = generateShellGeometry();

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.3}
        roughness={0.1}
        metalness={0.1}
        transmission={0.9}
        thickness={0.5}
      />
    </mesh>
  );
}

export function EggisonBulbsEditor() {
  const { eggisonSettings, setEggisonSettings } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const updateSetting = <K extends keyof typeof eggisonSettings>(
    key: K,
    value: typeof eggisonSettings[K]
  ) => {
    setEggisonSettings({ [key]: value });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/eggison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eggisonSettings),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eggison_${eggisonSettings.shellStyle}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export Eggison Bulb");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Settings */}
      <div className="w-96 overflow-y-auto border-r p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Eggison Bulbs
            </CardTitle>
            <CardDescription>
              Create custom 3D-printed light bulb shells for DIY LED filament bulbs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Shell Style */}
          <div className="space-y-2">
            <Label>Shell Style</Label>
            <Select
              value={eggisonSettings.shellStyle}
              onValueChange={(v) => updateSetting("shellStyle", v as EggisonShellStyle)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic (100×70mm)</SelectItem>
                <SelectItem value="tall">Tall (130×60mm)</SelectItem>
                <SelectItem value="wide">Wide (80×90mm)</SelectItem>
                <SelectItem value="mini">Mini (50×35mm)</SelectItem>
                <SelectItem value="cracked">Cracked/Hatched</SelectItem>
                <SelectItem value="split">Split Halves</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shell Dimensions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shell Height: {eggisonSettings.shellHeight}mm</Label>
              <Slider
                value={[eggisonSettings.shellHeight]}
                onValueChange={([v]) => updateSetting("shellHeight", v)}
                min={40}
                max={150}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Shell Width: {eggisonSettings.shellWidth}mm</Label>
              <Slider
                value={[eggisonSettings.shellWidth]}
                onValueChange={([v]) => updateSetting("shellWidth", v)}
                min={30}
                max={120}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Wall Thickness: {eggisonSettings.wallThickness}mm</Label>
              <Slider
                value={[eggisonSettings.wallThickness]}
                onValueChange={([v]) => updateSetting("wallThickness", v)}
                min={1}
                max={4}
                step={0.5}
              />
            </div>
          </div>

          {/* Light Type */}
          <div className="space-y-2">
            <Label>Light Type</Label>
            <Select
              value={eggisonSettings.lightType}
              onValueChange={(v) => updateSetting("lightType", v as EggisonLightType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filament">LED Filament</SelectItem>
                <SelectItem value="ws2812b">WS2812B Addressable</SelectItem>
                <SelectItem value="led_strip">LED Strip</SelectItem>
                <SelectItem value="fairy_lights">Fairy Lights</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Screw Base */}
          <div className="space-y-2">
            <Label>Screw Base Type</Label>
            <Select
              value={eggisonSettings.baseType}
              onValueChange={(v) => updateSetting("baseType", v as EggisonBaseType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E26">E26 (Standard US)</SelectItem>
                <SelectItem value="E27">E27 (Standard EU)</SelectItem>
                <SelectItem value="E14">E14 (Candelabra)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Base Height: {eggisonSettings.baseHeight}mm</Label>
            <Slider
              value={[eggisonSettings.baseHeight]}
              onValueChange={([v]) => updateSetting("baseHeight", v)}
              min={15}
              max={40}
              step={1}
            />
          </div>

          {/* Filament Channel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Filament Channel</Label>
              <Switch
                checked={eggisonSettings.includeFilamentChannel}
                onCheckedChange={(v) => updateSetting("includeFilamentChannel", v)}
              />
            </div>
            {eggisonSettings.includeFilamentChannel && (
              <div className="space-y-2">
                <Label>Channel Diameter: {eggisonSettings.filamentChannelDiameter}mm</Label>
                <Slider
                  value={[eggisonSettings.filamentChannelDiameter]}
                  onValueChange={([v]) => updateSetting("filamentChannelDiameter", v)}
                  min={2}
                  max={8}
                  step={0.5}
                />
              </div>
            )}
          </div>

          {/* Accessories */}
          <div className="space-y-3">
            <Label>Accessories</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="glasses">Glasses</Label>
              <Switch
                id="glasses"
                checked={eggisonSettings.includeGlasses}
                onCheckedChange={(v) => updateSetting("includeGlasses", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="feet">Feet</Label>
              <Switch
                id="feet"
                checked={eggisonSettings.includeFeet}
                onCheckedChange={(v) => updateSetting("includeFeet", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="battery">Battery Holder</Label>
              <Switch
                id="battery"
                checked={eggisonSettings.includeBatteryHolder}
                onCheckedChange={(v) => updateSetting("includeBatteryHolder", v)}
              />
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Generating..." : "Export Eggison Bulb STL"}
          </Button>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Eggison Bulbs:</strong> Print the shell in translucent filament, insert shaped LED filaments or WS2812B strips, 
              solder connections to the screw base, and snap the halves together. Create your own custom light bulbs!
            </p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Right Panel - 3D Preview */}
      <div className="flex-1 flex flex-col bg-muted/30">
        <div className="flex-1">
          <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <BulbPreview settings={eggisonSettings} />
            <OrbitControls enablePan={false} />
            <gridHelper args={[20, 20, '#888888', '#444444']} />
          </Canvas>
        </div>
        <div className="p-4 border-t bg-background/95 backdrop-blur">
          <div className="text-center">
            <p className="text-sm font-medium">
              {eggisonSettings.shellStyle.charAt(0).toUpperCase() + eggisonSettings.shellStyle.slice(1)} Shell
            </p>
            <p className="text-xs text-muted-foreground">
              {eggisonSettings.shellHeight}mm × {eggisonSettings.shellWidth}mm • {eggisonSettings.baseType.toUpperCase()} Base
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
