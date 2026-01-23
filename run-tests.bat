@echo off
echo ========================================
echo Sign-Sculptor Feature Testing Suite
echo ========================================
echo.
echo This will test all new features with curl commands.
echo Make sure the dev server is running on http://localhost:5000
echo.
echo Press Ctrl+C to cancel, or
pause
echo.

REM Create test output directory
if not exist "test-outputs" mkdir test-outputs

echo Testing server health...
curl -s http://localhost:5000/api/health
echo.
echo.

echo ========================================
echo Test 1: Emoji Message Export
echo ========================================
curl -X POST http://localhost:5000/api/export/emoji-message -H "Content-Type: application/json" -d "{\"emojis\":[\"😊\",\"❤️\",\"🎉\",\"🔥\"],\"layout\":\"grid\",\"gridColumns\":2,\"spacing\":20,\"emojiSize\":50,\"ledType\":\"10.5mm\",\"signHeight\":15,\"wallThickness\":3,\"baseThickness\":3,\"wireHoleSpacing\":50,\"includeBorder\":true,\"borderWidth\":10,\"borderPadding\":15}" --output test-outputs/emoji-message-test.zip
if exist "test-outputs\emoji-message-test.zip" (
    echo ✓ Emoji message export SUCCESS
) else (
    echo ✗ Emoji message export FAILED
)
echo.

echo ========================================
echo Test 2: Phrase Sign Export (No Welding)
echo ========================================
curl -X POST http://localhost:5000/api/export/phrase-sign -H "Content-Type: application/json" -d "{\"text\":\"HELLO\",\"font\":\"Architects Daughter\",\"weldingMode\":\"none\",\"includeBorder\":true,\"borderType\":\"rounded\",\"borderWidth\":10,\"borderPadding\":20,\"borderRadius\":10,\"ledType\":\"10.5mm\",\"signHeight\":15,\"wallThickness\":3,\"baseThickness\":3,\"wireHoleSpacing\":50,\"diffuserType\":\"flat\"}" --output test-outputs/phrase-no-weld-test.zip
if exist "test-outputs\phrase-no-weld-test.zip" (
    echo ✓ Phrase export (no welding) SUCCESS
) else (
    echo ✗ Phrase export (no welding) FAILED
)
echo.

echo ========================================
echo Test 3: Phrase Sign Export (Cursive Welding)
echo ========================================
echo NOTE: This may take 15-30 seconds...
curl -X POST http://localhost:5000/api/export/phrase-sign -H "Content-Type: application/json" -d "{\"text\":\"LOVE\",\"font\":\"Architects Daughter\",\"weldingMode\":\"cursive\",\"weldingGap\":2,\"smoothingLevel\":5,\"includeBorder\":true,\"borderType\":\"rounded\",\"borderWidth\":10,\"borderPadding\":20,\"borderRadius\":10,\"ledType\":\"10.5mm\",\"signHeight\":15,\"wallThickness\":3,\"baseThickness\":3,\"wireHoleSpacing\":50,\"diffuserType\":\"flat\"}" --output test-outputs/phrase-cursive-test.zip
if exist "test-outputs\phrase-cursive-test.zip" (
    echo ✓ Phrase export (cursive welding) SUCCESS
) else (
    echo ✗ Phrase export (cursive welding) FAILED
)
echo.

echo ========================================
echo Test 4: Yin-Yang Complete Symbol
echo ========================================
curl -X POST http://localhost:5000/api/export/ying-yang -H "Content-Type: application/json" -d "{\"diameter\":150,\"thickness\":10,\"separateHalves\":false,\"ledType\":\"10.5mm\",\"channelDepth\":5,\"wallThickness\":3,\"includeDiffuser\":true,\"diffuserType\":\"domed\",\"includeMounting\":true,\"mountingHoles\":4}" --output test-outputs/yingyang-complete-test.zip
if exist "test-outputs\yingyang-complete-test.zip" (
    echo ✓ Yin-Yang complete export SUCCESS
) else (
    echo ✗ Yin-Yang complete export FAILED
)
echo.

echo ========================================
echo Test 5: Yin-Yang Separate Halves
echo ========================================
curl -X POST http://localhost:5000/api/export/ying-yang -H "Content-Type: application/json" -d "{\"diameter\":150,\"thickness\":10,\"separateHalves\":true,\"ledType\":\"10.5mm\",\"channelDepth\":5,\"wallThickness\":3,\"includeDiffuser\":true,\"diffuserType\":\"flat\",\"includeMounting\":false}" --output test-outputs/yingyang-separate-test.zip
if exist "test-outputs\yingyang-separate-test.zip" (
    echo ✓ Yin-Yang separate halves export SUCCESS
) else (
    echo ✗ Yin-Yang separate halves export FAILED
)
echo.

echo ========================================
echo Test Results Summary
echo ========================================
echo.
echo Check the test-outputs folder for generated ZIP files.
echo Extract them to verify STL files and assembly instructions.
echo.
dir test-outputs
echo.
echo ========================================
echo Testing Complete!
echo ========================================
pause
