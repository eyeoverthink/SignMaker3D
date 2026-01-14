import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dog, Lightbulb, Download, Loader2, Link2, Type } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fontOptions } from "@shared/schema";

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
      
      const isMultiPart = response.headers.get("X-Multi-Part-Export") === "true";
      const extension = isMultiPart ? "zip" : "stl";
      a.download = `${petTagSettings.petName}_neon_tag.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const partCount = response.headers.get("X-Part-Count");
      toast({
        title: "Export complete",
        description: isMultiPart 
          ? `Downloaded ${partCount} parts: neon channel base + diffuser cap`
          : "Your neon pet tag STL has been downloaded",
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
          <NeonTagPreview />
        </div>
      </div>
      
      <div className="w-80 border-l bg-sidebar p-4 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Dog className="h-5 w-5" />
              Neon Pet Tags
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Mini neon signs for dog collars! Same U-channel system as text signs, scaled for pet tags with attachment loop.
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
            {isExporting ? "Generating..." : "Export Neon Tag"}
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
                maxLength={12}
                className="text-lg font-bold"
                data-testid="input-pet-name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {petTagSettings.petName.length}/12 characters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Font Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={petTagSettings.fontId}
                onValueChange={(value) => setPetTagSettings({ fontId: value })}
              >
                <SelectTrigger data-testid="select-pet-tag-font">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.slice(0, 3).map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Aerioz is recommended for neon-style signs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Channel Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Channel Width</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.ledChannelWidth}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.ledChannelWidth]}
                  onValueChange={([v]) => setPetTagSettings({ ledChannelWidth: v })}
                  min={4}
                  max={10}
                  step={1}
                  data-testid="slider-led-width"
                />
                <p className="text-xs text-muted-foreground">
                  Width of the LED/neon channel
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Wall Height</Label>
                  <span className="text-xs text-muted-foreground">{petTagSettings.ledChannelDepth}mm</span>
                </div>
                <Slider
                  value={[petTagSettings.ledChannelDepth]}
                  onValueChange={([v]) => setPetTagSettings({ ledChannelDepth: v })}
                  min={4}
                  max={12}
                  step={1}
                  data-testid="slider-led-depth"
                />
                <p className="text-xs text-muted-foreground">
                  Height of channel walls
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Attachment Loop
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Add Chain Loop</Label>
                <Switch
                  checked={petTagSettings.holeEnabled}
                  onCheckedChange={(v) => setPetTagSettings({ holeEnabled: v })}
                  data-testid="switch-hole"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Adds a sideways loop on the left side for attaching to collar or chain
              </p>
              {petTagSettings.holeEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Loop Inner Diameter</Label>
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
              <CardTitle className="text-sm">Text Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Scale</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(petTagSettings.fontScale * 100)}%</span>
                </div>
                <Slider
                  value={[petTagSettings.fontScale]}
                  onValueChange={([v]) => setPetTagSettings({ fontScale: v })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  data-testid="slider-font-scale"
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Same U-channel system as regular neon signs</li>
              <li>Insert LED strip or neon tube into channels</li>
              <li>Snap on diffuser cap for even glow</li>
              <li>Attach to collar via the side loop</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function NeonTagPreview() {
  const { petTagSettings } = useEditorStore();
  
  const text = petTagSettings.petName || "NAME";
  const fontSize = 32 * petTagSettings.fontScale;
  const channelWidth = petTagSettings.ledChannelWidth;
  
  const textWidth = text.length * fontSize * 0.6;
  const textHeight = fontSize * 1.2;
  
  const loopSize = petTagSettings.holeEnabled ? channelWidth + petTagSettings.holeDiameter : 0;
  const totalWidth = textWidth + loopSize + 40;
  const totalHeight = textHeight + channelWidth * 2 + 40;
  
  return (
    <div className="relative">
      <svg 
        width={Math.max(300, totalWidth)} 
        height={Math.max(150, totalHeight)} 
        viewBox={`0 0 ${Math.max(300, totalWidth)} ${Math.max(150, totalHeight)}`}
        className="drop-shadow-2xl"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g transform={`translate(${totalWidth/2}, ${totalHeight/2})`}>
          {petTagSettings.holeEnabled && (
            <g transform={`translate(${-textWidth/2 - loopSize/2 - 5}, 0)`}>
              <circle
                cx="0"
                cy="0"
                r={(channelWidth + petTagSettings.holeDiameter) / 2}
                fill="none"
                stroke="#00ff88"
                strokeWidth={channelWidth}
                filter="url(#glow)"
                opacity="0.9"
              />
              <circle
                cx="0"
                cy="0"
                r={(channelWidth + petTagSettings.holeDiameter) / 2}
                fill="none"
                stroke="#ffffff"
                strokeWidth={channelWidth * 0.4}
                filter="url(#innerGlow)"
              />
            </g>
          )}
          
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight="bold"
            fontFamily="monospace"
            fill="none"
            stroke="#00ff88"
            strokeWidth={channelWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#glow)"
          >
            {text}
          </text>
          
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight="bold"
            fontFamily="monospace"
            fill="none"
            stroke="#ffffff"
            strokeWidth={channelWidth * 0.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#innerGlow)"
          >
            {text}
          </text>
        </g>
      </svg>
      
      <div className="text-center mt-4 text-sm text-muted-foreground">
        Channel: {channelWidth}mm wide, {petTagSettings.ledChannelDepth}mm tall
      </div>
    </div>
  );
}
