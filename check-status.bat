@echo off
echo Checking git status...
echo.
git status
echo.
echo Checking if push succeeded...
git log --oneline -3
echo.
echo Checking commits ahead of origin...
git rev-list --count origin/main..HEAD
echo.
pause
