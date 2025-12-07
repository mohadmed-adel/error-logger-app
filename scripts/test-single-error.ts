/**
 * Test script to post a single error log
 * Run with: tsx scripts/test-single-error.ts
 */

async function sendError() {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  
  const errorData = {
    message: "Error message 5",
    stack: "Error: Stack trace\n    at Function.error (/app/logger.js:45:10)",
    level: "error",
    metadata: {
      service: "my-service",
      version: "1.0.0",
      environment: "production"
    },
    serverUrl: "https://example.com",
    userId: "12",
    userSecretKey: "DSKLDJALSKDNAS;KDNASK;DNMLAKSDNKALSN"
  };

  try {
    console.log('🚀 Sending error to API...\n');
    console.log(`📡 API URL: ${API_URL}\n`);
    console.log('📦 Error data:', JSON.stringify(errorData, null, 2));
    console.log('');

    const response = await fetch(`${API_URL}/api/errors/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Error logged successfully!');
      console.log(`   Error ID: ${data.id}`);
      console.log(`   Created at: ${data.createdAt}`);
      console.log('\n📊 Full response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Failed to log error');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error: any) {
    console.error('❌ Network error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
sendError().catch(console.error);

