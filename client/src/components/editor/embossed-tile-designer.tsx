/**
 * EMBOSSED LIGHT TILE DESIGNER
 * UI for creating modular 3D printed light tiles with embossed patterns
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Lightbulb, Layers } from "lucide-react";

interface EmbossedTileSettings {
  tileDiameter: number;
  tileHeight: number;
  wallThickness: number;
  patternType: "egg" | "gears" | "heart" | "star" | "custom" | "text";
  patternStyle: "embossed" | "engraved";
  patternDepth: number;
  patternScale: number;
  customText?: string;
  channelType: "ring" | "spiral" | "grid" | "custom";
  channelWidth: number;
  channelDepth: number;
  diffuserStyle: "flat" | "domed" | "conical";
  diffuserThickness: number;
  diffuserHeight: number;
  snapFit: boolean;
  includeMountingHoles: boolean;
  mountingHoleCount: number;
  mountingHoleDiameter: number;
  exportFormat: "stl" | "3mf";
  separateParts: boolean;
}

export function EmbossedTileDesigner() {
  const [settings, setSettings] = useState<EmbossedTileSettings>({
    tileDiameter: 80,
    tileHeight: 10,
    wallThickness: 2,
    patternType: "egg",
    patternStyle: "embossed",
    patternDepth: 1.5,
    patternScale: 0.7,
    channelType: "ring",
    channelWidth: 10.5,
    channelDepth: 3,
    diffuserStyle: "domed",
    diffuserThickness: 1.2,
    diffuserHeight: 5,
    snapFit: true,
    includeMountingHoles: true,
    mountingHoleCount: 3,
    mountingHoleDiameter: 3,
    exportFormat: "stl",
    separateParts: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-embossed-tile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Embossed_Tile_${settings.patternType}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to generate embossed tile:", error);
      alert("Failed to generate embossed tile. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-8 h-8 text-yellow-500" />
        <div>
          <h2 className="text-2xl font-bold">Embossed Light Tile Designer</h2>
          <p className="text-sm text-muted-foreground">
            Create modular 3D printed light tiles with embossed patterns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tile Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Tile Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tile Diameter: {settings.tileDiameter}mm</Label>
              <Slider
                value={[settings.tileDiameter]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, tileDiameter: value })
                }
                min={30}
                max={150}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Tile Height: {settings.tileHeight}mm</Label>
              <Slider
                value={[settings.tileHeight]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, tileHeight: value })
                }
                min={5}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Wall Thickness: {settings.wallThickness}mm</Label>
              <Slider
                value={[settings.wallThickness]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, wallThickness: value })
                }
                min={1.5}
                max={4}
                step={0.5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pattern Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pattern Type</Label>
              <Select
                value={settings.patternType}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, patternType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="egg">🥚 Egg</SelectItem>
                  <SelectItem value="gears">⚙️ Gears</SelectItem>
                  <SelectItem value="heart">❤️ Heart</SelectItem>
                  <SelectItem value="star">⭐ Star</SelectItem>
                  <SelectItem value="text">📝 Text</SelectItem>
                  <SelectItem value="custom">🎨 Custom SVG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.patternType === "text" && (
              <div className="space-y-2">
                <Label>Custom Text</Label>
                <Input
                  value={settings.customText || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, customText: e.target.value })
                  }
                  placeholder="Enter text..."
                  maxLength={10}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Pattern Style</Label>
              <Select
                value={settings.patternStyle}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, patternStyle: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="embossed">Embossed (Raised)</SelectItem>
                  <SelectItem value="engraved">Engraved (Recessed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pattern Depth: {settings.patternDepth}mm</Label>
              <Slider
                value={[settings.patternDepth]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, patternDepth: value })
                }
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Pattern Scale: {(settings.patternScale * 100).toFixed(0)}%</Label>
              <Slider
                value={[settings.patternScale]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, patternScale: value })
                }
                min={0.3}
                max={1.0}
                step={0.05}
              />
            </div>
          </CardContent>
        </Card>

        {/* LED Channel */}
        <Card>
          <CardHeader>
            <CardTitle>LED Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Channel Type</Label>
              <Select
                value={settings.channelType}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, channelType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ring">Ring (Circular)</SelectItem>
                  <SelectItem value="spiral">Spiral</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="custom">Custom Path</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel Width</Label>
              <Select
                value={settings.channelWidth.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, channelWidth: parseFloat(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6mm (5mm LED strip)</SelectItem>
                  <SelectItem value="8">8mm (Standard strip)</SelectItem>
                  <SelectItem value="10.5">10.5mm (WS2812B strip)</SelectItem>
                  <SelectItem value="14">14mm (Wide strip)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel Depth: {settings.channelDepth}mm</Label>
              <Slider
                value={[settings.channelDepth]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, channelDepth: value })
                }
                min={2}
                max={5}
                step={0.5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diffuser Lid */}
        <Card>
          <CardHeader>
            <CardTitle>Diffuser Lid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Diffuser Style</Label>
              <Select
                value={settings.diffuserStyle}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, diffuserStyle: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="domed">Domed</SelectItem>
                  <SelectItem value="conical">Conical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Diffuser Thickness: {settings.diffuserThickness}mm</Label>
              <Slider
                value={[settings.diffuserThickness]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, diffuserThickness: value })
                }
                min={0.8}
                max={2}
                step={0.1}
              />
            </div>

            {settings.diffuserStyle !== "flat" && (
              <div className="space-y-2">
                <Label>Diffuser Height: {settings.diffuserHeight}mm</Label>
                <Slider
                  value={[settings.diffuserHeight]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, diffuserHeight: value })
                  }
                  min={3}
                  max={15}
                  step={1}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Snap-Fit Tabs</Label>
              <Switch
                checked={settings.snapFit}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, snapFit: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Mounting Options */}
        <Card>
          <CardHeader>
            <CardTitle>Mounting Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Include Mounting Holes</Label>
              <Switch
                checked={settings.includeMountingHoles}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, includeMountingHoles: checked })
                }
              />
            </div>

            {settings.includeMountingHoles && (
              <>
                <div className="space-y-2">
                  <Label>Hole Count: {settings.mountingHoleCount}</Label>
                  <Slider
                    value={[settings.mountingHoleCount]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, mountingHoleCount: value })
                    }
                    min={2}
                    max={4}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hole Diameter: {settings.mountingHoleDiameter}mm</Label>
                  <Slider
                    value={[settings.mountingHoleDiameter]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, mountingHoleDiameter: value })
                    }
                    min={2.5}
                    max={5}
                    step={0.5}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={settings.exportFormat}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, exportFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stl">STL</SelectItem>
                  <SelectItem value="3mf">3MF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Separate Parts (Base + Lid)</Label>
              <Switch
                checked={settings.separateParts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, separateParts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            {isGenerating ? "Generating..." : "Generate Embossed Light Tile"}
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Exports: Base tile with {settings.patternType} pattern, diffuser lid, assembly instructions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
