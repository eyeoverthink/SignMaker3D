import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Grid3x3, Zap, Box, Layers } from "lucide-react";
import {
  type LEDGridSettings,
  defaultLEDGridSettings,
  ledGridSizes,
  wiringPatterns,
  ledDiffuserTypes,
  mountingStyles,
  ledInstallationTypes,
  signModes,
  getGridDimensions,
  getPhysicalSize,
} from "@shared/schema";

export default function LEDGridEditor() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LEDGridSettings>(defaultLEDGridSettings);
  const [isExporting, setIsExporting] = useState(false);

  const updateSetting = <K extends keyof LEDGridSettings>(
    key: K,
    value: LEDGridSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Determine which API endpoint to use
      const batchMode = (settings as any).batchMode;
      const isAlphabetFactory = batchMode === "alphabet" || batchMode === "word";
      const endpoint = isAlphabetFactory ? "/api/export/alphabet-factory" : "/api/export/led-grid";
      
      // Prepare settings with mode for alphabet factory
      const exportSettings = isAlphabetFactory 
        ? { ...settings, mode: batchMode }
        : settings;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportSettings),
      });

      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();
      
      // Download all files
      for (const file of data.files) {
        const blob = new Blob([file.content], { 
          type: file.filename.endsWith('.stl') ? 'application/sla' : 'text/plain' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Complete",
        description: `Generated ${data.files.length} files for ${settings.gridSize} LED grid`,
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

  const dims = getGridDimensions(settings);
  const physicalSize = getPhysicalSize(settings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">LED Grid Sign System</h2>
          <p className="text-muted-foreground">
            WS2812B matrix displays with housing and diffuser
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export All Files"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grid Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              LED Panel Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sign Mode</Label>
              <Select
                value={settings.signMode}
                onValueChange={(value) => updateSetting("signMode", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {signModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode === "grid_matrix" ? "Grid Matrix (Rectangular)" : "Custom Shape (Text/Logo)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {settings.signMode === "grid_matrix" 
                  ? "Rectangular LED matrix (8×7, 32×8, etc.)"
                  : "Custom shaped sign with LED channels (like 'GEYORD', 'NI3D')"}
              </p>
            </div>

            <div>
              <Label>LED Installation Type (Light Engine)</Label>
              <Select
                value={settings.ledInstallationType}
                onValueChange={(value) => updateSetting("ledInstallationType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ledInstallationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "silicone_neon_6mm" && "Silicone Neon 6mm (Standard)"}
                      {type === "silicone_neon_8mm" && "Silicone Neon 8mm (Bright)"}
                      {type === "led_strip_10mm" && "LED Strip 10mm (Waterproof)"}
                      {type === "individual_pixels" && "Individual Pixels (Addressable)"}
                      {type === "led_grid" && "LED Grid/Matrix (pre-wired)"}
                      {type === "discrete_leds" && "Discrete LEDs (3mm/5mm)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {settings.ledInstallationType === "silicone_neon_6mm" && "6mm flexible neon tube with friction lip"}
                {settings.ledInstallationType === "silicone_neon_8mm" && "8mm flexible neon tube with friction lip"}
                {settings.ledInstallationType === "led_strip_10mm" && "10mm waterproof WS2812B strip"}
                {settings.ledInstallationType === "individual_pixels" && "Addressable NeoPixels with deep channels"}
                {settings.ledInstallationType === "led_grid" && "Pre-wired LED matrix panel"}
                {settings.ledInstallationType === "discrete_leds" && "Standard LEDs with resistors"}
              </p>
            </div>

            {settings.signMode === "custom_shape" && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Friction Lip (Neon Retention)</Label>
                  <Switch
                    checked={settings.enableFrictionLip || false}
                    onCheckedChange={(checked) => updateSetting("enableFrictionLip", checked)}
                  />
                </div>
                {settings.enableFrictionLip && (
                  <div>
                    <Label>Lip Overhang: {settings.lipOverhang || 0.4}mm</Label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={settings.lipOverhang || 0.4}
                      onChange={(e) => updateSetting("lipOverhang", parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Top opening is narrower to hold neon tube
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Power Hole (Cable Exit)</Label>
                  <Switch
                    checked={settings.enablePowerHole || false}
                    onCheckedChange={(checked) => updateSetting("enablePowerHole", checked)}
                  />
                </div>
                {settings.enablePowerHole && (
                  <div>
                    <Label>Hole Size: {settings.powerHoleSize || 5}mm</Label>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      step={0.5}
                      value={settings.powerHoleSize || 5}
                      onChange={(e) => updateSetting("powerHoleSize", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}

            {settings.signMode === "custom_shape" && (
              <>
                <div>
                  <Label>Generation Mode</Label>
                  <Select
                    value={(settings as any).batchMode || "single"}
                    onValueChange={(value) => updateSetting("batchMode" as any, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Sign (e.g., "GEYORD")</SelectItem>
                      <SelectItem value="word">Modular Letters (e.g., "HELLO")</SelectItem>
                      <SelectItem value="alphabet">Full Alphabet (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(settings as any).batchMode === "alphabet" && "Generates all 26 letters with wire pass-through holes"}
                    {(settings as any).batchMode === "word" && "Generates unique letters for modular assembly"}
                    {((settings as any).batchMode === "single" || !(settings as any).batchMode) && "Generates single custom shaped sign"}
                  </p>
                </div>

                {((settings as any).batchMode === "single" || !(settings as any).batchMode || (settings as any).batchMode === "word") && (
                  <div>
                    <Label>Sign Text/Shape</Label>
                    <Input
                      value={settings.textContent || ""}
                      onChange={(e) => updateSetting("textContent", e.target.value.toUpperCase())}
                      placeholder={(settings as any).batchMode === "word" ? "Enter word (e.g., HELLO)..." : "Enter text (e.g., GEYORD, NI3D)..."}
                      maxLength={20}
                      className="font-bold text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(settings as any).batchMode === "word" 
                        ? "Generates modular letters with wire pass-through holes"
                        : "Creates 3D sign with LED channels following the text outline"}
                    </p>
                  </div>
                )}

                {(settings as any).batchMode === "alphabet" && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Alphabet Factory Mode</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Generates all 26 letters (A-Z) with:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Wire pass-through holes (both sides)</li>
                      <li>• Consistent dimensions across all letters</li>
                      <li>• Body + Lid STL for each letter</li>
                      <li>• OpenSCAD source files</li>
                      <li>• Complete BOM and assembly guide</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total files: 78 (26 letters × 3 files each)
                    </p>
                  </div>
                )}
              </>
            )}

            {settings.signMode === "grid_matrix" && (
              <div>
                <Label>Grid Size</Label>
                <Select
                  value={settings.gridSize}
                  onValueChange={(value) => updateSetting("gridSize", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ledGridSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size === "custom" ? "Custom Size" : size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {settings.signMode === "grid_matrix" && settings.gridSize === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width (LEDs)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={settings.customWidth || 8}
                    onChange={(e) => updateSetting("customWidth", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Height (LEDs)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={settings.customHeight || 8}
                    onChange={(e) => updateSetting("customHeight", parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Pixel Spacing: {settings.pixelSpacing}mm</Label>
              <Slider
                value={[settings.pixelSpacing]}
                onValueChange={([value]) => updateSetting("pixelSpacing", value)}
                min={5}
                max={15}
                step={0.5}
              />
            </div>

            <div>
              <Label>LED Diameter: {settings.ledDiameter}mm</Label>
              <Slider
                value={[settings.ledDiameter]}
                onValueChange={([value]) => updateSetting("ledDiameter", value)}
                min={3}
                max={8}
                step={0.5}
              />
            </div>

            <div>
              <Label>Wiring Pattern</Label>
              <Select
                value={settings.wiringPattern}
                onValueChange={(value) => updateSetting("wiringPattern", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wiringPatterns.map((pattern) => (
                    <SelectItem key={pattern} value={pattern}>
                      {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grid:</span>
                  <span className="font-mono">{dims.width} × {dims.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total LEDs:</span>
                  <span className="font-mono">{dims.totalLEDs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Physical Size:</span>
                  <span className="font-mono">{physicalSize.width.toFixed(1)} × {physicalSize.height.toFixed(1)}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power (max):</span>
                  <span className="font-mono">{(dims.totalLEDs * 0.06).toFixed(2)}A @ 5V</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Housing & Diffuser */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="w-5 h-5" />
              Housing & Diffuser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Housing Depth: {settings.housingDepth}mm</Label>
              <Slider
                value={[settings.housingDepth]}
                onValueChange={([value]) => updateSetting("housingDepth", value)}
                min={10}
                max={30}
                step={1}
              />
            </div>

            <div>
              <Label>Wall Thickness: {settings.wallThickness}mm</Label>
              <Slider
                value={[settings.wallThickness]}
                onValueChange={([value]) => updateSetting("wallThickness", value)}
                min={2}
                max={5}
                step={0.5}
              />
            </div>

            <div>
              <Label>Mounting Style</Label>
              <Select
                value={settings.mountingStyle}
                onValueChange={(value) => updateSetting("mountingStyle", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mountingStyles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Mounting Holes</Label>
              <Switch
                checked={settings.includeMountingHoles}
                onCheckedChange={(checked) => updateSetting("includeMountingHoles", checked)}
              />
            </div>

            <div className="pt-4 border-t">
              <Label>Diffuser Type</Label>
              <Select
                value={settings.diffuserType}
                onValueChange={(value) => updateSetting("diffuserType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ledDiffuserTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {settings.diffuserType !== 'none' && (
              <>
                <div>
                  <Label>Diffuser Thickness: {settings.diffuserThickness}mm</Label>
                  <Slider
                    value={[settings.diffuserThickness]}
                    onValueChange={([value]) => updateSetting("diffuserThickness", value)}
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>

                <div>
                  <Label>Diffuser Offset: {settings.diffuserOffset}mm</Label>
                  <Slider
                    value={[settings.diffuserOffset]}
                    onValueChange={([value]) => updateSetting("diffuserOffset", value)}
                    min={2}
                    max={10}
                    step={1}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sign Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Sign Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Content Type</Label>
              <Select
                value={settings.contentType}
                onValueChange={(value) => updateSetting("contentType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="animation">Animation</SelectItem>
                  <SelectItem value="custom_pixels">Custom Pixels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.contentType === 'text' && (
              <>
                <div>
                  <Label>Text Content</Label>
                  <Input
                    value={settings.textContent || ""}
                    onChange={(e) => updateSetting("textContent", e.target.value)}
                    placeholder="Enter text to display..."
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Uses 5×7 bitmap font. Max {Math.floor(dims.width / 6)} characters.
                  </p>
                </div>

                <div>
                  <Label>Font Size: {settings.fontSize}px</Label>
                  <Slider
                    value={[settings.fontSize || 8]}
                    onValueChange={([value]) => updateSetting("fontSize", value)}
                    min={5}
                    max={32}
                    step={1}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>Include Controller Space</Label>
              <Switch
                checked={settings.includeControllerSpace}
                onCheckedChange={(checked) => updateSetting("includeControllerSpace", checked)}
              />
            </div>

            {settings.includeControllerSpace && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Controller Width: {settings.controllerWidth}mm</Label>
                  <Slider
                    value={[settings.controllerWidth]}
                    onValueChange={([value]) => updateSetting("controllerWidth", value)}
                    min={20}
                    max={60}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Controller Height: {settings.controllerHeight}mm</Label>
                  <Slider
                    value={[settings.controllerHeight]}
                    onValueChange={([value]) => updateSetting("controllerHeight", value)}
                    min={20}
                    max={60}
                    step={5}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Wiring & Power
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">Wiring Pattern: {settings.wiringPattern}</h4>
              <div className="bg-muted p-3 rounded font-mono text-xs space-y-1">
                {settings.wiringPattern === 'serpentine' && (
                  <>
                    <div>Row 0: LED 0 → 1 → 2 → ... → {dims.width - 1}</div>
                    <div>Row 1: LED {dims.width + dims.width - 1} ← ... ← {dims.width + 1} ← {dims.width}</div>
                    <div>Row 2: LED {dims.width * 2} → ... (alternating)</div>
                  </>
                )}
                {settings.wiringPattern === 'parallel' && (
                  <>
                    <div>All rows: left → right</div>
                    <div>Row 0: 0 → {dims.width - 1}</div>
                    <div>Row 1: {dims.width} → {dims.width * 2 - 1}</div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">Power Requirements</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voltage:</span>
                  <span>5V DC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Current:</span>
                  <span>{(dims.totalLEDs * 0.06).toFixed(2)}A ({(dims.totalLEDs * 0.3).toFixed(1)}W)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Typical (50%):</span>
                  <span>{(dims.totalLEDs * 0.02).toFixed(2)}A ({(dims.totalLEDs * 0.1).toFixed(1)}W)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommended PSU:</span>
                  <span>5V {Math.ceil(dims.totalLEDs * 0.06) + 1}A</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">Generated Files</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• LED Grid STL (mounting grid)</li>
                <li>• Housing Box STL (enclosure)</li>
                {settings.diffuserType !== 'none' && <li>• Diffuser Panel STL</li>}
                <li>• Wiring Diagram JSON</li>
                {settings.textContent && <li>• Pixel Map JSON</li>}
                <li>• Arduino Code (.ino)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
