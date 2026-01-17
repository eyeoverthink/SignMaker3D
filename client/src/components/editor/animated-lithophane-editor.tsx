import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Upload, Download, Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AnimatedLithophaneEditor() {
  const [frames, setFrames] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Animation settings
  const [frameCount, setFrameCount] = useState(4);
  const [canvasWidth, setCanvasWidth] = useState(200); // 8 inches at 25 DPI
  const [canvasHeight, setCanvasHeight] = useState(250); // 10 inches at 25 DPI
  const [baseThickness, setBaseThickness] = useState(3);
  const [maxDepth, setMaxDepth] = useState(4);
  const [baffleDepth, setBaffleDepth] = useState(25);
  const [baffleWallThickness, setBaffleWallThickness] = useState(1.5);
  const [frameRate, setFrameRate] = useState(60); // FPS for POV
  const [includeBaffle, setIncludeBaffle] = useState(true);
  const [includeESP32Code, setIncludeESP32Code] = useState(true);

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxFrames = frameCount;
    const fileArray = Array.from(files).slice(0, maxFrames);

    if (fileArray.length < maxFrames) {
      toast({
        title: "Not enough frames",
        description: `Please upload ${maxFrames} images for the animation`,
        variant: "destructive",
      });
      return;
    }

    const readers = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      setFrames(images);
      drawInterlacedPreview(images);
      toast({
        title: "Frames loaded",
        description: `${images.length} frames ready for interlacing`,
      });
    });
  };

  const drawInterlacedPreview = (frameImages: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 400;
    canvas.height = 500;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate grid layout (2x2 for 4 frames, 3x3 for 9 frames, etc.)
    const gridSize = Math.ceil(Math.sqrt(frameImages.length));
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    // Load and draw each frame in its grid position
    frameImages.forEach((imgSrc, index) => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        const gridX = index % gridSize;
        const gridY = Math.floor(index / gridSize);
        ctx.drawImage(img, gridX * cellWidth, gridY * cellHeight, cellWidth, cellHeight);
        
        // Draw grid lines
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX * cellWidth, gridY * cellHeight, cellWidth, cellHeight);
        
        // Label frame
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px monospace';
        ctx.fillText(`F${index + 1}`, gridX * cellWidth + 10, gridY * cellHeight + 30);
      };
    });
  };

  const handleExport = async () => {
    if (frames.length === 0) {
      toast({
        title: "No frames loaded",
        description: "Please upload animation frames first",
        variant: "destructive",
      });
      return;
    }

    console.log('[Animated Lithophane] Starting export...');
    setIsExporting(true);

    try {
      const response = await fetch("/api/export/animated-lithophane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          frameCount,
          canvasWidth,
          canvasHeight,
          baseThickness,
          maxDepth,
          baffleDepth,
          baffleWallThickness,
          frameRate,
          includeBaffle,
          includeESP32Code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `animated_lithophane_${frameCount}frames_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `${frameCount}-frame animated lithophane with baffle and ESP32 code`,
      });
    } catch (error) {
      console.error('[Animated Lithophane] Error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate files",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 relative bg-gradient-to-br from-zinc-900 via-purple-950/20 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {frames.length === 0 ? (
            <div className="text-center">
              <Film className="h-16 w-16 mx-auto mb-4 text-purple-500/50" />
              <h3 className="text-lg font-medium mb-2">Upload Animation Frames</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload {frameCount} images to create a strobing animated lithophane
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFrameUpload}
                className="hidden"
                id="animated-litho-upload"
              />
              <label htmlFor="animated-litho-upload">
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose {frameCount} Frames
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full border border-purple-500/30 rounded-lg shadow-2xl"
                style={{ imageRendering: 'auto' }}
              />
              <div className="text-sm text-muted-foreground">
                Interlaced Preview - Each cell = 1 animation frame
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-96 border-l bg-sidebar overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Animated Lithophane</h2>
            </div>
            <Button onClick={handleExport} disabled={isExporting || frames.length === 0} size="sm">
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Project Chronos-Pane</CardTitle>
              <CardDescription className="text-xs">
                Strobing multi-frame lithophanes with optical baffles. Creates "motion" without moving parts using persistence of vision.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Frame Count</Label>
                <span className="text-xs text-muted-foreground">{frameCount} frames</span>
              </div>
              <Slider
                value={[frameCount]}
                onValueChange={([v]) => setFrameCount(v)}
                min={2}
                max={9}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                2=flip-flop, 4=smooth loop, 9=complex animation
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Canvas Size</Label>
                <span className="text-xs text-muted-foreground">{canvasWidth}x{canvasHeight}mm</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Slider
                    value={[canvasWidth]}
                    onValueChange={([v]) => setCanvasWidth(v)}
                    min={100}
                    max={300}
                    step={10}
                  />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Slider
                    value={[canvasHeight]}
                    onValueChange={([v]) => setCanvasHeight(v)}
                    min={100}
                    max={300}
                    step={10}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Frame Rate (POV)</Label>
                <span className="text-xs text-muted-foreground">{frameRate} FPS</span>
              </div>
              <Slider
                value={[frameRate]}
                onValueChange={([v]) => setFrameRate(v)}
                min={24}
                max={120}
                step={6}
              />
              <p className="text-xs text-muted-foreground">
                60 FPS = smooth, 24 FPS = cinematic, 120 FPS = camera-safe
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Lithophane Thickness</Label>
                <span className="text-xs text-muted-foreground">{baseThickness}-{baseThickness + maxDepth}mm</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Base</Label>
                  <Slider
                    value={[baseThickness]}
                    onValueChange={([v]) => setBaseThickness(v)}
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>
                <div>
                  <Label className="text-xs">Depth</Label>
                  <Slider
                    value={[maxDepth]}
                    onValueChange={([v]) => setMaxDepth(v)}
                    min={2}
                    max={10}
                    step={0.5}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Include Baffle Grid</Label>
                <p className="text-xs text-muted-foreground">
                  Prevents light bleed between frames
                </p>
              </div>
              <Switch
                checked={includeBaffle}
                onCheckedChange={setIncludeBaffle}
              />
            </div>

            {includeBaffle && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Baffle Depth</Label>
                  <span className="text-xs text-muted-foreground">{baffleDepth}mm</span>
                </div>
                <Slider
                  value={[baffleDepth]}
                  onValueChange={([v]) => setBaffleDepth(v)}
                  min={10}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Distance from LED to lithophane
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Include ESP32 Code</Label>
                <p className="text-xs text-muted-foreground">
                  Arduino firmware for WS2812B control
                </p>
              </div>
              <Switch
                checked={includeESP32Code}
                onCheckedChange={setIncludeESP32Code}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFrameUpload}
              className="hidden"
              id="animated-litho-new"
            />
            <label htmlFor="animated-litho-new" className="flex-1">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  New Frames
                </span>
              </Button>
            </label>
          </div>

          <div className="rounded-md bg-purple-500/10 border border-purple-500/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <p className="text-xs font-semibold text-purple-400">
                The Chronos-Pane System
              </p>
            </div>
            <p className="text-xs text-purple-400">
              <strong>Interlaced Lithophane:</strong> Each frame occupies a grid cell<br />
              <strong>Optical Baffle:</strong> Honeycomb prevents light bleed<br />
              <strong>POV Strobing:</strong> ESP32 pulses LED groups at {frameRate} FPS<br />
              <strong>Result:</strong> Fluid animation without moving parts
            </p>
          </div>

          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-400">
              <strong>Printing Tips:</strong> Print lithophane in white/clear PETG. Print baffle in black PLA for maximum light isolation. Use WS2812B LED strips with one LED per frame cell.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
