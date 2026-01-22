import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, CircleDot } from "lucide-react";

export default function YingYangDesigner() {
  const [diameter, setDiameter] = useState(200);
  const [depth, setDepth] = useState(30);
  const [wallThickness, setWallThickness] = useState(2);
  const [ledChannelWidth, setLedChannelWidth] = useState(8);
  const [splitDesign, setSplitDesign] = useState(true);
  const [dualColor, setDualColor] = useState(true);
  const [mountingType, setMountingType] = useState<"wall" | "stand" | "hanging">("wall");

  const handleExport = async () => {
    console.log("Exporting Ying-Yang design:", {
      diameter,
      depth,
      wallThickness,
      ledChannelWidth,
      splitDesign,
      dualColor,
      mountingType
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="w-5 h-5" />
            Ying-Yang Symbol Designer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dimensions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Dimensions</h3>
            
            <div>
              <Label>Diameter: {diameter}mm</Label>
              <Slider
                value={[diameter]}
                onValueChange={([v]) => setDiameter(v)}
                min={100}
                max={500}
                step={10}
              />
            </div>

            <div>
              <Label>Depth: {depth}mm</Label>
              <Slider
                value={[depth]}
                onValueChange={([v]) => setDepth(v)}
                min={10}
                max={80}
                step={5}
              />
            </div>

            <div>
              <Label>Wall Thickness: {wallThickness}mm</Label>
              <Slider
                value={[wallThickness]}
                onValueChange={([v]) => setWallThickness(v)}
                min={1}
                max={5}
                step={0.5}
              />
            </div>
          </div>

          {/* LED Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">LED Configuration</h3>
            
            <div>
              <Label>LED Channel Width</Label>
              <Select
                value={ledChannelWidth.toString()}
                onValueChange={(v) => setLedChannelWidth(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6mm (Thin Neon)</SelectItem>
                  <SelectItem value="8">8mm (Standard Neon)</SelectItem>
                  <SelectItem value="10">10mm (LED Strip)</SelectItem>
                  <SelectItem value="14">14mm (Wide Strip)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Dual Color LEDs (Yin/Yang)</Label>
              <Switch
                checked={dualColor}
                onCheckedChange={setDualColor}
              />
            </div>

            {dualColor && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                <p className="font-semibold mb-1">Dual Color Setup:</p>
                <p>• Yin (dark): White/Cool LEDs</p>
                <p>• Yang (light): Warm/Amber LEDs</p>
                <p>• Separate channels for independent control</p>
              </div>
            )}
          </div>

          {/* Design Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Design Options</h3>
            
            <div className="flex items-center justify-between">
              <Label>Split Design (Easy Assembly)</Label>
              <Switch
                checked={splitDesign}
                onCheckedChange={setSplitDesign}
              />
            </div>

            <div>
              <Label>Mounting Type</Label>
              <Select
                value={mountingType}
                onValueChange={(v: any) => setMountingType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wall">Wall Mount (Keyhole)</SelectItem>
                  <SelectItem value="stand">Stand Base</SelectItem>
                  <SelectItem value="hanging">Hanging (Wire Loop)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Symbol Details */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <h4 className="font-semibold mb-2">Ying-Yang Symbol Features:</h4>
            <ul className="text-sm space-y-1">
              <li>• Perfect circular balance with S-curve division</li>
              <li>• Two small circles (dots) for harmony</li>
              <li>• Integrated LED channels follow symbol contours</li>
              <li>• Optional dual-color for authentic representation</li>
              <li>• Snap-fit diffuser for clean finish</li>
            </ul>
          </div>

          {/* Export */}
          <Button onClick={handleExport} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Export Ying-Yang Sign
          </Button>

          <div className="text-xs text-gray-400">
            <p>Export includes:</p>
            <p>• Body shell with LED channels</p>
            <p>• Diffuser panel (flat or domed)</p>
            <p>• Mounting hardware</p>
            <p>• Assembly instructions</p>
            <p>• Wiring diagram for dual-color setup</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
