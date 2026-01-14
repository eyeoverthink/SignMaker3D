import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dog, Lightbulb, Download, Loader2, Link2, Type } from "lucide-react";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { fontOptions } from "@shared/schema";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Center, Text } from "@react-three/drei";
import * as THREE from "three";

const fontFileMap: Record<string, string> = {
  "aerioz": "Aerioz-Demo.otf",
  "airstream": "Airstream.ttf",
  "beon": "Beon-Regular.otf",
  "cabinetch": "CabinSketch-Regular.ttf",
  "cocogoose": "Cocogoose-Classic-Light-Trial.ttf",
  "fatsans": "fatsansround.otf",
  "fresh": "FreshMarker-Regular.otf",
  "gasoek": "Gasoek-DoOne.ttf",
  "goodmood": "GoodMood-Script.otf",
  "inter": "Inter-Bold.ttf",
  "lobster": "Lobster-Regular.ttf",
  "monoton": "Monoton-Regular.ttf",
  "neoneon": "Neoneon-3zaD6.otf",
  "neonlight": "Neon-Light-Regular.otf",
  "neosans": "NeoSans-Black.otf",
  "pacifico": "Pacifico-Regular.ttf",
  "questrial": "Questrial-Regular.ttf",
  "righteous": "Righteous-Regular.ttf",
  "satisfy": "Satisfy-Regular.ttf",
  "sono": "Sono-SemiBold.ttf",
  "urban": "UrbanJungleBold-7pZ0.otf",
  "hershey-futural": "hershey-futural",
  "hershey-futuram": "hershey-futuram",
  "hershey-scripts": "hershey-scripts",
  "hershey-scriptc": "hershey-scriptc",
};

export function PetTagEditor() {
  const { petTagSettings, setPetTagSettings } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!petTagSettings.petName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a pet name before exporting",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/pet-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petTagSettings),
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
      a.download = `${petTagSettings.petName}_neon_tag.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const partCount = response.headers.get("X-Part-Count");
      toast({
        title: "Export complete",
        description: isMultiPart 
          ? `Downloaded ${partCount} parts: neon channel base + diffuser cap`
          : "Your neon pet tag STL has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to generate pet tag file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative bg-background">
        <PetTag3DPreview />
      </div>
      
      <div className="w-80 border-l bg-sidebar p-4 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Dog className="h-5 w-5" />
              Neon Pet Tags
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Mini neon signs for dog collars! Same U-channel system as text signs, scaled for pet tags with attachment loop.
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={isExporting}
            data-testid="button-export-pet-tag"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Generating..." : "Export Neon Tag"}
          </Button>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pet Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={petTagSettings.petName}
                onChange={(e) => setPetTagSettings({ petName: e.target.value })}
                placeholder="Enter pet name"
                maxLength={12}
                className="text-lg font-bold"
                data-testid="input-pet-name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {petTagSettings.petName.length}/12 characters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Font Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={petTagSettings.fontId}
                onValueChange={(value) => setPetTagSettings({ fontId: value })}
              >
                <SelectTrigger data-testid="select-pet-tag-font">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.slice(0, 12).map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Aerioz is recommended for neon-style signs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Channel Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Channel Width</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.ledChannelWidth}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.ledChannelWidth]}
                  onValueChange={([v]) => setPetTagSettings({ ledChannelWidth: v })}
                  min={4}
                  max={10}
                  step={1}
                  data-testid="slider-led-width"
                />
                <p className="text-xs text-muted-foreground">
                  Width of the LED/neon channel
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Wall Height</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.ledChannelDepth}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.ledChannelDepth]}
                  onValueChange={([v]) => setPetTagSettings({ ledChannelDepth: v })}
                  min={4}
                  max={12}
                  step={1}
                  data-testid="slider-led-depth"
                />
                <p className="text-xs text-muted-foreground">
                  Height of channel walls
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Attachment Loop
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Add Chain Loop</Label>
                <Switch
                  checked={petTagSettings.holeEnabled}
                  onCheckedChange={(v) => setPetTagSettings({ holeEnabled: v })}
                  data-testid="switch-hole"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Adds a sideways loop on the left side for attaching to collar or chain
              </p>
              {petTagSettings.holeEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Loop Inner Diameter</Label>
                    <span className="text-xs text-muted-foreground">{petTagSettings.holeDiameter}mm</span>
                  </div>
                  <Slider
                    value={[petTagSettings.holeDiameter]}
                    onValueChange={([v]) => setPetTagSettings({ holeDiameter: v })}
                    min={3}
                    max={8}
                    step={0.5}
                    data-testid="slider-hole-diameter"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Text Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Scale</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(petTagSettings.fontScale * 100)}%</span>
                </div>
                <Slider
                  value={[petTagSettings.fontScale]}
                  onValueChange={([v]) => setPetTagSettings({ fontScale: v })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  data-testid="slider-font-scale"
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Same U-channel system as regular neon signs</li>
              <li>Insert LED strip or neon tube into channels</li>
              <li>Snap on diffuser cap for even glow</li>
              <li>Attach to collar via the side loop</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PetTag3DPreview() {
  const { petTagSettings } = useEditorStore();
  const [fontLoaded, setFontLoaded] = useState(false);
  
  const fontUrl = `/fonts/${fontFileMap[petTagSettings.fontId] || "Aerioz-Demo.otf"}`;
  const text = petTagSettings.petName || "NAME";
  const scale = petTagSettings.fontScale || 1;
  const channelWidth = petTagSettings.ledChannelWidth || 6;
  const wallHeight = petTagSettings.ledChannelDepth || 8;
  
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          
          <Center>
            <PetTagMesh
              text={text}
              fontUrl={fontUrl}
              scale={scale}
              channelWidth={channelWidth}
              wallHeight={wallHeight}
              holeEnabled={petTagSettings.holeEnabled}
              holeDiameter={petTagSettings.holeDiameter}
              onFontLoad={() => setFontLoaded(true)}
            />
          </Center>
          
          <Environment preset="studio" />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
          />
        </Suspense>
      </Canvas>
      
      <div className="absolute bottom-4 left-4 text-xs text-white/60 bg-black/30 px-2 py-1 rounded">
        Drag to rotate, scroll to zoom
      </div>
      
      <div className="absolute top-4 left-4 text-xs text-white/60 bg-black/30 px-2 py-1 rounded">
        Channel: {channelWidth}mm × {wallHeight}mm
      </div>
    </div>
  );
}

interface PetTagMeshProps {
  text: string;
  fontUrl: string;
  scale: number;
  channelWidth: number;
  wallHeight: number;
  holeEnabled: boolean;
  holeDiameter: number;
  onFontLoad?: () => void;
}

function PetTagMesh({ text, fontUrl, scale, channelWidth, wallHeight, holeEnabled, holeDiameter, onFontLoad }: PetTagMeshProps) {
  const textRef = useRef<any>(null);
  const [textBounds, setTextBounds] = useState({ width: 0, height: 0 });
  
  const fontSize = 0.8 * scale;
  const channelScale = 0.02;
  const wallHeightScale = wallHeight * channelScale;
  const channelWidthScale = channelWidth * channelScale;
  
  useEffect(() => {
    if (textRef.current?.geometry) {
      textRef.current.geometry.computeBoundingBox();
      const box = textRef.current.geometry.boundingBox;
      if (box) {
        setTextBounds({
          width: box.max.x - box.min.x,
          height: box.max.y - box.min.y
        });
      }
    }
  }, [text, fontUrl, fontSize]);
  
  const loopGeometry = useMemo(() => {
    if (!holeEnabled) return null;
    
    const innerRadius = (holeDiameter / 2) * channelScale;
    const outerRadius = innerRadius + channelWidthScale;
    const segments = 32;
    
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
    
    const extrudeSettings = {
      depth: wallHeightScale,
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [holeEnabled, holeDiameter, channelWidthScale, wallHeightScale, channelScale]);
  
  const strutGeometry = useMemo(() => {
    if (!holeEnabled || textBounds.width === 0) return null;
    
    const innerRadius = (holeDiameter / 2) * channelScale;
    const outerRadius = innerRadius + channelWidthScale;
    const loopX = -textBounds.width / 2 - outerRadius - channelWidthScale;
    const strutWidth = Math.abs(loopX + outerRadius) - (-textBounds.width / 2 - channelWidthScale / 2);
    
    if (strutWidth <= 0) return null;
    
    const strutShape = new THREE.Shape();
    const halfWidth = channelWidthScale / 2;
    strutShape.moveTo(-strutWidth, -halfWidth);
    strutShape.lineTo(0, -halfWidth);
    strutShape.lineTo(0, halfWidth);
    strutShape.lineTo(-strutWidth, halfWidth);
    strutShape.closePath();
    
    return new THREE.ExtrudeGeometry(strutShape, {
      depth: wallHeightScale,
      bevelEnabled: false,
    });
  }, [holeEnabled, textBounds.width, holeDiameter, channelWidthScale, wallHeightScale, channelScale]);
  
  const loopX = useMemo(() => {
    if (!holeEnabled) return 0;
    const innerRadius = (holeDiameter / 2) * channelScale;
    const outerRadius = innerRadius + channelWidthScale;
    return -textBounds.width / 2 - outerRadius - channelWidthScale;
  }, [holeEnabled, textBounds.width, holeDiameter, channelWidthScale, channelScale]);
  
  return (
    <group>
      <Text
        ref={textRef}
        font={fontUrl}
        fontSize={fontSize}
        color="#333"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, wallHeightScale / 2]}
        outlineWidth={channelWidthScale}
        outlineColor="#1e3a5f"
        onSync={() => {
          if (textRef.current?.geometry) {
            textRef.current.geometry.computeBoundingBox();
            const box = textRef.current.geometry.boundingBox;
            if (box) {
              setTextBounds({
                width: box.max.x - box.min.x,
                height: box.max.y - box.min.y
              });
            }
          }
          onFontLoad?.();
        }}
      >
        {text}
      </Text>
      
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[textBounds.width + channelWidthScale * 2, textBounds.height + channelWidthScale * 2, 0.04]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {holeEnabled && loopGeometry && (
        <mesh geometry={loopGeometry} position={[loopX, 0, 0]}>
          <meshStandardMaterial color="#1e3a5f" metalness={0.2} roughness={0.6} />
        </mesh>
      )}
      
      {holeEnabled && strutGeometry && textBounds.width > 0 && (
        <mesh geometry={strutGeometry} position={[-textBounds.width / 2 - channelWidthScale / 2, 0, 0]}>
          <meshStandardMaterial color="#1e3a5f" metalness={0.2} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}
