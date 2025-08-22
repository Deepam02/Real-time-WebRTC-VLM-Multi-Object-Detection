#!/usr/bin/env node

const fetch = require('node-fetch');

async function testHealthCheck() {
  try {
    console.log('Testing backend health check...');
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Backend health check passed:', data);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function testSessionCreation() {
  try {
    console.log('Testing session creation...');
    const response = await fetch('http://localhost:3001/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('✅ Session creation passed:', data);
    return data.sessionId;
  } catch (error) {
    console.log('❌ Session creation failed:', error.message);
    return null;
  }
}

async function testSessionRetrieval(sessionId) {
  try {
    console.log('Testing session retrieval...');
    const response = await fetch(`http://localhost:3001/session/${sessionId}`);
    const data = await response.json();
    console.log('✅ Session retrieval passed:', data);
    return true;
  } catch (error) {
    console.log('❌ Session retrieval failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running WebRTC Backend Tests...\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Backend is not running. Please start it with: npm start');
    return;
  }
  
  const sessionId = await testSessionCreation();
  if (!sessionId) {
    console.log('\n❌ Session creation failed');
    return;
  }
  
  const sessionOk = await testSessionRetrieval(sessionId);
  if (!sessionOk) {
    console.log('\n❌ Session retrieval failed');
    return;
  }
  
  console.log('\n🎉 All backend tests passed!');
  console.log('\n📝 Next steps:');
  console.log('1. Visit http://localhost:3000 in your browser');
  console.log('2. Create a new session');
  console.log('3. Scan the QR code with your phone');
  console.log('4. Test the video streaming!');
}

if (require.main === module) {
  runTests().catch(console.error);
}
