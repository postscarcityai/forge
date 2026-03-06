#!/usr/bin/env node

/**
 * Test MCP Server Connection
 * This script tests if the Forge MCP server responds to MCP protocol messages correctly
 */

const { spawn } = require('child_process');
const path = require('path');

function testMCPServer() {
  console.log('🧪 Testing Forge MCP Server connection...');
  
  // Start the MCP server
  const serverPath = path.join(__dirname, '..', 'src', 'mcp', 'server.ts');
  const server = spawn('npx', ['tsx', serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '..')
  });

  let serverReady = false;
  
  // Listen for server startup
  server.stderr.on('data', (data) => {
    const message = data.toString();
    console.error('Server:', message.trim());
    
    if (message.includes('ready for connections')) {
      serverReady = true;
      console.log('✅ Server is ready, testing protocol...');
      testProtocol();
    }
  });

  server.stdout.on('data', (data) => {
    console.log('Server Response:', data.toString());
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });

  function testProtocol() {
    console.log('📤 Sending initialize request...');
    
    // Send MCP initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    server.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      console.log('📤 Sending tools/list request...');
      
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      server.stdin.write(JSON.stringify(toolsRequest) + '\n');

      setTimeout(() => {
        console.log('🔄 Test completed, shutting down server...');
        server.kill();
        process.exit(0);
      }, 2000);
    }, 1000);
  }

  // Timeout after 10 seconds if server doesn't start
  setTimeout(() => {
    if (!serverReady) {
      console.error('❌ Server did not start within 10 seconds');
      server.kill();
      process.exit(1);
    }
  }, 10000);
}

if (require.main === module) {
  testMCPServer();
}

module.exports = { testMCPServer }; 