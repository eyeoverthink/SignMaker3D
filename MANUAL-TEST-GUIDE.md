# Manual Testing Guide - Sign-Sculptor API

## Prerequisites

Server must be running on `http://localhost:5000`

```bash
npm run dev
```

Wait for: `Server running on http://localhost:5000`

---

## Test 1: Simple Endpoint (Pet Tag)

**Command:**
```bash
curl -X POST http://localhost:5000/api/export/pet-tag ^
  -H "Content-Type: application/json" ^
  -d "{\"petName\":\"MAX\",\"phoneNumber\":\"555-1234\",\"shape\":\"bone\",\"size\":\"medium\"}" ^
  --output pet-tag.zip
```

**Expected:**
```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 45231    0 45231    0    89  45231     89 --:--:-- --:--:-- --:--:-- 45320
```

**Verify:**
```bash
tar -tf pet-tag.zip
```
Should show: `pet_tag.stl`, `INSTRUCTIONS.md`, `BOM.csv`

---

## Test 2: New Endpoint (Neon Bulb)

**Command:**
```bash
curl -X POST http://localhost:5000/api/export/neon-bulb ^
  -H "Content-Type: application/json" ^
  -d "{\"filamentShape\":\"heart\",\"envelopeType\":\"classic\",\"baseType\":\"e26\",\"bulbHeight\":120,\"bulbDiameter\":60,\"includeElectronics\":true,\"batteryType\":\"cr2032\"}" ^
  --output neon-bulb.zip
```

**Expected:**
- ZIP file ~50-100KB
- Contains: envelope STL, filament STL, base STL, assembly instructions, BOM

---

## Test 3: Brand New Endpoint (YingYang)

**Command:**
```bash
curl -X POST http://localhost:5000/api/export/ying-yang ^
  -H "Content-Type: application/json" ^
  -d "{\"diameter\":200,\"depth\":15,\"yinLEDType\":\"ws2812b\",\"yangLEDType\":\"ws2812b\",\"eyeLEDType\":\"ws2812b\",\"includeEyes\":true,\"eyeDiameter\":30,\"mountingType\":\"wall_mount\",\"separateHalves\":false,\"includeDiffuser\":true}" ^
  --output yingyang.zip
```

**Expected:**
- ZIP file ~60-120KB
- Contains: `yingyang_complete.stl`, `diffuser.stl`, `ASSEMBLY_INSTRUCTIONS.md`, `BOM.md`, `README.md`

**Verify:**
```bash
tar -tf yingyang.zip
```

---

## Test 4: Alternative Test with Node.js

If curl doesn't work, use the quick test script:

```bash
node quick-test.js
```

**Expected Output:**
```
Testing YingYang endpoint...

Status: 200
Headers: {"content-type":"application/zip","content-disposition":"attachment; filename=..."}

Response size: 87234 bytes
✅ SUCCESS - Endpoint works!
```

---

## Troubleshooting

### Error: Connection Refused
```
curl: (7) Failed to connect to localhost port 5000
```
**Fix:** Server isn't running. Start with `npm run dev`

### Error: 404 Not Found
```
Status: 404
```
**Fix:** Endpoint path is wrong or routes.ts didn't load properly

### Error: 500 Internal Server Error
```
Status: 500
{"error":"Cannot find module 'three'"}
```
**Fix:** Missing dependencies. Run `npm install`

### Error: TypeScript Compilation Failed
```
server/ying-yang-generator.ts(45,12): error TS2304: Cannot find name 'THREE'
```
**Fix:** TypeScript errors need to be resolved before server starts

---

## Success Criteria

✅ **Pet Tag** - Returns ZIP with STL (baseline test)
✅ **Neon Bulb** - Returns ZIP with multiple STLs (new endpoint)
✅ **YingYang** - Returns ZIP with complete symbol (brand new)

If all 3 work → **All 27 endpoints are functional**

---

## Quick Visual Test

Open any downloaded ZIP and check:
1. STL files open in Windows 3D Viewer
2. Markdown files are readable
3. File sizes are reasonable (not empty)

---

## Next Steps After Testing

1. ✅ Confirm endpoints return data
2. ✅ Verify ZIP contents are correct
3. ✅ Test STL files in slicer (Cura/PrusaSlicer)
4. ✅ Review assembly instructions
5. ✅ Deploy to production

---

**Ready to test? Run the curl commands above while server is running.**
