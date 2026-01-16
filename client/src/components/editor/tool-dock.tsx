import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Type, Pencil, Image, Eye, EyeOff, Dog, Hexagon, Zap, Square, Sparkles, Heart } from "lucide-react";
import type { InputMode } from "@shared/schema";

export function ToolDock() {
  const { inputMode, setInputMode, showGrid, setShowGrid } = useEditorStore();

  const modes: { id: InputMode; icon: typeof Type; label: string; description: string }[] = [
    { id: "text", icon: Type, label: "Signs", description: "Neon sign text" },
    { id: "draw", icon: Pencil, label: "Draw", description: "Freehand drawing" },
    { id: "image", icon: Image, label: "Image", description: "Upload & trace image" },
    { id: "neonshapes", icon: Heart, label: "Neon Shapes", description: "Iconic shapes with Edison bases" },
    { id: "pettag", icon: Dog, label: "Pet Tags", description: "Illuminated dog tags" },
    { id: "modular", icon: Hexagon, label: "Panels", description: "Modular light panels" },
    { id: "neontube", icon: Zap, label: "Neon Tubes", description: "Realistic tube casings" },
    { id: "backingplate", icon: Square, label: "Backing Plates", description: "Mounting plates with holes" },
    { id: "shoestring", icon: Sparkles, label: "Shoe String", description: "Pop culture image tracer" },
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
