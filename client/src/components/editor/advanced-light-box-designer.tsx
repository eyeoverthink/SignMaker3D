import { useState, useRef, useEffect } from "react";
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
  Loader2, Box, Download, Upload, Plus, Trash2, 
  Circle, Eye, Zap, Sparkles, Grid3x3, Image as ImageIcon,
  MousePointer, Target, Settings2, Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BOX_SHAPES = ["rectangle", "rounded", "hexagon", "circle", "custom"] as const;
const DIFFUSER_MOUNT_TYPES = ["snap_fit", "groove_slide", "overlay", "magnetic"] as const;
const IMAGE_PLACEMENT_MODES = ["under_diffuser", "on_top", "stencil_cutout", "glow_in_dark", "tubular_el_wire"] as const;
const DIFFUSION_PATTERNS = ["none", "honeycomb", "voronoi", "dots", "lines", "waves", "custom"] as const;
const EXPORT_MODES = ["complete_zip", "shell_only", "diffuser_only", "image_only", "all_separate"] as const;

interface CustomHole {
  id: string;
  x: number;
  y: number;
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
  snapFitTolerance: number;
  grooveDepth: number;
  
  // Image/Art Layer
  imagePlacementMode: typeof IMAGE_PLACEMENT_MODES[number];
  imageData?: string;
  stencilThickness: number;
  tubularChannelWidth: number;
  
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
  width: 200,
  height: 300,
  depth: 40,
  wallThickness: 2,
  boxShape: "rounded",
  cornerRadius: 10,
  
  diffuserMountType: "snap_fit",
  diffuserThickness: 2,
  snapFitTolerance: 0.2,
  grooveDepth: 3,
  
  imagePlacementMode: "under_diffuser",
  stencilThickness: 3,
  tubularChannelWidth: 6,
  
  diffusionPattern: "honeycomb",
  patternDensity: 50,
  patternScale: 5,
  
  customHoles: [],
  
  enableLithophane: false,
  lithophaneThickness: 3,
  lithophaneInvert: false,
  
  showPreview: true,
  previewMode: "solid",
  
  exportMode: "complete_zip",
  exportFormat: "stl",
  includeOpenSCAD: false,
};

export function AdvancedLightBoxDesigner() {
  const [settings, setSettings] = useState<LightBoxSettings>(defaultSettings);
  const [selectedTool, setSelectedTool] = useState<"select" | "add_hole">("select");
  const [selectedHole, setSelectedHole] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateSettings = (updates: Partial<LightBoxSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addHole = (x: number, y: number) => {
    const newHole: CustomHole = {
      id: `hole${Date.now()}`,
      x,
      y,
      diameter: 5,
      purpose: "led",
    };
    updateSettings({ customHoles: [...settings.customHoles, newHole] });
  };

  const removeHole = (id: string) => {
    updateSettings({ customHoles: settings.customHoles.filter(h => h.id !== id) });
    if (selectedHole === id) setSelectedHole(null);
  };

  const updateHole = (id: string, updates: Partial<CustomHole>) => {
    updateSettings({
      customHoles: settings.customHoles.map(h => h.id === id ? { ...h, ...updates } : h)
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * settings.width;
    const y = settings.height - ((e.clientY - rect.top) / rect.height) * settings.height;
    
    if (selectedTool === "add_hole") {
      addHole(x, y);
    } else {
      // Check if clicking on existing hole
      const clickedHole = settings.customHoles.find(h => {
        const dx = h.x - x;
        const dy = h.y - y;
        return Math.sqrt(dx * dx + dy * dy) < h.diameter;
      });
      
      setSelectedHole(clickedHole?.id || null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      updateSettings({ imageData });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/advanced-light-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to generate light box");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = settings.exportFormat.toUpperCase();
      a.download = `LightBox_${settings.width}x${settings.height}_${ext}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Light Box Generated!",
        description: `${settings.width}×${settings.height}mm light box ready (${ext} format)`,
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

  // Draw canvas preview
  useEffect(() => {
    if (!canvasRef.current || !settings.showPreview) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw box outline
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw image if loaded
    if (settings.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      };
      img.src = settings.imageData;
    }

    // Draw holes
    settings.customHoles.forEach(hole => {
      const x = (hole.x / settings.width) * canvas.width;
      const y = canvas.height - (hole.y / settings.height) * canvas.height;
      const radius = (hole.diameter / settings.width) * canvas.width;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      // Color based on purpose
      const colors = {
        led: "#FFD700",
        wire_routing: "#4CAF50",
        mounting: "#2196F3",
        ventilation: "#9E9E9E",
      };
      
      ctx.fillStyle = hole.id === selectedHole ? "#FF5722" : colors[hole.purpose];
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw diffusion pattern preview
    if (settings.diffusionPattern !== "none") {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#00BCD4";
      
      if (settings.diffusionPattern === "honeycomb") {
        drawHoneycombPattern(ctx, canvas.width, canvas.height, settings.patternScale);
      } else if (settings.diffusionPattern === "dots") {
        drawDotsPattern(ctx, canvas.width, canvas.height, settings.patternScale);
      }
      
      ctx.globalAlpha = 1.0;
    }
  }, [settings, selectedHole]);

  const drawHoneycombPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, scale: number) => {
    const size = scale * 2;
    const h = size * Math.sqrt(3) / 2;
    
    for (let y = 0; y < height; y += h * 2) {
      for (let x = 0; x < width; x += size * 1.5) {
        drawHexagon(ctx, x, y, size / 2);
        drawHexagon(ctx, x + size * 0.75, y + h, size / 2);
      }
    }
  };

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawDotsPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, scale: number) => {
    const spacing = scale * 3;
    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, scale / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Box className="h-4 w-4" />
          Advanced Light Box Designer
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Single hollow shell with customizable holes, diffusion patterns, and live preview
        </p>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        <Tabs defaultValue="shell" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="shell" className="text-xs">
              <Box className="h-3 w-3 mr-1" />
              Shell
            </TabsTrigger>
            <TabsTrigger value="diffuser" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Diffuser
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs">
              <ImageIcon className="h-3 w-3 mr-1" />
              Image
            </TabsTrigger>
            <TabsTrigger value="holes" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Holes
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* SHELL TAB */}
          <TabsContent value="shell" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Box Shell (Single Hollow Print)</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Width (mm)</Label>
                  <Input
                    type="number"
                    value={settings.width}
                    onChange={(e) => updateSettings({ width: parseInt(e.target.value) || 200 })}
                    min={50}
                    max={500}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Height (mm)</Label>
                  <Input
                    type="number"
                    value={settings.height}
                    onChange={(e) => updateSettings({ height: parseInt(e.target.value) || 300 })}
                    min={50}
                    max={500}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Depth</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.depth}mm
                  </span>
                </div>
                <Slider
                  value={[settings.depth]}
                  onValueChange={([v]) => updateSettings({ depth: v })}
                  min={20}
                  max={100}
                  step={5}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Wall Thickness</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.wallThickness}mm
                  </span>
                </div>
                <Slider
                  value={[settings.wallThickness]}
                  onValueChange={([v]) => updateSettings({ wallThickness: v })}
                  min={1}
                  max={5}
                  step={0.5}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Box Shape</Label>
                <Select
                  value={settings.boxShape}
                  onValueChange={(value: typeof BOX_SHAPES[number]) =>
                    updateSettings({ boxShape: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="rounded">Rounded Rectangle</SelectItem>
                    <SelectItem value="hexagon">Hexagon</SelectItem>
                    <SelectItem value="circle">Circle/Oval</SelectItem>
                    <SelectItem value="custom">Custom Shape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(settings.boxShape === "rounded" || settings.boxShape === "custom") && (
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
                    min={0}
                    max={50}
                    step={5}
                    className="py-2"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* DIFFUSER TAB */}
          <TabsContent value="diffuser" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Diffuser Mounting System</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mount Type</Label>
                <Select
                  value={settings.diffuserMountType}
                  onValueChange={(value: typeof DIFFUSER_MOUNT_TYPES[number]) =>
                    updateSettings({ diffuserMountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="snap_fit">Snap-Fit (Friction Lip)</SelectItem>
                    <SelectItem value="groove_slide">Groove Slide-In</SelectItem>
                    <SelectItem value="overlay">Perfect Overlay</SelectItem>
                    <SelectItem value="magnetic">Magnetic Mount</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.diffuserMountType === "snap_fit" && "Friction lip snaps into place"}
                  {settings.diffuserMountType === "groove_slide" && "Slides into groove channel"}
                  {settings.diffuserMountType === "overlay" && "Sits perfectly on top"}
                  {settings.diffuserMountType === "magnetic" && "Magnetic attachment points"}
                </p>
              </div>

              {settings.diffuserMountType === "snap_fit" && (
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

              {settings.diffuserMountType === "groove_slide" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Groove Depth</Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.grooveDepth}mm
                    </span>
                  </div>
                  <Slider
                    value={[settings.grooveDepth]}
                    onValueChange={([v]) => updateSettings({ grooveDepth: v })}
                    min={2}
                    max={6}
                    step={0.5}
                    className="py-2"
                  />
                </div>
              )}

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

              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-semibold">Diffusion Pattern</Label>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pattern Type</Label>
                  <Select
                    value={settings.diffusionPattern}
                    onValueChange={(value: typeof DIFFUSION_PATTERNS[number]) =>
                      updateSettings({ diffusionPattern: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Smooth)</SelectItem>
                      <SelectItem value="honeycomb">Honeycomb</SelectItem>
                      <SelectItem value="voronoi">Voronoi</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="lines">Lines</SelectItem>
                      <SelectItem value="waves">Waves</SelectItem>
                      <SelectItem value="custom">Custom Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.diffusionPattern !== "none" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Pattern Density</Label>
                        <span className="text-sm font-mono text-muted-foreground">
                          {settings.patternDensity}%
                        </span>
                      </div>
                      <Slider
                        value={[settings.patternDensity]}
                        onValueChange={([v]) => updateSettings({ patternDensity: v })}
                        min={10}
                        max={100}
                        step={10}
                        className="py-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Pattern Scale</Label>
                        <span className="text-sm font-mono text-muted-foreground">
                          {settings.patternScale}mm
                        </span>
                      </div>
                      <Slider
                        value={[settings.patternScale]}
                        onValueChange={([v]) => updateSettings({ patternScale: v })}
                        min={2}
                        max={20}
                        step={1}
                        className="py-2"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* IMAGE TAB */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Image/Art Layer</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Image</Label>
                <Input
                  type="file"
                  accept="image/*,.svg"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                {settings.imageData && (
                  <div className="mt-2 border rounded p-2">
                    <img
                      src={settings.imageData}
                      alt="Uploaded"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Placement Mode</Label>
                <Select
                  value={settings.imagePlacementMode}
                  onValueChange={(value: typeof IMAGE_PLACEMENT_MODES[number]) =>
                    updateSettings({ imagePlacementMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_diffuser">Under Diffuser (Protected)</SelectItem>
                    <SelectItem value="on_top">On Top (Exposed Art)</SelectItem>
                    <SelectItem value="stencil_cutout">Stencil Cutout (Solid/See-Through)</SelectItem>
                    <SelectItem value="glow_in_dark">Glow-in-Dark Material</SelectItem>
                    <SelectItem value="tubular_el_wire">Tubular (EL Wire Channels)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.imagePlacementMode === "under_diffuser" && "Image printed flat, protected by diffuser"}
                  {settings.imagePlacementMode === "on_top" && "Image layer sits on top of diffuser"}
                  {settings.imagePlacementMode === "stencil_cutout" && "Cut through design, solid or see-through"}
                  {settings.imagePlacementMode === "glow_in_dark" && "Print with glow-in-dark filament"}
                  {settings.imagePlacementMode === "tubular_el_wire" && "Hollow channels for EL wire insertion"}
                </p>
              </div>

              {settings.imagePlacementMode === "stencil_cutout" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Stencil Thickness</Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.stencilThickness}mm
                    </span>
                  </div>
                  <Slider
                    value={[settings.stencilThickness]}
                    onValueChange={([v]) => updateSettings({ stencilThickness: v })}
                    min={1}
                    max={10}
                    step={0.5}
                    className="py-2"
                  />
                </div>
              )}

              {settings.imagePlacementMode === "tubular_el_wire" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Tubular Channel Width</Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.tubularChannelWidth}mm
                    </span>
                  </div>
                  <Slider
                    value={[settings.tubularChannelWidth]}
                    onValueChange={([v]) => updateSettings({ tubularChannelWidth: v })}
                    min={3}
                    max={10}
                    step={0.5}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Creates hollow tubes following image outline for EL wire insertion
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lithophane" className="text-sm font-medium">
                      Enable Lithophane Mode
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[220px]">
                        <p className="text-xs">
                          Converts image to depth map for photo-realistic backlit effect
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="lithophane"
                    checked={settings.enableLithophane}
                    onCheckedChange={(v) => updateSettings({ enableLithophane: v })}
                  />
                </div>

                {settings.enableLithophane && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Lithophane Thickness</Label>
                        <span className="text-sm font-mono text-muted-foreground">
                          {settings.lithophaneThickness}mm
                        </span>
                      </div>
                      <Slider
                        value={[settings.lithophaneThickness]}
                        onValueChange={([v]) => updateSettings({ lithophaneThickness: v })}
                        min={1}
                        max={6}
                        step={0.5}
                        className="py-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="litho-invert" className="text-sm font-medium">
                        Invert Lithophane
                      </Label>
                      <Switch
                        id="litho-invert"
                        checked={settings.lithophaneInvert}
                        onCheckedChange={(v) => updateSettings({ lithophaneInvert: v })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* HOLES TAB */}
          <TabsContent value="holes" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Custom Hole Placement</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedTool === "select" ? "default" : "outline"}
                    onClick={() => setSelectedTool("select")}
                    className="h-7 text-xs"
                  >
                    <MousePointer className="h-3 w-3 mr-1" />
                    Select
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedTool === "add_hole" ? "default" : "outline"}
                    onClick={() => setSelectedTool("add_hole")}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Hole
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-2 bg-muted/30">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={600}
                  onClick={handleCanvasClick}
                  className="w-full cursor-crosshair border rounded"
                  style={{ aspectRatio: `${settings.width}/${settings.height}` }}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {selectedTool === "add_hole" ? "Click to add holes" : "Click holes to select"}
                </p>
              </div>

              {selectedHole && (
                <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Selected Hole</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeHole(selectedHole)}
                      className="h-6 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">X Position (mm)</Label>
                      <Input
                        type="number"
                        value={settings.customHoles.find(h => h.id === selectedHole)?.x.toFixed(1) || 0}
                        onChange={(e) => updateHole(selectedHole, { x: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y Position (mm)</Label>
                      <Input
                        type="number"
                        value={settings.customHoles.find(h => h.id === selectedHole)?.y.toFixed(1) || 0}
                        onChange={(e) => updateHole(selectedHole, { y: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Diameter (mm)</Label>
                    <Input
                      type="number"
                      value={settings.customHoles.find(h => h.id === selectedHole)?.diameter || 5}
                      onChange={(e) => updateHole(selectedHole, { diameter: parseFloat(e.target.value) || 5 })}
                      className="h-8 text-xs"
                      min={1}
                      max={50}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Purpose</Label>
                    <Select
                      value={settings.customHoles.find(h => h.id === selectedHole)?.purpose || "led"}
                      onValueChange={(value: CustomHole["purpose"]) =>
                        updateHole(selectedHole, { purpose: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="led">LED Insertion</SelectItem>
                        <SelectItem value="wire_routing">Wire Routing</SelectItem>
                        <SelectItem value="mounting">Mounting Point</SelectItem>
                        <SelectItem value="ventilation">Ventilation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">All Holes ({settings.customHoles.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {settings.customHoles.map((hole, index) => (
                    <div
                      key={hole.id}
                      onClick={() => setSelectedHole(hole.id)}
                      className={`p-2 border rounded text-xs cursor-pointer ${
                        selectedHole === hole.id ? "bg-primary/20 border-primary" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Hole {index + 1}</span>
                        <span className="text-muted-foreground capitalize">{hole.purpose.replace('_', ' ')}</span>
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {hole.x.toFixed(1)}mm, {hole.y.toFixed(1)}mm • ⌀{hole.diameter}mm
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Export Options</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Export Mode</Label>
                <Select
                  value={settings.exportMode}
                  onValueChange={(value: typeof EXPORT_MODES[number]) =>
                    updateSettings({ exportMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete_zip">Complete ZIP (All Parts)</SelectItem>
                    <SelectItem value="shell_only">Shell Only</SelectItem>
                    <SelectItem value="diffuser_only">Diffuser Only</SelectItem>
                    <SelectItem value="image_only">Image Layer Only</SelectItem>
                    <SelectItem value="all_separate">All Parts Separate</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.exportMode === "complete_zip" && "Single ZIP with all components"}
                  {settings.exportMode === "shell_only" && "Just the hollow box shell"}
                  {settings.exportMode === "diffuser_only" && "Just the diffuser panel"}
                  {settings.exportMode === "image_only" && "Just the image/art layer"}
                  {settings.exportMode === "all_separate" && "Individual files for each part"}
                </p>
              </div>

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

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-preview" className="text-sm font-medium">
                    Show Live Preview
                  </Label>
                  <Switch
                    id="show-preview"
                    checked={settings.showPreview}
                    onCheckedChange={(v) => updateSettings({ showPreview: v })}
                  />
                </div>

                {settings.showPreview && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preview Mode</Label>
                    <Select
                      value={settings.previewMode}
                      onValueChange={(value: typeof settings.previewMode) =>
                        updateSettings({ previewMode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wireframe">Wireframe</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full mt-6"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Light Box...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Light Box
            </>
          )}
        </Button>

        {/* Info Display */}
        <div className="space-y-2 pt-3 border-t bg-muted/30 p-3 rounded-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dimensions:</span>
              <span className="font-medium">{settings.width}×{settings.height}×{settings.depth}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shape:</span>
              <span className="font-medium capitalize">{settings.boxShape.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diffuser:</span>
              <span className="font-medium capitalize">{settings.diffuserMountType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Image Mode:</span>
              <span className="font-medium capitalize">{settings.imagePlacementMode.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pattern:</span>
              <span className="font-medium capitalize">{settings.diffusionPattern}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custom Holes:</span>
              <span className="font-medium">{settings.customHoles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lithophane:</span>
              <span className="font-medium">{settings.enableLithophane ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
