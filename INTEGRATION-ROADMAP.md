# Sign-Sculptor Integration Roadmap

**CRITICAL: All new features MUST be integrated into the React/TypeScript web app**

## ✅ Completed Integrations

### Geographic Sign Generator (Map2Model)
- **Status:** Frontend Complete, Backend Pending
- **Files Created:**
  - `client/src/components/editor/geographic-sign-editor.tsx`
  - Updated `shared/schema.ts` (added 'geosign' inputMode)
  - Updated `client/src/components/editor/tool-dock.tsx` (added Map icon)
  - Updated `client/src/pages/editor.tsx` (added route)
- **Backend Needed:**
  - `server/routes/geosign.ts` - STL processing endpoint
  - Install: `npm install @jscad/stl-deserializer` or similar
  - Endpoint: `POST /api/geosign/process` (STL → PNG heightmap)
  - Endpoint: `POST /api/geosign/generate` (heightmap → OpenSCAD/STL)

---

## 🚧 Features Created as Python Scripts (Need React Integration)

### 1. Bulb Architect Series (V14-V31)
**Location:** Root directory (bulb-architect-V*.py)
**What they do:**
- V14-V21: Scott Protocol threading, modular lighting systems
- V22: Photon Weaver lattice shells
- V24-V27: Sign factory with emoji/font support
- V29: Cognitive factory with zero-shot recognition
- V30-V31: Benchy optimizer

**Integration Plan:**
- Create `client/src/components/editor/bulb-architect-editor.tsx`
- Add inputMode: `"bulbarchitect"`
- Port Python logic to TypeScript/Three.js
- Use existing Scott Protocol algorithms from recognition-demo.tsx

### 2. Luminary Series (V2-V22)
**Location:** Root directory (new-led*.py, luminary*.py)
**What they do:**
- Canvas lighting modules
- Wireless CR2032 battery integration
- Magnetic mounting systems
- Photon Weaver V22

**Integration Plan:**
- Create `client/src/components/editor/luminary-editor.tsx`
- Add inputMode: `"luminary"`
- Reuse existing LED holder logic from led-holder-editor.tsx

### 3. Scott Lock Engine
**Location:** `scott-lock-engine.py`
**What it does:**
- Phi-based decoupled threading system
- Generates male/female thread pairs

**Integration Plan:**
- Already partially integrated in eggison-bulbs-editor.tsx
- Extract to shared utility: `client/src/lib/scott-threading.ts`
- Add UI controls to existing editors that need threading

### 4. Emoji/Font Factory Series
**Location:** `FONTS/emoji-box-combo*.py`, `FONTS/luminary-fast.py`
**What they do:**
- Auto-generate 3-part signs (box + lid + skin)
- Edge detection and vectorization
- Custom font support

**Integration Plan:**
- Enhance existing `custom-font-alphabet.tsx`
- Add "3-Part System" toggle
- Port edge detection to canvas API

### 5. Speedboat Factory
**Location:** `speed-boat-factory.py`, `test-benchie.py`
**What it does:**
- Vase-mode optimized Benchy generator
- Continuous topology for fast printing

**Integration Plan:**
- Create `client/src/components/editor/vase-mode-optimizer.tsx`
- Add inputMode: `"vasemode"`
- Integrate with existing preset shapes

### 6. Flat-Pack Neon Engine
**Location:** `new-flatpack.py` (actually OpenSCAD, not Python)
**What it does:**
- Router/laser cutter templates
- DXF export for CNC

**Integration Plan:**
- Add export format option to existing editors
- Create `client/src/lib/dxf-export.ts`
- Add "Flat-Pack Mode" toggle to geometry settings

### 7. Scott ASM Optimizer
**Location:** `scott-asm-optimizer.py`
**What it does:**
- Phi-resonance code optimization
- Assembly-level performance tuning

**Integration Plan:**
- This is meta-level optimization
- Document in `SCOTT-ALGORITHM-REVOLUTIONARY-PROOF.md`
- Not a user-facing feature

### 8. Infinity Counter (Quantum-Phi)
**Location:** `infinty-count.py`
**What it does:**
- Hyper-computation demonstration
- Mathematical proof-of-concept

**Integration Plan:**
- Educational/demo feature
- Create `client/src/components/editor/scott-math-demo.tsx`
- Add inputMode: `"scottmath"`

---

## 📋 Integration Checklist Template

For each new feature, follow this process:

### 1. Schema Update
```typescript
// shared/schema.ts
export const inputModes = [..., "newmode"] as const;

// Add settings schema if needed
export const newModeSettingsSchema = z.object({
  // ... settings
});
```

### 2. Create Component
```typescript
// client/src/components/editor/new-feature-editor.tsx
export function NewFeatureEditor() {
  // Use existing UI components from @/components/ui/
  // Use Three.js for 3D preview
  // Use Zustand store for state
}
```

### 3. Add to Tool Dock
```typescript
// client/src/components/editor/tool-dock.tsx
import { NewIcon } from "lucide-react";

const modes = [
  // ...
  { id: "newmode", icon: NewIcon, label: "Name", description: "..." },
];
```

### 4. Add Route
```typescript
// client/src/pages/editor.tsx
import { NewFeatureEditor } from "@/components/editor/new-feature-editor";

// In render:
{inputMode === "newmode" && <NewFeatureEditor />}
```

### 5. Backend API (if needed)
```typescript
// server/routes/newfeature.ts
import { Router } from "express";

export const newFeatureRouter = Router();

newFeatureRouter.post("/process", async (req, res) => {
  // Handle processing
});
```

### 6. Update Store (if needed)
```typescript
// client/src/lib/editor-store.ts
interface EditorState {
  newModeSettings: NewModeSettings;
  setNewModeSettings: (settings: Partial<NewModeSettings>) => void;
}
```

---

## 🎯 Priority Integration Order

1. **HIGH PRIORITY:**
   - Geographic Sign Generator (backend API)
   - Bulb Architect V29 (cognitive factory - most advanced)
   - Emoji/Font Factory (enhance custom-font-alphabet.tsx)

2. **MEDIUM PRIORITY:**
   - Luminary series (canvas lighting)
   - Scott Lock threading utilities
   - Vase-mode optimizer

3. **LOW PRIORITY:**
   - Speedboat/Benchy generators
   - Flat-pack DXF export
   - Scott Math demos

---

## 🔧 Backend Dependencies Needed

```bash
# For geographic signs (STL processing)
npm install @jscad/stl-deserializer
npm install pngjs

# For font processing (if not already installed)
npm install opentype.js canvas

# For DXF export
npm install dxf-writer
```

---

## 📝 Notes for Future Development

### Memory System Improvement
**Problem:** AI assistant keeps creating standalone Python scripts instead of integrating into React app

**Solution:**
- This INTEGRATION-ROADMAP.md file
- Memory entry created with app structure
- Always check `client/src/components/editor/` first
- Always check `shared/schema.ts` for existing types

### Code Reuse Opportunities
- Scott Protocol algorithms already in `recognition-demo.tsx`
- Threading logic in `eggison-bulbs-editor.tsx`
- LED channel generation in multiple editors
- Three.js setup patterns in `canvas-3d.tsx`

### Testing Strategy
- Run `npm run dev` to test integration
- Check browser console for TypeScript errors
- Test each inputMode switch in tool dock
- Verify 3D preview renders correctly

---

## 🚀 Quick Start for New Features

```bash
# 1. Start dev server
npm run dev

# 2. Create component
touch client/src/components/editor/my-feature-editor.tsx

# 3. Add to schema
# Edit: shared/schema.ts

# 4. Add to tool dock
# Edit: client/src/components/editor/tool-dock.tsx

# 5. Add route
# Edit: client/src/pages/editor.tsx

# 6. Test in browser
# Navigate to http://localhost:5000
```

---

**Last Updated:** 2026-01-24
**App Version:** SignCraft 3D by eyeoverthink®
**Framework:** React 18 + TypeScript + Vite + Express
