// Native fetch available in Node.js 22+
const GATEWAY_URL = 'http://localhost:3001/api/evolution/webhook';
const TEST_PAYLOAD = {
  event: 'messages.upsert',
  instance: 'pitoco-loco',
  data: {
    key: {
      remoteJid: '5511999999999@s.whatsapp.net',
      fromMe: false,
      id: 'TEST_MSG_ID'
    },
    message: {
      conversation: 'Oi Pitoco, você está funcionando?'
    },
    pushName: 'Admin'
  }
};

async function testWebhook() {
  console.log('--- WHATSAPP WEBHOOK TEST ---');
  console.log('Target:', GATEWAY_URL);
  
  try {
    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_PAYLOAD)
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.ok && data.status === 'ok') {
      console.log('\n✅ SUCCESS: Gateway processed the webhook!');
      if (data.reply_sent) {
        console.log('🤖 AGENT REPLY:', data.reply || 'Sent');
      }
    } else {
      console.error('\n❌ FAILED: Gateway returned an error.');
    }
  } catch (err) {
    console.error('\n❌ ERROR: Could not connect to gateway.');
    console.error('Check if the gateway container is running on port 3001.');
    console.error('Details:', err.message);
  }
}

testWebhook();
