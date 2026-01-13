import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Type, Cable, CircleDot, Settings2, Download } from "lucide-react";
import { TextControls } from "./text-controls";
import { WiringControls } from "./wiring-controls";
import { MountingControls } from "./mounting-controls";
import { ViewControls } from "./view-controls";
import { ExportPanel } from "./export-panel";

export function EditorSidebar() {
  return (
    <div className="w-80 border-r bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Controls</h2>
        <p className="text-sm text-muted-foreground">
          Customize your 3D signage
        </p>
      </div>

      <Tabs defaultValue="text" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 p-1 m-2 bg-muted/50">
          <TabsTrigger
            value="text"
            className="flex flex-col items-center gap-1 py-2 px-1"
            data-testid="tab-text"
          >
            <Type className="h-4 w-4" />
            <span className="text-[10px]">Text</span>
          </TabsTrigger>
          <TabsTrigger
            value="wiring"
            className="flex flex-col items-center gap-1 py-2 px-1"
            data-testid="tab-wiring"
          >
            <Cable className="h-4 w-4" />
            <span className="text-[10px]">Wiring</span>
          </TabsTrigger>
          <TabsTrigger
            value="mounting"
            className="flex flex-col items-center gap-1 py-2 px-1"
            data-testid="tab-mounting"
          >
            <CircleDot className="h-4 w-4" />
            <span className="text-[10px]">Mount</span>
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="flex flex-col items-center gap-1 py-2 px-1"
            data-testid="tab-view"
          >
            <Settings2 className="h-4 w-4" />
            <span className="text-[10px]">View</span>
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="flex flex-col items-center gap-1 py-2 px-1"
            data-testid="tab-export"
          >
            <Download className="h-4 w-4" />
            <span className="text-[10px]">Export</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="text" className="mt-0">
              <TextControls />
            </TabsContent>

            <TabsContent value="wiring" className="mt-0">
              <WiringControls />
            </TabsContent>

            <TabsContent value="mounting" className="mt-0">
              <MountingControls />
            </TabsContent>

            <TabsContent value="view" className="mt-0">
              <ViewControls />
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <ExportPanel />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      <Separator />

      <div className="p-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Tip: Drag to rotate, scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
