import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Download, Loader2, Upload, Pencil, Type as TypeIcon } from "lucide-react";
import { useState, Suspense, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { fontOptions } from "@shared/schema";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import * as THREE from "three";

const fontFileMap: Record<string, string> = {
  "aerioz": "Aerioz-Demo.otf",
  "airstream": "Airstream.ttf",
  "inter": "Inter-Bold.ttf",
  "roboto": "Roboto-Bold.ttf",
};

function NeonTubePreview3D() {
  const { neonTubeSettings } = useEditorStore();
  const { text, tubeDiameter, tubeScale, fontId } = neonTubeSettings;
  
  const [fontData, setFontData] = useState<any>(null);
  
  // Initialize font data (placeholder for now)
  useMemo(() => {
    setFontData({ loaded: true });
  }, [fontId]);
  
  const tubeGeometries = useMemo(() => {
    if (!text || !fontData) return [];
    
    const tubeRadius = (tubeDiameter / 2) * 0.01 * tubeScale;
    const geometries: THREE.TubeGeometry[] = [];
    
    // Create simple letter-like paths for each character
    const chars = text.split('');
    const spacing = 0.6 * tubeScale;
    const startX = -(chars.length - 1) * spacing / 2;
    
    chars.forEach((char, index) => {
      const x = startX + index * spacing;
      const height = 0.5 * tubeScale;
      const w = 0.2 * tubeScale; // letter width
      
      // Create a simple path for each letter (placeholder - will be replaced with real font paths)
      let points: THREE.Vector3[] = [];
      
      // Simple letter shapes
      const letter = char.toUpperCase();
      
      if (letter === 'A') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x, height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
          new THREE.Vector3(x + w, -height/4, 0),
          new THREE.Vector3(x - w, -height/4, 0),
        ];
      } else if (letter === 'B') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x + w, 0, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w, 0, 0),
          new THREE.Vector3(x + w, -height/2, 0),
          new THREE.Vector3(x - w, -height/2, 0),
        ];
      } else if (letter === 'C') {
        const segments = 24;
        const radius = w * 1.2;
        for (let i = 0; i <= segments; i++) {
          const angle = Math.PI * 0.25 + (i / segments) * Math.PI * 1.5;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          ));
        }
      } else if (letter === 'D') {
        const segments = 16;
        points.push(new THREE.Vector3(x - w, -height/2, 0));
        points.push(new THREE.Vector3(x - w, height/2, 0));
        for (let i = 0; i <= segments; i++) {
          const angle = -Math.PI/2 + (i / segments) * Math.PI;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * w,
            Math.sin(angle) * height/2,
            0
          ));
        }
        points.push(new THREE.Vector3(x - w, -height/2, 0));
      } else if (letter === 'E') {
        points = [
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w*0.8, 0, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'F') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w*0.8, 0, 0),
        ];
      } else if (letter === 'G') {
        const segments = 24;
        const radius = w * 1.2;
        for (let i = 0; i <= segments; i++) {
          const angle = Math.PI * 0.25 + (i / segments) * Math.PI * 1.5;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          ));
        }
        points.push(new THREE.Vector3(x + radius, 0, 0));
        points.push(new THREE.Vector3(x, 0, 0));
      } else if (letter === 'H') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w, 0, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'I') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x, height/2, 0),
          new THREE.Vector3(x, -height/2, 0),
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'J') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x, height/2, 0),
          new THREE.Vector3(x, -height/4, 0),
        ];
        const segments = 12;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI;
          points.push(new THREE.Vector3(
            x - w/2 + Math.cos(angle) * w/2,
            -height/4 - Math.sin(angle) * w/2,
            0
          ));
        }
      } else if (letter === 'K') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'L') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'M') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x, 0, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'N') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
        ];
      } else if (letter === 'O') {
        const segments = 32;
        const radius = w * 1.2;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * radius,
            Math.sin(angle) * height/2,
            0
          ));
        }
      } else if (letter === 'P') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x + w, 0, 0),
          new THREE.Vector3(x - w, 0, 0),
        ];
      } else if (letter === 'Q') {
        const segments = 32;
        const radius = w * 1.2;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * radius,
            Math.sin(angle) * height/2,
            0
          ));
        }
        points.push(new THREE.Vector3(x, 0, 0));
        points.push(new THREE.Vector3(x + w, -height/2, 0));
      } else if (letter === 'R') {
        points = [
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x + w, 0, 0),
          new THREE.Vector3(x - w, 0, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === 'S') {
        const segments = 12;
        for (let i = 0; i <= segments; i++) {
          const angle = Math.PI + (i / segments) * Math.PI;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * w/2,
            height/4 + Math.sin(angle) * height/4,
            0
          ));
        }
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * w/2,
            -height/4 + Math.sin(angle) * height/4,
            0
          ));
        }
      } else if (letter === 'T') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x, height/2, 0),
          new THREE.Vector3(x, -height/2, 0),
        ];
      } else if (letter === 'U') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w, -height/4, 0),
        ];
        const segments = 16;
        for (let i = 0; i <= segments; i++) {
          const angle = Math.PI + (i / segments) * Math.PI;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * w,
            -height/4 + Math.sin(angle) * height/4,
            0
          ));
        }
        points.push(new THREE.Vector3(x + w, height/2, 0));
      } else if (letter === 'V') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x, -height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
        ];
      } else if (letter === 'W') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x - w/2, -height/2, 0),
          new THREE.Vector3(x, 0, 0),
          new THREE.Vector3(x + w/2, -height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
        ];
      } else if (letter === 'X') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
          new THREE.Vector3(x, 0, 0),
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
        ];
      } else if (letter === 'Y') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x, 0, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x, 0, 0),
          new THREE.Vector3(x, -height/2, 0),
        ];
      } else if (letter === 'Z') {
        points = [
          new THREE.Vector3(x - w, height/2, 0),
          new THREE.Vector3(x + w, height/2, 0),
          new THREE.Vector3(x - w, -height/2, 0),
          new THREE.Vector3(x + w, -height/2, 0),
        ];
      } else if (letter === ' ') {
        // Space - no geometry
        return;
      } else {
        // Default vertical line for other characters
        points = [
          new THREE.Vector3(x, -height/2, 0),
          new THREE.Vector3(x, height/2, 0),
        ];
      }
      
      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 64, tubeRadius, 16, false);
        geometries.push(geometry);
      }
    });
    
    return geometries;
  }, [text, tubeDiameter, tubeScale, fontData]);
  
  return (
    <group>
      {tubeGeometries.map((geometry, index) => (
        <group key={index}>
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color="#ff00ff" 
              emissive="#ff00ff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color="#ffffff" 
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function NeonTubeEditor() {
  const { neonTubeSettings, setNeonTubeSettings, uploadedImageData, setUploadedImageData } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [inputType, setInputType] = useState<"text" | "image" | "draw">("text");
  const { toast } = useToast();

  const handleExport = async () => {
    if (!neonTubeSettings.text.trim() && inputType === "text") {
      toast({
        title: "Text required",
        description: "Please enter text before exporting",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/neon-tube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...neonTubeSettings, inputType }),
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const isMultiPart = response.headers.get("X-Multi-Part-Export") === "true";
      const extension = isMultiPart ? "zip" : "stl";
      a.download = `${neonTubeSettings.text}_neon_tube.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const partCount = response.headers.get("X-Part-Count");
      toast({
        title: "Export complete",
        description: isMultiPart 
          ? `Downloaded ${partCount} parts: casing segments + diffuser caps + mounting clips`
          : "Your neon tube STL has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not generate neon tube files",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImageData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 relative bg-gradient-to-br from-zinc-900 via-purple-950/20 to-zinc-900">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <NeonTubePreview3D />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            <Grid args={[10, 10]} cellColor="#444" sectionColor="#666" />
            <Environment preset="night" />
          </Suspense>
        </Canvas>
        
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
          <p className="text-xs font-medium mb-2">Input Type</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={inputType === "text" ? "default" : "outline"}
              onClick={() => setInputType("text")}
            >
              <TypeIcon className="h-4 w-4 mr-1" />
              Text
            </Button>
            <Button
              size="sm"
              variant={inputType === "image" ? "default" : "outline"}
              onClick={() => setInputType("image")}
            >
              <Upload className="h-4 w-4 mr-1" />
              Image
            </Button>
            <Button
              size="sm"
              variant={inputType === "draw" ? "default" : "outline"}
              onClick={() => setInputType("draw")}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Draw
            </Button>
          </div>
        </div>
      </div>

      <div className="w-96 border-l bg-sidebar overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Neon Tube Designer</h2>
            </div>
            <Button onClick={handleExport} disabled={isExporting} size="sm">
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

          {inputType === "text" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tube-text">Text</Label>
                  <Input
                    id="tube-text"
                    value={neonTubeSettings.text}
                    onChange={(e) => setNeonTubeSettings({ text: e.target.value })}
                    placeholder="Enter text..."
                    maxLength={200}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tube-font">Font</Label>
                  <Select
                    value={neonTubeSettings.fontId}
                    onValueChange={(value) => setNeonTubeSettings({ fontId: value })}
                  >
                    <SelectTrigger id="tube-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.id} value={font.id}>
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {inputType === "image" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Image Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {uploadedImageData && (
                  <img src={uploadedImageData} alt="Uploaded" className="mt-4 rounded border" />
                )}
              </CardContent>
            </Card>
          )}

          {inputType === "draw" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Freehand Drawing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Draw mode coming soon - will allow freehand tube paths
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tube Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tube Diameter: {neonTubeSettings.tubeDiameter}mm</Label>
                <Slider
                  value={[neonTubeSettings.tubeDiameter]}
                  onValueChange={([value]) => setNeonTubeSettings({ tubeDiameter: value })}
                  min={8}
                  max={25}
                  step={1}
                />
              </div>
              
              <div>
                <Label>Casing Thickness: {neonTubeSettings.casingThickness}mm</Label>
                <Slider
                  value={[neonTubeSettings.casingThickness]}
                  onValueChange={([value]) => setNeonTubeSettings({ casingThickness: value })}
                  min={2}
                  max={5}
                  step={0.5}
                />
              </div>
              
              <div>
                <Label>Scale: {neonTubeSettings.tubeScale}x</Label>
                <Slider
                  value={[neonTubeSettings.tubeScale]}
                  onValueChange={([value]) => setNeonTubeSettings({ tubeScale: value })}
                  min={0.5}
                  max={3}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interlocking System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="interlock-enabled">Enable Interlocking</Label>
                <Switch
                  id="interlock-enabled"
                  checked={neonTubeSettings.interlockEnabled}
                  onCheckedChange={(checked) => setNeonTubeSettings({ interlockEnabled: checked })}
                />
              </div>
              
              {neonTubeSettings.interlockEnabled && (
                <>
                  <div>
                    <Label>Segment Length: {neonTubeSettings.segmentLength}mm</Label>
                    <Slider
                      value={[neonTubeSettings.segmentLength]}
                      onValueChange={([value]) => setNeonTubeSettings({ segmentLength: value })}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="interlock-type">Connector Type</Label>
                    <Select
                      value={neonTubeSettings.interlockType}
                      onValueChange={(value: any) => setNeonTubeSettings({ interlockType: value })}
                    >
                      <SelectTrigger id="interlock-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="snap">Snap-Fit</SelectItem>
                        <SelectItem value="thread">Threaded</SelectItem>
                        <SelectItem value="friction">Friction Fit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Diffuser & Mounting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="separate-diffuser">Separate Diffuser</Label>
                <Switch
                  id="separate-diffuser"
                  checked={neonTubeSettings.separateDiffuser}
                  onCheckedChange={(checked) => setNeonTubeSettings({ separateDiffuser: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mounting-clips">Mounting Clips</Label>
                <Switch
                  id="mounting-clips"
                  checked={neonTubeSettings.mountingClipsEnabled}
                  onCheckedChange={(checked) => setNeonTubeSettings({ mountingClipsEnabled: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="end-cap-style">End Cap Style</Label>
                <Select
                  value={neonTubeSettings.endCapStyle}
                  onValueChange={(value: any) => setNeonTubeSettings({ endCapStyle: value })}
                >
                  <SelectTrigger id="end-cap-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="dome">Dome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
