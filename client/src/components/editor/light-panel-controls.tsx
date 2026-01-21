import { Sparkles, RotateCcw, Info, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// FRAYMUS-based pattern types
const PATTERN_TYPES = [
  "phi_spiral",
  "phi_vortex",
  "tree_of_life",
  "sacred_geometry",
  "fibonacci_flower",
  "golden_mandala",
  "voronoi_organic",
  "islamic_geometric",
  "celtic_knot",
  "nature_leaves",
  "dna_helix",
  "fractal_branches",
] as const;

const PATTERN_LABELS: Record<string, string> = {
  phi_spiral: "Phi Spiral (Golden Ratio)",
  phi_vortex: "Phi Vortex Lattice",
  tree_of_life: "Tree of Life",
  sacred_geometry: "Sacred Geometry",
  fibonacci_flower: "Fibonacci Flower",
  golden_mandala: "Golden Mandala",
  voronoi_organic: "Voronoi Organic",
  islamic_geometric: "Islamic Geometric",
  celtic_knot: "Celtic Knot",
  nature_leaves: "Nature Leaves",
  dna_helix: "DNA Helix",
  fractal_branches: "Fractal Branches",
};

const FRAME_STYLES = ["rectangular", "circular", "hexagonal", "organic"] as const;

const FRAME_LABELS: Record<string, string> = {
  rectangular: "Rectangular Frame",
  circular: "Circular Frame",
  hexagonal: "Hexagonal Frame",
  organic: "Organic Edge",
};

interface LightPanelSettings {
  pattern: typeof PATTERN_TYPES[number];
  frameStyle: typeof FRAME_STYLES[number];
  panelWidth: number;
  panelHeight: number;
  panelDepth: number;
  patternDensity: number;
  cutoutDepth: number;
  frameThickness: number;
  phiIterations: number;
  goldenAngleRotation: boolean;
  symmetry: number;
  addMountingHoles: boolean;
  mountingHoleDiameter: number;
  ledChannelDepth: number;
  addLedChannel: boolean;
}

const defaultSettings: LightPanelSettings = {
  pattern: "phi_spiral",
  frameStyle: "rectangular",
  panelWidth: 300,
  panelHeight: 400,
  panelDepth: 6,
  patternDensity: 50,
  cutoutDepth: 6,
  frameThickness: 20,
  phiIterations: 8,
  goldenAngleRotation: true,
  symmetry: 1,
  addMountingHoles: true,
  mountingHoleDiameter: 5,
  ledChannelDepth: 3,
  addLedChannel: true,
};

export function LightPanelControls() {
  const [settings, setSettings] = useState<LightPanelSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateSettings = (updates: Partial<LightPanelSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/light-panel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to generate light panel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FRAYMUS_${settings.pattern}_Panel_${Date.now()}.stl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Light Panel Generated!",
        description: `${PATTERN_LABELS[settings.pattern]} panel ready for 3D printing`,
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
          <Sparkles className="h-4 w-4" />
          Decorative Light Panel
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Create intricate cutout panels for ambient lighting using FRAYMUS phi-based patterns
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Pattern Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Pattern Design</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs">
                  Phi-based patterns use the golden ratio (φ = 1.618...) for natural, harmonious designs
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={settings.pattern}
            onValueChange={(value: typeof settings.pattern) =>
              updateSettings({ pattern: value })
            }
          >
            <SelectTrigger data-testid="select-pattern" className="h-10">
              <SelectValue placeholder="Select pattern" />
            </SelectTrigger>
            <SelectContent>
              {PATTERN_TYPES.map((pattern) => (
                <SelectItem key={pattern} value={pattern} data-testid={`pattern-${pattern}`}>
                  {PATTERN_LABELS[pattern]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frame Style */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Frame Style</Label>
          <Select
            value={settings.frameStyle}
            onValueChange={(value: typeof settings.frameStyle) =>
              updateSettings({ frameStyle: value })
            }
          >
            <SelectTrigger data-testid="select-frame" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRAME_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {FRAME_LABELS[style]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Panel Dimensions */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Panel Dimensions</Label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Width</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.panelWidth}mm
              </span>
            </div>
            <Slider
              data-testid="slider-panel-width"
              value={[settings.panelWidth]}
              onValueChange={([v]) => updateSettings({ panelWidth: v })}
              min={150}
              max={600}
              step={10}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Height</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.panelHeight}mm
              </span>
            </div>
            <Slider
              data-testid="slider-panel-height"
              value={[settings.panelHeight]}
              onValueChange={([v]) => updateSettings({ panelHeight: v })}
              min={150}
              max={800}
              step={10}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Panel Depth</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.panelDepth}mm
              </span>
            </div>
            <Slider
              data-testid="slider-panel-depth"
              value={[settings.panelDepth]}
              onValueChange={([v]) => updateSettings({ panelDepth: v })}
              min={3}
              max={15}
              step={0.5}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              Thicker panels are more durable but require longer print times
            </p>
          </div>
        </div>

        {/* FRAYMUS Pattern Controls */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold">FRAYMUS Pattern Settings</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs">
                  Controls based on Fractal Resonance Architecture for Yielding Multidimensional Universal Structures
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Pattern Density</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.patternDensity}%
              </span>
            </div>
            <Slider
              data-testid="slider-pattern-density"
              value={[settings.patternDensity]}
              onValueChange={([v]) => updateSettings({ patternDensity: v })}
              min={10}
              max={90}
              step={5}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              Higher density = more intricate cutouts, more light diffusion
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Phi Iterations (φⁿ)</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.phiIterations}
              </span>
            </div>
            <Slider
              data-testid="slider-phi-iterations"
              value={[settings.phiIterations]}
              onValueChange={([v]) => updateSettings({ phiIterations: v })}
              min={3}
              max={15}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              Number of recursive phi-based subdivisions (φ = 1.618...)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Symmetry Order</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.symmetry}x
              </span>
            </div>
            <Slider
              data-testid="slider-symmetry"
              value={[settings.symmetry]}
              onValueChange={([v]) => updateSettings({ symmetry: v })}
              min={1}
              max={12}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              1 = asymmetric, 4 = quad symmetry, 6 = hexagonal, etc.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="golden-angle" className="text-sm font-medium">
                Golden Angle Rotation (137.5°)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">
                    Uses the golden angle for natural spiral patterns found in sunflowers and pinecones
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="golden-angle"
              data-testid="switch-golden-angle"
              checked={settings.goldenAngleRotation}
              onCheckedChange={(v) => updateSettings({ goldenAngleRotation: v })}
            />
          </div>
        </div>

        {/* Frame & Structure */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Frame & Structure</Label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Frame Thickness</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.frameThickness}mm
              </span>
            </div>
            <Slider
              data-testid="slider-frame-thickness"
              value={[settings.frameThickness]}
              onValueChange={([v]) => updateSettings({ frameThickness: v })}
              min={10}
              max={50}
              step={5}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Cutout Depth</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.cutoutDepth}mm
              </span>
            </div>
            <Slider
              data-testid="slider-cutout-depth"
              value={[settings.cutoutDepth]}
              onValueChange={([v]) => updateSettings({ cutoutDepth: v })}
              min={0}
              max={settings.panelDepth}
              step={0.5}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              {settings.cutoutDepth === settings.panelDepth 
                ? "Full cutout (through-hole)" 
                : "Partial depth (relief carving)"}
            </p>
          </div>
        </div>

        {/* LED Integration */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">LED Integration</Label>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="led-channel" className="text-sm font-medium">
                Add Back LED Channel
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">
                    Creates a recessed channel on the back for LED strip mounting
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="led-channel"
              data-testid="switch-led-channel"
              checked={settings.addLedChannel}
              onCheckedChange={(v) => updateSettings({ addLedChannel: v })}
            />
          </div>

          {settings.addLedChannel && (
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Channel Depth</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings.ledChannelDepth}mm
                </span>
              </div>
              <Slider
                data-testid="slider-led-channel-depth"
                value={[settings.ledChannelDepth]}
                onValueChange={([v]) => updateSettings({ ledChannelDepth: v })}
                min={1}
                max={5}
                step={0.5}
                className="py-2"
              />
            </div>
          )}
        </div>

        {/* Mounting */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Mounting Options</Label>

          <div className="flex items-center justify-between">
            <Label htmlFor="mounting-holes" className="text-sm font-medium">
              Add Mounting Holes
            </Label>
            <Switch
              id="mounting-holes"
              data-testid="switch-mounting-holes"
              checked={settings.addMountingHoles}
              onCheckedChange={(v) => updateSettings({ addMountingHoles: v })}
            />
          </div>

          {settings.addMountingHoles && (
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Hole Diameter</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings.mountingHoleDiameter}mm
                </span>
              </div>
              <Slider
                data-testid="slider-mounting-hole-diameter"
                value={[settings.mountingHoleDiameter]}
                onValueChange={([v]) => updateSettings({ mountingHoleDiameter: v })}
                min={3}
                max={10}
                step={0.5}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Standard sizes: 3mm (M3), 5mm (M5), 6mm (1/4")
              </p>
            </div>
          )}
        </div>

        {/* Pattern Info Display */}
        <div className="space-y-2 pt-3 border-t bg-muted/30 p-3 rounded-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Pattern:</span>
              <span className="font-medium">{PATTERN_LABELS[settings.pattern]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phi Resonance:</span>
              <span className="font-mono">φ^{settings.phiIterations} = {(1.618 ** settings.phiIterations).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Golden Angle:</span>
              <span className="font-mono">{settings.goldenAngleRotation ? "137.507764°" : "Disabled"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Panel Area:</span>
              <span className="font-mono">{((settings.panelWidth * settings.panelHeight) / 10000).toFixed(1)} cm²</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => setSettings(defaultSettings)}
          data-testid="button-reset-light-panel"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset Defaults
        </Button>

        <div className="pt-2 border-t">
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            data-testid="button-generate-light-panel"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Light Panel STL
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
