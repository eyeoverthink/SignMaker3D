# Scott Algorithm API Implementation Plan

## Problem
Demo components have mock/fake data with toast messages. Real Scott Algorithm implementations exist on server but no API endpoints to call them.

## Server-Side Implementations (Already Exist)
- ✅ `scott-universal-recognition.ts` - Zero-shot recognition
- ✅ `scott-4d-predictor.ts` - Temporal prediction
- ✅ `scott-cloaking.ts` - Geometric cloaking
- ✅ `scott-collision-benchmark.ts` - Collision detection
- ✅ `scott-inverted-contrast.ts` - Yin-Yang detection
- ✅ `scott-maze-generator.ts` - Maze/pathfinding

## Missing
- ❌ API endpoints in `routes.ts` to expose these features
- ❌ Client-side components wired to real endpoints
- ❌ Deepfake detection server implementation

## Implementation Steps

### 1. Create API Endpoints (routes.ts)
```typescript
// Recognition
app.post("/api/scott/recognize", async (req, res) => {
  const { imageData } = req.body;
  const engine = new ScottUniversalRecognition();
  const result = engine.recognize(imageData);
  res.json(result);
});

// Cloaking
app.post("/api/scott/cloak", async (req, res) => {
  const { imageData, strategies } = req.body;
  const cloaking = new ScottCloaking();
  const result = cloaking.cloak(imageData, strategies);
  res.json(result);
});

// 4D Prediction
app.post("/api/scott/predict", async (req, res) => {
  const { imageData, timeHorizon } = req.body;
  const predictor = new Scott4DPredictor();
  const result = predictor.predict(imageData, timeHorizon);
  res.json(result);
});

// Collision Detection
app.post("/api/scott/collision", async (req, res) => {
  const { imageData } = req.body;
  const result = detectCollision(imageData);
  res.json(result);
});

// Yin-Yang Detection
app.post("/api/scott/yinyang", async (req, res) => {
  const { imageData } = req.body;
  const result = detectInvertedContrast(imageData);
  res.json(result);
});
```

### 2. Update Demo Components
Remove all mock data and wire to real endpoints:

**Recognition Demo:**
```typescript
const handleRecognize = async () => {
  const response = await fetch("/api/scott/recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData: uploadedImage })
  });
  const result = await response.json();
  setRecognitionResult(result);
};
```

**Cloaking Demo:**
```typescript
const handleCloak = async () => {
  const response = await fetch("/api/scott/cloak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      imageData: uploadedImage,
      strategies: selectedStrategies 
    })
  });
  const result = await response.json();
  setCloakedImage(result.cloakedImage);
  setEffectiveness(result.effectiveness);
};
```

### 3. Fix Cloaking Tab Crash
The crash is likely due to missing Label import or incorrect component structure. Need to verify the component loads properly with real functionality.

## Next Actions
1. Add Scott API endpoints to routes.ts
2. Update all demo components to remove mock data
3. Wire components to real endpoints
4. Test each tab with actual image processing
5. Commit working implementation
