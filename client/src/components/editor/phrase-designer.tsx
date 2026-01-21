import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Type, Wand2, Info, Download, Frame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WELDING_MODES = ["none", "cursive", "continuous", "auto"] as const;
const BORDER_STYLES = ["none", "rectangle", "rounded", "circle", "custom"] as const;
const LED_TYPES = ["silicone_neon_6mm", "silicone_neon_8mm", "led_strip_10mm", "individual_pixels"] as const;

interface PhraseDesignerSettings {
  text: string;
  fontId: string | null;
  fontSize: number;
  
  // Welding/Continuity
  weldingMode: typeof WELDING_MODES[number];
  weldingGap: number;
  enableCursiveFlow: boolean;
  smoothingLevel: number;
  
  // Border/Frame
  borderStyle: typeof BORDER_STYLES[number];
  borderWidth: number;
  borderPadding: number;
  borderRadius: number;
  
  // Shell/Channel/Hole System
  ledType: typeof LED_TYPES[number];
  signHeight: number;
  wallThickness: number;
  baseThickness: number;
  wireHoleSize: number;
  wireHoleSpacing: number;
  
  // Lid/Diffuser
  lidType: "flat" | "domed";
  lidTolerance: number;
  domeHeight: number;
  
  // Export
  exportFormat: "stl" | "3mf";
  includeOpenSCAD: boolean;
}

const defaultSettings: PhraseDesignerSettings = {
  text: "HELLO",
  fontId: null,
  fontSize: 100,
  
  weldingMode: "cursive",
  weldingGap: 2,
  enableCursiveFlow: true,
  smoothingLevel: 5,
  
  borderStyle: "rounded",
  borderWidth: 10,
  borderPadding: 20,
  borderRadius: 15,
  
  ledType: "silicone_neon_6mm",
  signHeight: 30,
  wallThickness: 2,
  baseThickness: 2,
  wireHoleSize: 5,
  wireHoleSpacing: 50,
  
  lidType: "flat",
  lidTolerance: 0.15,
  domeHeight: 10,
  
  exportFormat: "stl",
  includeOpenSCAD: false,
};

export function PhraseDesigner() {
  const [settings, setSettings] = useState<PhraseDesignerSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateSettings = (updates: Partial<PhraseDesignerSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    if (!settings.fontId) {
      toast({
        title: "No Font Selected",
        description: "Please select a font first",
        variant: "destructive",
      });
      return;
    }

    if (!settings.text.trim()) {
      toast({
        title: "No Text Entered",
        description: "Please enter text to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/phrase-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to generate phrase sign");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = settings.exportFormat.toUpperCase();
      a.download = `Phrase_Sign_${settings.text.replace(/\s+/g, '_')}_${ext}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Phrase Sign Generated!",
        description: `"${settings.text}" ready for 3D printing (${ext} format)`,
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
          <Wand2 className="h-4 w-4" />
          Phrase Sign Designer
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Create welded, continuous signs with borders and complete assemblies
        </p>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        {/* Text Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Text/Phrase</Label>
          <Input
            value={settings.text}
            onChange={(e) => updateSettings({ text: e.target.value.toUpperCase() })}
            placeholder="HELLO WORLD"
            className="font-mono text-lg"
          />
          <p className="text-xs text-muted-foreground">
            Enter your phrase or name
          </p>
        </div>

        {/* Welding Mode */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Letter Welding</Label>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Welding Mode</Label>
            <Select
              value={settings.weldingMode}
              onValueChange={(value: typeof settings.weldingMode) =>
                updateSettings({ weldingMode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Individual Letters)</SelectItem>
                <SelectItem value="cursive">Cursive Flow</SelectItem>
                <SelectItem value="continuous">Continuous Weld</SelectItem>
                <SelectItem value="auto">Auto-Detect</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.weldingMode === "cursive" && "Letters flow together like handwriting"}
              {settings.weldingMode === "continuous" && "Letters are welded at connection points"}
              {settings.weldingMode === "auto" && "Automatically detects best welding method"}
              {settings.weldingMode === "none" && "Letters remain separate"}
            </p>
          </div>

          {settings.weldingMode !== "none" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Welding Gap</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.weldingGap}mm
                  </span>
                </div>
                <Slider
                  value={[settings.weldingGap]}
                  onValueChange={([v]) => updateSettings({ weldingGap: v })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="py-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cursive-flow" className="text-sm font-medium">
                    Cursive Flow Enhancement
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[220px]">
                      <p className="text-xs">
                        Uses Zhang-Suen centerline extraction to create smooth, flowing connections
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id="cursive-flow"
                  checked={settings.enableCursiveFlow}
                  onCheckedChange={(v) => updateSettings({ enableCursiveFlow: v })}
                />
              </div>

              {settings.enableCursiveFlow && (
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Smoothing Level</Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.smoothingLevel}
                    </span>
                  </div>
                  <Slider
                    value={[settings.smoothingLevel]}
                    onValueChange={([v]) => updateSettings({ smoothingLevel: v })}
                    min={1}
                    max={10}
                    step={1}
                    className="py-2"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Border/Frame */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Frame className="h-4 w-4" />
            <Label className="text-sm font-semibold">Border & Frame</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Border Style</Label>
            <Select
              value={settings.borderStyle}
              onValueChange={(value: typeof settings.borderStyle) =>
                updateSettings({ borderStyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="rounded">Rounded Rectangle</SelectItem>
                <SelectItem value="circle">Circle/Oval</SelectItem>
                <SelectItem value="custom">Custom Path</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.borderStyle !== "none" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Border Width</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.borderWidth}mm
                  </span>
                </div>
                <Slider
                  value={[settings.borderWidth]}
                  onValueChange={([v]) => updateSettings({ borderWidth: v })}
                  min={5}
                  max={30}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Border Padding</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {settings.borderPadding}mm
                  </span>
                </div>
                <Slider
                  value={[settings.borderPadding]}
                  onValueChange={([v]) => updateSettings({ borderPadding: v })}
                  min={10}
                  max={50}
                  step={5}
                  className="py-2"
                />
              </div>

              {settings.borderStyle === "rounded" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Corner Radius</Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.borderRadius}mm
                    </span>
                  </div>
                  <Slider
                    value={[settings.borderRadius]}
                    onValueChange={([v]) => updateSettings({ borderRadius: v })}
                    min={0}
                    max={50}
                    step={5}
                    className="py-2"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Shell/Channel/Hole System */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Shell & Channel System</Label>

          <div className="space-y-2">
            <Label className="text-sm font-medium">LED Type</Label>
            <Select
              value={settings.ledType}
              onValueChange={(value: typeof settings.ledType) =>
                updateSettings({ ledType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silicone_neon_6mm">Silicone Neon 6mm</SelectItem>
                <SelectItem value="silicone_neon_8mm">Silicone Neon 8mm</SelectItem>
                <SelectItem value="led_strip_10mm">LED Strip 10mm</SelectItem>
                <SelectItem value="individual_pixels">Individual Pixels</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sign Height</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.signHeight}mm
              </span>
            </div>
            <Slider
              value={[settings.signHeight]}
              onValueChange={([v]) => updateSettings({ signHeight: v })}
              min={10}
              max={100}
              step={5}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Wire Hole Spacing</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.wireHoleSpacing}mm
              </span>
            </div>
            <Slider
              value={[settings.wireHoleSpacing]}
              onValueChange={([v]) => updateSettings({ wireHoleSpacing: v })}
              min={20}
              max={100}
              step={10}
              className="py-2"
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
          disabled={isGenerating || !settings.fontId || !settings.text.trim()}
          className="w-full mt-6"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Sign...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Complete Sign
            </>
          )}
        </Button>

        {/* Info Display */}
        <div className="space-y-2 pt-3 border-t bg-muted/30 p-3 rounded-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Text:</span>
              <span className="font-medium">{settings.text || "Not entered"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Welding:</span>
              <span className="font-medium capitalize">{settings.weldingMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Border:</span>
              <span className="font-medium capitalize">{settings.borderStyle}</span>
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
