import { Cylinder, Info, Zap, Lightbulb } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "@/lib/editor-store";

export function TubeControls() {
  const { tubeSettings, setTubeSettings, geometrySettings } = useEditorStore();

  if (geometrySettings.mode !== "outline") {
    return null;
  }

  const isFilament = tubeSettings.channelType === "filament";

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Cylinder className="h-4 w-4" />
          Tube Channel Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Light Type</Label>
          <Select
            value={tubeSettings.channelType}
            onValueChange={(value: "led_strip" | "filament") => {
              const updates: Partial<typeof tubeSettings> = { channelType: value };
              if (value === "filament") {
                updates.continuousPath = true;
              }
              setTubeSettings(updates);
            }}
          >
            <SelectTrigger data-testid="select-channel-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="led_strip">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>LED Strip (WS2812B)</span>
                </div>
              </SelectItem>
              <SelectItem value="filament">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-orange-400" />
                  <span>Filament / Neon String</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-muted/50 rounded-md border border-dashed">
          {isFilament ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-400">
                  Continuous Path
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Creates a circular tube that can be threaded with filament/neon string lighting. 
                The path connects all letters continuously for easy threading.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Rectangular channel for WS2812B LED strips (10-12mm wide, 3-5mm thick). 
              Each letter segment is separate for individual wiring.
            </p>
          )}
        </div>

        {isFilament ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Filament Diameter</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p className="text-xs">Circular channel diameter for filament/neon string (8-20mm typical)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {tubeSettings.filamentDiameter}mm
              </span>
            </div>
            <Slider
              data-testid="slider-filament-diameter"
              value={[tubeSettings.filamentDiameter]}
              onValueChange={([value]) => setTubeSettings({ filamentDiameter: value })}
              min={8}
              max={20}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              Match to your filament/neon tube outer diameter + 1-2mm clearance
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Channel Depth</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p className="text-xs">Interior depth for LED strips (15-30mm for most strips)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {tubeSettings.channelDepth}mm
                </span>
              </div>
              <Slider
                data-testid="slider-channel-depth"
                value={[tubeSettings.channelDepth]}
                onValueChange={([value]) => setTubeSettings({ channelDepth: value })}
                min={10}
                max={40}
                step={1}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Tube Width</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p className="text-xs">Overall width of the tube profile</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {tubeSettings.tubeWidth}mm
                </span>
              </div>
              <Slider
                data-testid="slider-tube-width"
                value={[tubeSettings.tubeWidth]}
                onValueChange={([value]) => setTubeSettings({ tubeWidth: value })}
                min={15}
                max={50}
                step={1}
                className="py-2"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Wall Thickness</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {tubeSettings.wallThickness}mm
            </span>
          </div>
          <Slider
            data-testid="slider-wall-thickness"
            value={[tubeSettings.wallThickness]}
            onValueChange={([value]) => setTubeSettings({ wallThickness: value })}
            min={1}
            max={5}
            step={0.5}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            {isFilament ? "Tube wall thickness" : "Barrier wall thickness on each side"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Wall Height</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {tubeSettings.wallHeight}mm
            </span>
          </div>
          <Slider
            data-testid="slider-wall-height"
            value={[tubeSettings.wallHeight]}
            onValueChange={([value]) => setTubeSettings({ wallHeight: value })}
            min={5}
            max={30}
            step={1}
            className="py-2"
          />
        </div>

        {isFilament && (
          <div className="p-3 bg-orange-500/10 rounded-md border border-orange-500/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-300">
                <strong>Threading Path:</strong> The tube follows a continuous path through all letters. 
                Entry and exit holes are generated at the ends for easy filament insertion.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="enable-overlay" className="text-sm font-medium">
                Generate Overlay Cap
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">Creates a separate piece to seal the tube channel (diffuser recommended)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="enable-overlay"
              data-testid="switch-enable-overlay"
              checked={tubeSettings.enableOverlay}
              onCheckedChange={(checked) => setTubeSettings({ enableOverlay: checked })}
            />
          </div>

          {tubeSettings.enableOverlay && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Overlay Thickness</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {tubeSettings.overlayThickness}mm
                </span>
              </div>
              <Slider
                data-testid="slider-overlay-thickness"
                value={[tubeSettings.overlayThickness]}
                onValueChange={([value]) => setTubeSettings({ overlayThickness: value })}
                min={1}
                max={5}
                step={0.5}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Print in diffuser/translucent material for best light spread
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
