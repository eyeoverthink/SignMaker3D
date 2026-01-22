/**
 * SILHOUETTE LIGHT BOX DESIGNER
 * Advanced multi-layer light box with image tracing, templates, and per-layer LED control
 */

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, Download, Pencil, Image as ImageIcon, Layers, 
  Plus, Trash2, Eye, EyeOff, Zap, Lightbulb, Play, Pause
} from "lucide-react";
import { loadImageData, autoTraceImage, ManualTracer, drawSVGPath } from "@/lib/image-tracer";

const DESIGN_MODES = ["image_trace", "freehand", "template", "hybrid"] as const;
const TRACE_MODES = ["auto", "manual"] as const;
const LED_TYPES = ["backlit", "el_wire", "ws2812b", "neopixel", "standard_strip", "none"] as const;
const DIFFUSER_STYLES = ["flat", "clamshell_raised", "cnc_routed"] as const;
const BATTERY_TYPES = ["cr2032", "cr2016", "ag13"] as const;

const TEMPLATE_CATEGORIES = ["gaming", "pop_culture", "science", "symbols", "abstract"] as const;

// Stock templates (simplified versions)
const STOCK_TEMPLATES = {
  gaming: [
    { name: "Pac-Man Chase", description: "Pac-Man with ghosts" },
    { name: "Mario Mushroom", description: "Power-up mushroom" },
    { name: "Game Boy", description: "Classic handheld" },
    { name: "Sonic Ring", description: "Golden ring" },
    { name: "Rubik's Cube", description: "3D puzzle cube" },
  ],
  pop_culture: [
    { name: "Pulp Fiction Silhouette", description: "Man with hat and cigarette" },
    { name: "Star Wars Helmet", description: "Stormtrooper" },
    { name: "Simpsons Donut", description: "Pink frosted donut" },
    { name: "Pac-Man Ghost", description: "Blinky, Pinky, Inky, or Clyde" },
  ],
  science: [
    { name: "DNA Double Helix", description: "Genetic structure" },
    { name: "Atom Model", description: "Nucleus with electrons" },
    { name: "Periodic Table Element", description: "Element symbol" },
    { name: "Molecular Structure", description: "Chemical bonds" },
    { name: "Neural Network", description: "Synapse connections" },
  ],
  symbols: [
    { name: "Peace Sign", description: "Classic peace symbol" },
    { name: "Heart Hands", description: "Two hands forming heart" },
    { name: "Middle Finger", description: "Hand gesture" },
    { name: "Balloon", description: "Floating balloon" },
    { name: "Dice", description: "Six-sided die" },
  ],
  abstract: [
    { name: "Fractal Nodes", description: "Connected network" },
    { name: "Expanding Cubes", description: "Geometric pattern" },
    { name: "Binary Data", description: "0s and 1s pattern" },
    { name: "Bouncing Balls", description: "Motion trail" },
  ],
};

interface SilhouetteLayer {
  id: string;
  name: string;
  svgPath: string;
  depth: number;
  ledType: typeof LED_TYPES[number];
  ledColor?: string;
  channelWidth?: number;
  opacity: number;
  visible: boolean;
}

interface SilhouetteLightBoxSettings {
  width: number;
  height: number;
  depth: number;
  wallThickness: number;
  
  designMode: typeof DESIGN_MODES[number];
  traceMode: typeof TRACE_MODES[number];
  edgeThreshold: number;
  simplifyTolerance: number;
  
  layers: SilhouetteLayer[];
  
  diffuserStyle: typeof DIFFUSER_STYLES[number];
  raisedHeight: number;
  routingDepth: number;
  snapFitTolerance: number;
  
  backlightType: "standard_5v" | "ws2812b" | "none";
  backlightLEDCount: number;
  includeControllerHousing: boolean;
  
  keychainMode: boolean;
  batteryType: typeof BATTERY_TYPES[number];
  ledInsertDiameter: number;
}

const defaultSettings: SilhouetteLightBoxSettings = {
  width: 200,
  height: 200,
  depth: 30,
  wallThickness: 2,
  
  designMode: "template",
  traceMode: "auto",
  edgeThreshold: 128,
  simplifyTolerance: 2,
  
  layers: [],
  
  diffuserStyle: "clamshell_raised",
  raisedHeight: 5,
  routingDepth: 2,
  snapFitTolerance: 0.2,
  
  backlightType: "standard_5v",
  backlightLEDCount: 20,
  includeControllerHousing: false,
  
  keychainMode: false,
  batteryType: "cr2032",
  ledInsertDiameter: 5,
};

export default function SilhouetteLightBoxDesigner() {
  const [settings, setSettings] = useState<SilhouetteLightBoxSettings>(defaultSettings);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof TEMPLATE_CATEGORIES[number]>("gaming");
  const [isTracing, setIsTracing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const manualTracer = useRef(new ManualTracer());

  const updateSettings = (updates: Partial<SilhouetteLightBoxSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addLayer = (name: string, svgPath: string, ledType: typeof LED_TYPES[number] = "backlit") => {
    const newLayer: SilhouetteLayer = {
      id: `layer_${Date.now()}`,
      name,
      svgPath,
      depth: settings.layers.length * 3 + 5,
      ledType,
      opacity: 1,
      visible: true,
    };
    updateSettings({ layers: [...settings.layers, newLayer] });
  };

  const removeLayer = (id: string) => {
    updateSettings({ layers: settings.layers.filter(l => l.id !== id) });
    if (selectedLayer === id) setSelectedLayer(null);
  };

  const updateLayer = (id: string, updates: Partial<SilhouetteLayer>) => {
    updateSettings({
      layers: settings.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setUploadedImage(imageUrl);

      if (settings.traceMode === "auto") {
        try {
          const imageData = await loadImageData(imageUrl);
          const paths = await autoTraceImage(imageData, settings.edgeThreshold, settings.simplifyTolerance);
          
          paths.forEach((path, index) => {
            addLayer(`Traced Layer ${index + 1}`, path.svgPath, "backlit");
          });
        } catch (error) {
          console.error("Auto-trace failed:", error);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || settings.traceMode !== "manual" || !isTracing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * settings.width;
    const y = settings.height - ((e.clientY - rect.top) / rect.height) * settings.height;

    manualTracer.current.addPoint(x, y);
    drawCanvas();
  };

  const finishManualTrace = () => {
    const svgPath = manualTracer.current.getSVGPath();
    if (svgPath) {
      addLayer("Manual Trace", svgPath, "backlit");
      manualTracer.current.clear();
      setIsTracing(false);
      drawCanvas();
    }
  };

  const loadTemplate = (category: typeof TEMPLATE_CATEGORIES[number], templateName: string) => {
    // In production, load actual SVG paths from template library
    const mockSVGPath = "M 100,50 L 150,100 L 100,150 L 50,100 Z";
    addLayer(templateName, mockSVGPath, "backlit");
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw uploaded image
    if (uploadedImage) {
      const img = new Image();
      img.src = uploadedImage;
      img.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      };
    }

    // Draw layers
    settings.layers.forEach(layer => {
      if (layer.visible) {
        drawSVGPath(ctx, layer.svgPath, layer.ledColor || '#000000', 2);
      }
    });

    // Draw manual trace in progress
    if (isTracing) {
      const points = manualTracer.current.getPoints();
      if (points.length > 0) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [settings.layers, uploadedImage, isTracing]);

  const handleExport = async () => {
    // Export logic here
    console.log("Exporting silhouette light box:", settings);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Silhouette Light Box Designer
        </h2>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="design" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="layers">Layers ({settings.layers.length})</TabsTrigger>
          <TabsTrigger value="leds">LEDs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] mt-4">
          {/* DESIGN TAB */}
          <TabsContent value="design" className="space-y-4">
            <div>
              <Label>Design Mode</Label>
              <Select
                value={settings.designMode}
                onValueChange={(value: typeof settings.designMode) =>
                  updateSettings({ designMode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image_trace">Image Trace</SelectItem>
                  <SelectItem value="freehand">Freehand Drawing</SelectItem>
                  <SelectItem value="template">Stock Templates</SelectItem>
                  <SelectItem value="hybrid">Hybrid (All Tools)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IMAGE TRACE MODE */}
            {(settings.designMode === "image_trace" || settings.designMode === "hybrid") && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image Tracing
                </h3>

                <div>
                  <Label>Trace Mode</Label>
                  <Select
                    value={settings.traceMode}
                    onValueChange={(value: typeof settings.traceMode) =>
                      updateSettings({ traceMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-Trace (Edge Detection)</SelectItem>
                      <SelectItem value="manual">Manual Point-by-Point</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>

                {settings.traceMode === "auto" && (
                  <>
                    <div>
                      <Label>Edge Threshold: {settings.edgeThreshold}</Label>
                      <Slider
                        value={[settings.edgeThreshold]}
                        onValueChange={([v]) => updateSettings({ edgeThreshold: v })}
                        min={0}
                        max={255}
                        step={1}
                      />
                    </div>

                    <div>
                      <Label>Simplify Tolerance: {settings.simplifyTolerance}</Label>
                      <Slider
                        value={[settings.simplifyTolerance]}
                        onValueChange={([v]) => updateSettings({ simplifyTolerance: v })}
                        min={0.5}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  </>
                )}

                {settings.traceMode === "manual" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsTracing(!isTracing)}
                      variant={isTracing ? "destructive" : "default"}
                      className="flex-1"
                    >
                      {isTracing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isTracing ? "Stop Tracing" : "Start Tracing"}
                    </Button>
                    {isTracing && (
                      <Button onClick={finishManualTrace} variant="outline">
                        Finish
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FREEHAND MODE */}
            {(settings.designMode === "freehand" || settings.designMode === "hybrid") && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Freehand Drawing
                </h3>
                <p className="text-sm text-gray-400">
                  Click on canvas below to draw custom silhouettes
                </p>
              </div>
            )}

            {/* TEMPLATE MODE */}
            {(settings.designMode === "template" || settings.designMode === "hybrid") && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Stock Templates
                </h3>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value: typeof selectedCategory) =>
                      setSelectedCategory(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaming">🎮 Gaming</SelectItem>
                      <SelectItem value="pop_culture">🎬 Pop Culture</SelectItem>
                      <SelectItem value="science">🔬 Science</SelectItem>
                      <SelectItem value="symbols">✌️ Symbols</SelectItem>
                      <SelectItem value="abstract">🌀 Abstract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {STOCK_TEMPLATES[selectedCategory].map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      onClick={() => loadTemplate(selectedCategory, template.name)}
                      className="justify-start h-auto py-3"
                    >
                      <div className="text-left">
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-xs text-gray-400">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* CANVAS */}
            <div className="border rounded-lg p-4">
              <Label>Design Canvas</Label>
              <canvas
                ref={canvasRef}
                width={settings.width}
                height={settings.height}
                onClick={handleCanvasClick}
                className="w-full border rounded cursor-crosshair bg-gray-900"
                style={{ aspectRatio: `${settings.width}/${settings.height}` }}
              />
            </div>
          </TabsContent>

          {/* LAYERS TAB */}
          <TabsContent value="layers" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Layer Stack (Back to Front)</Label>
              <Button size="sm" onClick={() => addLayer("New Layer", "", "backlit")}>
                <Plus className="w-4 h-4 mr-1" />
                Add Layer
              </Button>
            </div>

            {settings.layers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No layers yet. Add a template or trace an image to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {settings.layers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`p-3 border rounded-lg ${
                      selectedLayer === layer.id ? 'border-blue-500 bg-blue-500/10' : ''
                    }`}
                    onClick={() => setSelectedLayer(layer.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-400">#{index + 1}</span>
                        <Input
                          value={layer.name}
                          onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                          className="h-7 text-sm"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                        >
                          {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLayer(layer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-xs">Depth: {layer.depth}mm</Label>
                        <Slider
                          value={[layer.depth]}
                          onValueChange={([v]) => updateLayer(layer.id, { depth: v })}
                          min={0}
                          max={30}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">LED Type</Label>
                        <Select
                          value={layer.ledType}
                          onValueChange={(value: typeof layer.ledType) =>
                            updateLayer(layer.id, { ledType: value })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="backlit">Backlit</SelectItem>
                            <SelectItem value="el_wire">EL Wire</SelectItem>
                            <SelectItem value="ws2812b">WS2812B</SelectItem>
                            <SelectItem value="neopixel">NeoPixel</SelectItem>
                            <SelectItem value="standard_strip">Standard Strip</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {layer.ledType !== "none" && layer.ledType !== "backlit" && (
                      <div className="mt-2">
                        <Label className="text-xs">LED Color</Label>
                        <Input
                          type="color"
                          value={layer.ledColor || "#FFFFFF"}
                          onChange={(e) => updateLayer(layer.id, { ledColor: e.target.value })}
                          className="h-7"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* LEDS TAB */}
          <TabsContent value="leds" className="space-y-4">
            <div>
              <Label>Backlight Type</Label>
              <Select
                value={settings.backlightType}
                onValueChange={(value: typeof settings.backlightType) =>
                  updateSettings({ backlightType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_5v">Standard 5V Strip</SelectItem>
                  <SelectItem value="ws2812b">WS2812B Addressable</SelectItem>
                  <SelectItem value="none">None (Layer LEDs Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.backlightType !== "none" && (
              <div>
                <Label>LED Count: {settings.backlightLEDCount}</Label>
                <Slider
                  value={[settings.backlightLEDCount]}
                  onValueChange={([v]) => updateSettings({ backlightLEDCount: v })}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Include Controller Housing</Label>
              <Switch
                checked={settings.includeControllerHousing}
                onCheckedChange={(v) => updateSettings({ includeControllerHousing: v })}
              />
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-semibold mb-2">Per-Layer LED Summary:</h4>
              <ul className="text-sm space-y-1">
                {settings.layers.map((layer, i) => (
                  <li key={layer.id}>
                    <span className="font-mono text-gray-400">#{i + 1}</span> {layer.name}: <span className="text-blue-400">{layer.ledType}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Box Dimensions</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={settings.width}
                    onChange={(e) => updateSettings({ width: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={settings.height}
                    onChange={(e) => updateSettings({ height: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Depth (mm)</Label>
                  <Input
                    type="number"
                    value={settings.depth}
                    onChange={(e) => updateSettings({ depth: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Diffuser Style</Label>
              <Select
                value={settings.diffuserStyle}
                onValueChange={(value: typeof settings.diffuserStyle) =>
                  updateSettings({ diffuserStyle: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Diffuser</SelectItem>
                  <SelectItem value="clamshell_raised">Clamshell Raised</SelectItem>
                  <SelectItem value="cnc_routed">CNC Routed Channels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.diffuserStyle !== "flat" && (
              <div>
                <Label>Raised Height: {settings.raisedHeight}mm</Label>
                <Slider
                  value={[settings.raisedHeight]}
                  onValueChange={([v]) => updateSettings({ raisedHeight: v })}
                  min={2}
                  max={15}
                  step={1}
                />
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Keychain Mode</h3>
              <div className="flex items-center justify-between mb-4">
                <Label>Enable Lithophane Keychain</Label>
                <Switch
                  checked={settings.keychainMode}
                  onCheckedChange={(v) => updateSettings({ keychainMode: v })}
                />
              </div>

              {settings.keychainMode && (
                <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div>
                    <Label>Battery Type</Label>
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
                        <SelectItem value="cr2032">CR2032 (3V, 20mm)</SelectItem>
                        <SelectItem value="cr2016">CR2016 (3V, 16mm)</SelectItem>
                        <SelectItem value="ag13">AG13 (1.5V, 11mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>LED Insert Diameter</Label>
                    <Select
                      value={settings.ledInsertDiameter.toString()}
                      onValueChange={(value) =>
                        updateSettings({ ledInsertDiameter: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3mm LED</SelectItem>
                        <SelectItem value="5">5mm LED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-xs text-gray-400">
                    Keychain mode creates a compact 40×50mm lithophane with integrated battery compartment and LED insert.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
