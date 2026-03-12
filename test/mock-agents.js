#!/usr/bin/env node
/**
 * Mock Test for OpenClaw Gateway Events
 * Simulates 7 agents firing events simultaneously
 */

const TEST_AGENTS = [
  { id: 'main', name: '司礼监', color: '#ff006e' },
  { id: 'bingbu', name: '兵部', color: '#00f5ff' },
  { id: 'gongbu', name: '工部', color: '#ffbe0b' },
  { id: 'hubu', name: '户部', color: '#39ff14' },
  { id: 'libu', name: '礼部', color: '#9d4edd' },
  { id: 'libu2', name: '吏部', color: '#ff9500' },
  { id: 'xingbu', name: '刑部', color: '#00d9a5' }
];

async function sendMockEvent(agent, phase = 'start') {
  const payload = {
    stream: 'lifecycle',
    runId: `test_${agent.id}_${Date.now()}`,
    data: { phase, startedAt: Date.now() },
    sessionKey: `agent:${agent.id}:discord:channel:test123`
  };
  
  console.log(`[MOCK] Sending: agent=${agent.id}, phase=${phase}`);
  
  try {
    const res = await fetch('http://localhost:4200/api/openclaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });
    return res.ok;
  } catch (e) {
    console.error(`[MOCK] Failed for ${agent.id}:`, e.message);
    return false;
  }
}

async function runConcurrentTest() {
  console.log('=== Concurrent Agents Test ===');
  console.log(`Testing ${TEST_AGENTS.length} agents simultaneously...\n`);
  
  // Fire all agents at once
  const promises = TEST_AGENTS.map(agent => sendMockEvent(agent, 'start'));
  const results = await Promise.all(promises);
  
  console.log(`\nResults: ${results.filter(r => r).length}/${TEST_AGENTS.length} succeeded`);
  
  // Wait for animations
  await new Promise(r => setTimeout(r, 3000));
  
  // Send end events
  console.log('\n=== Sending End Events ===');
  const endPromises = TEST_AGENTS.map(agent => sendMockEvent(agent, 'end'));
  await Promise.all(endPromises);
  
  console.log('\n=== Test Complete ===');
  console.log('Check database: SELECT agent, COUNT(*) FROM events GROUP BY agent;');
}

// Run test
runConcurrentTest().catch(console.error);
