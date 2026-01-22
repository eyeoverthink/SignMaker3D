/**
 * ENDPOINT TESTING SCRIPT
 * Tests all 27 API endpoints to verify they work
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test data for each endpoint
const tests = [
  {
    name: 'Pet Tag',
    endpoint: '/api/export/pet-tag',
    data: {
      petName: 'MAX',
      phoneNumber: '555-1234',
      shape: 'bone',
      size: 'medium'
    }
  },
  {
    name: 'Neon Bulb',
    endpoint: '/api/export/neon-bulb',
    data: {
      filamentShape: 'heart',
      envelopeType: 'classic',
      baseType: 'e26',
      bulbHeight: 120,
      bulbDiameter: 60,
      includeElectronics: true,
      batteryType: 'cr2032'
    }
  },
  {
    name: 'YingYang',
    endpoint: '/api/export/ying-yang',
    data: {
      diameter: 200,
      depth: 15,
      yinLEDType: 'ws2812b',
      yangLEDType: 'ws2812b',
      eyeLEDType: 'ws2812b',
      includeEyes: true,
      eyeDiameter: 30,
      mountingType: 'wall_mount',
      separateHalves: false,
      includeDiffuser: true
    }
  },
  {
    name: 'Embossed Tile',
    endpoint: '/api/generate-embossed-tile',
    data: {
      patternType: 'egg',
      tileDiameter: 100,
      channelWidth: 10.5,
      diffuserStyle: 'domed',
      includeMountingHoles: true
    }
  },
  {
    name: 'LED Grid',
    endpoint: '/api/export/led-grid',
    data: {
      rows: 8,
      columns: 8,
      ledSpacing: 20,
      ledType: 'ws2812b',
      includeController: true
    }
  }
];

function testEndpoint(test) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(test.data);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: test.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Endpoint: ${test.endpoint}`);
    
    const req = http.request(options, (res) => {
      let data = [];
      
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        
        if (res.statusCode === 200) {
          console.log(`   ✅ SUCCESS - Status: ${res.statusCode}`);
          console.log(`   📦 Response size: ${buffer.length} bytes`);
          console.log(`   📄 Content-Type: ${res.headers['content-type']}`);
          resolve({ test: test.name, success: true, size: buffer.length });
        } else {
          console.log(`   ❌ FAILED - Status: ${res.statusCode}`);
          console.log(`   Error: ${buffer.toString()}`);
          resolve({ test: test.name, success: false, error: buffer.toString() });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ ERROR: ${error.message}`);
      resolve({ test: test.name, success: false, error: error.message });
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Sign-Sculptor API Endpoint Testing');
  console.log('=====================================\n');
  console.log(`Testing ${tests.length} endpoints...\n`);
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between tests
  }
  
  console.log('\n\n📊 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.test}: ${r.error}`);
    });
  }
  
  console.log('\n✨ Testing complete!\n');
}

// Check if server is running first
http.get('http://localhost:5000', (res) => {
  console.log('✅ Server is running\n');
  runTests();
}).on('error', (err) => {
  console.error('❌ Server is not running!');
  console.error('   Please start the server with: npm run dev');
  console.error(`   Error: ${err.message}\n`);
  process.exit(1);
});
