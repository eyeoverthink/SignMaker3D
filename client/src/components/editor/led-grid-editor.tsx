import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Grid3x3, Zap, Box, Layers, Upload } from "lucide-react";
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
  textToPixelGrid,
  generateWiringMap,
} from "@shared/schema";

export default function LEDGridEditor() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LEDGridSettings>(defaultLEDGridSettings);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Draw LED grid preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, totalLEDs } = dims;
    const cellSize = 40;
    const padding = 20;
    const canvasWidth = width * cellSize + padding * 2;
    const canvasHeight = height * cellSize + padding * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Get pixel grid based on content type
    let pixelGrid: boolean[][] | null = null;
    
    if (settings.contentType === 'text' && settings.textContent) {
      pixelGrid = textToPixelGrid(settings.textContent, width, height);
    } else if (settings.contentType === 'image' && settings.imageData) {
      // Process image to pixel grid
      pixelGrid = processImageToPixelGrid(settings.imageData, width, height, settings.brightnessThreshold || 128, settings.invertImage || false);
    }

    // Helper function to process image
    function processImageToPixelGrid(imageData: string, gridWidth: number, gridHeight: number, threshold: number, invert: boolean): boolean[][] {
      const grid: boolean[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));
      
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gridWidth;
        tempCanvas.height = gridHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Draw and scale image to grid size
        tempCtx.drawImage(img, 0, 0, gridWidth, gridHeight);
        const imgData = tempCtx.getImageData(0, 0, gridWidth, gridHeight);
        const data = imgData.data;

        // Convert to grayscale and threshold
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const i = (y * gridWidth + x) * 4;
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const isLit = invert ? (gray > threshold) : (gray < threshold);
            grid[y][x] = isLit;
          }
        }

        // Trigger re-render with updated grid
        if (ctx) {
          requestAnimationFrame(() => {
            drawGrid(ctx, grid, width, height, cellSize, padding, wiringMap);
          });
        }
      };
      img.src = imageData;
      
      return grid;
    }

    function drawGrid(ctx: CanvasRenderingContext2D, pixelGrid: boolean[][] | null, width: number, height: number, cellSize: number, padding: number, wiringMapParam: any[]) {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width * cellSize + padding * 2, height * cellSize + padding * 2);

      // Draw grid cells and LEDs
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = padding + x * cellSize;
        const py = padding + y * cellSize;

        // Draw cell background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px, py, cellSize - 2, cellSize - 2);

        // Check if this pixel should be lit
        const isLit = pixelGrid ? pixelGrid[y]?.[x] || false : false;

        // Draw LED
        const ledX = px + cellSize / 2;
        const ledY = py + cellSize / 2;
        const ledRadius = isLit ? 12 : 8;

        ctx.beginPath();
        ctx.arc(ledX, ledY, ledRadius, 0, Math.PI * 2);
        ctx.fillStyle = isLit ? '#3b82f6' : '#374151';
        ctx.fill();

        if (isLit) {
          // Add glow effect
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#3b82f6';
          ctx.beginPath();
          ctx.arc(ledX, ledY, ledRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw LED index
        const ledInfo = wiringMapParam.find(m => m.x === x && m.y === y);
        if (ledInfo) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(ledInfo.index.toString(), ledX, py + cellSize - 14);
        }
      }
    }

    // Draw wiring pattern lines
    if (settings.wiringPattern === 'serpentine') {
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i < wiringMapParam.length - 1; i++) {
        const current = wiringMapParam[i];
        const next = wiringMapParam[i + 1];

        const x1 = padding + current.x * cellSize + cellSize / 2;
        const y1 = padding + current.y * cellSize + cellSize / 2;
        const x2 = padding + next.x * cellSize + cellSize / 2;
        const y2 = padding + next.y * cellSize + cellSize / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

      // Draw info text
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${width}×${height} Grid | ${totalLEDs} LEDs | ${settings.wiringPattern}`, padding, 12);
    }

    // Get wiring map
    const wiringMap = generateWiringMap(settings);

    // Initial draw
    drawGrid(ctx, pixelGrid, width, height, cellSize, padding, wiringMap);

  }, [settings, dims]);

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div>
          <h2 className="text-2xl font-bold">LED Grid Sign System</h2>
          <p className="text-muted-foreground">
            Complete hardware + software stack for WS2812B matrix displays
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Complete System"}
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
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

            {settings.contentType === 'image' && (
              <div className="space-y-4">
                <div>
                  <Label>Upload Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            updateSetting("imageData", event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="led-grid-image-upload"
                    />
                    <label htmlFor="led-grid-image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload image</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, or GIF</p>
                      </div>
                    </label>
                  </div>
                </div>

                {settings.imageData && (
                  <>
                    <div className="border rounded-lg p-4 bg-black">
                      <img 
                        src={settings.imageData} 
                        alt="Uploaded" 
                        className="max-w-full h-auto mx-auto"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>

                    <div>
                      <Label>Processing Method</Label>
                      <Select
                        value={settings.imageProcessing || "scott_trace"}
                        onValueChange={(value) => updateSetting("imageProcessing", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scott_trace">Scott Algorithm (Centerline Extraction)</SelectItem>
                          <SelectItem value="edge_detect">Edge Detection</SelectItem>
                          <SelectItem value="threshold">Simple Threshold</SelectItem>
                          <SelectItem value="dither">Floyd-Steinberg Dithering</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scott Algorithm extracts centerlines for cleaner pixel conversion
                      </p>
                    </div>

                    <div>
                      <Label>Brightness Threshold: {settings.brightnessThreshold || 128}</Label>
                      <Slider
                        value={[settings.brightnessThreshold || 128]}
                        onValueChange={([value]) => updateSetting("brightnessThreshold", value)}
                        min={0}
                        max={255}
                        step={1}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Invert Colors</Label>
                      <Switch
                        checked={settings.invertImage || false}
                        onCheckedChange={(checked) => updateSetting("invertImage", checked)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {settings.contentType === 'animation' && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  🎬 Animation mode: Upload multiple frames or create scrolling text animations. 
                  Export will include frame sequencing code for ESP32.
                </p>
              </div>
            )}

            {settings.contentType === 'custom_pixels' && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  🎨 Custom pixel mode: Manually define which LEDs are on/off. 
                  Export will include a pixel editor JSON template you can modify.
                </p>
              </div>
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

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="w-5 h-5" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center bg-black rounded-lg p-4">
              <canvas 
                ref={canvasRef}
                className="max-w-full h-auto"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Blue LEDs show active pixels • Numbers show wiring order • Dashed lines show data flow
            </p>
          </CardContent>
        </Card>

        {/* Wiring & Power */}
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

      {/* Scott Algorithm Content Conversion */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Content Pipeline - Scott Algorithm Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convert any content type into pixel grid displays using Scott Algorithm centerline extraction:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">📝 Text Input</h4>
              <p className="text-xs text-muted-foreground">Type text → 5×7 bitmap font → pixel grid</p>
              <code className="text-xs bg-muted p-1 rounded">"HELLO" → 35×7 grid</code>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">✏️ Freehand Draw</h4>
              <p className="text-xs text-muted-foreground">Draw strokes → Scott centerline → downsample to grid</p>
              <code className="text-xs bg-muted p-1 rounded">Canvas paths → skeleton → pixels</code>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">🖼️ Image Trace</h4>
              <p className="text-xs text-muted-foreground">Upload image → edge detect → Scott trace → grid</p>
              <code className="text-xs bg-muted p-1 rounded">JPG/PNG → contours → pixels</code>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">🔤 Custom Fonts</h4>
              <p className="text-xs text-muted-foreground">Any TTF/OTF → glyph outline → centerline → grid</p>
              <code className="text-xs bg-muted p-1 rounded">Font glyphs → skeleton → pixels</code>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium text-blue-400">🎯 Scott Algorithm Advantage</p>
            <p className="text-xs text-muted-foreground mt-1">
              Traditional bitmap conversion loses detail. Scott Algorithm extracts centerlines first, 
              preserving stroke topology before downsampling to grid resolution. Result: cleaner pixels, 
              better recognition of shapes at low resolution.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ESP32/WLED Circuit Design */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Electronics & Circuits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ESP32 Option */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Option 1: ESP32 + FastLED</h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Bill of Materials:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• ESP32-DevKit C (1×) - $6</li>
                  <li>• WS2812B LED Strip ({dims.totalLEDs} LEDs) - ${(dims.totalLEDs * 0.15).toFixed(2)}</li>
                  <li>• 5V Power Supply ({Math.ceil(dims.totalLEDs * 0.06) + 1}A) - $12</li>
                  <li>• 1000µF Capacitor (1×) - $0.50</li>
                  <li>• 470Ω Resistor (1×) - $0.10</li>
                  <li>• Jumper wires (22 AWG) - $2</li>
                </ul>
                <p className="font-medium mt-2">Wiring:</p>
                <div className="bg-muted p-2 rounded text-xs font-mono">
                  ESP32 GPIO16 → 470Ω → LED DIN<br/>
                  5V PSU + → LED 5V & ESP32 VIN<br/>
                  GND → LED GND & ESP32 GND<br/>
                  1000µF cap across 5V/GND
                </div>
              </div>
            </div>

            {/* WLED Option */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Option 2: WLED (WiFi Control)</h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Bill of Materials:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• ESP8266 D1 Mini (1×) - $4</li>
                  <li>• WS2812B LED Strip ({dims.totalLEDs} LEDs) - ${(dims.totalLEDs * 0.15).toFixed(2)}</li>
                  <li>• 5V Power Supply ({Math.ceil(dims.totalLEDs * 0.06) + 1}A) - $12</li>
                  <li>• 1000µF Capacitor (1×) - $0.50</li>
                  <li>• 470Ω Resistor (1×) - $0.10</li>
                  <li>• Level shifter 3.3V→5V (1×) - $1</li>
                </ul>
                <p className="font-medium mt-2">Features:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>✓ WiFi web interface</li>
                  <li>✓ 100+ built-in effects</li>
                  <li>✓ Mobile app control</li>
                  <li>✓ Music reactive mode</li>
                  <li>✓ No coding required</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-400">💡 Recommendation</p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>WLED</strong> for plug-and-play with WiFi control. <strong>ESP32 + FastLED</strong> for 
              custom animations and Scott Algorithm real-time processing (shape recognition, collision detection, etc.)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Firmware & Programming */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Firmware & Programming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export includes complete firmware with your pixel content pre-loaded:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-sm">📄 Arduino .ino</h4>
              <p className="text-xs text-muted-foreground">FastLED library code with pixel map embedded</p>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-sm">🗺️ Pixel Map JSON</h4>
              <p className="text-xs text-muted-foreground">LED indices mapped to grid coordinates</p>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-sm">⚙️ WLED Config</h4>
              <p className="text-xs text-muted-foreground">Preset file for WLED import</p>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs font-mono">
              // Generated code includes:<br/>
              • Grid dimensions ({dims.width}×{dims.height})<br/>
              • Wiring pattern ({settings.wiringPattern})<br/>
              • Pixel data for "{settings.textContent || 'your content'}"<br/>
              • Helper functions (getPixelIndex, setPixel, etc.)<br/>
              • Example animations (scroll, fade, blink)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card className="mt-6 mb-6">
        <CardHeader>
          <CardTitle>Complete System Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Clicking "Export Complete System" generates everything you need:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
              <p className="font-semibold text-green-400">Hardware</p>
              <p className="text-muted-foreground">STL files for 3D printing</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="font-semibold text-blue-400">Electronics</p>
              <p className="text-muted-foreground">Wiring diagrams & BOM</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
              <p className="font-semibold text-purple-400">Software</p>
              <p className="text-muted-foreground">Arduino/WLED firmware</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
              <p className="font-semibold text-orange-400">Content</p>
              <p className="text-muted-foreground">Pixel maps & animations</p>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
