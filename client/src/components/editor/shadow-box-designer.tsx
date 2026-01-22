import { useState, useRef } from "react";
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
  Loader2, Box, Layers, Info, Download, Upload, Plus, Trash2, 
  Circle, Eye, Zap, Sparkles, Grid3x3, Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BOX_SHAPES = ["rectangle", "rounded", "hexagon", "circle", "custom"] as const;
const DIFFUSER_MOUNT_TYPES = ["snap_fit", "groove_slide", "overlay", "magnetic"] as const;
const IMAGE_PLACEMENT_MODES = ["under_diffuser", "on_top", "stencil_cutout", "glow_in_dark", "tubular_el_wire"] as const;
const DIFFUSION_PATTERNS = ["none", "honeycomb", "voronoi", "dots", "lines", "waves", "custom"] as const;
const EXPORT_MODES = ["complete_zip", "shell_only", "diffuser_only", "image_only", "all_separate"] as const;

interface CustomHole {
  id: string;
  x: number; // Position in mm from left
  y: number; // Position in mm from bottom
  diameter: number;
  purpose: "led" | "wire_routing" | "mounting" | "ventilation";
}

interface LightBoxSettings {
  // Box Shell (Single Hollow Print)
  width: number;
  height: number;
  depth: number;
  wallThickness: number;
  boxShape: typeof BOX_SHAPES[number];
  cornerRadius: number;
  
  // Diffuser System
  diffuserMountType: typeof DIFFUSER_MOUNT_TYPES[number];
  diffuserThickness: number;
  snapFitTolerance: number; // For snap-fit
  grooveDepth: number; // For groove slide
  
  // Image/Art Layer
  imagePlacementMode: typeof IMAGE_PLACEMENT_MODES[number];
  imageData?: string;
  stencilThickness: number; // For stencil mode
  tubularChannelWidth: number; // For EL wire mode
  
  // Diffusion Pattern
  diffusionPattern: typeof DIFFUSION_PATTERNS[number];
  patternDensity: number;
  patternScale: number;
  
  // Custom Holes
  customHoles: CustomHole[];
  
  // Lithophane Integration
  enableLithophane: boolean;
  lithophaneThickness: number;
  lithophaneInvert: boolean;
  
  // Live Preview
  showPreview: boolean;
  previewMode: "wireframe" | "solid" | "transparent";
  
  // Export Options
  exportMode: typeof EXPORT_MODES[number];
  exportFormat: "stl" | "3mf";
  includeOpenSCAD: boolean;
}

const defaultSettings: LightBoxSettings = {
  // Box Shell
  width: 200,
  height: 300,
  depth: 40,
  wallThickness: 2,
  boxShape: "rounded",
  cornerRadius: 10,
  
  // Diffuser System
  diffuserMountType: "snap_fit",
  diffuserThickness: 2,
  snapFitTolerance: 0.2,
  grooveDepth: 3,
  
  // Image/Art Layer
  imagePlacementMode: "under_diffuser",
  stencilThickness: 3,
  tubularChannelWidth: 6,
  
  // Diffusion Pattern
  diffusionPattern: "honeycomb",
  patternDensity: 50,
  patternScale: 5,
  
  // Custom Holes
  customHoles: [],
  
  // Lithophane
  enableLithophane: false,
  lithophaneThickness: 3,
  lithophaneInvert: false,
  
  // Preview
  showPreview: true,
  previewMode: "solid",
  
  // Export
  exportMode: "complete_zip",
  exportFormat: "stl",
  includeOpenSCAD: false,
};

export function ShadowBoxDesigner() {
  const [settings, setSettings] = useState<LightBoxSettings>(defaultSettings);
  const [selectedTool, setSelectedTool] = useState<"select" | "add_hole">("select");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateSettings = (updates: Partial<LightBoxSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addHole = (x: number, y: number) => {
    const newHole: CustomHole = {
      id: `hole${settings.customHoles.length + 1}`,
      x,
      y,
      diameter: 5,
      purpose: "led",
    };
    updateSettings({ customHoles: [...settings.customHoles, newHole] });
  };

  const removeHole = (id: string) => {
    updateSettings({ customHoles: settings.customHoles.filter(h => h.id !== id) });
  };

  const updateHole = (id: string, updates: Partial<CustomHole>) => {
    updateSettings({
      customHoles: settings.customHoles.map(h => h.id === id ? { ...h, ...updates } : h)
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "add_hole" || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * settings.width;
    const y = ((e.clientY - rect.top) / rect.height) * settings.height;
    
    addHole(x, y);
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: `layer${settings.layers.length + 1}`,
      type: "silhouette",
      depth: settings.layers.length * settings.layerSpacing,
      opacity: 1 - (settings.layers.length * 0.2),
    };
    updateSettings({ layers: [...settings.layers, newLayer] });
  };

  const removeLayer = (id: string) => {
    updateSettings({ layers: settings.layers.filter(l => l.id !== id) });
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    updateSettings({
      layers: settings.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    });
  };

  const handleImageUpload = (layerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      updateLayer(layerId, { imageData });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (settings.layers.length === 0) {
      toast({
        title: "No Layers",
        description: "Add at least one layer to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/shadow-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to generate shadow box");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = settings.exportFormat.toUpperCase();
      a.download = `Shadow_Box_${settings.width}x${settings.height}_${ext}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Shadow Box Generated!",
        description: `${settings.width}x${settings.height}mm backlit art ready for 3D printing (${ext} format)`,
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

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Box className="h-4 w-4" />
          Shadow Box Designer
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Create backlit layered art with 3D printed frames
        </p>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        {/* Frame Dimensions */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Frame Dimensions</Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Width (mm)</Label>
              <Input
                type="number"
                value={settings.width}
                onChange={(e) => updateSettings({ width: parseInt(e.target.value) || 200 })}
                min={100}
                max={500}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Height (mm)</Label>
              <Input
                type="number"
                value={settings.height}
                onChange={(e) => updateSettings({ height: parseInt(e.target.value) || 300 })}
                min={100}
                max={500}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Frame Thickness</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.frameThickness}mm
              </span>
            </div>
            <Slider
              value={[settings.frameThickness]}
              onValueChange={([v]) => updateSettings({ frameThickness: v })}
              min={10}
              max={30}
              step={1}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Frame Depth</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.frameDepth}mm
              </span>
            </div>
            <Slider
              value={[settings.frameDepth]}
              onValueChange={([v]) => updateSettings({ frameDepth: v })}
              min={20}
              max={80}
              step={5}
              className="py-2"
            />
          </div>
        </div>

        {/* Frame Style */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Frame Style</Label>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Shape</Label>
            <Select
              value={settings.frameStyle}
              onValueChange={(value: typeof FRAME_STYLES[number]) =>
                updateSettings({ frameStyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="rounded">Rounded Rectangle</SelectItem>
                <SelectItem value="arch">Arch Top</SelectItem>
                <SelectItem value="hexagon">Hexagon</SelectItem>
                <SelectItem value="circle">Circle/Oval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(settings.frameStyle === "rounded" || settings.frameStyle === "arch") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Corner Radius</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings.cornerRadius}mm
                </span>
              </div>
              <Slider
                value={[settings.cornerRadius]}
                onValueChange={([v]) => updateSettings({ cornerRadius: v })}
                min={5}
                max={50}
                step={5}
                className="py-2"
              />
            </div>
          )}
        </div>

        {/* Layers */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <Label className="text-sm font-semibold">Layers ({settings.layers.length})</Label>
            </div>
            <Button
              onClick={addLayer}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Layer
            </Button>
          </div>

          <div className="space-y-2">
            {settings.layers.map((layer, index) => (
              <div key={layer.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Layer {index + 1}</Label>
                  <Button
                    onClick={() => removeLayer(layer.id)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={layer.type}
                      onValueChange={(value: typeof LAYER_TYPES[number]) =>
                        updateLayer(layer.id, { type: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silhouette">Silhouette</SelectItem>
                        <SelectItem value="cutout">Cutout</SelectItem>
                        <SelectItem value="pattern">Pattern</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Depth (mm)</Label>
                    <Input
                      type="number"
                      value={layer.depth}
                      onChange={(e) => updateLayer(layer.id, { depth: parseInt(e.target.value) || 0 })}
                      className="h-8 text-xs"
                      min={0}
                      max={50}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Upload Image/SVG</Label>
                  <Input
                    type="file"
                    accept="image/*,.svg"
                    onChange={(e) => handleImageUpload(layer.id, e)}
                    className="h-8 text-xs"
                  />
                </div>

                {layer.imageData && (
                  <div className="mt-2">
                    <img
                      src={layer.imageData}
                      alt={`Layer ${index + 1}`}
                      className="w-full h-20 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Layer Spacing</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.layerSpacing}mm
              </span>
            </div>
            <Slider
              value={[settings.layerSpacing]}
              onValueChange={([v]) => updateSettings({ layerSpacing: v })}
              min={5}
              max={20}
              step={1}
              className="py-2"
            />
          </div>
        </div>

        {/* LED System */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">LED Backlighting</Label>

          <div className="space-y-2">
            <Label className="text-sm font-medium">LED Position</Label>
            <Select
              value={settings.ledPosition}
              onValueChange={(value: typeof LED_POSITIONS[number]) =>
                updateSettings({ ledPosition: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perimeter">Perimeter (All Sides)</SelectItem>
                <SelectItem value="back">Back Panel</SelectItem>
                <SelectItem value="sides">Left & Right Sides</SelectItem>
                <SelectItem value="top_bottom">Top & Bottom</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.ledPosition === "perimeter" && "LED strips around entire frame perimeter"}
              {settings.ledPosition === "back" && "LED panel behind all layers"}
              {settings.ledPosition === "sides" && "LED strips on left and right edges"}
              {settings.ledPosition === "top_bottom" && "LED strips on top and bottom edges"}
            </p>
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
              min={8}
              max={15}
              step={1}
              className="py-2"
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
              max={5}
              step={0.5}
              className="py-2"
            />
          </div>
        </div>

        {/* Mounting Options */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Mounting Options</Label>

          <div className="flex items-center justify-between">
            <Label htmlFor="hanging-hardware" className="text-sm font-medium">
              Include Hanging Hardware
            </Label>
            <Switch
              id="hanging-hardware"
              checked={settings.includeHangingHardware}
              onCheckedChange={(v) => updateSettings({ includeHangingHardware: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="stand-base" className="text-sm font-medium">
              Include Stand Base
            </Label>
            <Switch
              id="stand-base"
              checked={settings.includeStandBase}
              onCheckedChange={(v) => updateSettings({ includeStandBase: v })}
            />
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Export Options</Label>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
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
              Include OpenSCAD Files
            </Label>
            <Switch
              id="include-scad"
              checked={settings.includeOpenSCAD}
              onCheckedChange={(v) => updateSettings({ includeOpenSCAD: v })}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || settings.layers.length === 0}
          className="w-full mt-6"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Shadow Box...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Shadow Box
            </>
          )}
        </Button>

        {/* Info Display */}
        <div className="space-y-2 pt-3 border-t bg-muted/30 p-3 rounded-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dimensions:</span>
              <span className="font-medium">{settings.width}×{settings.height}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frame Style:</span>
              <span className="font-medium capitalize">{settings.frameStyle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Layers:</span>
              <span className="font-medium">{settings.layers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LED Position:</span>
              <span className="font-medium capitalize">{settings.ledPosition.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span className="font-medium">{settings.exportFormat.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
