import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { NeonShapesSettings } from "@shared/schema";
import { defaultNeonShapesSettings } from "@shared/schema";
import { neonShapes, neonShapeTypes, type NeonShapeType } from "@shared/neon-shapes";

export function NeonShapesEditor() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NeonShapesSettings>(defaultNeonShapesSettings);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "basic" | "icon" | "character">("all");

  const updateSetting = <K extends keyof NeonShapesSettings>(
    key: K,
    value: NeonShapesSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch("/api/export/neonshapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neon_${settings.shapeType}_${Date.now()}.stl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `${settings.shapeType} neon sign exported successfully!`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export neon sign",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentShape = neonShapes[settings.shapeType as NeonShapeType];
  const filteredShapes = neonShapeTypes.filter(
    (type) => selectedCategory === "all" || neonShapes[type].category === selectedCategory
  );

  return (
    <div className="h-full flex">
      {/* Left Panel - Shape Selection */}
      <div className="w-80 border-r bg-background overflow-y-auto">
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Neon Sign Designer</h2>
            <p className="text-sm text-muted-foreground">
              Create simple iconic neon signs with Edison bulb bases
            </p>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={(v: any) => setSelectedCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shapes</SelectItem>
                <SelectItem value="basic">Basic Shapes</SelectItem>
                <SelectItem value="icon">Icons</SelectItem>
                <SelectItem value="character">Characters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shape Grid */}
          <div className="space-y-2">
            <Label>Select Shape</Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredShapes.map((shapeType) => {
                const shape = neonShapes[shapeType];
                return (
                  <button
                    key={shapeType}
                    onClick={() => updateSetting("shapeType", shapeType)}
                    className={`
                      aspect-square rounded-lg border-2 p-2 transition-all
                      hover:border-primary hover:bg-accent
                      ${settings.shapeType === shapeType ? "border-primary bg-accent" : "border-border"}
                    `}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="-50 -50 100 100" className="w-full h-full">
                        {shape.paths.map((path, i) => (
                          <path
                            key={i}
                            d={`M ${path.points.map(p => `${p.x},${p.y}`).join(" L ")} ${path.closed ? "Z" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}
                      </svg>
                    </div>
                    <div className="text-xs text-center mt-1 truncate">{shape.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Settings and Preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Preview: {currentShape?.name}
              </CardTitle>
              <CardDescription>
                {currentShape?.category === "basic" && "Basic geometric shape"}
                {currentShape?.category === "icon" && "Iconic symbol"}
                {currentShape?.category === "character" && "Character outline"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center p-8">
                <svg viewBox="-60 -60 120 120" className="w-full h-full">
                  {/* Base */}
                  <ellipse
                    cx="0"
                    cy="55"
                    rx={settings.baseDiameter / 3}
                    ry={settings.baseDiameter / 6}
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  
                  {/* Neon Shape */}
                  {currentShape?.paths.map((path, i) => (
                    <path
                      key={i}
                      d={`M ${path.points.map(p => `${p.x * (settings.size / 100)},${p.y * (settings.size / 100)}`).join(" L ")} ${path.closed ? "Z" : ""}`}
                      fill="none"
                      stroke={i === 0 ? "#3b82f6" : i === 1 ? "#f59e0b" : "#ec4899"}
                      strokeWidth={settings.tubeDiameter / 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: "drop-shadow(0 0 8px currentColor)",
                      }}
                    />
                  ))}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Size Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Size & Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Sign Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.size}mm</span>
                </div>
                <Slider
                  value={[settings.size]}
                  onValueChange={([v]) => updateSetting("size", v)}
                  min={50}
                  max={300}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tube Diameter</Label>
                  <span className="text-sm text-muted-foreground">{settings.tubeDiameter}mm</span>
                </div>
                <Slider
                  value={[settings.tubeDiameter]}
                  onValueChange={([v]) => updateSetting("tubeDiameter", v)}
                  min={8}
                  max={25}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Base Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Edison Bulb Base</CardTitle>
              <CardDescription>Mounting base for the neon tube holder</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base Style</Label>
                <Select value={settings.baseStyle} onValueChange={(v: any) => updateSetting("baseStyle", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cylinder">Cylinder</SelectItem>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Base Diameter</Label>
                  <span className="text-sm text-muted-foreground">{settings.baseDiameter}mm</span>
                </div>
                <Slider
                  value={[settings.baseDiameter]}
                  onValueChange={([v]) => updateSetting("baseDiameter", v)}
                  min={40}
                  max={150}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Base Height</Label>
                  <span className="text-sm text-muted-foreground">{settings.baseHeight}mm</span>
                </div>
                <Slider
                  value={[settings.baseHeight]}
                  onValueChange={([v]) => updateSetting("baseHeight", v)}
                  min={10}
                  max={40}
                  step={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tube Holder Height</Label>
                  <span className="text-sm text-muted-foreground">{settings.tubeHolderHeight}mm</span>
                </div>
                <Slider
                  value={[settings.tubeHolderHeight]}
                  onValueChange={([v]) => updateSetting("tubeHolderHeight", v)}
                  min={20}
                  max={80}
                  step={5}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mounting-hole">Mounting Hole</Label>
                <Switch
                  id="mounting-hole"
                  checked={settings.mountingHole}
                  onCheckedChange={(v) => updateSetting("mountingHole", v)}
                />
              </div>

              {settings.mountingHole && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Hole Diameter</Label>
                    <span className="text-sm text-muted-foreground">{settings.mountingHoleDiameter}mm</span>
                  </div>
                  <Slider
                    value={[settings.mountingHoleDiameter]}
                    onValueChange={([v]) => updateSetting("mountingHoleDiameter", v)}
                    min={3}
                    max={10}
                    step={0.5}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* LED Settings */}
          <Card>
            <CardHeader>
              <CardTitle>LED Channel</CardTitle>
              <CardDescription>Internal channel for LED strip or filament</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="led-channel">LED Channel</Label>
                <Switch
                  id="led-channel"
                  checked={settings.ledChannel}
                  onCheckedChange={(v) => updateSetting("ledChannel", v)}
                />
              </div>

              {settings.ledChannel && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Channel Diameter</Label>
                    <span className="text-sm text-muted-foreground">{settings.ledChannelDiameter}mm</span>
                  </div>
                  <Slider
                    value={[settings.ledChannelDiameter]}
                    onValueChange={([v]) => updateSetting("ledChannelDiameter", v)}
                    min={3}
                    max={12}
                    step={0.5}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="multi-color">Multi-Color Support</Label>
                <Switch
                  id="multi-color"
                  checked={settings.multiColor}
                  onCheckedChange={(v) => updateSetting("multiColor", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export STL Files"}
          </Button>
        </div>
      </div>
    </div>
  );
}
