#!/usr/bin/env node

/**
 * Simple MCP Protocol Test
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Simple MCP Protocol...');

const mcpServer = spawn('npx', ['tsx', path.join(__dirname, '..', 'src', 'mcp', 'server.ts')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: path.join(__dirname, '..')
});

let responseCount = 0;

mcpServer.stdout.on('data', (data) => {
  responseCount++;
  console.log(`📥 RESPONSE ${responseCount}:`, data.toString());
  
  if (responseCount >= 2) {
    mcpServer.kill();
  }
});

// Wait for server to start, then send initialize
setTimeout(() => {
  console.log('📤 Sending MCP initialize...');
  const initRequest = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  };
  
  mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Send tools/list after initialize
  setTimeout(() => {
    console.log('📤 Sending tools/list...');
    const toolsRequest = {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "tools/list",
      "params": {}
    };
    
    mcpServer.stdin.write(JSON.stringify(toolsRequest) + '\n');
  }, 1000);
  
}, 3000);

setTimeout(() => {
  if (responseCount === 0) {
    console.log('❌ No responses received');
  }
  mcpServer.kill();
}, 8000); 