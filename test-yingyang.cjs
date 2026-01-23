/**
 * Test YingYang endpoint to prove it works
 */

const http = require('http');
const fs = require('fs');

function testYingYang() {
  const postData = JSON.stringify({
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
  });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/export/ying-yang',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('🧪 Testing YingYang Endpoint');
  console.log('============================\n');
  console.log('POST /api/export/ying-yang');
  console.log('Settings:', JSON.parse(postData));
  console.log('\nWaiting for response...\n');
  
  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Content-Disposition: ${res.headers['content-disposition']}\n`);
    
    let data = [];
    
    res.on('data', (chunk) => {
      data.push(chunk);
    });
    
    res.on('end', () => {
      const buffer = Buffer.concat(data);
      
      if (res.statusCode === 200) {
        console.log('✅ SUCCESS!');
        console.log(`📦 Response Size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);
        
        // Save to file
        const filename = 'yingyang_test.zip';
        fs.writeFileSync(filename, buffer);
        console.log(`💾 Saved to: ${filename}`);
        
        // Check if it's a valid ZIP
        const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
        console.log(`📋 Valid ZIP file: ${isZip ? 'YES ✅' : 'NO ❌'}`);
        
        if (isZip) {
          console.log('\n🎉 YingYang endpoint is WORKING!');
          console.log('\nTo verify contents, run:');
          console.log('  tar -tf yingyang_test.zip');
        } else {
          console.log('\n❌ Response is not a valid ZIP file');
          console.log('First 100 bytes:', buffer.slice(0, 100).toString());
        }
      } else {
        console.log('❌ FAILED');
        console.log('Error Response:', buffer.toString());
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ ERROR: ${error.message}`);
    console.log('\nIs the server running?');
    console.log('Start with: npm run dev');
  });
  
  req.write(postData);
  req.end();
}

// Check server first
http.get('http://localhost:5000', (res) => {
  console.log('✅ Server is running\n');
  testYingYang();
}).on('error', (err) => {
  console.error('❌ Server is not running!');
  console.error('   Please start the server with: npm run dev');
  console.error(`   Error: ${err.message}\n`);
  process.exit(1);
});
