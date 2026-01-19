@echo off
echo Copying Neonderthaw font...
copy "..\server\fonts\neonderthaw-v8-latin-regular.otf" "Neonderthaw.otf"
echo.
echo Running font-extract.py...
python font-extract.py
echo.
echo Done! Check the Custom_Font_Alphabet folder.
pause
