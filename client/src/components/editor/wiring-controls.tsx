import { Cable, Circle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { wiringChannelTypes, type WiringChannelType } from "@shared/schema";
import { useEditorStore } from "@/lib/editor-store";

const channelDescriptions: Record<WiringChannelType, string> = {
  none: "No wiring channel",
  center: "Channel runs through the center",
  back: "Channel on the back surface",
  custom: "Custom channel placement",
};

export function WiringControls() {
  const { wiringSettings, setWiringSettings } = useEditorStore();

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Cable className="h-4 w-4" />
          Wiring Channel
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Channel Type</Label>
          <Select
            value={wiringSettings.channelType}
            onValueChange={(value: WiringChannelType) =>
              setWiringSettings({ channelType: value })
            }
          >
            <SelectTrigger data-testid="select-channel-type" className="h-10">
              <SelectValue placeholder="Select channel type" />
            </SelectTrigger>
            <SelectContent>
              {wiringChannelTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  data-testid={`channel-option-${type}`}
                >
                  <div className="flex items-center gap-2">
                    <Circle
                      className={`h-2 w-2 ${
                        type === "none"
                          ? "text-muted-foreground"
                          : "text-primary fill-primary"
                      }`}
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {channelDescriptions[wiringSettings.channelType]}
          </p>
        </div>

        {wiringSettings.channelType !== "none" && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Channel Diameter</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {wiringSettings.channelDiameter}mm
                </span>
              </div>
              <Slider
                data-testid="slider-channel-diameter"
                value={[wiringSettings.channelDiameter]}
                onValueChange={([value]) =>
                  setWiringSettings({ channelDiameter: value })
                }
                min={3}
                max={20}
                step={0.5}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Fits wires up to{" "}
                {(wiringSettings.channelDiameter * 0.8).toFixed(1)}mm
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Channel Depth</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {wiringSettings.channelDepth}mm
                </span>
              </div>
              <Slider
                data-testid="slider-channel-depth"
                value={[wiringSettings.channelDepth]}
                onValueChange={([value]) =>
                  setWiringSettings({ channelDepth: value })
                }
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-start gap-2">
                <Cable className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    Wire Routing Tips
                  </p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>LED strips typically need 8-12mm channels</li>
                    <li>Neon flex usually requires 10-15mm</li>
                    <li>Leave extra room for connectors</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
