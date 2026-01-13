import { useEditorStore } from "@/lib/editor-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { fontOptions } from "@shared/schema";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export function SettingsPanel() {
  const {
    inputMode,
    letterSettings,
    setLetterSettings,
    tubeSettings,
    setTubeSettings,
    twoPartSystem,
    setTwoPartSystem,
    setUploadedImageData,
  } = useEditorStore();

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [setUploadedImageData]);

  const isFilament = tubeSettings.channelType === "filament";

  return (
    <div className="w-72 border-l bg-sidebar flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Settings</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure your neon sign
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {inputMode === "text" && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Text Input</h3>
              
              <div className="space-y-2">
                <Label>Your Text</Label>
                <Input
                  value={letterSettings.text}
                  onChange={(e) => setLetterSettings({ text: e.target.value })}
                  placeholder="Type here..."
                  data-testid="input-text"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter any text - no character limit
                </p>
              </div>

              <div className="space-y-2">
                <Label>Font Style</Label>
                <Select
                  value={letterSettings.fontId}
                  onValueChange={(value) => setLetterSettings({ fontId: value })}
                >
                  <SelectTrigger data-testid="select-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.id} value={font.id}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Size</Label>
                  <span className="text-xs text-muted-foreground">{letterSettings.scale.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[letterSettings.scale]}
                  onValueChange={([v]) => setLetterSettings({ scale: v })}
                  min={0.5}
                  max={3}
                  step={0.1}
                  data-testid="slider-scale"
                />
              </div>
            </section>
          )}

          {inputMode === "image" && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Image Upload</h3>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload handwriting or drawing
                </p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-image-upload"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>Choose Image</span>
                  </Button>
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Your image will be traced into bubble letter style paths
              </p>
            </section>
          )}

          {inputMode === "draw" && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Drawing Tools</h3>
              <p className="text-sm text-muted-foreground">
                Draw directly on the canvas. Your strokes will become neon tube paths.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => useEditorStore.getState().setSketchPaths([])}
                data-testid="button-clear-drawing"
              >
                Clear Drawing
              </Button>
            </section>
          )}

          <Separator />

          <section className="space-y-4">
            <h3 className="text-sm font-medium">Tube Settings</h3>
            
            <div className="space-y-2">
              <Label>Light Type</Label>
              <Select
                value={tubeSettings.channelType}
                onValueChange={(value: "led_strip" | "filament") => 
                  setTubeSettings({ channelType: value })
                }
              >
                <SelectTrigger data-testid="select-channel-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="led_strip">LED Strip (rectangular)</SelectItem>
                  <SelectItem value="filament">Neon/Filament (circular)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFilament ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tube Diameter</Label>
                  <span className="text-xs text-muted-foreground">{tubeSettings.filamentDiameter}mm</span>
                </div>
                <Slider
                  value={[tubeSettings.filamentDiameter]}
                  onValueChange={([v]) => setTubeSettings({ filamentDiameter: v })}
                  min={8}
                  max={20}
                  step={1}
                  data-testid="slider-filament-diameter"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Channel Width</Label>
                  <span className="text-xs text-muted-foreground">{tubeSettings.tubeWidth}mm</span>
                </div>
                <Slider
                  value={[tubeSettings.tubeWidth]}
                  onValueChange={([v]) => setTubeSettings({ tubeWidth: v })}
                  min={15}
                  max={50}
                  step={1}
                  data-testid="slider-tube-width"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Wall Thickness</Label>
                <span className="text-xs text-muted-foreground">{tubeSettings.wallThickness}mm</span>
              </div>
              <Slider
                value={[tubeSettings.wallThickness]}
                onValueChange={([v]) => setTubeSettings({ wallThickness: v })}
                min={1}
                max={5}
                step={0.5}
                data-testid="slider-wall-thickness"
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">2-Part System</h3>
              <Switch
                checked={twoPartSystem.enabled}
                onCheckedChange={(checked) => setTwoPartSystem({ enabled: checked })}
                data-testid="switch-two-part"
              />
            </div>
            
            {twoPartSystem.enabled && (
              <>
                <p className="text-xs text-muted-foreground">
                  Base holds the light with walls on both sides. Cap snaps on top as diffuser.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Base Wall Height</Label>
                    <span className="text-xs text-muted-foreground">{twoPartSystem.baseWallHeight}mm</span>
                  </div>
                  <Slider
                    value={[twoPartSystem.baseWallHeight]}
                    onValueChange={([v]) => setTwoPartSystem({ baseWallHeight: v })}
                    min={5}
                    max={40}
                    step={1}
                    data-testid="slider-base-wall-height"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Cap Thickness</Label>
                    <span className="text-xs text-muted-foreground">{twoPartSystem.capThickness}mm</span>
                  </div>
                  <Slider
                    value={[twoPartSystem.capThickness]}
                    onValueChange={([v]) => setTwoPartSystem({ capThickness: v })}
                    min={1}
                    max={5}
                    step={0.5}
                    data-testid="slider-cap-thickness"
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
