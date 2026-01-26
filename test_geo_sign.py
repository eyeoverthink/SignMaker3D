"""
Quick test script to verify geo-sign-generator dependencies.
Run this before launching the GUI to check if everything is installed.
"""

import sys

print("Testing Geographic Sign Generator dependencies...\n")

# Test 1: Core libraries
try:
    import tkinter as tk
    print("✓ tkinter - OK")
except ImportError:
    print("✗ tkinter - MISSING (should be built-in with Python)")

try:
    from PIL import Image, ImageTk
    print("✓ Pillow (PIL) - OK")
except ImportError:
    print("✗ Pillow - MISSING")
    print("  Install: pip install Pillow")

# Test 2: STL processing
try:
    import numpy as np
    print("✓ numpy - OK")
except ImportError:
    print("✗ numpy - MISSING")
    print("  Install: pip install numpy")

try:
    from stl import mesh
    print("✓ numpy-stl - OK")
except ImportError:
    print("✗ numpy-stl - MISSING")
    print("  Install: pip install numpy-stl")

try:
    from scipy.interpolate import griddata
    print("✓ scipy - OK")
except ImportError:
    print("✗ scipy - MISSING")
    print("  Install: pip install scipy")

# Test 3: Custom module
try:
    from stl_to_heightmap import STLToHeightmap
    print("✓ stl_to_heightmap module - OK")
except ImportError as e:
    print(f"✗ stl_to_heightmap - MISSING")
    print(f"  Error: {e}")

print("\n" + "="*50)
print("Dependency check complete!")
print("="*50)

# Check if all critical dependencies are available
critical_missing = []
try:
    import numpy
    from stl import mesh
    from scipy.interpolate import griddata
    from PIL import Image
    from stl_to_heightmap import STLToHeightmap
except ImportError as e:
    critical_missing.append(str(e))

if critical_missing:
    print("\n⚠️  CRITICAL: Some dependencies are missing!")
    print("\nQuick fix - run this command:")
    print("pip install numpy numpy-stl scipy Pillow")
    sys.exit(1)
else:
    print("\n✅ All dependencies installed!")
    print("\nYou can now run:")
    print("python geo-sign-generator.py")
    sys.exit(0)
