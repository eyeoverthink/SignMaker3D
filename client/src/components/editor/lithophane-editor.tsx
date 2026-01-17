import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Upload, Download, Loader2, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LithophaneEditor() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { toast } = useToast();

  // Lithophane settings
  const [baseThickness, setBaseThickness] = useState(3);
  const [maxDepth, setMaxDepth] = useState(4);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [invertImage, setInvertImage] = useState(false);
  const [smoothing, setSmoothing] = useState(2);
  const [borderThickness, setBorderThickness] = useState(5);
  const [addFrame, setAddFrame] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgSrc = event.target?.result as string;
      setUploadedImage(imgSrc);
      
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        imageRef.current = img;
        
        const canvas = canvasRef.current;
        if (canvas) {
          const maxWidth = 400;
          const maxHeight = 400;
          let w = img.width;
          let h = img.height;
          
          if (w > maxWidth || h > maxHeight) {
            const scale = Math.min(maxWidth / w, maxHeight / h);
            w = w * scale;
            h = h * scale;
          }
          
          canvas.width = w;
          canvas.height = h;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            
            // Apply grayscale preview
            const imageData = ctx.getImageData(0, 0, w, h);
            for (let i = 0; i < imageData.data.length; i += 4) {
              const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
              const value = invertImage ? 255 - gray : gray;
              imageData.data[i] = value;
              imageData.data[i + 1] = value;
              imageData.data[i + 2] = value;
            }
            ctx.putImageData(imageData, 0, 0);
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
          const value = invertImage ? 255 - gray : gray;
          imageData.data[i] = value;
          imageData.data[i + 1] = value;
          imageData.data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [invertImage]);

  const handleExport = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    console.log('[Lithophane Export] Starting export...');
    setIsExporting(true);

    try {
      const response = await fetch("/api/export/lithophane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          baseThickness,
          maxDepth,
          width,
          height,
          invertImage,
          smoothing,
          borderThickness,
          addFrame,
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
      a.download = `lithophane_${Date.now()}.stl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Lithophane STL downloaded successfully",
      });
    } catch (error) {
      console.error('[Lithophane Export] Error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate STL file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 relative bg-gradient-to-br from-zinc-900 via-amber-950/20 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {!uploadedImage ? (
            <div className="text-center">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-amber-500/50" />
              <h3 className="text-lg font-medium mb-2">Upload an Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Photos, logos, or artwork to convert into backlit 3D panels
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="lithophane-upload"
              />
              <label htmlFor="lithophane-upload">
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full border border-amber-500/30 rounded-lg shadow-2xl"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-96 border-l bg-sidebar overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Lithophane</h2>
            </div>
            <Button onClick={handleExport} disabled={isExporting || !uploadedImage} size="sm">
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
              <CardTitle className="text-sm">About Lithophanes</CardTitle>
              <CardDescription className="text-xs">
                3D panels that reveal images when backlit. Dark areas are thick (block light), bright areas are thin (transmit light). Perfect for LED backlit displays.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Physical Width</Label>
                <span className="text-xs text-muted-foreground">{width}mm</span>
              </div>
              <Slider
                value={[width]}
                onValueChange={([v]) => setWidth(v)}
                min={50}
                max={300}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Physical Height</Label>
                <span className="text-xs text-muted-foreground">{height}mm</span>
              </div>
              <Slider
                value={[height]}
                onValueChange={([v]) => setHeight(v)}
                min={50}
                max={300}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Base Thickness</Label>
                <span className="text-xs text-muted-foreground">{baseThickness}mm</span>
              </div>
              <Slider
                value={[baseThickness]}
                onValueChange={([v]) => setBaseThickness(v)}
                min={1}
                max={5}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Minimum wall thickness (brightest areas)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Maximum Depth</Label>
                <span className="text-xs text-muted-foreground">{maxDepth}mm</span>
              </div>
              <Slider
                value={[maxDepth]}
                onValueChange={([v]) => setMaxDepth(v)}
                min={2}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Additional thickness for darkest areas
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Smoothing</Label>
                <span className="text-xs text-muted-foreground">{smoothing}px</span>
              </div>
              <Slider
                value={[smoothing]}
                onValueChange={([v]) => setSmoothing(v)}
                min={0}
                max={5}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Blur radius for smoother transitions
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Invert Image</Label>
                <p className="text-xs text-muted-foreground">
                  Swap light/dark areas
                </p>
              </div>
              <Switch
                checked={invertImage}
                onCheckedChange={setInvertImage}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Add Frame</Label>
                <p className="text-xs text-muted-foreground">
                  Border around edges
                </p>
              </div>
              <Switch
                checked={addFrame}
                onCheckedChange={setAddFrame}
              />
            </div>

            {addFrame && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Frame Thickness</Label>
                  <span className="text-xs text-muted-foreground">{borderThickness}mm</span>
                </div>
                <Slider
                  value={[borderThickness]}
                  onValueChange={([v]) => setBorderThickness(v)}
                  min={2}
                  max={15}
                  step={1}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="lithophane-new-image"
            />
            <label htmlFor="lithophane-new-image" className="flex-1">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  New Image
                </span>
              </Button>
            </label>
          </div>

          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-400">
              <strong>Printing Tip:</strong> Use white or translucent filament (PLA/PETG). Place LED strip or light source behind the panel for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
