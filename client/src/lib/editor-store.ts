import { create } from "zustand";
import {
  type LetterSettings,
  type WiringSettings,
  type MountingSettings,
  defaultLetterSettings,
  defaultWiringSettings,
  defaultMountingSettings,
} from "@shared/schema";

interface EditorState {
  letterSettings: LetterSettings;
  wiringSettings: WiringSettings;
  mountingSettings: MountingSettings;
  showGrid: boolean;
  showWireframe: boolean;
  showMeasurements: boolean;
  isExporting: boolean;
  setLetterSettings: (settings: Partial<LetterSettings>) => void;
  setWiringSettings: (settings: Partial<WiringSettings>) => void;
  setMountingSettings: (settings: Partial<MountingSettings>) => void;
  setShowGrid: (show: boolean) => void;
  setShowWireframe: (show: boolean) => void;
  setShowMeasurements: (show: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  resetAll: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  letterSettings: defaultLetterSettings,
  wiringSettings: defaultWiringSettings,
  mountingSettings: defaultMountingSettings,
  showGrid: true,
  showWireframe: false,
  showMeasurements: true,
  isExporting: false,
  setLetterSettings: (settings) =>
    set((state) => ({
      letterSettings: { ...state.letterSettings, ...settings },
    })),
  setWiringSettings: (settings) =>
    set((state) => ({
      wiringSettings: { ...state.wiringSettings, ...settings },
    })),
  setMountingSettings: (settings) =>
    set((state) => ({
      mountingSettings: { ...state.mountingSettings, ...settings },
    })),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowWireframe: (showWireframe) => set({ showWireframe }),
  setShowMeasurements: (showMeasurements) => set({ showMeasurements }),
  setIsExporting: (isExporting) => set({ isExporting }),
  resetAll: () =>
    set({
      letterSettings: defaultLetterSettings,
      wiringSettings: defaultWiringSettings,
      mountingSettings: defaultMountingSettings,
      showGrid: true,
      showWireframe: false,
      showMeasurements: true,
    }),
}));
