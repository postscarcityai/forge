#!/usr/bin/env node

/**
 * Test stdin reading for MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing stdin communication...');

const mcpServer = spawn('node', [path.join(__dirname, 'start-mcp-server.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: path.join(__dirname, '..')
});

// Wait for server to start
setTimeout(() => {
  console.log('📤 Sending test message...');
  mcpServer.stdin.write('{"test": "message"}\n');
  
  // Send MCP initialize
  setTimeout(() => {
    console.log('📤 Sending MCP initialize...');
    const init = {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}};
    mcpServer.stdin.write(JSON.stringify(init) + '\n');
  }, 1000);
  
}, 3000);

mcpServer.stdout.on('data', (data) => {
  console.log('📥 STDOUT:', data.toString());
});

setTimeout(() => {
  mcpServer.kill();
}, 8000); 