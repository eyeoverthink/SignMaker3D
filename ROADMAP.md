# Sign-Sculptor Strategic Roadmap

## Vision
**"The only tool that converts ideas into functional, printable, LED-lit 3D objects"**

Meshy makes 3D models. Sign-Sculptor makes 3D models **you can actually build and light up**.

---

## Current Competitive Advantages

### What Makes Us Unique:
1. **End-to-end manufacturing** - Not just design, but printable parts with assembly instructions
2. **Modular "Lego" system** - Mix and match components (bases, diffusers, connectors, electronics)
3. **Split-tube technology** - Easy LED insertion (competitors don't have this)
4. **Multiple input methods** - Text, drawing, image tracing, shapes, custom paths
5. **Smart algorithms** - Moore-Neighbor boundary tracing, OpenType font rendering, proper edge detection
6. **Electronics integration** - Controller housings, wire management, power systems
7. **Material-aware** - Knows what needs opaque vs. translucent, includes vase mode instructions

---

## Feature Roadmap (Prioritized)

### 🎯 Phase 1: HIGH IMPACT - Leverage Existing Architecture

#### ✅ 1. 2.5D Relief/Embossing from Images
**Status:** Next to implement  
**Effort:** Medium (2-3 days)  
**Market Impact:** High

**Description:**
- Convert images to raised/recessed surfaces with LED channels
- Use existing edge detection + add depth mapping
- Generate split-able models with integrated LED paths

**Why it works:**
- Leverages 80% of existing image tracing code
- Natural extension of current capabilities
- Creates "neon relief sculptures" - totally unique market position

**Technical Approach:**
- Grayscale image → height map
- Extrude geometry based on brightness
- Auto-inject LED channels along contours
- Apply modular connector system
- Generate base + relief + diffuser parts

**Use Cases:**
- Logo reliefs with edge lighting
- Portrait lithophanes with depth
- Textured wall art with integrated LEDs
- Embossed signage

---

#### 📋 2. SVG/Vector Import with Auto-Tubing
**Status:** Planned  
**Effort:** Medium (2-3 days)  
**Market Impact:** High

**Description:**
- Import SVG files, auto-convert paths to neon tubes
- Add split-tube logic, connectors, bases automatically
- Support complex vector artwork

**Why it works:**
- Extends path-based architecture
- Opens door to professional design tools (Figma, Illustrator)
- SVG tools exist, but none add manufacturing details

**Technical Approach:**
- Parse SVG path data
- Convert Bezier curves to tube geometries
- Apply existing tube generation logic
- Add mounting hardware and electronics
- Generate multi-part assembly

**Use Cases:**
- Import logos from design tools
- Convert vector art to neon signs
- Professional signage workflows
- Custom brand installations

---

#### 🎨 3. Text-to-3D Neon Sculpture
**Status:** Planned  
**Effort:** Medium (3-4 days)  
**Market Impact:** Medium-High

**Description:**
- Take text rendering and make it truly 3D (not just flat tubes)
- Add depth, perspective, stacking capabilities
- Create volumetric letter forms with edge lighting

**Why it works:**
- Extends existing font rendering + tube generation
- All neon generators are 2D - this is 3D
- Natural evolution of current text features

**Technical Approach:**
- Extrude font glyphs to 3D volumes
- Add LED channels along edges
- Support perspective and rotation
- Generate stackable/assemblable letter blocks
- Include mounting and wiring systems

**Use Cases:**
- 3D storefront signage
- Dimensional logo displays
- Sculptural text art
- Layered typography

---

### 🔥 Phase 2: MEDIUM IMPACT - New Capabilities

#### 📐 4. Parametric 3D Primitives with LED Channels
**Status:** Planned  
**Effort:** Medium (2-3 days)  
**Market Impact:** Medium

**Description:**
- Cubes, spheres, pyramids, cylinders with built-in LED routing
- Modular connector system for assembly
- Customizable dimensions and LED placement

**Why it works:**
- Extends geometric shape generators
- No one does "LED-ready 3D primitives"
- Enables modular light sculpture building

**Technical Approach:**
- Generate parametric 3D shapes
- Auto-route LED channels along edges/surfaces
- Apply connector system
- Split for easy assembly
- Include electronics integration

**Use Cases:**
- Modular light sculptures
- Geometric art installations
- Educational LED projects
- Custom lighting fixtures

---

#### 📱 5. QR Code Neon Signs
**Status:** Planned  
**Effort:** Low (1-2 days)  
**Market Impact:** Medium (Viral Potential)

**Description:**
- Generate scannable QR codes as neon tube paths
- Functional + decorative
- Customizable colors and sizes

**Why it works:**
- Path generation + tube creation already exists
- Totally unique - no one does this
- High viral/marketing potential

**Technical Approach:**
- Generate QR code data
- Convert to path geometry
- Apply tube generation
- Ensure scannability with proper contrast
- Add mounting and power systems

**Use Cases:**
- Business signage with scannable codes
- Restaurant menus
- Event marketing
- Interactive art installations

---

#### 🖼️ 6. Lithophane + LED Integration
**Status:** Planned  
**Effort:** Medium (2-3 days)  
**Market Impact:** Medium-High

**Description:**
- Convert photos to backlit lithophanes with integrated LED holders
- Auto-generate mounting frames
- Include diffusion and brightness controls

**Why it works:**
- LED holder generators already exist
- Lithophane generators exist, but none integrate LED mounting
- "Living photo frames" market opportunity

**Technical Approach:**
- Convert image to lithophane mesh
- Generate integrated LED holder backing
- Add frame with snap-fit assembly
- Include wire management
- Support multiple sizes

**Use Cases:**
- Personalized photo gifts
- Memorial displays
- Portrait lighting
- Decorative wall art

---

### ⚡ Phase 3: GAME-CHANGER - Advanced Features

#### 🤖 7. Image-to-3D with LED Path Injection
**Status:** Future (High Priority)  
**Effort:** High (1-2 weeks)  
**Market Impact:** VERY HIGH - Killer Feature

**Description:**
- Use AI (TripoSR, Stable Fast 3D, or similar) to convert image → 3D mesh
- **Innovation:** Auto-inject LED channels along edges/features
- Add split points, mounting hardware, diffusers
- Make AI-generated models actually buildable

**Why it works:**
- Combines AI 3D generation (trendy) with manufacturing expertise (our strength)
- AI 3D tools exist, but output isn't printable/functional
- **Our edge:** Make it actually buildable with LEDs

**Technical Approach:**
- Integrate AI 3D generation API/model
- Analyze generated mesh for feature edges
- Inject LED channels using edge detection
- Apply split-tube methodology
- Generate assembly instructions
- Add electronics integration

**Use Cases:**
- Turn photos into 3D LED sculptures
- Product visualization with lighting
- Character models with integrated LEDs
- Custom figurines with illumination

**Competitive Advantage:**
> "Meshy generates 3D models. Sign-Sculptor generates 3D models you can print, assemble, and light up."

---

#### 🔧 8. "Neon-ify Any STL"
**Status:** Future  
**Effort:** High (1-2 weeks)  
**Market Impact:** High

**Description:**
- Import existing 3D models (STL files)
- Auto-detect edges, add LED channels
- Generate split versions with connector system
- Convert any model to LED-ready version

**Why it works:**
- Extends edge-tracing logic to 3D meshes
- No tool converts arbitrary 3D models to LED-ready versions
- Opens entire Thingiverse/Printables ecosystem

**Technical Approach:**
- Parse STL mesh
- Detect feature edges (sharp angles, silhouettes)
- Generate LED channel paths
- Apply split methodology
- Add modular connectors
- Generate assembly guide

**Use Cases:**
- Turn Thingiverse models into light sculptures
- Add LEDs to existing designs
- Retrofit models with illumination
- Create glowing versions of popular models

---

## Implementation Strategy

### Phase 1 Execution Plan:
1. **Week 1-2:** Implement 2.5D Relief (highest ROI)
2. **Week 3-4:** Implement SVG Import (professional workflow)
3. **Week 5-6:** Implement Text-to-3D (market differentiator)

### Success Metrics:
- Each feature must output printable, assemblable parts
- Maintain modular "Lego" approach
- Include assembly instructions
- Support electronics integration
- Material-aware (opaque vs. translucent)

### Core Principles:
✅ **Modular First** - Everything uses connector system  
✅ **Printable Always** - No unprintable geometry  
✅ **LED-Ready** - Built-in channels and routing  
✅ **Assembly-Friendly** - Split designs, snap-fits  
✅ **Electronics-Aware** - Power, wiring, controllers  

---

## Market Positioning

### Current Market:
- **Meshy/AI 3D Tools:** Generate models (not functional)
- **Neon Sign Generators:** 2D only, no manufacturing
- **3D Printing Tools:** Generic, no LED integration
- **Lithophane Generators:** No mounting/LED systems

### Our Unique Position:
**"The only tool that bridges design, manufacturing, and electronics for LED-lit 3D objects"**

### Target Users:
1. Makers/DIY enthusiasts
2. Small business owners (signage)
3. Artists (light sculptures)
4. Event planners (custom displays)
5. Educators (STEM projects)

---

## Technical Architecture Notes

### Leverage Existing Systems:
- ✅ Moore-Neighbor boundary tracing
- ✅ OpenType font rendering
- ✅ Modular connector generation
- ✅ Split-tube methodology
- ✅ Electronics housing generation
- ✅ Material-aware slicing instructions

### New Systems Needed:
- 🔨 Height map → 3D extrusion
- 🔨 SVG path parser
- 🔨 3D text extrusion
- 🔨 AI 3D model integration
- 🔨 STL edge detection
- 🔨 Lithophane mesh generation

---

## Next Steps

1. ✅ Document roadmap (this file)
2. 📝 Commit to git
3. 🚀 Start Phase 1, Feature 1: 2.5D Relief
4. 🧪 Test with sample images
5. 📦 Deploy and gather feedback
6. 🔄 Iterate to next feature

---

**Last Updated:** January 17, 2026  
**Status:** Active Development  
**Current Focus:** 2.5D Relief Implementation
