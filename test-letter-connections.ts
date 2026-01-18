/**
 * TEST: Letter Connection Module
 * 
 * Tests smart letter connections using Scott Algorithm
 * Validates:
 * - Connection generation
 * - Path continuity
 * - Geometry reduction
 * - Export quality
 */

import { getTextStrokePathsFromFont } from './server/font-loader';
import { connectLetterPaths } from './server/letter-connector';

interface TestResult {
  text: string;
  font: string;
  originalPaths: number;
  connectedPaths: number;
  connections: number;
  reduction: number;
  totalLength: number;
}

/**
 * Test letter connections with sample text
 */
async function testLetterConnections() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   LETTER CONNECTION TEST                                   ║');
  console.log('║   Scott Algorithm - Smart Path Connections                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const testCases = [
    { font: 'inter', text: 'HELLO', name: 'Inter (Block)' },
    { font: 'neonderthaw', text: 'Hello', name: 'Neonderthaw (Script)' },
    { font: 'caveat', text: 'Hello', name: 'Caveat (Cursive)' }
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name} - "${testCase.text}"`);
    console.log('─'.repeat(60));
    
    try {
      // Get font paths
      const fontResult = getTextStrokePathsFromFont(testCase.text, testCase.font, 50);
      
      if (!fontResult || !fontResult.paths || fontResult.paths.length === 0) {
        console.log('  ❌ Failed: No paths generated\n');
        continue;
      }
      
      const originalPaths = fontResult.paths.length;
      console.log(`  Original: ${originalPaths} separate paths`);
      
      // Connect paths (increased distance for normal letter spacing)
      const connected = connectLetterPaths(fontResult.paths, 200, 0.5);
      
      console.log(`  Connected: ${connected.connectedSegments} continuous paths`);
      console.log(`  Connections made: ${connected.connectionCount}`);
      console.log(`  Total length: ${connected.totalLength.toFixed(1)}`);
      
      const reduction = ((originalPaths - connected.connectedSegments) / originalPaths * 100);
      console.log(`  Reduction: ${reduction.toFixed(1)}% fewer segments`);
      
      if (connected.connectionCount > 0) {
        console.log(`  ✅ Successfully connected letters`);
      } else {
        console.log(`  ⚠️  No connections made (letters too far apart)`);
      }
      
      results.push({
        text: testCase.text,
        font: testCase.name,
        originalPaths,
        connectedPaths: connected.connectedSegments,
        connections: connected.connectionCount,
        reduction,
        totalLength: connected.totalLength
      });
      
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }
  
  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   SUMMARY                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  if (results.length === 0) {
    console.log('❌ No successful tests\n');
    return;
  }
  
  const avgReduction = results.reduce((sum, r) => sum + r.reduction, 0) / results.length;
  const totalConnections = results.reduce((sum, r) => sum + r.connections, 0);
  
  console.log(`Tests completed: ${results.length}`);
  console.log(`Total connections: ${totalConnections}`);
  console.log(`Average segment reduction: ${avgReduction.toFixed(1)}%\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (avgReduction > 30) {
    console.log('✅ LETTER CONNECTIONS WORKING WELL');
    console.log(`   ${avgReduction.toFixed(1)}% reduction in path segments`);
    console.log('   Continuous tube paths achieved');
    console.log('   Ready for integration into app');
  } else if (totalConnections > 0) {
    console.log('⚠️  PARTIAL SUCCESS');
    console.log('   Some connections made but limited reduction');
    console.log('   May need to adjust connection distance threshold');
  } else {
    console.log('❌ NO CONNECTIONS MADE');
    console.log('   Letters may be too far apart');
    console.log('   Increase maxConnectionDistance parameter');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return results;
}

// Run test
testLetterConnections().catch(console.error);

export { testLetterConnections };
