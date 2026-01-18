/**
 * TEST RUNNER: Inverted Contrast (Yin-Yang) Theory
 * Empirical validation of dual-contrast facial detection
 */

import { benchmarkInvertedContrast, generateTestImages } from './server/scott-inverted-contrast';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   SCOTT ALGORITHM: YIN-YANG CONTRAST TEST                 ║');
console.log('║   Testing: Left Eye (Normal) vs Right Eye (Inverted)      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Generating synthetic test images with varying lighting...\n');

// Generate 50 test images with different lighting conditions
const testImages = generateTestImages(50);

console.log(`Generated ${testImages.length} test images\n`);
console.log('Running benchmark comparing three methods:');
console.log('  1. Standard (single threshold)');
console.log('  2. Inverted (flipped threshold)');
console.log('  3. Yin-Yang (dual contrast)\n');

// Run benchmark
const results = benchmarkInvertedContrast(testImages);

// Summary
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   FINAL ANALYSIS                                           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (results.improvement > 0) {
  console.log('✅ YIN-YANG METHOD WINS!');
  console.log(`   ${results.improvement.toFixed(1)}% improvement over standard method`);
  console.log(`   ${results.yinYang.detections} successful detections`);
  console.log(`   ${(results.yinYang.accuracy * 100).toFixed(1)}% average confidence\n`);
} else {
  console.log('⚠️  Standard method performed better');
  console.log(`   Yin-Yang needs refinement\n`);
}

console.log('📊 DETECTION RATES:');
console.log(`   Standard: ${results.standard.detections}/${testImages.length} (${(results.standard.detections / testImages.length * 100).toFixed(1)}%)`);
console.log(`   Inverted: ${results.inverted.detections}/${testImages.length} (${(results.inverted.detections / testImages.length * 100).toFixed(1)}%)`);
console.log(`   Yin-Yang: ${results.yinYang.detections}/${testImages.length} (${(results.yinYang.detections / testImages.length * 100).toFixed(1)}%)\n`);

console.log('⚡ SPEED COMPARISON:');
console.log(`   Standard: ${results.standard.avgTime.toFixed(2)}ms`);
console.log(`   Inverted: ${results.inverted.avgTime.toFixed(2)}ms`);
console.log(`   Yin-Yang: ${results.yinYang.avgTime.toFixed(2)}ms\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 CONCLUSION:');

if (results.improvement > 5) {
  console.log('   The Yin-Yang theory is VALIDATED.');
  console.log('   Inverted contrast significantly improves facial detection.');
  console.log('   Recommendation: Integrate into production system.');
} else if (results.improvement > 0) {
  console.log('   The Yin-Yang theory shows promise.');
  console.log('   Minor improvement detected.');
  console.log('   Recommendation: Further testing with real images.');
} else {
  console.log('   The Yin-Yang theory needs refinement.');
  console.log('   Standard method currently more reliable.');
  console.log('   Recommendation: Analyze failure cases and adjust algorithm.');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

export { results };
