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
import type { EggisonShellShape, EggisonScrewBase, FilamentGuideType, ShellFinish } from "@shared/schema";

// 3D Preview Component
function BulbPreview({ settings }: { settings: any }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Generate shell geometry based on shape
  const generateShellGeometry = () => {
    const height = settings.shellHeight / 10; // Scale down for preview
    const width = settings.shellWidth / 10;
    const segments = 32;
    
    const points: THREE.Vector2[] = [];
    
    switch (settings.shellShape) {
      case "egg":
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle) * (1 - t * 0.3);
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "sphere":
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle);
          const y = -height / 2 + (width / 2) * (1 - Math.cos(angle));
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "teardrop":
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const radius = (width / 2) * Math.sin(angle) * (1 - t * 0.6);
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      case "pear":
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * Math.PI;
          const bulge = 1 + 0.3 * Math.sin(t * Math.PI);
          const radius = (width / 2) * Math.sin(angle) * bulge * (1 - t * 0.4);
          const y = -height / 2 + t * height;
          points.push(new THREE.Vector2(radius, y));
        }
        break;
      default:
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
  const { eggisonBulbsSettings, setEggisonBulbsSettings } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const updateSetting = <K extends keyof typeof eggisonBulbsSettings>(
    key: K,
    value: typeof eggisonBulbsSettings[K]
  ) => {
    setEggisonBulbsSettings({ ...eggisonBulbsSettings, [key]: value });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/eggison-bulbs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eggisonBulbsSettings),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eggison_${eggisonBulbsSettings.shellShape}_${Date.now()}.zip`;
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
          {/* Shell Shape */}
          <div className="space-y-2">
            <Label>Shell Shape</Label>
            <Select
              value={eggisonBulbsSettings.shellShape}
              onValueChange={(v) => updateSetting("shellShape", v as EggisonShellShape)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="egg">Egg</SelectItem>
                <SelectItem value="sphere">Sphere</SelectItem>
                <SelectItem value="teardrop">Teardrop</SelectItem>
                <SelectItem value="pear">Pear</SelectItem>
                <SelectItem value="tube">Tube</SelectItem>
                <SelectItem value="dome">Dome</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shell Dimensions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shell Height: {eggisonBulbsSettings.shellHeight}mm</Label>
              <Slider
                value={[eggisonBulbsSettings.shellHeight]}
                onValueChange={([v]) => updateSetting("shellHeight", v)}
                min={40}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Shell Width: {eggisonBulbsSettings.shellWidth}mm</Label>
              <Slider
                value={[eggisonBulbsSettings.shellWidth]}
                onValueChange={([v]) => updateSetting("shellWidth", v)}
                min={30}
                max={150}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Wall Thickness: {eggisonBulbsSettings.shellWallThickness}mm</Label>
              <Slider
                value={[eggisonBulbsSettings.shellWallThickness]}
                onValueChange={([v]) => updateSetting("shellWallThickness", v)}
                min={1}
                max={5}
                step={0.5}
              />
            </div>
          </div>

          {/* Shell Finish */}
          <div className="space-y-2">
            <Label>Shell Finish</Label>
            <Select
              value={eggisonBulbsSettings.shellFinish}
              onValueChange={(v) => updateSetting("shellFinish", v as ShellFinish)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="frosted">Frosted</SelectItem>
                <SelectItem value="translucent">Translucent</SelectItem>
                <SelectItem value="opaque">Opaque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Screw Base */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Screw Base Type</Label>
              <Select
                value={eggisonBulbsSettings.screwBase}
                onValueChange={(v) => updateSetting("screwBase", v as EggisonScrewBase)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e26">E26 (Standard US)</SelectItem>
                  <SelectItem value="e27">E27 (Standard EU)</SelectItem>
                  <SelectItem value="e14">E14 (Candelabra)</SelectItem>
                  <SelectItem value="e12">E12 (Small Candelabra)</SelectItem>
                  <SelectItem value="gu10">GU10 (Twist & Lock)</SelectItem>
                  <SelectItem value="none">None (Custom Mount)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eggisonBulbsSettings.screwBase !== "none" && (
              <>
                <div className="space-y-2">
                  <Label>Base Height: {eggisonBulbsSettings.baseHeight}mm</Label>
                  <Slider
                    value={[eggisonBulbsSettings.baseHeight]}
                    onValueChange={([v]) => updateSetting("baseHeight", v)}
                    min={10}
                    max={40}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="conductive-groove">Conductive Path Groove</Label>
                  <Switch
                    id="conductive-groove"
                    checked={eggisonBulbsSettings.conductivePathGroove}
                    onCheckedChange={(v) => updateSetting("conductivePathGroove", v)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Filament Guide */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Internal Filament Guide</Label>
              <Select
                value={eggisonBulbsSettings.filamentGuide}
                onValueChange={(v) => updateSetting("filamentGuide", v as FilamentGuideType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="heart">Heart</SelectItem>
                  <SelectItem value="infinity">Infinity (∞)</SelectItem>
                  <SelectItem value="spiral">Spiral</SelectItem>
                  <SelectItem value="zigzag">Zigzag</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="custom_path">Custom Path</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eggisonBulbsSettings.filamentGuide !== "none" && (
              <>
                <div className="space-y-2">
                  <Label>Guide Height: {eggisonBulbsSettings.guideHeight}mm</Label>
                  <Slider
                    value={[eggisonBulbsSettings.guideHeight]}
                    onValueChange={([v]) => updateSetting("guideHeight", v)}
                    min={20}
                    max={150}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mount Points: {eggisonBulbsSettings.guideMountPoints}</Label>
                  <Slider
                    value={[eggisonBulbsSettings.guideMountPoints]}
                    onValueChange={([v]) => updateSetting("guideMountPoints", v)}
                    min={2}
                    max={8}
                    step={1}
                  />
                </div>
              </>
            )}
          </div>

          {/* Assembly Features */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="split-horizontal">Split Horizontally</Label>
              <Switch
                id="split-horizontal"
                checked={eggisonBulbsSettings.splitHorizontal}
                onCheckedChange={(v) => updateSetting("splitHorizontal", v)}
              />
            </div>

            {eggisonBulbsSettings.splitHorizontal && (
              <>
                <div className="space-y-2">
                  <Label>Split Height: {eggisonBulbsSettings.splitHeight}mm</Label>
                  <Slider
                    value={[eggisonBulbsSettings.splitHeight]}
                    onValueChange={([v]) => updateSetting("splitHeight", v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-fit">Snap-Fit Tabs</Label>
                  <Switch
                    id="snap-fit"
                    checked={eggisonBulbsSettings.snapFitTabs}
                    onCheckedChange={(v) => updateSetting("snapFitTabs", v)}
                  />
                </div>

                {eggisonBulbsSettings.snapFitTabs && (
                  <div className="space-y-2">
                    <Label>Tab Count: {eggisonBulbsSettings.tabCount}</Label>
                    <Slider
                      value={[eggisonBulbsSettings.tabCount]}
                      onValueChange={([v]) => updateSetting("tabCount", v)}
                      min={2}
                      max={8}
                      step={1}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="top-opening">Top Opening (for LED insertion)</Label>
              <Switch
                id="top-opening"
                checked={eggisonBulbsSettings.topOpening}
                onCheckedChange={(v) => updateSetting("topOpening", v)}
              />
            </div>

            {eggisonBulbsSettings.topOpening && (
              <div className="space-y-2">
                <Label>Opening Diameter: {eggisonBulbsSettings.openingDiameter}mm</Label>
                <Slider
                  value={[eggisonBulbsSettings.openingDiameter]}
                  onValueChange={([v]) => updateSetting("openingDiameter", v)}
                  min={10}
                  max={40}
                  step={2}
                />
              </div>
            )}
          </div>

          {/* Wire Channels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="wire-hole">Center Wire Hole</Label>
              <Switch
                id="wire-hole"
                checked={eggisonBulbsSettings.wireCenterHole}
                onCheckedChange={(v) => updateSetting("wireCenterHole", v)}
              />
            </div>

            {eggisonBulbsSettings.wireCenterHole && (
              <div className="space-y-2">
                <Label>Wire Hole Diameter: {eggisonBulbsSettings.wireHoleDiameter}mm</Label>
                <Slider
                  value={[eggisonBulbsSettings.wireHoleDiameter]}
                  onValueChange={([v]) => updateSetting("wireHoleDiameter", v)}
                  min={2}
                  max={8}
                  step={0.5}
                />
              </div>
            )}
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
            <BulbPreview settings={eggisonBulbsSettings} />
            <OrbitControls enablePan={false} />
            <gridHelper args={[20, 20, '#888888', '#444444']} />
          </Canvas>
        </div>
        <div className="p-4 border-t bg-background/95 backdrop-blur">
          <div className="text-center">
            <p className="text-sm font-medium">
              {eggisonBulbsSettings.shellShape.charAt(0).toUpperCase() + eggisonBulbsSettings.shellShape.slice(1)} Shell
            </p>
            <p className="text-xs text-muted-foreground">
              {eggisonBulbsSettings.shellHeight}mm × {eggisonBulbsSettings.shellWidth}mm • {eggisonBulbsSettings.screwBase.toUpperCase()} Base
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
