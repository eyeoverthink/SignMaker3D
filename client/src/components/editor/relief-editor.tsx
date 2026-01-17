import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Loader2, Image as ImageIcon, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ReliefSettings, ReliefStyle, LedPlacement } from "@shared/relief-types";
import { defaultReliefSettings } from "@shared/relief-types";

export function ReliefEditor() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReliefSettings>(defaultReliefSettings);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateSetting = <K extends keyof ReliefSettings>(
    key: K,
    value: ReliefSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Generate preview when image or settings change
  useEffect(() => {
    if (!uploadedImage || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Scale image to fit canvas
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data for height map generation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and apply threshold
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const value = gray > settings.threshold ? 255 : 0;
        
        // Visualize depth with gradient
        const depth = settings.invertDepth ? (255 - gray) : gray;
        const depthColor = Math.floor(depth * (settings.maxDepth / 50));
        
        data[i] = depthColor;     // R
        data[i + 1] = depthColor; // G
        data[i + 2] = depthColor; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Draw LED channel indicators
      if (settings.ledPlacement !== "none") {
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        
        if (settings.ledPlacement === "edges") {
          ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        } else if (settings.ledPlacement === "grid") {
          const gridSize = 40;
          for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        }
      }
      
      setIsProcessing(false);
    };
    
    img.src = uploadedImage;
  }, [uploadedImage, settings]);

  const handleExport = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Convert image to base64 data
      const response = await fetch("/api/export/relief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          imageData: uploadedImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relief_${settings.reliefStyle}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Your 2.5D relief model has been downloaded",
      });
    } catch (error) {
      console.error("Relief export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!uploadedImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div 
          className="text-center p-12 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors max-w-md"
          onClick={openFilePicker}
        >
          <div className="bg-primary/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Image for 2.5D Relief</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Convert any image into a raised or recessed 3D relief with integrated LED channels
          </p>
          <Button 
            variant="default" 
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Supports JPG, PNG, GIF
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full rounded-lg shadow-lg border-2 border-border"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="w-96 border-l bg-card p-6 overflow-y-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">2.5D Relief Generator</h2>
          <p className="text-sm text-muted-foreground">
            Create embossed or engraved surfaces with LED lighting
          </p>
        </div>

        {/* Relief Style */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Relief Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Extrusion Type</Label>
              <Select 
                value={settings.reliefStyle} 
                onValueChange={(v: ReliefStyle) => updateSetting("reliefStyle", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raised">Raised (Embossed)</SelectItem>
                  <SelectItem value="recessed">Recessed (Engraved)</SelectItem>
                  <SelectItem value="both">Both (Dual-Layer)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Max Depth</Label>
                <span className="text-xs text-muted-foreground">{settings.maxDepth}mm</span>
              </div>
              <Slider
                value={[settings.maxDepth]}
                onValueChange={([v]) => updateSetting("maxDepth", v)}
                min={1}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Threshold</Label>
                <span className="text-xs text-muted-foreground">{settings.threshold}</span>
              </div>
              <Slider
                value={[settings.threshold]}
                onValueChange={([v]) => updateSetting("threshold", v)}
                min={0}
                max={255}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Invert Depth</Label>
              <Switch
                checked={settings.invertDepth}
                onCheckedChange={(v) => updateSetting("invertDepth", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* LED Integration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">LED Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">LED Placement</Label>
              <Select 
                value={settings.ledPlacement} 
                onValueChange={(v: LedPlacement) => updateSetting("ledPlacement", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edges">Edges Only</SelectItem>
                  <SelectItem value="contours">Follow Contours</SelectItem>
                  <SelectItem value="grid">Grid Pattern</SelectItem>
                  <SelectItem value="none">No LEDs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.ledPlacement !== "none" && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Channel Width</Label>
                    <span className="text-xs text-muted-foreground">{settings.ledChannelWidth}mm</span>
                  </div>
                  <Slider
                    value={[settings.ledChannelWidth]}
                    onValueChange={([v]) => updateSetting("ledChannelWidth", v)}
                    min={3}
                    max={15}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Channel Depth</Label>
                    <span className="text-xs text-muted-foreground">{settings.ledChannelDepth}mm</span>
                  </div>
                  <Slider
                    value={[settings.ledChannelDepth]}
                    onValueChange={([v]) => updateSetting("ledChannelDepth", v)}
                    min={2}
                    max={10}
                    step={1}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Splitting & Assembly */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assembly Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Split Horizontal</Label>
              <Switch
                checked={settings.splitHorizontal}
                onCheckedChange={(v) => updateSetting("splitHorizontal", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Split Vertical</Label>
              <Switch
                checked={settings.splitVertical}
                onCheckedChange={(v) => updateSetting("splitVertical", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Snap-Fit Connectors</Label>
              <Switch
                checked={settings.snapFit}
                onCheckedChange={(v) => updateSetting("snapFit", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Include Diffuser</Label>
              <Switch
                checked={settings.includeDiffuser}
                onCheckedChange={(v) => updateSetting("includeDiffuser", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Relief Model
            </>
          )}
        </Button>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setUploadedImage(null);
            setPreviewData(null);
          }}
        >
          Upload Different Image
        </Button>
      </div>
    </div>
  );
}
