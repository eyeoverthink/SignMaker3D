import { Download, FileBox, Loader2, Info, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportFormats, type ExportFormat } from "@shared/schema";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/hooks/use-toast";

const formatDescriptions: Record<ExportFormat, string> = {
  stl: "Most compatible with 3D printers",
  obj: "Good for editing in other software",
  "3mf": "Modern format with material info",
};

const geometryModeLabels: Record<string, string> = {
  raised: "Raised Letters",
  stencil: "Cut-Out Stencil",
  layered: "Layered Parts",
  flat: "Flat/Engraved",
};

export function ExportPanel() {
  const [format, setFormat] = useState<ExportFormat>("stl");
  const { letterSettings, geometrySettings, wiringSettings, mountingSettings, isExporting, setIsExporting } = useEditorStore();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!letterSettings.text) {
      toast({
        title: "No text to export",
        description: "Please enter at least one letter to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterSettings,
          geometrySettings,
          wiringSettings,
          mountingSettings,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${letterSettings.text.replace(/\s/g, "_")}_signage.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Your ${format.toUpperCase()} file has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const estimatedSize = Math.round(
    (letterSettings.text.length * letterSettings.depth * letterSettings.scale * 50) / 10
  );

  const estimatedPrintTime = Math.round(
    letterSettings.text.length * letterSettings.depth * letterSettings.scale * 0.3
  );

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <FileBox className="h-4 w-4" />
          Export
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">File Format</Label>
          <Select
            value={format}
            onValueChange={(value: ExportFormat) => setFormat(value)}
          >
            <SelectTrigger data-testid="select-format" className="h-10">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.map((fmt) => (
                <SelectItem
                  key={fmt}
                  value={fmt}
                  data-testid={`format-option-${fmt}`}
                >
                  <span className="uppercase font-mono">{fmt}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {formatDescriptions[format]}
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-md space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            Export Summary
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Geometry:</span>
              <Badge variant="secondary" className="text-[10px]">
                {geometryModeLabels[geometrySettings.mode]}
              </Badge>
            </div>
            
            {geometrySettings.separateFiles && (geometrySettings.mode === "layered" || geometrySettings.mode === "raised") && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Multi-part:</span>
                <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-400">
                  Separate files
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Letters:</span>
              <span className="font-mono">{geometrySettings.letterMaterial}</span>
            </div>
            
            {geometrySettings.mode !== "flat" && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Backing:</span>
                <span className="font-mono">{geometrySettings.backingMaterial}</span>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t border-muted-foreground/20">
            <div className="flex items-center gap-2 text-xs font-medium mb-1">
              <Info className="h-3 w-3 text-muted-foreground" />
              Estimates
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">File size:</span>
                <span className="ml-1 font-mono">~{estimatedSize}KB</span>
              </div>
              <div>
                <span className="text-muted-foreground">Print time:</span>
                <span className="ml-1 font-mono">~{estimatedPrintTime}min</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleExport}
          disabled={isExporting || !letterSettings.text}
          data-testid="button-export"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {format.toUpperCase()}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Ready for 3D printing or CNC machining
        </p>
      </CardContent>
    </Card>
  );
}
