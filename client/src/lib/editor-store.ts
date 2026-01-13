import { create } from "zustand";
import {
  type LetterSettings,
  type GeometrySettings,
  type WiringSettings,
  type MountingSettings,
  type TubeSettings,
  type SketchPath,
  defaultLetterSettings,
  defaultGeometrySettings,
  defaultWiringSettings,
  defaultMountingSettings,
  defaultTubeSettings,
} from "@shared/schema";

interface EditorState {
  letterSettings: LetterSettings;
  geometrySettings: GeometrySettings;
  wiringSettings: WiringSettings;
  mountingSettings: MountingSettings;
  tubeSettings: TubeSettings;
  sketchPaths: SketchPath[];
  activeToolMode: "text" | "sketch";
  showGrid: boolean;
  showWireframe: boolean;
  showMeasurements: boolean;
  isExporting: boolean;
  setLetterSettings: (settings: Partial<LetterSettings>) => void;
  setGeometrySettings: (settings: Partial<GeometrySettings>) => void;
  setWiringSettings: (settings: Partial<WiringSettings>) => void;
  setMountingSettings: (settings: Partial<MountingSettings>) => void;
  setTubeSettings: (settings: Partial<TubeSettings>) => void;
  setSketchPaths: (paths: SketchPath[]) => void;
  addSketchPath: (path: SketchPath) => void;
  removeSketchPath: (id: string) => void;
  setActiveToolMode: (mode: "text" | "sketch") => void;
  setShowGrid: (show: boolean) => void;
  setShowWireframe: (show: boolean) => void;
  setShowMeasurements: (show: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  resetAll: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  letterSettings: defaultLetterSettings,
  geometrySettings: defaultGeometrySettings,
  wiringSettings: defaultWiringSettings,
  mountingSettings: defaultMountingSettings,
  tubeSettings: defaultTubeSettings,
  sketchPaths: [],
  activeToolMode: "text",
  showGrid: true,
  showWireframe: false,
  showMeasurements: true,
  isExporting: false,
  setLetterSettings: (settings) =>
    set((state) => ({
      letterSettings: { ...state.letterSettings, ...settings },
    })),
  setGeometrySettings: (settings) =>
    set((state) => ({
      geometrySettings: { ...state.geometrySettings, ...settings },
    })),
  setWiringSettings: (settings) =>
    set((state) => ({
      wiringSettings: { ...state.wiringSettings, ...settings },
    })),
  setMountingSettings: (settings) =>
    set((state) => ({
      mountingSettings: { ...state.mountingSettings, ...settings },
    })),
  setTubeSettings: (settings) =>
    set((state) => ({
      tubeSettings: { ...state.tubeSettings, ...settings },
    })),
  setSketchPaths: (paths) => set({ sketchPaths: paths }),
  addSketchPath: (path) =>
    set((state) => ({
      sketchPaths: [...state.sketchPaths, path],
    })),
  removeSketchPath: (id) =>
    set((state) => ({
      sketchPaths: state.sketchPaths.filter((p) => p.id !== id),
    })),
  setActiveToolMode: (mode) => set({ activeToolMode: mode }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowWireframe: (showWireframe) => set({ showWireframe }),
  setShowMeasurements: (showMeasurements) => set({ showMeasurements }),
  setIsExporting: (isExporting) => set({ isExporting }),
  resetAll: () =>
    set({
      letterSettings: defaultLetterSettings,
      geometrySettings: defaultGeometrySettings,
      wiringSettings: defaultWiringSettings,
      mountingSettings: defaultMountingSettings,
      tubeSettings: defaultTubeSettings,
      sketchPaths: [],
      activeToolMode: "text",
      showGrid: true,
      showWireframe: false,
      showMeasurements: true,
    }),
}));
