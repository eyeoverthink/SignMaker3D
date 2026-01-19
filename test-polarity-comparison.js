// Compare simple vs complex polarity detection
import { createCanvas } from 'canvas';

// Simulate a black icon on white background (like your dinosaur/laptop/etc)
const width = 200;
const height = 200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// White background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, width, height);

// Black icon shape (simple rectangle for testing)
ctx.fillStyle = 'black';
ctx.fillRect(50, 50, 100, 100);

const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data;

console.log('\n=== POLARITY DETECTION COMPARISON ===\n');

// METHOD 1: Simple (Scott Proof Demo style - no alpha checking)
console.log('METHOD 1: Simple (no alpha checking)');
const grayValues1 = new Uint8Array(width * height);
for (let i = 0; i < width * height; i++) {
  grayValues1[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
}

let darkPixels1 = 0;
for (let i = 0; i < grayValues1.length; i++) {
  if (grayValues1[i] < 128) darkPixels1++;
}
const isDarkOnLight1 = darkPixels1 < grayValues1.length / 2;

console.log(`  Total pixels: ${width * height}`);
console.log(`  Dark pixels: ${darkPixels1}`);
console.log(`  Detected as: ${isDarkOnLight1 ? 'dark-on-light' : 'light-on-dark'}`);

const binary1 = new Uint8Array(width * height);
for (let i = 0; i < width * height; i++) {
  binary1[i] = isDarkOnLight1 
    ? (grayValues1[i] < 128 ? 1 : 0)
    : (grayValues1[i] > 128 ? 1 : 0);
}
const foreground1 = binary1.filter(v => v === 1).length;
console.log(`  Foreground pixels: ${foreground1}`);

// METHOD 2: Complex (Current Image Tracer - with alpha checking)
console.log('\nMETHOD 2: Complex (with alpha checking)');
let darkPixels2 = 0;
let opaquePixels2 = 0;
for (let i = 0; i < width * height; i++) {
  const alpha = data[i * 4 + 3];
  if (alpha > 128) {
    opaquePixels2++;
    const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    if (gray < 128) darkPixels2++;
  }
}

const isDarkOnLight2 = opaquePixels2 > 0 && darkPixels2 < (opaquePixels2 / 2);

console.log(`  Opaque pixels: ${opaquePixels2}`);
console.log(`  Dark pixels: ${darkPixels2}`);
console.log(`  Detected as: ${isDarkOnLight2 ? 'dark-on-light' : 'light-on-dark'}`);

const binary2 = new Uint8Array(width * height);
for (let i = 0; i < width * height; i++) {
  const alpha = data[i * 4 + 3];
  if (alpha < 128) {
    binary2[i] = 0;
  } else {
    const gray = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    if (isDarkOnLight2) {
      binary2[i] = gray < 128 ? 1 : 0;
    } else {
      binary2[i] = gray >= 128 ? 1 : 0;
    }
  }
}
const foreground2 = binary2.filter(v => v === 1).length;
console.log(`  Foreground pixels: ${foreground2}`);

console.log('\n=== RESULTS ===');
console.log(`Method 1 foreground: ${foreground1}`);
console.log(`Method 2 foreground: ${foreground2}`);
console.log(`Match: ${foreground1 === foreground2 ? 'YES ✓' : 'NO ✗'}`);

if (foreground1 !== foreground2) {
  console.log(`\nDifference: ${Math.abs(foreground1 - foreground2)} pixels`);
}
