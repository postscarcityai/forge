#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing MCP Protocol Communication...');

const mcpServer = spawn('node', [path.join(__dirname, 'start-mcp-server.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: path.join(__dirname, '..')
});

// Send initialize message
const initMessage = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}\n';
console.log('📤 Sending initialize...');
mcpServer.stdin.write(initMessage);

// Send tools/list message after a delay
setTimeout(() => {
  const toolsMessage = '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n';
  console.log('📤 Sending tools/list...');
  mcpServer.stdin.write(toolsMessage);
}, 2000);

// Capture responses
mcpServer.stdout.on('data', (data) => {
  console.log('📥 Response:', data.toString());
});

// Exit after 5 seconds
setTimeout(() => {
  mcpServer.kill();
  process.exit(0);
}, 5000); 