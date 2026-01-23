// FONT NAME TEST - Find the correct font name for Noto Sans Symbols 2
// Try different variations to see which one works

use <NotoSansSymbols2-Regular.ttf>;

// Test different font name variations
// Uncomment ONE at a time and press F5 to see which renders the symbol

// Option 1: With spaces
//text("☯", size=50, font="Noto Sans Symbols 2");

// Option 2: Without spaces
//text("☯", size=50, font="NotoSansSymbols2");

// Option 3: Just family name
//text("☯", size=50, font="Noto Sans Symbols2");

// Option 4: With Regular
//text("☯", size=50, font="Noto Sans Symbols 2 Regular");

// Option 5: Exact filename without extension
text("☯", size=50, font="NotoSansSymbols2-Regular");

// Option 6: Try default (OpenSCAD auto-detects)
//text("☯", size=50);

// If you see the Yin-Yang symbol (☯), that font name works!
// If you see a rectangle/box, try a different option above.
