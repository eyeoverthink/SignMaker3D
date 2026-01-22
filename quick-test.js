/**
 * Quick single endpoint test
 */

const http = require('http');

function testEndpoint() {
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
  
  console.log('Testing YingYang endpoint...\n');
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}\n`);
    
    let data = [];
    
    res.on('data', (chunk) => {
      data.push(chunk);
    });
    
    res.on('end', () => {
      const buffer = Buffer.concat(data);
      console.log(`Response size: ${buffer.length} bytes`);
      
      if (res.statusCode === 200) {
        console.log('✅ SUCCESS - Endpoint works!');
      } else {
        console.log('❌ FAILED');
        console.log(buffer.toString());
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ ERROR: ${error.message}`);
    console.log('Is the server running? Start with: npm run dev');
  });
  
  req.write(postData);
  req.end();
}

testEndpoint();
