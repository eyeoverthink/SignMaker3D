import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { backingPlateShapes, holePatterns } from "@shared/schema";

function BackingPlatePreview() {
  const { backingPlateSettings } = useEditorStore();
  const { shape, width, height, thickness, cornerRadius, holePattern, holeDiameter, holeInset, gridSpacing } = backingPlateSettings;
  
  let w = width * 0.01;
  let h = height * 0.01;
  const t = thickness * 0.01;
  const holeR = (holeDiameter / 2) * 0.01;
  
  // Adjust dimensions for square and circle
  if (shape === "square") {
    const size = Math.max(width, height);
    w = size * 0.01;
    h = size * 0.01;
  } else if (shape === "circle") {
    const diameter = Math.max(width, height);
    w = diameter * 0.01;
    h = diameter * 0.01;
  }
  
  // Calculate hole positions based on pattern
  const holes: [number, number][] = [];
  
  if (holePattern === "corners") {
    const inset = holeInset * 0.01;
    holes.push(
      [-w/2 + inset, h/2 - inset],
      [w/2 - inset, h/2 - inset],
      [-w/2 + inset, -h/2 + inset],
      [w/2 - inset, -h/2 + inset]
    );
  } else if (holePattern === "grid") {
    const spacing = gridSpacing * 0.01;
    const inset = holeInset * 0.01;
    for (let x = -w/2 + inset; x <= w/2 - inset; x += spacing) {
      for (let y = -h/2 + inset; y <= h/2 - inset; y += spacing) {
        holes.push([x, y]);
      }
    }
  } else if (holePattern === "perimeter") {
    const spacing = gridSpacing * 0.01;
    const inset = holeInset * 0.01;
    // Top and bottom edges
    for (let x = -w/2 + inset; x <= w/2 - inset; x += spacing) {
      holes.push([x, h/2 - inset]);
      holes.push([x, -h/2 + inset]);
    }
    // Left and right edges
    for (let y = -h/2 + inset + spacing; y <= h/2 - inset - spacing; y += spacing) {
      holes.push([-w/2 + inset, y]);
      holes.push([w/2 - inset, y]);
    }
  }
  
  return (
    <group>
      {/* Main plate - render based on shape */}
      {shape === "circle" ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[w/2, w/2, t, 32]} />
          <meshStandardMaterial 
            color="#3b82f6"
            metalness={0.2}
            roughness={0.4}
          />
        </mesh>
      ) : (
        <RoundedBox
          args={[w, h, t]}
          radius={shape === "rounded-rect" ? cornerRadius * 0.01 : 0.02}
          smoothness={4}
        >
          <meshStandardMaterial 
            color="#3b82f6"
            metalness={0.2}
            roughness={0.4}
          />
        </RoundedBox>
      )}
      
      {/* Mounting holes */}
      {holes.map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[holeR, holeR, t + 0.02, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
    </group>
  );
}

export function BackingPlateEditor() {
  const { backingPlateSettings, setBackingPlateSettings } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/backing-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backingPlateSettings),
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backing_plate_${backingPlateSettings.width}x${backingPlateSettings.height}mm.stl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Backing plate STL downloaded",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not generate backing plate",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="flex-1 flex">
      {/* 3D Preview */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <color attach="background" args={["#18181b"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          
          <BackingPlatePreview />
          <OrbitControls />
        </Canvas>
        
        {/* Dimensions overlay */}
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-zinc-700 rounded-md px-3 py-2 text-sm font-mono text-zinc-100">
          <span className="text-zinc-400">W:</span>{" "}
          <span className="text-blue-400">{backingPlateSettings.width}mm</span>
          <span className="mx-2 text-zinc-600">|</span>
          <span className="text-zinc-400">H:</span>{" "}
          <span className="text-blue-400">{backingPlateSettings.height}mm</span>
          <span className="mx-2 text-zinc-600">|</span>
          <span className="text-zinc-400">T:</span>{" "}
          <span className="text-blue-400">{backingPlateSettings.thickness}mm</span>
        </div>
      </div>
      
      {/* Settings Panel */}
      <div className="w-80 border-l bg-sidebar p-4 overflow-y-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Backing Plate Designer</CardTitle>
            <CardDescription>Create mounting plates for your neon signs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Shape</Label>
              <Select
                value={backingPlateSettings.shape}
                onValueChange={(value) => setBackingPlateSettings({ shape: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {backingPlateShapes.map((shape) => (
                    <SelectItem key={shape} value={shape}>
                      {shape.charAt(0).toUpperCase() + shape.slice(1).replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Width: {backingPlateSettings.width}mm</Label>
              <Slider
                value={[backingPlateSettings.width]}
                onValueChange={([value]) => setBackingPlateSettings({ width: value })}
                min={50}
                max={500}
                step={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Height: {backingPlateSettings.height}mm</Label>
              <Slider
                value={[backingPlateSettings.height]}
                onValueChange={([value]) => setBackingPlateSettings({ height: value })}
                min={50}
                max={500}
                step={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Thickness: {backingPlateSettings.thickness}mm</Label>
              <Slider
                value={[backingPlateSettings.thickness]}
                onValueChange={([value]) => setBackingPlateSettings({ thickness: value })}
                min={2}
                max={10}
                step={0.5}
              />
            </div>
            
            {backingPlateSettings.shape === "rounded-rect" && (
              <div className="space-y-2">
                <Label>Corner Radius: {backingPlateSettings.cornerRadius}mm</Label>
                <Slider
                  value={[backingPlateSettings.cornerRadius]}
                  onValueChange={([value]) => setBackingPlateSettings({ cornerRadius: value })}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Mounting Holes</CardTitle>
            <CardDescription>Add holes for feeding lights through</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hole Pattern</Label>
              <Select
                value={backingPlateSettings.holePattern}
                onValueChange={(value) => setBackingPlateSettings({ holePattern: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {holePatterns.map((pattern) => (
                    <SelectItem key={pattern} value={pattern}>
                      {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {backingPlateSettings.holePattern !== "none" && (
              <>
                <div className="space-y-2">
                  <Label>Hole Diameter: {backingPlateSettings.holeDiameter}mm</Label>
                  <Slider
                    value={[backingPlateSettings.holeDiameter]}
                    onValueChange={([value]) => setBackingPlateSettings({ holeDiameter: value })}
                    min={3}
                    max={15}
                    step={0.5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Hole Inset: {backingPlateSettings.holeInset}mm</Label>
                  <Slider
                    value={[backingPlateSettings.holeInset]}
                    onValueChange={([value]) => setBackingPlateSettings({ holeInset: value })}
                    min={5}
                    max={50}
                    step={1}
                  />
                </div>
                
                {(backingPlateSettings.holePattern === "grid" || backingPlateSettings.holePattern === "perimeter") && (
                  <div className="space-y-2">
                    <Label>Hole Spacing: {backingPlateSettings.gridSpacing}mm</Label>
                    <Slider
                      value={[backingPlateSettings.gridSpacing]}
                      onValueChange={([value]) => setBackingPlateSettings({ gridSpacing: value })}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Generating..." : "Export STL"}
        </Button>
      </div>
    </div>
  );
}
