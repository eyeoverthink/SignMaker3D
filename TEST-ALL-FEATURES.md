# Sign-Sculptor Complete Feature Test Plan

## Prerequisites
1. Start the development server: `npm run dev`
2. Server should be running on http://localhost:5000
3. Open browser to http://localhost:5000

---

## Test 1: Emoji Message Designer Tab

### UI Test
- [ ] Navigate to "Emoji" tab in the editor sidebar
- [ ] Verify emoji picker displays with categories
- [ ] Verify layout controls (grid/linear, spacing, size)
- [ ] Verify shell configuration options (LED type, height, thickness)

### Functionality Test
- [ ] Select 3-5 emojis from different categories
- [ ] Adjust grid columns (try 2, 3, 4)
- [ ] Change emoji spacing (10mm, 20mm, 30mm)
- [ ] Toggle border on/off
- [ ] Change LED type (6mm, 8mm, 10.5mm, 14mm)

### Export Test
```bash
# Test emoji message export
curl -X POST http://localhost:5000/api/export/emoji-message \
  -H "Content-Type: application/json" \
  -d '{
    "emojis": ["😊", "❤️", "🎉", "🔥"],
    "layout": "grid",
    "gridColumns": 2,
    "spacing": 20,
    "emojiSize": 50,
    "ledType": "10.5mm",
    "signHeight": 15,
    "wallThickness": 3,
    "baseThickness": 3,
    "wireHoleSpacing": 50,
    "includeBorder": true,
    "borderWidth": 10,
    "borderPadding": 15
  }' \
  --output emoji-message-test.zip
```

**Expected Output:**
- ZIP file containing:
  - Individual emoji STL files (Emoji_Smile_Body.stl, etc.)
  - Individual emoji lids (Emoji_Smile_Lid.stl, etc.)
  - Border frame (if enabled)
  - Assembly instructions
  - BOM (Bill of Materials)

---

## Test 2: Phrase Designer Tab

### UI Test
- [ ] Navigate to "Phrase" tab
- [ ] Verify text input field
- [ ] Verify font selector dropdown
- [ ] Verify welding mode options (None, Cursive Flow, Continuous, Auto)
- [ ] Verify border options (Rectangle, Rounded, Circle, Custom)
- [ ] Verify shell configuration

### Functionality Test
- [ ] Enter text: "HELLO"
- [ ] Select different fonts (try 3-4 fonts)
- [ ] Test each welding mode:
  - None (individual letters)
  - Cursive Flow (smooth connections)
  - Continuous Weld (closest points)
  - Auto-Detect
- [ ] Add border (Rectangle, then Rounded with 10mm radius)
- [ ] Adjust border padding (20mm, 30mm)

### Export Test
```bash
# Test phrase sign export
curl -X POST http://localhost:5000/api/export/phrase-sign \
  -H "Content-Type: application/json" \
  -d '{
    "text": "HELLO",
    "font": "Architects Daughter",
    "weldingMode": "cursive",
    "weldingGap": 2,
    "smoothingLevel": 5,
    "includeBorder": true,
    "borderType": "rounded",
    "borderWidth": 10,
    "borderPadding": 20,
    "borderRadius": 10,
    "ledType": "10.5mm",
    "signHeight": 15,
    "wallThickness": 3,
    "baseThickness": 3,
    "wireHoleSpacing": 50,
    "diffuserType": "flat"
  }' \
  --output phrase-hello-test.zip
```

**Expected Output:**
- ZIP file containing:
  - HELLO_Body.stl (welded letters with channels)
  - HELLO_Lid.stl (diffuser)
  - HELLO_Border.stl (if enabled)
  - ASSEMBLY_INSTRUCTIONS.md
  - HELLO.scad (optional)

---

## Test 3: Yin-Yang Generator Tab

### UI Test
- [ ] Navigate to "Yin-Yang" tab
- [ ] Verify diameter slider (50-300mm)
- [ ] Verify thickness slider
- [ ] Verify separate halves toggle
- [ ] Verify LED channel options
- [ ] Verify mounting options

### Functionality Test
- [ ] Set diameter to 150mm
- [ ] Adjust thickness (5mm, 10mm, 15mm)
- [ ] Toggle "Separate Halves" on/off
- [ ] Change LED type
- [ ] Enable mounting plate

### Export Test
```bash
# Test yin-yang export (complete symbol)
curl -X POST http://localhost:5000/api/export/ying-yang \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 150,
    "thickness": 10,
    "separateHalves": false,
    "ledType": "10.5mm",
    "channelDepth": 5,
    "wallThickness": 3,
    "includeDiffuser": true,
    "diffuserType": "domed",
    "includeMounting": true,
    "mountingHoles": 4
  }' \
  --output yingyang-complete-test.zip

# Test yin-yang export (separate halves)
curl -X POST http://localhost:5000/api/export/ying-yang \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 150,
    "thickness": 10,
    "separateHalves": true,
    "ledType": "10.5mm",
    "channelDepth": 5,
    "wallThickness": 3,
    "includeDiffuser": true,
    "diffuserType": "flat",
    "includeMounting": false
  }' \
  --output yingyang-separate-test.zip
```

**Expected Output (Complete):**
- yingyang_complete.stl
- diffuser.stl
- mounting.stl (if enabled)
- ASSEMBLY_INSTRUCTIONS.md
- BOM.md

**Expected Output (Separate):**
- yin_half.stl
- yang_half.stl
- border_ring.stl
- diffuser.stl
- ASSEMBLY_INSTRUCTIONS.md
- BOM.md

---

## Test 4: Existing Tabs (Regression Testing)

### Text Tab
- [ ] Enter text: "NEON"
- [ ] Select font
- [ ] Adjust size and spacing
- [ ] Export and verify STL generation

### Freehand Tab
- [ ] Draw a simple shape
- [ ] Adjust tube width
- [ ] Export and verify

### Image Tab
- [ ] Upload a simple image
- [ ] Try "Bubble Letters" mode
- [ ] Try "Shoe String" mode
- [ ] Export and verify

### Primitives Tab
- [ ] Generate a heart shape
- [ ] Generate a star shape
- [ ] Adjust size parameters
- [ ] Export and verify

---

## Test 5: API Endpoint Verification

### Health Check
```bash
curl http://localhost:5000/api/health
```
Expected: `{"status":"ok"}`

### Font List
```bash
curl http://localhost:5000/api/fonts
```
Expected: JSON array of available fonts

### Emoji List
```bash
curl http://localhost:5000/api/emojis
```
Expected: JSON object with emoji categories

---

## Test 6: Tab Count Verification

Open the application and count visible tabs in the editor sidebar:
1. Text
2. Freehand
3. Image
4. Primitives
5. Emoji (NEW)
6. Phrase (NEW)
7. Yin-Yang (NEW)
8. Pet Tags
9. Modular Panels
10. Backing Plates

**Expected Total: 10 tabs**

---

## Test 7: Error Handling

### Invalid Emoji Request
```bash
curl -X POST http://localhost:5000/api/export/emoji-message \
  -H "Content-Type: application/json" \
  -d '{"emojis": []}' \
  --output error-test.zip
```
Expected: Error response (no emojis provided)

### Invalid Phrase Request
```bash
curl -X POST http://localhost:5000/api/export/phrase-sign \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' \
  --output error-test.zip
```
Expected: Error response (empty text)

---

## Success Criteria

✅ All tabs load without errors
✅ All UI controls respond correctly
✅ All export endpoints return valid ZIP files
✅ ZIP files contain expected STL files
✅ Assembly instructions are generated
✅ No console errors in browser
✅ No server errors in terminal

---

## Known Issues to Watch For

1. **Font Loading**: Ensure all 70+ fonts load correctly
2. **LFS Files**: Verify font files download via Git LFS
3. **Memory Usage**: Large emoji grids may use significant memory
4. **Export Time**: Complex phrases with welding may take 10-30 seconds
5. **Browser Compatibility**: Test in Chrome/Edge (primary), Firefox (secondary)

---

## Performance Benchmarks

- Emoji export (4 emojis): < 5 seconds
- Phrase export (5 letters, no welding): < 3 seconds
- Phrase export (5 letters, cursive welding): < 15 seconds
- Yin-Yang export: < 2 seconds
- UI responsiveness: < 100ms for all interactions
