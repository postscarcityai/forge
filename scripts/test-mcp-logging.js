#!/usr/bin/env node

/**
 * Test MCP Server Logging
 * Tests the Forge MCP server with detailed logging to debug issues
 */

const { spawn } = require('child_process');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'start-mcp-server.js');

console.log('🧪 Testing Forge MCP Server with logging...');
console.log(`📁 Working directory: ${process.cwd()}`);
console.log(`📄 Script path: ${SCRIPT_PATH}`);
console.log('🔧 Command: node start-mcp-server.js');

// Start the MCP server
const mcpServer = spawn('node', [SCRIPT_PATH], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

// Send MCP initialization message after 2 seconds
setTimeout(() => {
  console.log('\n📤 Sending MCP initialization message...');
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" }
    }
  };
  
  mcpServer.stdin.write(JSON.stringify(initMessage) + '\n');
}, 2000);

// Send tools list request after 4 seconds
setTimeout(() => {
  console.log('\n📤 Sending tools/list request...');
  const toolsMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  mcpServer.stdin.write(JSON.stringify(toolsMessage) + '\n');
}, 4000);

// Handle stdout
mcpServer.stdout.on('data', (data) => {
  console.log('\n📥 STDOUT:', data.toString());
});

// Handle stderr (our logging)
mcpServer.stderr.on('data', (data) => {
  console.log('🔍 STDERR:', data.toString());
});

// Handle errors
mcpServer.on('error', (error) => {
  console.error('❌ Process error:', error);
});

// Handle close
mcpServer.on('close', (code, signal) => {
  console.log(`\n🏁 Process exited with code ${code}, signal: ${signal}`);
});

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('\n🛑 Stopping test...');
  mcpServer.kill('SIGTERM');
  process.exit(0);
}, 10000); 