import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { presetShapes, getShapesByCategory, type PresetShape } from "@shared/preset-shapes";
import { Sparkles, Layers } from "lucide-react";

// Parse SVG path data to points for extrusion
function parseSVGPath(pathData: string): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    
    switch (type.toUpperCase()) {
      case 'M':
        currentX = coords[0];
        currentY = coords[1];
        points.push(new THREE.Vector2(currentX, currentY));
        break;
      case 'L':
        currentX = coords[0];
        currentY = coords[1];
        points.push(new THREE.Vector2(currentX, currentY));
        break;
      case 'H':
        currentX = coords[0];
        points.push(new THREE.Vector2(currentX, currentY));
        break;
      case 'V':
        currentY = coords[0];
        points.push(new THREE.Vector2(currentX, currentY));
        break;
      case 'Z':
        if (points.length > 0) {
          points.push(points[0].clone());
        }
        break;
    }
  });
  
  return points;
}

function PresetShapePreview({ 
  preset, 
  depth, 
  includeDiffuser, 
  diffuserThickness, 
  diffuserOffset 
}: { 
  preset: PresetShape; 
  depth: number;
  includeDiffuser: boolean;
  diffuserThickness: number;
  diffuserOffset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const diffuserRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
    if (diffuserRef.current) {
      diffuserRef.current.rotation.y += 0.005;
    }
  });
  
  const geometry = (() => {
    try {
      const points = parseSVGPath(preset.pathData);
      if (points.length < 3) return new THREE.BoxGeometry(10, 10, depth);
      
      const shape = new THREE.Shape(points);
      const extrudeSettings = {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.5,
        bevelSegments: 3
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    } catch (error) {
      console.error('Error creating geometry:', error);
      return new THREE.BoxGeometry(10, 10, depth);
    }
  })();
  
  // Create diffuser cover geometry - wraps around the shape
  const diffuserGeometry = (() => {
    if (!includeDiffuser) return null;
    
    try {
      const points = parseSVGPath(preset.pathData);
      if (points.length < 3) return null;
      
      // Offset points outward to create wrap-around cover
      const offsetPoints = points.map(p => {
        const angle = Math.atan2(p.y, p.x);
        return new THREE.Vector2(
          p.x + Math.cos(angle) * diffuserOffset,
          p.y + Math.sin(angle) * diffuserOffset
        );
      });
      
      const shape = new THREE.Shape(offsetPoints);
      const extrudeSettings = {
        depth: depth + diffuserThickness * 2,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    } catch (error) {
      console.error('Error creating diffuser geometry:', error);
      return null;
    }
  })();
  
  return (
    <>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      
      {includeDiffuser && diffuserGeometry && (
        <mesh 
          ref={diffuserRef} 
          geometry={diffuserGeometry}
          position={[0, 0, -diffuserThickness]}
        >
          <meshStandardMaterial 
            color="#00ff88" 
            transparent 
            opacity={0.4}
            emissive="#00ff88" 
            emissiveIntensity={0.3} 
          />
        </mesh>
      )}
    </>
  );
}

export function PresetShapesEditor() {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [extrudeDepth, setExtrudeDepth] = useState<number>(15);
  const [includeDiffuser, setIncludeDiffuser] = useState<boolean>(true);
  const [diffuserThickness, setDiffuserThickness] = useState<number>(3);
  const [diffuserOffset, setDiffuserOffset] = useState<number>(5);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
  };

  const handleExport = async () => {
    if (!selectedPreset) return;
    
    const preset = presetShapes.find(p => p.id === selectedPreset);
    if (!preset) return;

    try {
      const response = await fetch('/api/export/preset-shape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: selectedPreset,
          extrudeDepth: extrudeDepth,
          wallThickness: 2,
          includeDiffuser: includeDiffuser,
          diffuserThickness: diffuserThickness,
          diffuserOffset: diffuserOffset
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preset_${selectedPreset}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export preset shape');
    }
  };

  const selectedShape = presetShapes.find(p => p.id === selectedPreset);

  return (
    <div className="flex h-full">
      {/* Left Panel - Controls */}
      <div className="w-96 border-r bg-sidebar p-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Preset Shapes
            </CardTitle>
            <CardDescription>
              Choose from 40+ iconic designs - retro tech, space, stick figures, emoji faces, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset-select">Select Shape</Label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger id="preset-select">
                  <SelectValue placeholder="Choose a preset shape..." />
                </SelectTrigger>
                <SelectContent>
                <SelectGroup>
                  <SelectLabel>✨ Icons & Symbols</SelectLabel>
                  {getShapesByCategory('icons').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🎮 Retro Tech</SelectLabel>
                  {getShapesByCategory('retro').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🪐 Space & Planets</SelectLabel>
                  {getShapesByCategory('space').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🍔 Food & Drink</SelectLabel>
                  {getShapesByCategory('food').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🎲 Games & Dice</SelectLabel>
                  {getShapesByCategory('games').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🕶️ Objects</SelectLabel>
                  {getShapesByCategory('objects').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🦖 Nature & Animals</SelectLabel>
                  {getShapesByCategory('nature').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🚶 Stick Figures</SelectLabel>
                  {getShapesByCategory('stickFigures').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>😊 Emoji Faces</SelectLabel>
                  {getShapesByCategory('emojiFaces').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedPreset && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {presetShapes.find(p => p.id === selectedPreset)?.description}
              </div>
              
              <div className="space-y-2">
                <Label>Extrude Depth: {extrudeDepth}mm</Label>
                <Slider
                  value={[extrudeDepth]}
                  onValueChange={(v) => setExtrudeDepth(v[0])}
                  min={5}
                  max={30}
                  step={1}
                />
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <Label>Diffuser Cover</Label>
                  </div>
                  <Switch
                    checked={includeDiffuser}
                    onCheckedChange={setIncludeDiffuser}
                  />
                </div>

                {includeDiffuser && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Cover Thickness: {diffuserThickness}mm</Label>
                      <Slider
                        value={[diffuserThickness]}
                        onValueChange={(v) => setDiffuserThickness(v[0])}
                        min={2}
                        max={6}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Gap/Offset: {diffuserOffset}mm</Label>
                      <Slider
                        value={[diffuserOffset]}
                        onValueChange={(v) => setDiffuserOffset(v[0])}
                        min={2}
                        max={10}
                        step={0.5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Space between shape and diffuser for LED strips
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <Button 
                onClick={handleExport} 
                className="w-full"
                size="lg"
              >
                Export STL
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro Tip:</strong> Enable diffuser cover to create a snug-fitting translucent shell perfect for WS2812B or nano LED strips!
            </p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Right Panel - 3D Preview */}
      <div className="flex-1 relative bg-background">
        {selectedShape ? (
          <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <PresetShapePreview 
              preset={selectedShape} 
              depth={extrudeDepth}
              includeDiffuser={includeDiffuser}
              diffuserThickness={diffuserThickness}
              diffuserOffset={diffuserOffset}
            />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <gridHelper args={[200, 20, '#444', '#222']} />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Select a preset shape to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
