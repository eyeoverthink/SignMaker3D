/**
 * HOLOGRAPHIC PANEL DESIGNER
 * Frontend UI for creating multi-layer 3D depth effect panels
 * 
 * Features:
 * - Multiple layer configuration (1-5 layers)
 * - Pattern selection per layer
 * - Real-time 3D preview with depth visualization
 * - LED backlighting options
 * - Frame customization
 */

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Layers, Download, Plus, Minus, Eye } from "lucide-react";

const PATTERN_TYPES = ["floral", "geometric", "organic", "text", "custom", "none"] as const;
const LED_TYPES = ["ws2812b", "simple_5v", "none"] as const;
const BACKLIGHT_POSITIONS = ["back", "between_layers", "front"] as const;
const MATERIAL_TYPES = ["transparent_petg", "white_pla", "translucent_resin"] as const;

interface LayerConfig {
  layerNumber: number;
  patternType: typeof PATTERN_TYPES[number];
  patternName: string;
  density: number;
  scale: number;
  rotation: number;
  position: "front" | "middle" | "back";
  cutout: boolean;
}

interface HolographicPanelSettings {
  panelWidth: number;
  panelHeight: number;
  numberOfLayers: number;
  layerSpacing: number;
  totalDepth: number;
  layers: LayerConfig[];
  frameWidth: number;
  frameThickness: number;
  includeFrame: boolean;
  frameMountingHoles: boolean;
  ledType: typeof LED_TYPES[number];
  ledChannelWidth: number;
  ledChannelDepth: number;
  backlightPosition: typeof BACKLIGHT_POSITIONS[number];
  materialType: typeof MATERIAL_TYPES[number];
  layerThickness: number;
  includeSpacerClips: boolean;
  spacerClipCount: number;
  alignmentPins: boolean;
  includeScottTorsion: boolean;
  exportFormat: "stl" | "3mf";
}

const defaultSettings: HolographicPanelSettings = {
  panelWidth: 200,
  panelHeight: 300,
  numberOfLayers: 3,
  layerSpacing: 8,
  totalDepth: 30.5,
  layers: [
    {
      layerNumber: 1,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 40,
      scale: 1.2,
      rotation: 0,
      position: "front",
      cutout: true,
    },
    {
      layerNumber: 2,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 30,
      scale: 1.2,
      rotation: 18,
      position: "middle",
      cutout: true,
    },
    {
      layerNumber: 3,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 20,
      scale: 1.4,
      rotation: 30,
      position: "back",
      cutout: true,
    },
  ],
  frameWidth: 20,
  frameThickness: 5,
  includeFrame: true,
  frameMountingHoles: true,
  ledType: "ws2812b",
  ledChannelWidth: 12,
  ledChannelDepth: 3,
  backlightPosition: "back",
  materialType: "transparent_petg",
  layerThickness: 1.5,
  includeSpacerClips: true,
  spacerClipCount: 4,
  alignmentPins: true,
  includeScottTorsion: true,
  exportFormat: "stl",
};

export default function HolographicPanelDesigner() {
  const [settings, setSettings] = useState<HolographicPanelSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(1);

  const updateSettings = (updates: Partial<HolographicPanelSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      
      // Recalculate total depth when layers or spacing changes
      if (updates.numberOfLayers !== undefined || updates.layerSpacing !== undefined) {
        newSettings.totalDepth = 
          newSettings.numberOfLayers * newSettings.layerThickness + 
          (newSettings.numberOfLayers - 1) * newSettings.layerSpacing +
          newSettings.frameThickness * 2;
      }
      
      return newSettings;
    });
  };

  const updateLayer = (layerNumber: number, updates: Partial<LayerConfig>) => {
    setSettings((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.layerNumber === layerNumber ? { ...layer, ...updates } : layer
      ),
    }));
  };

  const addLayer = () => {
    if (settings.numberOfLayers >= 5) return;
    
    const newLayerNumber = settings.numberOfLayers + 1;
    const newLayer: LayerConfig = {
      layerNumber: newLayerNumber,
      patternType: "floral",
      patternName: "Floral / Vine",
      density: 30,
      scale: 1.2,
      rotation: 0,
      position: newLayerNumber === 1 ? "front" : newLayerNumber === settings.numberOfLayers + 1 ? "back" : "middle",
      cutout: true,
    };
    
    updateSettings({
      numberOfLayers: newLayerNumber,
      layers: [...settings.layers, newLayer],
    });
  };

  const removeLayer = () => {
    if (settings.numberOfLayers <= 1) return;
    
    updateSettings({
      numberOfLayers: settings.numberOfLayers - 1,
      layers: settings.layers.slice(0, -1),
    });
    
    if (selectedLayer > settings.numberOfLayers - 1) {
      setSelectedLayer(settings.numberOfLayers - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-holographic-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `holographic-panel-${settings.numberOfLayers}layers.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate holographic panel. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentLayer = settings.layers[selectedLayer - 1];

  return (
    <div className="flex h-full">
      {/* 3D Preview */}
      <div className="flex-1 bg-gray-900 relative">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 400]} fov={50} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* Panel Preview */}
          <HolographicPanelPreview settings={settings} selectedLayer={selectedLayer} />
        </Canvas>
        
        {/* Preview Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">Preview</span>
          </div>
          <div className="space-y-1 text-xs">
            <div>Size: {settings.panelWidth}×{settings.panelHeight}mm</div>
            <div>Layers: {settings.numberOfLayers}</div>
            <div>Depth: {settings.totalDepth.toFixed(1)}mm</div>
            <div>Spacing: {settings.layerSpacing}mm</div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-96 bg-gray-800 text-white overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold">Holographic Panel</h2>
        </div>

        {/* Panel Dimensions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Panel Size</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Width (mm)</Label>
              <Input
                type="number"
                value={settings.panelWidth}
                onChange={(e) => updateSettings({ panelWidth: Number(e.target.value) })}
                min={100}
                max={500}
              />
            </div>
            <div>
              <Label>Height (mm)</Label>
              <Input
                type="number"
                value={settings.panelHeight}
                onChange={(e) => updateSettings({ panelHeight: Number(e.target.value) })}
                min={100}
                max={500}
              />
            </div>
          </div>
        </div>

        {/* Layer Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Layers</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={removeLayer}
                disabled={settings.numberOfLayers <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 bg-gray-700 rounded">{settings.numberOfLayers}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={addLayer}
                disabled={settings.numberOfLayers >= 5}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Layer Spacing: {settings.layerSpacing}mm</Label>
            <Slider
              value={[settings.layerSpacing]}
              onValueChange={([v]) => updateSettings({ layerSpacing: v })}
              min={4}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="text-sm text-gray-400">
            Total Depth: {settings.totalDepth.toFixed(1)}mm
          </div>
        </div>

        {/* Layer Tabs */}
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {settings.layers.map((layer) => (
              <Button
                key={layer.layerNumber}
                size="sm"
                variant={selectedLayer === layer.layerNumber ? "default" : "outline"}
                onClick={() => setSelectedLayer(layer.layerNumber)}
                className="min-w-[80px]"
              >
                Layer {layer.layerNumber}
                <span className="ml-1 text-xs">({layer.position})</span>
              </Button>
            ))}
          </div>

          {/* Current Layer Controls */}
          {currentLayer && (
            <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold">Layer {currentLayer.layerNumber} Settings</h4>
              
              <div>
                <Label>Pattern Type</Label>
                <Select
                  value={currentLayer.patternType}
                  onValueChange={(value: typeof PATTERN_TYPES[number]) =>
                    updateLayer(currentLayer.layerNumber, { patternType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="floral">Floral / Vine</SelectItem>
                    <SelectItem value="geometric">Geometric</SelectItem>
                    <SelectItem value="organic">Organic / Cellular</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="custom">Custom SVG</SelectItem>
                    <SelectItem value="none">None (Solid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Density: {currentLayer.density}%</Label>
                <Slider
                  value={[currentLayer.density]}
                  onValueChange={([v]) => updateLayer(currentLayer.layerNumber, { density: v })}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Scale: {currentLayer.scale.toFixed(1)}×</Label>
                <Slider
                  value={[currentLayer.scale * 10]}
                  onValueChange={([v]) => updateLayer(currentLayer.layerNumber, { scale: v / 10 })}
                  min={5}
                  max={30}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Rotation: {currentLayer.rotation}°</Label>
                <Slider
                  value={[currentLayer.rotation]}
                  onValueChange={([v]) => updateLayer(currentLayer.layerNumber, { rotation: v })}
                  min={0}
                  max={360}
                  step={5}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Frame Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Frame</h3>
          
          <div className="flex items-center justify-between">
            <Label>Include Frame</Label>
            <Switch
              checked={settings.includeFrame}
              onCheckedChange={(v) => updateSettings({ includeFrame: v })}
            />
          </div>

          {settings.includeFrame && (
            <>
              <div>
                <Label>Frame Width: {settings.frameWidth}mm</Label>
                <Slider
                  value={[settings.frameWidth]}
                  onValueChange={([v]) => updateSettings({ frameWidth: v })}
                  min={10}
                  max={50}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Mounting Holes</Label>
                <Switch
                  checked={settings.frameMountingHoles}
                  onCheckedChange={(v) => updateSettings({ frameMountingHoles: v })}
                />
              </div>
            </>
          )}
        </div>

        {/* LED Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">LED Backlighting</h3>
          
          <div>
            <Label>LED Type</Label>
            <Select
              value={settings.ledType}
              onValueChange={(value: typeof LED_TYPES[number]) =>
                updateSettings({ ledType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ws2812b">WS2812B Addressable</SelectItem>
                <SelectItem value="simple_5v">Simple 5V Strip</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.ledType !== "none" && (
            <div>
              <Label>Backlight Position</Label>
              <Select
                value={settings.backlightPosition}
                onValueChange={(value: typeof BACKLIGHT_POSITIONS[number]) =>
                  updateSettings({ backlightPosition: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="back">Back (Behind all layers)</SelectItem>
                  <SelectItem value="between_layers">Between Layers</SelectItem>
                  <SelectItem value="front">Front (Edge lighting)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Material & Assembly */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Material & Assembly</h3>
          
          <div>
            <Label>Material Type</Label>
            <Select
              value={settings.materialType}
              onValueChange={(value: typeof MATERIAL_TYPES[number]) =>
                updateSettings({ materialType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transparent_petg">Transparent PETG</SelectItem>
                <SelectItem value="white_pla">White PLA</SelectItem>
                <SelectItem value="translucent_resin">Translucent Resin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Spacer Clips</Label>
            <Switch
              checked={settings.includeSpacerClips}
              onCheckedChange={(v) => updateSettings({ includeSpacerClips: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Alignment Pins</Label>
            <Switch
              checked={settings.alignmentPins}
              onCheckedChange={(v) => updateSettings({ alignmentPins: v })}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Layers className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate Panel
            </>
          )}
        </Button>

        <div className="text-xs text-gray-400 space-y-1">
          <p>Export includes:</p>
          <ul className="list-disc list-inside space-y-1">
            {settings.layers.map((layer) => (
              <li key={layer.layerNumber}>layer_{layer.layerNumber}_{layer.position}.stl</li>
            ))}
            <li>frame.stl</li>
            {settings.ledType !== "none" && <li>led_channel.stl</li>}
            {settings.includeSpacerClips && <li>spacer_clips.stl</li>}
            <li>assembly_instructions.md</li>
            <li>wiring_diagram.png</li>
            <li>manifest.json</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 3D Preview Component
 */
function HolographicPanelPreview({ 
  settings, 
  selectedLayer 
}: { 
  settings: HolographicPanelSettings;
  selectedLayer: number;
}) {
  return (
    <group>
      {/* Render each layer with spacing */}
      {settings.layers.map((layer, index) => {
        const zPosition = index * (settings.layerThickness + settings.layerSpacing) - 
                         (settings.numberOfLayers * (settings.layerThickness + settings.layerSpacing)) / 2;
        
        const isSelected = layer.layerNumber === selectedLayer;
        
        return (
          <group key={layer.layerNumber} position={[0, 0, zPosition]}>
            {/* Layer panel */}
            <mesh>
              <boxGeometry args={[settings.panelWidth, settings.panelHeight, settings.layerThickness]} />
              <meshPhysicalMaterial
                color={isSelected ? 0xFFFFFF : 0xEEEEEE}
                transparent
                opacity={0.3}
                roughness={0.1}
                transmission={0.9}
                emissive={isSelected ? 0x8800FF : 0x000000}
                emissiveIntensity={isSelected ? 0.2 : 0}
              />
            </mesh>
            
            {/* Pattern visualization (simplified) */}
            {layer.patternType !== "none" && (
              <PatternPreview layer={layer} settings={settings} />
            )}
          </group>
        );
      })}
      
      {/* Frame */}
      {settings.includeFrame && (
        <mesh>
          <boxGeometry 
            args={[
              settings.panelWidth + settings.frameWidth * 2,
              settings.panelHeight + settings.frameWidth * 2,
              settings.frameThickness
            ]} 
          />
          <meshStandardMaterial color={0x303030} roughness={0.8} />
        </mesh>
      )}
      
      {/* LED backlight glow effect */}
      {settings.ledType !== "none" && (
        <mesh position={[0, 0, -settings.totalDepth / 2 - 10]}>
          <planeGeometry args={[settings.panelWidth * 1.2, settings.panelHeight * 1.2]} />
          <meshBasicMaterial color={0xFFAA00} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Pattern Preview Component
 */
function PatternPreview({ layer, settings }: { layer: LayerConfig; settings: HolographicPanelSettings }) {
  const patternElements = React.useMemo(() => {
    const elements: JSX.Element[] = [];
    const count = Math.floor(layer.density / 10);
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * settings.panelWidth * 0.8;
      const y = (Math.random() - 0.5) * settings.panelHeight * 0.8;
      const size = 5 * layer.scale;
      
      elements.push(
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshStandardMaterial color={0x606060} />
        </mesh>
      );
    }
    
    return elements;
  }, [layer.density, layer.scale, settings.panelWidth, settings.panelHeight]);
  
  return (
    <group rotation={[0, 0, (layer.rotation * Math.PI) / 180]}>
      {patternElements}
    </group>
  );
}
