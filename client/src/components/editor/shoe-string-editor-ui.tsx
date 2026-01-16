import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Minus, Spline, Eraser, Undo2, Trash2, Upload, Download, Loader2, Sparkles } from "lucide-react";

interface ShoeStringEditorUIProps {
  tracingMode: 'auto' | 'manual';
  setTracingMode: (mode: 'auto' | 'manual') => void;
  activeTool: 'freehand' | 'line' | 'bezier' | 'pan';
  setActiveTool: (tool: 'freehand' | 'line' | 'bezier' | 'pan') => void;
  imageOpacity: number;
  setImageOpacity: (opacity: number) => void;
  tubeDiameter: number;
  setTubeDiameter: (diameter: number) => void;
  simplificationLevel: number;
  setSimplificationLevel: (level: number) => void;
  edgeThreshold: number;
  setEdgeThreshold: (threshold: number) => void;
  invertColors: boolean;
  setInvertColors: (invert: boolean) => void;
  isProcessing: boolean;
  isExporting: boolean;
  pathCount: number;
  onProcessImage: () => void;
  onExport: () => void;
  onUndo: () => void;
  onClear: () => void;
  onNewImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ShoeStringEditorUI({
  tracingMode,
  setTracingMode,
  activeTool,
  setActiveTool,
  imageOpacity,
  setImageOpacity,
  tubeDiameter,
  setTubeDiameter,
  simplificationLevel,
  setSimplificationLevel,
  edgeThreshold,
  setEdgeThreshold,
  invertColors,
  setInvertColors,
  isProcessing,
  isExporting,
  pathCount,
  onProcessImage,
  onExport,
  onUndo,
  onClear,
  onNewImage,
}: ShoeStringEditorUIProps) {
  return (
    <div className="w-96 border-l bg-sidebar overflow-y-auto">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Shoe String Mode</h2>
          </div>
          <Button onClick={onExport} disabled={isExporting || pathCount === 0} size="sm">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Export
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">About Shoe String Mode</CardTitle>
            <CardDescription className="text-xs">
              Trace iconic images into LED/neon tube paths. Upload a reference image and either auto-trace or manually draw stick figure paths.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={tracingMode} onValueChange={(v) => setTracingMode(v as 'auto' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Trace</TabsTrigger>
            <TabsTrigger value="auto">Auto Trace</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Drawing Tools</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={activeTool === 'freehand' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('freehand')}
                  className="flex flex-col h-auto py-3"
                >
                  <Pencil className="h-4 w-4 mb-1" />
                  <span className="text-xs">Freehand</span>
                </Button>
                <Button
                  variant={activeTool === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('line')}
                  className="flex flex-col h-auto py-3"
                >
                  <Minus className="h-4 w-4 mb-1" />
                  <span className="text-xs">Line</span>
                </Button>
                <Button
                  variant={activeTool === 'bezier' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('bezier')}
                  className="flex flex-col h-auto py-3"
                  disabled
                >
                  <Spline className="h-4 w-4 mb-1" />
                  <span className="text-xs">Curve</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Freehand:</strong> Click and drag to draw<br />
                <strong>Line:</strong> Click start, then click end
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Image Opacity</Label>
                <span className="text-xs text-muted-foreground">{Math.round(imageOpacity * 100)}%</span>
              </div>
              <Slider
                value={[imageOpacity]}
                onValueChange={([v]) => setImageOpacity(v)}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onUndo} className="flex-1">
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={onClear} className="flex-1">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-400">
                <strong>Manual Mode:</strong> Draw stick figure paths directly on the image. Perfect for creating simplified neon sign designs from complex images.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="auto" className="space-y-4 mt-4">
            <Button
              onClick={onProcessImage}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Trace Image
                </>
              )}
            </Button>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Edge Threshold</Label>
                <span className="text-xs text-muted-foreground">{edgeThreshold}</span>
              </div>
              <Slider
                value={[edgeThreshold]}
                onValueChange={([v]) => setEdgeThreshold(v)}
                min={50}
                max={200}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                Lower = more detail, Higher = simpler
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Simplification</Label>
                <span className="text-xs text-muted-foreground">{simplificationLevel}</span>
              </div>
              <Slider
                value={[simplificationLevel]}
                onValueChange={([v]) => setSimplificationLevel(v)}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
              <p className="text-xs text-orange-400">
                <strong>Auto Mode:</strong> Automatically extracts centerlines from the image. May produce too much detail - use Manual Mode for better control.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Tube Diameter</Label>
            <span className="text-xs text-muted-foreground">{tubeDiameter}mm</span>
          </div>
          <Slider
            value={[tubeDiameter]}
            onValueChange={([v]) => setTubeDiameter(v)}
            min={8}
            max={25}
            step={1}
          />
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={onNewImage}
            className="hidden"
            id="shoestring-new-image"
          />
          <label htmlFor="shoestring-new-image" className="flex-1">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                New Image
              </span>
            </Button>
          </label>
        </div>

        {pathCount > 0 && (
          <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
            <p className="text-xs text-green-400">
              <strong>{pathCount} paths</strong> ready to export
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
