@echo off
echo ========================================
echo Git LFS Setup for Large Font Files
echo ========================================
echo.

REM Step 1: Remove problematic large zip files from FONTS
echo Step 1: Removing large zip files from FONTS directory...
if exist "FONTS\noto-emoji-main.zip" (
    echo Deleting FONTS\noto-emoji-main.zip (211MB)
    del "FONTS\noto-emoji-main.zip"
)
if exist "FONTS\Sign-Sculptor (23).zip" (
    echo Deleting "FONTS\Sign-Sculptor (23).zip" (844MB)
    del "FONTS\Sign-Sculptor (23).zip"
)
echo.

REM Step 2: Check if Git LFS is installed
echo Step 2: Checking Git LFS installation...
git lfs version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git LFS is not installed!
    echo.
    echo Please install Git LFS from: https://git-lfs.github.com/
    echo After installing, run this script again.
    pause
    exit /b 1
)
echo Git LFS is installed!
echo.

REM Step 3: Initialize Git LFS in this repo
echo Step 3: Initializing Git LFS...
git lfs install
echo.

REM Step 4: Track font files with LFS
echo Step 4: Configuring LFS to track font files...
git lfs track "server/fonts/**/*.ttf"
git lfs track "server/fonts/**/*.woff"
git lfs track "server/fonts/**/*.woff2"
git lfs track "server/fonts/**/*.otf"
git lfs track "*.zip"
echo.

REM Step 5: Add .gitattributes
echo Step 5: Adding .gitattributes...
git add .gitattributes
echo.

REM Step 6: Add modified files
echo Step 6: Adding code changes...
git add "server\emoji-message-generator.ts"
echo.

REM Step 7: Add font directories
echo Step 7: Adding font directories (this may take a while)...
git add server/fonts/
echo.

REM Step 8: Commit
echo Step 8: Committing changes...
git commit -m "Add Git LFS support and font files"
echo.

REM Step 9: Push
echo Step 9: Pushing to origin (LFS will upload large files separately)...
git push
echo.

echo ========================================
echo Done! All files pushed successfully.
echo ========================================
pause
