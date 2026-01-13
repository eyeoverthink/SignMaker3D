import { Type, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fontOptions } from "@shared/schema";
import { useEditorStore } from "@/lib/editor-store";

export function TextControls() {
  const { letterSettings, setLetterSettings } = useEditorStore();

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Type className="h-4 w-4" />
          Text & Font
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-input" className="text-sm font-medium">
            Letter / Text
          </Label>
          <Input
            id="text-input"
            data-testid="input-text"
            value={letterSettings.text}
            onChange={(e) =>
              setLetterSettings({ text: e.target.value.slice(0, 10) })
            }
            placeholder="Enter letter(s)"
            className="font-mono text-lg h-12 text-center"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground text-right">
            {letterSettings.text.length}/10 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Style</Label>
          <Select
            value={letterSettings.fontId}
            onValueChange={(value) => setLetterSettings({ fontId: value })}
          >
            <SelectTrigger data-testid="select-font" className="h-10">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem
                  key={font.id}
                  value={font.id}
                  data-testid={`font-option-${font.id}`}
                >
                  <span style={{ fontFamily: font.family }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Depth</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {letterSettings.depth}mm
            </span>
          </div>
          <Slider
            data-testid="slider-depth"
            value={[letterSettings.depth]}
            onValueChange={([value]) => setLetterSettings({ depth: value })}
            min={5}
            max={100}
            step={1}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Scale</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {letterSettings.scale.toFixed(1)}x
            </span>
          </div>
          <Slider
            data-testid="slider-scale"
            value={[letterSettings.scale]}
            onValueChange={([value]) => setLetterSettings({ scale: value })}
            min={0.1}
            max={5}
            step={0.1}
            className="py-2"
          />
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="bevel-toggle" className="text-sm font-medium">
              Bevel Edges
            </Label>
            <Switch
              id="bevel-toggle"
              data-testid="switch-bevel"
              checked={letterSettings.bevelEnabled}
              onCheckedChange={(checked) =>
                setLetterSettings({ bevelEnabled: checked })
              }
            />
          </div>

          {letterSettings.bevelEnabled && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Bevel Thickness
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {letterSettings.bevelThickness}mm
                  </span>
                </div>
                <Slider
                  data-testid="slider-bevel-thickness"
                  value={[letterSettings.bevelThickness]}
                  onValueChange={([value]) =>
                    setLetterSettings({ bevelThickness: value })
                  }
                  min={0}
                  max={10}
                  step={0.5}
                  className="py-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Bevel Size
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {letterSettings.bevelSize}mm
                  </span>
                </div>
                <Slider
                  data-testid="slider-bevel-size"
                  value={[letterSettings.bevelSize]}
                  onValueChange={([value]) =>
                    setLetterSettings({ bevelSize: value })
                  }
                  min={0}
                  max={5}
                  step={0.25}
                  className="py-1"
                />
              </div>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() =>
            setLetterSettings({
              text: "A",
              fontId: "inter",
              depth: 20,
              scale: 1,
              bevelEnabled: true,
              bevelThickness: 2,
              bevelSize: 1,
            })
          }
          data-testid="button-reset-text"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset Defaults
        </Button>
      </CardContent>
    </Card>
  );
}
