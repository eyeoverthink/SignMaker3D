@echo off
echo Committing changes...
git commit -m "Add sonner package, fix TypeScript errors, update emoji generator, and add extensive font library"
echo.
echo Current status:
git status
echo.
echo Ready to push? Press any key to continue or Ctrl+C to cancel...
pause
echo.
echo Pushing to origin...
git push
echo.
echo Done!
pause
