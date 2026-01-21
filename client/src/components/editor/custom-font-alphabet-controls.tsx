import { Type, RotateCcw, Info, Loader2, Upload, Download, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface AvailableFont {
  id: string;
  name: string;
  filename: string;
  path: string;
  category: string;
}

const EXPORT_FORMATS = ["stl", "3mf"] as const;

const LED_TYPES = [
  "silicone_neon_6mm",
  "silicone_neon_8mm",
  "led_strip_10mm",
  "individual_pixels",
] as const;

const LED_TYPE_LABELS: Record<string, string> = {
  silicone_neon_6mm: "Silicone Neon 6mm",
  silicone_neon_8mm: "Silicone Neon 8mm",
  led_strip_10mm: "LED Strip 10mm",
  individual_pixels: "Individual Pixels 14mm",
};

const LID_TYPES = ["flat", "domed"] as const;

interface CustomFontAlphabetSettings {
  selectedFont: string | null;
  fontName: string;
  fontSize: number;
  ledType: typeof LED_TYPES[number];
  signHeight: number;
  wallThickness: number;
  baseThickness: number;
  lidTolerance: number;
  wireHoleHeight: number;
  wireHoleSize: number;
  enableFrictionLip: boolean;
  lipOverhang: number;
  lidType: typeof LID_TYPES[number];
  domeHeight: number;
  exportFormat: typeof EXPORT_FORMATS[number];
  includeOpenSCAD: boolean;
  lettersToGenerate: string;
}

const defaultSettings: CustomFontAlphabetSettings = {
  selectedFont: null,
  fontName: "",
  fontSize: 100,
  ledType: "silicone_neon_6mm",
  signHeight: 30,
  wallThickness: 2,
  baseThickness: 2,
  lidTolerance: 0.15,
  wireHoleHeight: 5,
  wireHoleSize: 5,
  enableFrictionLip: true,
  lipOverhang: 0.4,
  lidType: "flat",
  domeHeight: 10,
  exportFormat: "stl",
  includeOpenSCAD: false,
  lettersToGenerate: "A-Z",
};

export function CustomFontAlphabetControls() {
  const [settings, setSettings] = useState<CustomFontAlphabetSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<AvailableFont[]>([]);
  const [isLoadingFonts, setIsLoadingFonts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableFonts();
  }, []);

  const loadAvailableFonts = async () => {
    try {
      const response = await fetch("/api/fonts/available");
      if (response.ok) {
        const fonts = await response.json();
        setAvailableFonts(fonts);
        // Load fonts for preview
        loadFontPreviews(fonts);
      }
    } catch (error) {
      console.error("Failed to load fonts:", error);
      toast({
        title: "Font Loading Failed",
        description: "Could not load available fonts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFonts(false);
    }
  };

  const loadFontPreviews = async (fonts: AvailableFont[]) => {
    const loaded = new Set<string>();
    
    for (const font of fonts) {
      try {
        // Create @font-face dynamically
        const fontFace = new FontFace(
          font.id,
          `url(/api/fonts/custom/${encodeURIComponent(font.filename)})`
        );
        
        await fontFace.load();
        document.fonts.add(fontFace);
        loaded.add(font.id);
      } catch (error) {
        console.warn(`Failed to load font preview for ${font.name}:`, error);
      }
    }
    
    setLoadedFonts(loaded);
  };

  const updateSettings = (updates: Partial<CustomFontAlphabetSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleFontSelect = (fontId: string) => {
    const font = availableFonts.find(f => f.id === fontId);
    if (font) {
      updateSettings({ 
        selectedFont: fontId,
        fontName: font.name
      });
    }
  };

  const filteredFonts = availableFonts.filter(font =>
    font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    font.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!settings.selectedFont) {
      toast({
        title: "No Font Selected",
        description: "Please select a font from the list",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/custom-font-alphabet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fontId: settings.selectedFont,
          fontName: settings.fontName,
          fontSize: settings.fontSize,
          ledType: settings.ledType,
          signHeight: settings.signHeight,
          wallThickness: settings.wallThickness,
          baseThickness: settings.baseThickness,
          lidTolerance: settings.lidTolerance,
          wireHoleHeight: settings.wireHoleHeight,
          wireHoleSize: settings.wireHoleSize,
          enableFrictionLip: settings.enableFrictionLip,
          lipOverhang: settings.lipOverhang,
          lidType: settings.lidType,
          domeHeight: settings.domeHeight,
          exportFormat: settings.exportFormat,
          includeOpenSCAD: settings.includeOpenSCAD,
          lettersToGenerate: settings.lettersToGenerate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate alphabet");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = settings.exportFormat.toUpperCase();
      a.download = `Custom_Font_Alphabet_${settings.fontName}_${ext}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const letterCount = settings.lettersToGenerate === "A-Z" ? 26 : 
        settings.lettersToGenerate.replace(/[^A-Z]/g, '').length;
      
      toast({
        title: "Alphabet Generated!",
        description: `${letterCount} letters (${ext} format) ready for 3D printing`,
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
          <Type className="h-4 w-4" />
          Custom Font Alphabet Factory
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Upload any font and generate A-Z letter shells with light channels, wire holes, and diffuser lids
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Font Picker with Previews */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Select Font</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs">
                  Choose from available fonts. Each font will generate letter shells with perfect light channels.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Search Bar */}
          <Input
            placeholder="Search fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />

          {/* Font Grid with Previews */}
          <ScrollArea className="h-64 border rounded-md">
            {isLoadingFonts ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFonts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No fonts found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                {filteredFonts.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => handleFontSelect(font.id)}
                    className={`relative p-3 border-2 rounded-md text-left transition-all hover:border-primary/50 ${
                      settings.selectedFont === font.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-testid={`font-${font.id}`}
                  >
                    {settings.selectedFont === font.id && (
                      <div className="absolute top-1 right-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div 
                      className="text-lg mb-1 truncate"
                      style={{ 
                        fontFamily: loadedFonts.has(font.id) ? font.id : 'sans-serif',
                        fontWeight: loadedFonts.has(font.id) ? 'normal' : 'bold'
                      }}
                    >
                      {loadedFonts.has(font.id) ? 'ABC' : 'ABC'}
                    </div>
                    <div className="text-xs font-medium truncate">{font.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {font.category}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {settings.selectedFont && (
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
              <div className="text-xs">
                <span className="text-muted-foreground">Selected:</span>{" "}
                <span className="font-medium">{settings.fontName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSettings({ selectedFont: null, fontName: "" })}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Letters to Generate */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Letters to Generate</Label>
          <Input
            value={settings.lettersToGenerate}
            onChange={(e) => updateSettings({ lettersToGenerate: e.target.value.toUpperCase() })}
            placeholder="A-Z or HELLO"
            data-testid="input-letters"
          />
          <p className="text-xs text-muted-foreground">
            "A-Z" for full alphabet, or specific letters like "HELLO"
          </p>
        </div>

        {/* LED Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">LED Type</Label>
          <Select
            value={settings.ledType}
            onValueChange={(value: typeof settings.ledType) =>
              updateSettings({ ledType: value })
            }
          >
            <SelectTrigger data-testid="select-led-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LED_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {LED_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dimensions */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Dimensions</Label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Font Size</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.fontSize}mm
              </span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([v]) => updateSettings({ fontSize: v })}
              min={50}
              max={200}
              step={10}
              className="py-2"
            />
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
              min={15}
              max={50}
              step={1}
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
              max={4}
              step={0.5}
              className="py-2"
            />
          </div>
        </div>

        {/* Wire Holes */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Wire Pass-Through Holes</Label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Hole Height</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.wireHoleHeight}mm
              </span>
            </div>
            <Slider
              value={[settings.wireHoleHeight]}
              onValueChange={([v]) => updateSettings({ wireHoleHeight: v })}
              min={3}
              max={15}
              step={1}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Hole Diameter</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.wireHoleSize}mm
              </span>
            </div>
            <Slider
              value={[settings.wireHoleSize]}
              onValueChange={([v]) => updateSettings({ wireHoleSize: v })}
              min={3}
              max={10}
              step={0.5}
              className="py-2"
            />
          </div>
        </div>

        {/* Lid Options */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Diffuser Lid</Label>

          <div className="space-y-2">
            <Label className="text-sm">Lid Type</Label>
            <Select
              value={settings.lidType}
              onValueChange={(value: typeof settings.lidType) =>
                updateSettings({ lidType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat Lid</SelectItem>
                <SelectItem value="domed">Domed Lid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.lidType === "domed" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Dome Height</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings.domeHeight}mm
                </span>
              </div>
              <Slider
                value={[settings.domeHeight]}
                onValueChange={([v]) => updateSettings({ domeHeight: v })}
                min={5}
                max={20}
                step={1}
                className="py-2"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="friction-lip" className="text-sm font-medium">
                Friction Lip (Snap-Fit)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">
                    Creates a friction fit to hold LEDs in place without glue
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="friction-lip"
              checked={settings.enableFrictionLip}
              onCheckedChange={(v) => updateSettings({ enableFrictionLip: v })}
            />
          </div>

          {settings.enableFrictionLip && (
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Lip Overhang</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings.lipOverhang}mm
                </span>
              </div>
              <Slider
                value={[settings.lipOverhang]}
                onValueChange={([v]) => updateSettings({ lipOverhang: v })}
                min={0.2}
                max={1.0}
                step={0.1}
                className="py-2"
              />
            </div>
          )}
        </div>

        {/* Output Options */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-semibold">Output Options</Label>

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
            <p className="text-xs text-muted-foreground">
              {settings.exportFormat === "stl" 
                ? "STL files work with all slicers" 
                : "3MF includes color, material, and metadata"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="openscad" className="text-sm font-medium">
                Include OpenSCAD Files
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">
                    Optional: Add .scad files for manual editing in OpenSCAD
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="openscad"
              checked={settings.includeOpenSCAD}
              onCheckedChange={(v) => updateSettings({ includeOpenSCAD: v })}
            />
          </div>
        </div>

        {/* Info Display */}
        <div className="space-y-2 pt-3 border-t bg-muted/30 p-3 rounded-md">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Font:</span>
              <span className="font-medium">{settings.fontName || "Not loaded"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LED Channel Width:</span>
              <span className="font-mono">
                {settings.ledType === "silicone_neon_6mm" ? "6mm" :
                 settings.ledType === "silicone_neon_8mm" ? "8mm" :
                 settings.ledType === "led_strip_10mm" ? "10.5mm" : "14mm"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Letters:</span>
              <span className="font-mono">
                {settings.lettersToGenerate === "A-Z" ? "26 letters" : 
                 settings.lettersToGenerate.replace(/[^A-Z]/g, '').length + " letters"}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => setSettings(defaultSettings)}
          data-testid="button-reset"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset Defaults
        </Button>

        <div className="pt-2 border-t">
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !settings.fontFile}
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Alphabet...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Alphabet ZIP
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
