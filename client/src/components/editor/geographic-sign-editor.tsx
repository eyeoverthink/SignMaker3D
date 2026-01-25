import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Map, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GeographicSignEditor() {
  const { toast } = useToast();
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [heightmapUrl, setHeightmapUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Settings
  const [resolution, setResolution] = useState(512);
  const [shellStyle, setShellStyle] = useState("flat");
  const [pattern, setPattern] = useState("clear");
  const [signSize, setSignSize] = useState(150);
  const [depth, setDepth] = useState(30);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.stl')) {
      setStlFile(file);
      toast({
        title: "STL Loaded",
        description: `${file.name} ready for processing`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a .stl file from Map2Model",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generateHeightmap = useCallback(async () => {
    if (!stlFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('stl', stlFile);
    formData.append('resolution', resolution.toString());
    formData.append('invert', 'true'); // For lithophane mode

    try {
      const response = await fetch('/api/geosign/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Processing failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setHeightmapUrl(url);

      toast({
        title: "Heightmap Generated",
        description: `${resolution}x${resolution} depth map ready`,
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process STL",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [stlFile, resolution, toast]);

  const generateSign = useCallback(async () => {
    if (!heightmapUrl) return;

    try {
      const response = await fetch('/api/geosign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heightmapUrl,
          shellStyle,
          pattern,
          signSize,
          depth,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GeoSign_${Date.now()}.zip`;
      a.click();

      toast({
        title: "Sign Generated",
        description: "Download started - check your downloads folder",
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate sign",
        variant: "destructive",
      });
    }
  }, [heightmapUrl, shellStyle, pattern, signSize, depth, toast]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-96 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Geographic Sign Generator
            </CardTitle>
            <CardDescription>
              Convert Map2Model STL files into LED relief maps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Step 1: Import STL</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".stl"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="stl-upload"
                />
                <label htmlFor="stl-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {stlFile ? stlFile.name : "Click to upload Map2Model STL"}
                  </p>
                </label>
              </div>
            </div>

            {/* Step 2: Heightmap Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Step 2: Heightmap Settings</Label>
              
              <div className="space-y-2">
                <Label className="text-xs">Resolution</Label>
                <Select value={resolution.toString()} onValueChange={(v) => setResolution(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256px - Fast</SelectItem>
                    <SelectItem value="512">512px - Balanced</SelectItem>
                    <SelectItem value="1024">1024px - High Detail</SelectItem>
                    <SelectItem value="2048">2048px - Ultra (slow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateHeightmap} 
                disabled={!stlFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Generate Heightmap"
                )}
              </Button>
            </div>

            {/* Step 3: LED System */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Step 3: LED Integration</Label>
              
              <div className="space-y-2">
                <Label className="text-xs">Shell Style</Label>
                <Select value={shellStyle} onValueChange={setShellStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Panel (Wall Mount)</SelectItem>
                    <SelectItem value="curved">Curved Shell (Freestanding)</SelectItem>
                    <SelectItem value="deep">Deep Frame (Shadow Box)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Diffusion Pattern</Label>
                <Select value={pattern} onValueChange={setPattern}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="phi-ribs">Phi-Ribs (Subtle)</SelectItem>
                    <SelectItem value="hex">Hex-Lattice</SelectItem>
                    <SelectItem value="frosted">Frosted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Sign Size: {signSize}mm</Label>
                <Slider
                  value={[signSize]}
                  onValueChange={([v]) => setSignSize(v)}
                  min={50}
                  max={300}
                  step={10}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Box Depth: {depth}mm</Label>
                <Slider
                  value={[depth]}
                  onValueChange={([v]) => setDepth(v)}
                  min={10}
                  max={80}
                  step={5}
                />
              </div>

              <Button 
                onClick={generateSign} 
                disabled={!heightmapUrl}
                className="w-full"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Complete Sign
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground">
            <p>1. Visit <strong>map2model.com</strong></p>
            <p>2. Search for any location (city, landmark, etc.)</p>
            <p>3. Select the area and export as STL</p>
            <p>4. Upload the STL file here</p>
            <p>5. Generate heightmap (converts 3D → 2D depth map)</p>
            <p>6. Configure LED system and generate sign</p>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 bg-muted/30 rounded-lg border flex items-center justify-center p-4">
        {heightmapUrl ? (
          <div className="space-y-4 text-center">
            <img 
              src={heightmapUrl} 
              alt="Heightmap Preview" 
              className="max-w-full max-h-96 rounded-lg shadow-lg"
            />
            <p className="text-sm text-muted-foreground">
              Heightmap Preview - This will be carved into the LED shell
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Map className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-lg font-medium text-muted-foreground">
                No heightmap generated yet
              </p>
              <p className="text-sm text-muted-foreground">
                Upload an STL file and click "Generate Heightmap"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
