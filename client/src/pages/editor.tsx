import { Canvas3D } from "@/components/editor/canvas-3d";
import { DrawingCanvas } from "@/components/editor/drawing-canvas";
import { ImageTracer } from "@/components/editor/image-tracer";
import { PetTagEditor } from "@/components/editor/pet-tag-editor";
import { ToolDock } from "@/components/editor/tool-dock";
import { SettingsPanel } from "@/components/editor/settings-panel";
import { ExportPanel } from "@/components/editor/export-panel";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function Editor() {
  const { inputMode, resetAll } = useEditorStore();
  const [showSettings, setShowSettings] = useState(true);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-12 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">SignCraft 3D</h1>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            Neon Sign Generator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            data-testid="button-reset"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowExport(!showExport)}
            data-testid="button-export-toggle"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ToolDock />

        <main className="flex-1 relative">
          <div className="absolute inset-0 bg-muted/30">
            {inputMode === "draw" && <DrawingCanvas />}
            {inputMode === "image" && <ImageTracer />}
            {inputMode === "text" && <Canvas3D />}
            {inputMode === "pettag" && <PetTagEditor />}
          </div>
          
          {inputMode !== "pettag" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-lg">
              <p className="text-xs text-muted-foreground">
                {inputMode === "text" && "Type your text, then adjust settings on the right"}
                {inputMode === "draw" && "Draw on canvas - your strokes become neon tubes"}
                {inputMode === "image" && "Upload an image to trace into bubble letter style"}
              </p>
            </div>
          )}
        </main>

        {showSettings && !showExport && inputMode !== "pettag" && <SettingsPanel />}
        {showExport && inputMode !== "pettag" && (
          <div className="w-80 border-l bg-sidebar p-4">
            <ExportPanel />
          </div>
        )}
      </div>
    </div>
  );
}
