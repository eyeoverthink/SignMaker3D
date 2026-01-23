@echo off
echo ========================================
echo Simple Fix: Remove Large Files and Use Git LFS
echo ========================================
echo.

REM First, let's see what we're dealing with
echo Current situation:
echo - You have 4 commits ahead of origin
echo - Two large zip files are blocking the push
echo.

REM Option 1: Remove the problematic commits and start fresh
echo OPTION 1: Reset to origin and recommit (RECOMMENDED)
echo This will discard your 4 local commits and start fresh with LFS
echo.
echo Press 1 for this option
echo.

REM Option 2: Try to fix the existing commits
echo OPTION 2: Fix existing commits (more complex)
echo This will rewrite git history to remove large files
echo.
echo Press 2 for this option
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" goto option1
if "%choice%"=="2" goto option2
echo Invalid choice
pause
exit /b 1

:option1
echo.
echo Resetting to origin/main...
git reset --hard origin/main
echo.
echo Setting up Git LFS...
git lfs install
git lfs track "server/fonts/**/*.ttf"
git lfs track "server/fonts/**/*.woff"
git lfs track "server/fonts/**/*.woff2"
git lfs track "server/fonts/**/*.otf"
echo.
echo Adding files...
git add .gitattributes
git add "server\emoji-message-generator.ts"
git add "server\routes.ts"
git add package.json
git add package-lock.json
echo.
echo Adding fonts (this may take a while)...
git add server/fonts/
echo.
echo Committing...
git commit -m "Add emoji generator updates, TypeScript fixes, and font library via Git LFS"
echo.
echo Pushing...
git push
echo.
echo Done!
pause
exit /b 0

:option2
echo.
echo Removing large files from history...
git filter-branch -f --index-filter "git rm --cached --ignore-unmatch FONTS/noto-emoji-main.zip FONTS/Sign-Sculptor* 2>nul" HEAD
echo.
echo Setting up Git LFS...
git lfs install
git lfs track "server/fonts/**/*.ttf"
git lfs track "server/fonts/**/*.woff"
git lfs track "server/fonts/**/*.woff2"
git lfs track "server/fonts/**/*.otf"
git add .gitattributes
echo.
echo Force pushing...
git push --force
echo.
echo Done!
pause
exit /b 0
