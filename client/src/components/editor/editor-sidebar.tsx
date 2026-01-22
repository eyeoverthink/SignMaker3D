import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Type,
  Layers,
  Cable,
  CircleDot,
  Settings2,
  Download,
  Cylinder,
  Pencil,
  Sparkles,
  FileText,
  Wand2,
  Box,
  Zap,
  Lightbulb,
  Film,
  Image,
  Shield,
  Atom,
  Clock,
  Mountain,
  Eye,
  Contrast,
  CheckCircle,
  Grid3x3,
  ImageIcon,
  Flame,
  Egg,
  Shapes,
  Sparkle,
  Star,
  Tag,
  Gamepad2,
} from "lucide-react";
import { TextControls } from "./text-controls";
import { GeometryControls } from "./geometry-controls";
import { WiringControls } from "./wiring-controls";
import { MountingControls } from "./mounting-controls";
import { ViewControls } from "./view-controls";
import { ExportPanel } from "./export-panel";
import { TubeControls } from "./tube-controls";
import { SketchControls } from "./sketch-controls";
import { LightPanelControls } from "./light-panel-controls";
import { CustomFontAlphabetControls } from "./custom-font-alphabet-controls";
import { PhraseDesigner } from "./phrase-designer";
import { AdvancedLightBoxDesigner } from "./advanced-light-box-designer";
import { NeonStandDesigner } from "./neon-stand-designer";
import NeonBulbDesigner from "./neon-bulb-designer";
import HolographicPanelDesigner from "./holographic-panel-designer";
import AnimationSequenceDesigner from "./animation-sequence-designer";
import SilhouetteLightBoxDesigner from "./silhouette-lightbox-designer";
import DeepfakeDetector from "./deepfake-detector";
import CollisionDemo from "./collision-demo";
import TemporalPredictionDemo from "./temporal-prediction-demo";
import { ReliefEditor } from "./relief-editor";
import CloakingDemo from "./cloaking-demo";
import { RecognitionDemo } from "./recognition-demo";
import InvertedContrastDemo from "./inverted-contrast-demo";
import { ScottProofDemo } from "./scott-proof-demo";
import LEDGridEditor from "./led-grid-editor";
import { LithophaneEditor } from "./lithophane-editor";
import { AnimatedLithophaneEditor } from "./animated-lithophane-editor";
import EggisonBulbsEditor from "./eggison-bulbs-editor";
import { CustomShapesEditor } from "./custom-shapes-editor";
import { RetroNeonEditor } from "./retro-neon-editor";
import { NeonShapesEditor } from "./neon-shapes-editor";
import { PetTagEditor } from "./pet-tag-editor";
import { MazeGameEditor } from "./maze-game-editor";
import YingYangDesigner from "./ying-yang-designer";
import { EmbossedTileDesigner } from "./embossed-tile-designer";
import { useEditorStore } from "@/lib/editor-store";

export function EditorSidebar() {
  const { geometrySettings } = useEditorStore();
  const isOutlineMode = geometrySettings.mode === "outline";

  return (
    <div className="w-80 border-r bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Controls</h2>
        <p className="text-sm text-muted-foreground">
          Customize your 3D signage
        </p>
      </div>

      <Tabs defaultValue="text" className="flex-1 flex flex-col">
        <TabsList className={`grid w-full p-1 m-2 bg-muted/50 ${isOutlineMode ? 'grid-cols-10' : 'grid-cols-10'}`} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))'}}>
          <TabsTrigger
            value="text"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-text"
          >
            <Type className="h-3.5 w-3.5" />
            <span className="text-[9px]">Text</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="geometry"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-geometry"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="text-[9px]">Shape</span>
          </TabsTrigger>
          <TabsTrigger
            value="wiring"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-wiring"
          >
            <Cable className="h-3.5 w-3.5" />
            <span className="text-[9px]">Wiring</span>
          </TabsTrigger>
          <TabsTrigger
            value="mounting"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-mounting"
          >
            <CircleDot className="h-3.5 w-3.5" />
            <span className="text-[9px]">Mount</span>
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-view"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="text-[9px]">View</span>
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-export"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-[9px]">Export</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="lightpanel"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-lightpanel"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[9px]">Panel</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="customfont"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-customfont"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="text-[9px]">Font</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="phrase"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-phrase"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span className="text-[9px]">Phrase</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="shadowbox"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-shadowbox"
          >
            <Box className="h-3.5 w-3.5" />
            <span className="text-[9px]">Shadow</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="neonstand"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-neonstand"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[9px]">Stand</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="neonbulb"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-neonbulb"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span className="text-[9px]">Bulb</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-emerald-600 shadow-lg" title="NEW: Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="holographic"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-holographic"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="text-[9px]">Holo</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-emerald-600 shadow-lg" title="NEW: Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="animation"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-animation"
          >
            <Film className="h-3.5 w-3.5" />
            <span className="text-[9px]">Anim</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-emerald-600 shadow-lg" title="NEW: Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="silhouette"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-silhouette"
          >
            <Image className="h-3.5 w-3.5" />
            <span className="text-[9px]">Silh</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-emerald-600 shadow-lg" title="NEW: Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="deepfake"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-deepfake"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="text-[9px]">Fake</span>
          </TabsTrigger>
          <TabsTrigger
            value="collision"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-collision"
          >
            <Atom className="h-3.5 w-3.5" />
            <span className="text-[9px]">Coll</span>
          </TabsTrigger>
          <TabsTrigger
            value="4dpredict"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-4dpredict"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[9px]">4D</span>
          </TabsTrigger>
          <TabsTrigger
            value="relief"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-relief"
          >
            <Mountain className="h-3.5 w-3.5" />
            <span className="text-[9px]">Relief</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="cloak"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-cloak"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[9px]">Cloak</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="recognize"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-recognize"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-[9px]">Recog</span>
          </TabsTrigger>
          <TabsTrigger
            value="contrast"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-contrast"
          >
            <Contrast className="h-3.5 w-3.5" />
            <span className="text-[9px]">Contr</span>
          </TabsTrigger>
          <TabsTrigger
            value="scottproof"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
            data-testid="tab-scottproof"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-[9px]">Proof</span>
          </TabsTrigger>
          <TabsTrigger
            value="ledgrid"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-ledgrid"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            <span className="text-[9px]">Grid</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="litho"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-litho"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="text-[9px]">Litho</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="animlitho"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-animlitho"
          >
            <Film className="h-3.5 w-3.5" />
            <span className="text-[9px]">ALith</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-emerald-600 shadow-lg" title="NEW: Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="eggison"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-eggison"
          >
            <Egg className="h-3.5 w-3.5" />
            <span className="text-[9px]">Egg</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="customshapes"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-customshapes"
          >
            <Shapes className="h-3.5 w-3.5" />
            <span className="text-[9px]">Shapes</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="retroneon"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-retroneon"
          >
            <Sparkle className="h-3.5 w-3.5" />
            <span className="text-[9px]">Retro</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="neonshapes"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-neonshapes"
          >
            <Star className="h-3.5 w-3.5" />
            <span className="text-[9px]">NShap</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="pettag"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-pettag"
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="text-[9px]">Tag</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="maze"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-maze"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="text-[9px]">Maze</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-emerald-600 shadow-lg" title="NEW: Exports 3D models"></span>
          </TabsTrigger>
          <TabsTrigger
            value="yingyang"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-yingyang"
          >
            <CircleDot className="h-3.5 w-3.5" />
            <span className="text-[9px]">YinYg</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-amber-400 rounded-full border-2 border-amber-600 animate-pulse shadow-lg" title="BRAND NEW: Complete backend created!"></span>
          </TabsTrigger>
          <TabsTrigger
            value="embossedtile"
            className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
            data-testid="tab-embossedtile"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span className="text-[9px]">Tile</span>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
          </TabsTrigger>
          {isOutlineMode && (
            <>
              <TabsTrigger
                value="tube"
                className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 relative"
                data-testid="tab-tube"
              >
                <Cylinder className="h-3.5 w-3.5" />
                <span className="text-[9px]">Tube</span>
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-green-700" title="Exports 3D models"></span>
              </TabsTrigger>
              <TabsTrigger
                value="sketch"
                className="flex flex-col items-center gap-0.5 py-1.5 px-0.5"
                data-testid="tab-sketch"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-[9px]">Sketch</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="text" className="mt-0">
              <TextControls />
            </TabsContent>

            <TabsContent value="geometry" className="mt-0">
              <GeometryControls />
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

            <TabsContent value="lightpanel" className="mt-0">
              <LightPanelControls />
            </TabsContent>

            <TabsContent value="customfont" className="mt-0">
              <CustomFontAlphabetControls />
            </TabsContent>

            <TabsContent value="phrase" className="mt-0">
              <PhraseDesigner />
            </TabsContent>

            <TabsContent value="shadowbox" className="mt-0">
              <AdvancedLightBoxDesigner />
            </TabsContent>

            <TabsContent value="neonstand" className="mt-0">
              <NeonStandDesigner />
            </TabsContent>

            <TabsContent value="neonbulb" className="mt-0">
              <NeonBulbDesigner />
            </TabsContent>

            <TabsContent value="holographic" className="mt-0">
              <HolographicPanelDesigner />
            </TabsContent>

            <TabsContent value="animation" className="mt-0">
              <AnimationSequenceDesigner />
            </TabsContent>

            <TabsContent value="silhouette" className="mt-0">
              <SilhouetteLightBoxDesigner />
            </TabsContent>

            <TabsContent value="deepfake" className="mt-0">
              <DeepfakeDetector />
            </TabsContent>

            <TabsContent value="collision" className="mt-0">
              <CollisionDemo />
            </TabsContent>

            <TabsContent value="4dpredict" className="mt-0">
              <TemporalPredictionDemo />
            </TabsContent>

            <TabsContent value="relief" className="mt-0">
              <ReliefEditor />
            </TabsContent>

            <TabsContent value="cloak" className="mt-0">
              <CloakingDemo />
            </TabsContent>

            <TabsContent value="recognize" className="mt-0">
              <RecognitionDemo />
            </TabsContent>

            <TabsContent value="contrast" className="mt-0">
              <InvertedContrastDemo />
            </TabsContent>

            <TabsContent value="scottproof" className="mt-0">
              <ScottProofDemo />
            </TabsContent>

            <TabsContent value="ledgrid" className="mt-0">
              <LEDGridEditor />
            </TabsContent>

            <TabsContent value="litho" className="mt-0">
              <LithophaneEditor />
            </TabsContent>

            <TabsContent value="animlitho" className="mt-0">
              <AnimatedLithophaneEditor />
            </TabsContent>

            <TabsContent value="eggison" className="mt-0">
              <EggisonBulbsEditor />
            </TabsContent>

            <TabsContent value="customshapes" className="mt-0">
              <CustomShapesEditor />
            </TabsContent>

            <TabsContent value="retroneon" className="mt-0">
              <RetroNeonEditor />
            </TabsContent>

            <TabsContent value="neonshapes" className="mt-0">
              <NeonShapesEditor />
            </TabsContent>

            <TabsContent value="pettag" className="mt-0">
              <PetTagEditor />
            </TabsContent>

            <TabsContent value="maze" className="mt-0">
              <MazeGameEditor />
            </TabsContent>

            <TabsContent value="yingyang" className="mt-0">
              <YingYangDesigner />
            </TabsContent>

            <TabsContent value="embossedtile" className="mt-0">
              <EmbossedTileDesigner />
            </TabsContent>

            {isOutlineMode && (
              <>
                <TabsContent value="tube" className="mt-0">
                  <TubeControls />
                </TabsContent>

                <TabsContent value="sketch" className="mt-0">
                  <SketchControls />
                </TabsContent>
              </>
            )}
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
