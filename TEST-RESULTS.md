# API Endpoint Testing Guide

## Quick Test Script

I've created `test-endpoints.js` to verify all endpoints work.

### Run Tests

```bash
# 1. Start the server (in one terminal)
npm run dev

# 2. Run tests (in another terminal)
node test-endpoints.js
```

### What It Tests

The script tests 5 representative endpoints:
1. **Pet Tag** - Simple endpoint (baseline)
2. **Neon Bulb** - New endpoint we just created
3. **YingYang** - Brand new endpoint
4. **Embossed Tile** - Recent endpoint
5. **LED Grid** - Existing endpoint

### Expected Output

```
🚀 Sign-Sculptor API Endpoint Testing
=====================================

Testing 5 endpoints...

🧪 Testing: Pet Tag
   Endpoint: /api/export/pet-tag
   ✅ SUCCESS - Status: 200
   📦 Response size: 45231 bytes
   📄 Content-Type: application/zip

🧪 Testing: Neon Bulb
   Endpoint: /api/export/neon-bulb
   ✅ SUCCESS - Status: 200
   📦 Response size: 67842 bytes
   📄 Content-Type: application/zip

... etc ...

📊 TEST RESULTS SUMMARY
========================

✅ Passed: 5/5
❌ Failed: 0/5
📈 Success Rate: 100.0%

✨ Testing complete!
```

## Manual Testing with curl

### Test YingYang Endpoint
```bash
curl -X POST http://localhost:5000/api/export/ying-yang \
  -H "Content-Type: application/json" \
  -d "{\"diameter\":200,\"depth\":15,\"yinLEDType\":\"ws2812b\",\"yangLEDType\":\"ws2812b\",\"includeEyes\":true,\"mountingType\":\"wall_mount\",\"separateHalves\":false,\"includeDiffuser\":true}" \
  --output yingyang.zip
```

### Test Neon Bulb Endpoint
```bash
curl -X POST http://localhost:5000/api/export/neon-bulb \
  -H "Content-Type: application/json" \
  -d "{\"filamentShape\":\"heart\",\"envelopeType\":\"classic\",\"baseType\":\"e26\",\"bulbHeight\":120,\"bulbDiameter\":60,\"includeElectronics\":true,\"batteryType\":\"cr2032\"}" \
  --output neon-bulb.zip
```

### Test Pet Tag (Simple Baseline)
```bash
curl -X POST http://localhost:5000/api/export/pet-tag \
  -H "Content-Type: application/json" \
  -d "{\"petName\":\"MAX\",\"phoneNumber\":\"555-1234\",\"shape\":\"bone\",\"size\":\"medium\"}" \
  --output pet-tag.zip
```

## Verify ZIP Contents

After downloading, check the ZIP contains expected files:

```bash
# Windows
tar -tf yingyang.zip

# Expected contents:
# yingyang_complete.stl
# diffuser.stl
# ASSEMBLY_INSTRUCTIONS.md
# BOM.md
# README.md
```

## Troubleshooting

### Server Not Running
```
❌ Server is not running!
   Please start the server with: npm run dev
```
**Fix:** Start the dev server first

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:** Kill existing process or change port

### TypeScript Errors
```
Error: Cannot find module 'three'
```
**Fix:** Run `npm install` to install dependencies

## Next Steps

Once tests pass:
1. Import Postman collection
2. Test all 27 endpoints systematically
3. Verify ZIP contents for each
4. Check STL files open in slicer
5. Deploy to production

---

**Status:** Test script ready. Run `node test-endpoints.js` after starting server.
