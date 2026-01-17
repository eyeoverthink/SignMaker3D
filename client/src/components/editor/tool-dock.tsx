import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Type, Pencil, Image, Eye, EyeOff, Dog, Hexagon, Zap, Square, Sparkles, Heart, Lightbulb, Layers, Cable, Egg, Mountain, Lamp } from "lucide-react";
import type { InputMode } from "@shared/schema";

export function ToolDock() {
  const { inputMode, setInputMode, showGrid, setShowGrid } = useEditorStore();

  const modes: { id: InputMode; icon: typeof Type; label: string; description: string }[] = [
    { id: "text", icon: Type, label: "Text", description: "Create neon text signs" },
    { id: "draw", icon: Pencil, label: "Draw", description: "Freehand neon tubes" },
    { id: "image", icon: Image, label: "Bubble", description: "Bubble letter style from images" },
    { id: "shoestring", icon: Sparkles, label: "Shoestring", description: "Pop culture image tracer" },
    { id: "relief", icon: Mountain, label: "2.5D Relief", description: "Embossed/engraved surfaces with LED channels" },
    { id: "lithophane", icon: Lamp, label: "Lithophane", description: "Backlit 3D image panels for streamers" },
    { id: "presets", icon: Sparkles, label: "Presets", description: "40+ iconic shapes - retro, emoji, stick figures" },
    { id: "custom", icon: Layers, label: "Custom", description: "Custom LED tube shapes" },
    { id: "retro", icon: Lightbulb, label: "Edison", description: "Edison bulbs & retro neon" },
    { id: "eggison", icon: Egg, label: "Eggison", description: "DIY light bulb shells with shaped filaments" },
    { id: "ledholder", icon: Cable, label: "LED Holder", description: "LED mounting holders" },
    { id: "neonshapes", icon: Heart, label: "Neon Shapes", description: "Iconic shapes with Edison bases" },
    { id: "pettag", icon: Dog, label: "Pet Tags", description: "Illuminated dog tags" },
    { id: "modular", icon: Hexagon, label: "Panels", description: "Modular light panels" },
    { id: "neontube", icon: Zap, label: "Neon Tubes", description: "Realistic tube casings" },
    { id: "backingplate", icon: Square, label: "Backing Plates", description: "Mounting plates with holes" },
  ];

  return (
    <div className="w-16 border-r bg-sidebar flex flex-col items-center py-4 gap-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">Input</div>
      
      {modes.map((mode) => (
        <Tooltip key={mode.id}>
          <TooltipTrigger asChild>
            <Button
              variant={inputMode === mode.id ? "default" : "ghost"}
              size="icon"
              onClick={() => setInputMode(mode.id)}
              data-testid={`button-mode-${mode.id}`}
              className="w-10 h-10"
            >
              <mode.icon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{mode.label}</p>
            <p className="text-xs text-muted-foreground">{mode.description}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="flex-1" />

      <div className="text-xs font-medium text-muted-foreground mb-2">View</div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showGrid ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
            data-testid="button-toggle-grid"
            className="w-10 h-10"
          >
            {showGrid ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{showGrid ? "Hide Grid" : "Show Grid"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
