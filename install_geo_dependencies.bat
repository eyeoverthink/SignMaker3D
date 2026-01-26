@echo off
echo ========================================
echo  Geographic Sign Generator Setup
echo ========================================
echo.
echo Installing required Python packages...
echo.

pip install numpy numpy-stl scipy Pillow

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Testing dependencies...
python test_geo_sign.py

pause
