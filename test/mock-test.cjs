#!/usr/bin/env node
/**
 * Mock Gateway Test - Simulates concurrent agent events
 */

const http = require('http');

const TEST_AGENTS = [
  { id: 'main', name: '司礼监', delay: 0 },
  { id: 'bingbu', name: '兵部', delay: 100 },
  { id: 'gongbu', name: '工部', delay: 200 },
  { id: 'hubu', name: '户部', delay: 300 },
  { id: 'libu', name: '礼部', delay: 400 },
  { id: 'libu2', name: '吏部', delay: 500 },
  { id: 'xingbu', name: '刑部', delay: 600 }
];

function sendEvent(agent, phase) {
  return new Promise((resolve, reject) => {
    const runId = `test_${Date.now()}_${agent.id}_${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      stream: 'lifecycle',
      runId: runId,
      data: { phase, startedAt: Date.now() },
      sessionKey: `agent:${agent.id}:discord:channel:test123`
    };

    console.log(`[MOCK] ${agent.name} (${agent.id}): phase=${phase}, runId=${runId.slice(0, 20)}...`);

    const data = JSON.stringify({ payload });
    
    const options = {
      hostname: 'localhost',
      port: 4200,
      path: '/api/openclaw',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ agent: agent.id, phase, status: res.statusCode }));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('\n=== Concurrent Agents Mock Test ===\n');
  console.log(`Testing ${TEST_AGENTS.length} agents with staggered delays...\n`);

  // Phase 1: Start all agents
  console.log('--- Phase 1: START all agents ---');
  const startPromises = TEST_AGENTS.map(agent => 
    new Promise(r => setTimeout(() => {
      sendEvent(agent, 'start').then(r).catch(console.error);
    }, agent.delay))
  );
  
  await Promise.all(startPromises);
  console.log('✅ All START events sent\n');

  // Wait for animations
  await new Promise(r => setTimeout(r, 5000));

  // Phase 2: End all agents
  console.log('--- Phase 2: END all agents ---');
  const endPromises = TEST_AGENTS.map(agent => 
    new Promise(r => setTimeout(() => {
      sendEvent(agent, 'end').then(r).catch(console.error);
    }, agent.delay))
  );
  
  await Promise.all(endPromises);
  console.log('✅ All END events sent\n');

  console.log('=== Test Complete ===');
  console.log('\nCheck database:');
  console.log('  sqlite3 data/openclaw-office.db "SELECT agent, agent_name, COUNT(*) FROM events GROUP BY agent;"');
}

// Wait for server to be ready
console.log('Waiting 3 seconds for server...');
setTimeout(runTest, 3000);
