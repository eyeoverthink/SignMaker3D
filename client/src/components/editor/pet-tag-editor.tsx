import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { petTagShapes, type PetTagShape } from "@shared/schema";
import { Dog, Heart, Circle, Square, Shield, PawPrint, Lightbulb, Sparkles, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const shapeIcons: Record<PetTagShape, typeof Dog> = {
  bone: Dog,
  round: Circle,
  heart: Heart,
  rectangle: Square,
  military: Shield,
  paw: PawPrint,
};

const shapeLabels: Record<PetTagShape, string> = {
  bone: "Bone",
  round: "Round",
  heart: "Heart",
  rectangle: "Rectangle",
  military: "Military",
  paw: "Paw Print",
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
      
      // Check if it's a multi-part export (zip) or single STL
      const isMultiPart = response.headers.get("X-Multi-Part-Export") === "true";
      const extension = isMultiPart ? "zip" : "stl";
      a.download = `${petTagSettings.petName}_${petTagSettings.tagShape}_mini_neon.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const partCount = response.headers.get("X-Part-Count");
      toast({
        title: "Export complete",
        description: isMultiPart 
          ? `Downloaded ${partCount} parts: base plate with neon letters + diffuser cap`
          : "Your pet tag STL has been downloaded",
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
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-8">
        <div className="relative">
          <PetTagPreview />
        </div>
      </div>
      
      <div className="w-80 border-l bg-sidebar p-4 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Dog className="h-5 w-5" />
              Mini Neon Pet Tags
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create illuminated pet tags with floating neon-style letters. Exports as 2-part system: base with U-channel letters + snap-fit diffuser cap.
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
            {isExporting ? "Generating..." : "Export 2-Part Mini Neon"}
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
                maxLength={20}
                className="text-lg font-bold"
                data-testid="input-pet-name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {petTagSettings.petName.length}/20 characters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tag Shape</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {petTagShapes.map((shape) => {
                  const Icon = shapeIcons[shape];
                  return (
                    <Button
                      key={shape}
                      variant={petTagSettings.tagShape === shape ? "default" : "outline"}
                      className="flex flex-col h-16 gap-1"
                      onClick={() => setPetTagSettings({ tagShape: shape })}
                      data-testid={`button-shape-${shape}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{shapeLabels[shape]}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tag Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Width</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.tagWidth}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.tagWidth]}
                  onValueChange={([v]) => setPetTagSettings({ tagWidth: v })}
                  min={20}
                  max={60}
                  step={1}
                  data-testid="slider-tag-width"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Height</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.tagHeight}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.tagHeight]}
                  onValueChange={([v]) => setPetTagSettings({ tagHeight: v })}
                  min={15}
                  max={50}
                  step={1}
                  data-testid="slider-tag-height"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Thickness</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.tagThickness}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.tagThickness]}
                  onValueChange={([v]) => setPetTagSettings({ tagThickness: v })}
                  min={2}
                  max={6}
                  step={0.5}
                  data-testid="slider-tag-thickness"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                LED Illumination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">LED Channel</Label>
                <Switch
                  checked={petTagSettings.ledChannelEnabled}
                  onCheckedChange={(v) => setPetTagSettings({ ledChannelEnabled: v })}
                  data-testid="switch-led-channel"
                />
              </div>
              {petTagSettings.ledChannelEnabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Channel Width</Label>
                      <span className="text-xs text-muted-foreground">{petTagSettings.ledChannelWidth}mm</span>
                    </div>
                    <Slider
                      value={[petTagSettings.ledChannelWidth]}
                      onValueChange={([v]) => setPetTagSettings({ ledChannelWidth: v })}
                      min={2}
                      max={6}
                      step={0.5}
                      data-testid="slider-led-width"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Channel Depth</Label>
                      <span className="text-xs text-muted-foreground">{petTagSettings.ledChannelDepth}mm</span>
                    </div>
                    <Slider
                      value={[petTagSettings.ledChannelDepth]}
                      onValueChange={([v]) => setPetTagSettings({ ledChannelDepth: v })}
                      min={1}
                      max={4}
                      step={0.5}
                      data-testid="slider-led-depth"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm">Glow-in-Dark</Label>
                </div>
                <Switch
                  checked={petTagSettings.glowInDark}
                  onCheckedChange={(v) => setPetTagSettings({ glowInDark: v })}
                  data-testid="switch-glow"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use glow-in-dark filament for passive visibility
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Attachment Hole</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Enable Hole</Label>
                <Switch
                  checked={petTagSettings.holeEnabled}
                  onCheckedChange={(v) => setPetTagSettings({ holeEnabled: v })}
                  data-testid="switch-hole"
                />
              </div>
              {petTagSettings.holeEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Hole Diameter</Label>
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
              <CardTitle className="text-sm">Text Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Text Size</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(petTagSettings.fontScale * 100)}%</span>
                </div>
                <Slider
                  value={[petTagSettings.fontScale]}
                  onValueChange={([v]) => setPetTagSettings({ fontScale: v })}
                  min={0.3}
                  max={1.5}
                  step={0.1}
                  data-testid="slider-font-scale"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PetTagPreview() {
  const { petTagSettings } = useEditorStore();
  const scale = 4; // Visual scale factor
  
  const width = petTagSettings.tagWidth * scale;
  const height = petTagSettings.tagHeight * scale;
  
  const getShapePath = () => {
    const w = width;
    const h = height;
    const cx = w / 2;
    const cy = h / 2;
    
    switch (petTagSettings.tagShape) {
      case "bone":
        const boneEnd = h * 0.35;
        return `
          M ${boneEnd} ${h * 0.3}
          C ${boneEnd * 0.3} ${h * 0.3}, 0 ${h * 0.15}, 0 ${cy}
          C 0 ${h * 0.85}, ${boneEnd * 0.3} ${h * 0.7}, ${boneEnd} ${h * 0.7}
          L ${w - boneEnd} ${h * 0.7}
          C ${w - boneEnd * 0.3} ${h * 0.7}, ${w} ${h * 0.85}, ${w} ${cy}
          C ${w} ${h * 0.15}, ${w - boneEnd * 0.3} ${h * 0.3}, ${w - boneEnd} ${h * 0.3}
          Z
        `;
      case "round":
        return `
          M ${cx + w/2} ${cy}
          A ${w/2} ${h/2} 0 1 1 ${cx - w/2} ${cy}
          A ${w/2} ${h/2} 0 1 1 ${cx + w/2} ${cy}
          Z
        `;
      case "heart":
        return `
          M ${cx} ${h * 0.85}
          C ${cx - w * 0.5} ${h * 0.5}, ${cx - w * 0.5} ${h * 0.2}, ${cx} ${h * 0.35}
          C ${cx + w * 0.5} ${h * 0.2}, ${cx + w * 0.5} ${h * 0.5}, ${cx} ${h * 0.85}
          Z
        `;
      case "rectangle":
        const r = 8;
        return `
          M ${r} 0
          L ${w - r} 0
          Q ${w} 0, ${w} ${r}
          L ${w} ${h - r}
          Q ${w} ${h}, ${w - r} ${h}
          L ${r} ${h}
          Q 0 ${h}, 0 ${h - r}
          L 0 ${r}
          Q 0 0, ${r} 0
          Z
        `;
      case "military":
        const mh = h * 0.15;
        return `
          M ${mh} 0
          L ${w - mh} 0
          L ${w} ${mh}
          L ${w} ${h - mh}
          L ${w - mh} ${h}
          L ${mh} ${h}
          L 0 ${h - mh}
          L 0 ${mh}
          Z
        `;
      case "paw":
        return `
          M ${cx} ${h * 0.9}
          C ${cx - w * 0.4} ${h * 0.7}, ${cx - w * 0.3} ${h * 0.4}, ${cx} ${h * 0.35}
          C ${cx + w * 0.3} ${h * 0.4}, ${cx + w * 0.4} ${h * 0.7}, ${cx} ${h * 0.9}
          Z
        `;
      default:
        return "";
    }
  };
  
  return (
    <div className="relative">
      <svg 
        width={width + 40} 
        height={height + 40} 
        viewBox={`-20 -20 ${width + 40} ${height + 40}`}
        className="drop-shadow-2xl"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="tagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={petTagSettings.glowInDark ? "#88ff88" : "#c0c0c0"} />
            <stop offset="100%" stopColor={petTagSettings.glowInDark ? "#44aa44" : "#808080"} />
          </linearGradient>
        </defs>
        
        <path
          d={getShapePath()}
          fill="url(#tagGradient)"
          stroke={petTagSettings.ledChannelEnabled ? "#00ff88" : "#666"}
          strokeWidth={petTagSettings.ledChannelEnabled ? 3 : 1}
          filter={petTagSettings.ledChannelEnabled ? "url(#glow)" : undefined}
        />
        
        {petTagSettings.holeEnabled && (
          <circle
            cx={width / 2}
            cy={15}
            r={petTagSettings.holeDiameter * scale / 2}
            fill="#333"
            stroke="#666"
            strokeWidth="1"
          />
        )}
        
        <text
          x={width / 2}
          y={height / 2 + (petTagSettings.holeEnabled ? 10 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14 * petTagSettings.fontScale * scale / 4}
          fontWeight="bold"
          fill={petTagSettings.ledChannelEnabled ? "#00ff88" : "#333"}
          filter={petTagSettings.ledChannelEnabled ? "url(#glow)" : undefined}
        >
          {petTagSettings.petName || "Name"}
        </text>
      </svg>
      
      <div className="text-center mt-4 text-sm text-muted-foreground">
        {petTagSettings.tagWidth}mm x {petTagSettings.tagHeight}mm x {petTagSettings.tagThickness}mm
      </div>
    </div>
  );
}
