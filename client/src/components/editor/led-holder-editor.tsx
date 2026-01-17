import { useEditorStore } from "@/lib/editor-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, Lightbulb, Magnet, Wrench, Cable, Zap, Sun, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { LEDHolderLedType, LEDHolderMountType, LEDHolderStyle, LEDHolderSettings } from "@shared/schema";

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function PreviewFallback({ settings }: { settings: LEDHolderSettings }) {
  const led = ledTypeOptions.find(o => o.value === settings.ledType);
  const mount = mountTypeOptions.find(o => o.value === settings.mountType);
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <Lightbulb className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-2xl font-bold">LED Holder Preview</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>LED Type: <span className="font-medium text-foreground">{led?.label}</span></p>
          <p>Mount: <span className="font-medium text-foreground">{mount?.label}</span></p>
          <p>Tilt: <span className="font-medium text-foreground">{settings.tiltAngle}°</span></p>
          <p>Wall: <span className="font-medium text-foreground">{settings.wallThickness}mm</span></p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>3D preview requires WebGL</span>
        </div>
      </div>
    </div>
  );
}

const ledTypeOptions: { value: LEDHolderLedType; label: string; description: string }[] = [
  { value: "3mm", label: "3mm LED", description: "Standard small LED" },
  { value: "5mm", label: "5mm LED", description: "Standard LED bulb" },
  { value: "10mm_uv", label: "10mm UV/Black Light", description: "Large UV LED for glow effects" },
  { value: "ws2812b", label: "WS2812B", description: "Addressable RGB LED" },
  { value: "ws2812b_strip", label: "WS2812B Strip", description: "Addressable LED strip segment" },
];

const holderStyleOptions: { value: LEDHolderStyle; label: string }[] = [
  { value: "socket", label: "Socket" },
  { value: "clip", label: "Clip" },
  { value: "cradle", label: "Cradle" },
];

const mountTypeOptions: { value: LEDHolderMountType; label: string; icon: typeof Magnet }[] = [
  { value: "magnetic", label: "Magnetic Mount", icon: Magnet },
  { value: "screw", label: "Screw Mount", icon: Wrench },
  { value: "adhesive", label: "Adhesive Pad", icon: Lightbulb },
  { value: "clip_on", label: "Clip-On (Frame)", icon: Cable },
];

function getLEDDimensions(ledType: LEDHolderLedType) {
  switch (ledType) {
    case "3mm":
      return { bodyRadius: 1.5, bodyHeight: 5, legSpacing: 2.54 };
    case "5mm":
      return { bodyRadius: 2.5, bodyHeight: 8.6, legSpacing: 2.54 };
    case "10mm_uv":
      return { bodyRadius: 5, bodyHeight: 13, legSpacing: 2.54 };
    case "ws2812b":
      return { bodyRadius: 2.5, bodyHeight: 1.6, legSpacing: 5.0 };
    case "ws2812b_strip":
      return { bodyRadius: 6, bodyHeight: 3, legSpacing: 10 };
    default:
      return { bodyRadius: 2.5, bodyHeight: 8.6, legSpacing: 2.54 };
  }
}

function LEDHolderPreview({ settings }: { settings: LEDHolderSettings }) {
  const led = getLEDDimensions(settings.ledType);
  const wall = settings.wallThickness;
  const tiltRad = (settings.tiltAngle * Math.PI) / 180;

  const socketInnerRadius = led.bodyRadius + 0.3;
  const socketOuterRadius = socketInnerRadius + wall;
  const socketDepth = Math.min(led.bodyHeight * 0.7, 10);

  const stemRadius = settings.wireChannelDiameter / 2 + wall;
  const stemLength = 25;

  const magnetRadius = settings.magnetDiameter / 2;
  const magnetHousingRadius = magnetRadius + 0.2 + wall;

  const scale = 0.05;

  const isWS2812 = settings.ledType === "ws2812b" || settings.ledType === "ws2812b_strip";

  const holderGeometry = useMemo(() => {
    const group = new THREE.Group();

    if (isWS2812) {
      const ws2812Size = settings.ledType === "ws2812b" ? 5 : 12;
      const cradleInner = ws2812Size / 2 + 0.3;
      const cradleOuter = cradleInner + wall;
      const cradleHeight = ws2812Size + wall * 2;
      const backThickness = wall + 2;
      const totalHeight = cradleHeight + backThickness;

      const cradleShape = new THREE.Shape();
      cradleShape.absarc(0, 0, cradleOuter, 0, Math.PI * 2, false);
      const cradleHole = new THREE.Path();
      cradleHole.absarc(0, 0, cradleInner, 0, Math.PI * 2, true);
      cradleShape.holes.push(cradleHole);

      const cradleGeom = new THREE.ExtrudeGeometry(cradleShape, {
        depth: totalHeight,
        bevelEnabled: false,
      });
      const cradleMesh = new THREE.Mesh(cradleGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
      cradleMesh.rotation.x = -Math.PI / 2;
      group.add(cradleMesh);

      const stemGeom = new THREE.CylinderGeometry(stemRadius, stemRadius, stemLength, 24);
      const stemMesh = new THREE.Mesh(stemGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
      stemMesh.position.y = -stemLength / 2;
      group.add(stemMesh);

      if (settings.mountType === "magnetic") {
        const mountHeight = settings.magnetDepth + wall;
        const mountGeom = new THREE.CylinderGeometry(magnetHousingRadius, magnetHousingRadius, mountHeight, 24);
        const mountMesh = new THREE.Mesh(mountGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        mountMesh.position.y = -stemLength - mountHeight / 2;
        group.add(mountMesh);
      }
    } else {
      const bodyHeight = socketDepth + wall;

      const socketShape = new THREE.Shape();
      socketShape.absarc(0, 0, socketOuterRadius, 0, Math.PI * 2, false);
      const socketHole = new THREE.Path();
      socketHole.absarc(0, 0, socketInnerRadius, 0, Math.PI * 2, true);
      socketShape.holes.push(socketHole);

      const socketGeom = new THREE.ExtrudeGeometry(socketShape, {
        depth: bodyHeight,
        bevelEnabled: false,
      });
      const socketMesh = new THREE.Mesh(socketGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
      socketMesh.rotation.x = -Math.PI / 2;
      socketMesh.rotation.z = tiltRad;
      group.add(socketMesh);

      const domeGeom = new THREE.SphereGeometry(socketOuterRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMesh = new THREE.Mesh(domeGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
      domeMesh.rotation.x = Math.PI;
      domeMesh.rotation.z = tiltRad;
      group.add(domeMesh);

      const stemConnectionY = -socketOuterRadius * Math.sin(Math.PI / 4);
      const stemConnectionX = stemConnectionY * Math.sin(tiltRad);

      const stemGeom = new THREE.CylinderGeometry(stemRadius, stemRadius, stemLength, 24);
      const stemMesh = new THREE.Mesh(stemGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
      stemMesh.position.set(stemConnectionX, stemConnectionY - stemLength / 2, 0);
      group.add(stemMesh);

      if (settings.mountType === "magnetic") {
        const mountHeight = settings.magnetDepth + wall;
        const mountGeom = new THREE.CylinderGeometry(magnetHousingRadius, magnetHousingRadius, mountHeight, 24);
        const mountMesh = new THREE.Mesh(mountGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        mountMesh.position.set(stemConnectionX, stemConnectionY - stemLength - mountHeight / 2, 0);
        group.add(mountMesh);
      } else if (settings.mountType === "screw") {
        const plateGeom = new THREE.BoxGeometry(20, 3, 20);
        const plateMesh = new THREE.Mesh(plateGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        plateMesh.position.set(stemConnectionX, stemConnectionY - stemLength - 1.5, 0);
        group.add(plateMesh);
      } else if (settings.mountType === "adhesive") {
        const padGeom = new THREE.CylinderGeometry(10, 10, 2, 24);
        const padMesh = new THREE.Mesh(padGeom, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        padMesh.position.set(stemConnectionX, stemConnectionY - stemLength - 1, 0);
        group.add(padMesh);
      } else if (settings.mountType === "clip_on") {
        const clipGap = 4;
        const clipDepth = 8;

        const leftArm = new THREE.BoxGeometry(wall, clipDepth, wall);
        const leftMesh = new THREE.Mesh(leftArm, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        leftMesh.position.set(stemConnectionX - clipGap / 2 - wall / 2, stemConnectionY - stemLength - clipDepth / 2, 0);
        group.add(leftMesh);

        const rightMesh = new THREE.Mesh(leftArm.clone(), new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        rightMesh.position.set(stemConnectionX + clipGap / 2 + wall / 2, stemConnectionY - stemLength - clipDepth / 2, 0);
        group.add(rightMesh);

        const crossBar = new THREE.BoxGeometry(clipGap + wall * 2, wall, wall);
        const crossMesh = new THREE.Mesh(crossBar, new THREE.MeshStandardMaterial({ color: 0x4a90d9 }));
        crossMesh.position.set(stemConnectionX, stemConnectionY - stemLength - clipDepth - wall / 2, 0);
        group.add(crossMesh);
      }
    }

    return group;
  }, [settings.ledType, settings.mountType, settings.wallThickness, settings.wireChannelDiameter, 
      settings.magnetDiameter, settings.magnetDepth, settings.tiltAngle]);

  return (
    <primitive object={holderGeometry} scale={scale} />
  );
}

export function LEDHolderEditor() {
  const { ledHolderSettings, setLEDHolderSettings } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  if (webglSupported === null) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="led-holder-editor-loading">
        <div className="text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/led-holder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ledHolderSettings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "led_holder.stl";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

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
        description: `LED holder downloaded as ${filename}`,
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

  const selectedLedType = ledTypeOptions.find(o => o.value === ledHolderSettings.ledType);

  return (
    <div className="h-full flex" data-testid="led-holder-editor">
      {webglSupported ? (
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800">
          <Suspense fallback={<PreviewFallback settings={ledHolderSettings} />}>
            <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-5, 3, -5]} intensity={0.5} />
              <LEDHolderPreview settings={ledHolderSettings} />
              <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} />
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              <Environment preset="studio" />
            </Canvas>
          </Suspense>
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-lg">
              <p className="text-xs text-muted-foreground text-center">
                Drag to rotate, scroll to zoom, right-click to pan
              </p>
            </div>
          </div>
        </div>
      ) : (
        <PreviewFallback settings={ledHolderSettings} />
      )}

      <div className="w-96 border-l bg-sidebar p-4 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">LED Holder Designer</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create 3D printable LED holders for accent lighting
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                LED Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={ledHolderSettings.ledType}
                onValueChange={(value: LEDHolderLedType) => setLEDHolderSettings({ ledType: value })}
              >
                <SelectTrigger data-testid="select-led-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ledTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} data-testid={`option-led-${option.value}`}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLedType && (
                <p className="text-xs text-muted-foreground">{selectedLedType.description}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Magnet className="w-4 h-4" />
                Mount Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {mountTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={ledHolderSettings.mountType === option.value ? "default" : "outline"}
                      size="sm"
                      className="flex flex-col h-auto py-3 gap-1"
                      onClick={() => setLEDHolderSettings({ mountType: option.value })}
                      data-testid={`button-mount-${option.value}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cable className="w-4 h-4" />
                Wire Channel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Channel Diameter: {ledHolderSettings.wireChannelDiameter}mm
                </Label>
                <Slider
                  value={[ledHolderSettings.wireChannelDiameter]}
                  onValueChange={([value]) => setLEDHolderSettings({ wireChannelDiameter: value })}
                  min={1}
                  max={10}
                  step={0.5}
                  className="mt-2"
                  data-testid="slider-wire-channel"
                />
              </div>
            </CardContent>
          </Card>

          {ledHolderSettings.mountType === "magnetic" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Magnet Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Magnet Diameter: {ledHolderSettings.magnetDiameter}mm
                  </Label>
                  <Slider
                    value={[ledHolderSettings.magnetDiameter]}
                    onValueChange={([value]) => setLEDHolderSettings({ magnetDiameter: value })}
                    min={3}
                    max={15}
                    step={1}
                    className="mt-2"
                    data-testid="slider-magnet-diameter"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Magnet Depth: {ledHolderSettings.magnetDepth}mm
                  </Label>
                  <Slider
                    value={[ledHolderSettings.magnetDepth]}
                    onValueChange={([value]) => setLEDHolderSettings({ magnetDepth: value })}
                    min={1}
                    max={5}
                    step={0.5}
                    className="mt-2"
                    data-testid="slider-magnet-depth"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {ledHolderSettings.mountType === "screw" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Screw Mount Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-xs text-muted-foreground">
                  Screw Hole Diameter: {ledHolderSettings.screwHoleDiameter}mm
                </Label>
                <Slider
                  value={[ledHolderSettings.screwHoleDiameter]}
                  onValueChange={([value]) => setLEDHolderSettings({ screwHoleDiameter: value })}
                  min={2}
                  max={6}
                  step={0.5}
                  className="mt-2"
                  data-testid="slider-screw-diameter"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Wall Thickness: {ledHolderSettings.wallThickness}mm
                </Label>
                <Slider
                  value={[ledHolderSettings.wallThickness]}
                  onValueChange={([value]) => setLEDHolderSettings({ wallThickness: value })}
                  min={1}
                  max={5}
                  step={0.5}
                  className="mt-2"
                  data-testid="slider-wall-thickness"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Tilt Angle: {ledHolderSettings.tiltAngle}°
                </Label>
                <Slider
                  value={[ledHolderSettings.tiltAngle]}
                  onValueChange={([value]) => setLEDHolderSettings({ tiltAngle: value })}
                  min={0}
                  max={90}
                  step={5}
                  className="mt-2"
                  data-testid="slider-tilt-angle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Slider
                  value={[ledHolderSettings.quantity]}
                  onValueChange={([value]) => setLEDHolderSettings({ quantity: value })}
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                  data-testid="slider-quantity"
                />
                <Badge variant="secondary" className="min-w-[3rem] justify-center">
                  {ledHolderSettings.quantity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {ledHolderSettings.quantity > 1 ? "Exports as ZIP file" : "Exports as single STL"}
              </p>
            </CardContent>
          </Card>

          <Separator />

          <Button
            className="w-full"
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
            data-testid="button-export-led-holder"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Generating..." : `Export LED Holder${ledHolderSettings.quantity > 1 ? "s" : ""}`}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Holder includes:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Socket for {selectedLedType?.label || ledHolderSettings.ledType} LED</li>
              <li>{ledHolderSettings.wireChannelDiameter}mm wire channel</li>
              <li>{mountTypeOptions.find(m => m.value === ledHolderSettings.mountType)?.label}</li>
              {ledHolderSettings.tiltAngle > 0 && <li>{ledHolderSettings.tiltAngle}° tilt angle</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
