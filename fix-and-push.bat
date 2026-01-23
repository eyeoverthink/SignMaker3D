@echo off
echo ========================================
echo Fixing Large File Issues and Setting Up Git LFS
echo ========================================
echo.

REM Step 1: Remove large files from git history
echo Step 1: Removing large zip files from git history...
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch 'FONTS/noto-emoji-main.zip' 'FONTS/Sign-Sculptor (23).zip'" --prune-empty --tag-name-filter cat -- --all
echo.

REM Step 2: Clean up refs
echo Step 2: Cleaning up...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo.

REM Step 3: Initialize Git LFS
echo Step 3: Setting up Git LFS...
git lfs install
echo.

REM Step 4: Track font files with LFS
echo Step 4: Configuring LFS to track font files...
git lfs track "server/fonts/**/*.ttf"
git lfs track "server/fonts/**/*.woff"
git lfs track "server/fonts/**/*.woff2"
git lfs track "server/fonts/**/*.otf"
echo.

REM Step 5: Add .gitattributes
echo Step 5: Adding .gitattributes...
git add .gitattributes
git commit -m "Add Git LFS configuration for font files"
echo.

REM Step 6: Add code changes
echo Step 6: Adding remaining code changes...
git add "server\emoji-message-generator.ts"
git commit -m "Update emoji message generator"
echo.

REM Step 7: Add font directories through LFS
echo Step 7: Adding font directories (LFS will handle large files)...
git add server/fonts/
git commit -m "Add font files via Git LFS"
echo.

REM Step 8: Force push (required after filter-branch)
echo Step 8: Force pushing to origin...
echo WARNING: This will rewrite git history. Press Ctrl+C to cancel or
pause
git push --force
echo.

echo ========================================
echo Done! Check output above for any errors.
echo ========================================
pause
