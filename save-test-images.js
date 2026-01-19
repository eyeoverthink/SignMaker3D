// Quick script to save the 5 test images you uploaded
// Run this first, then run test-scott-tracing.js

const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'test-images');

// Create directory if it doesn't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
  console.log('✅ Created test-images directory');
}

console.log('\n📁 Test images directory ready:', testDir);
console.log('\n📝 Instructions:');
console.log('1. Save the 5 test images (alien, brain, phone, clock, dice) to:');
console.log('   ' + testDir);
console.log('2. Name them: alien.png, brain.png, phone.png, clock.png, dice.png');
console.log('3. Run: node test-scott-tracing.js');
console.log('\nThe test will trace all images and save results as *_traced.png\n');
