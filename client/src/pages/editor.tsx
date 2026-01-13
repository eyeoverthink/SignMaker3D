import { EditorHeader } from "@/components/editor/editor-header";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { Canvas3D } from "@/components/editor/canvas-3d";
import { StatusBar } from "@/components/editor/status-bar";

export default function Editor() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader />

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />

        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <Canvas3D />
          </div>
          <StatusBar />
        </main>
      </div>
    </div>
  );
}
