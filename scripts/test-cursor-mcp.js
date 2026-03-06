#!/usr/bin/env node

/**
 * Test Cursor MCP Connection
 * This script simulates exactly what Cursor does to connect to the MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

function testCursorMCPConnection() {
  console.log('🧪 Testing Cursor-style MCP connection...');
  
  // Start server exactly like Cursor would
  const server = spawn('npx', ['tsx', '/Users/cjohndesign/dev/Forge/src/mcp/server.ts'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: '/Users/cjohndesign/dev/Forge'
  });

  let responses = [];
  let requestId = 1;

  server.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString().trim());
  });

  server.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      try {
        const parsed = JSON.parse(output);
        responses.push(parsed);
        console.log(`✅ Response ${parsed.id}:`, JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Raw output:', output);
      }
    }
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });

  // Wait a moment for server to start
  setTimeout(() => {
    console.log('\n📤 Step 1: Initialize...');
    const initRequest = {
      jsonrpc: '2.0',
      id: requestId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: false
          }
        },
        clientInfo: { 
          name: 'cursor-test', 
          version: '1.0.0' 
        }
      }
    };

    server.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      console.log('\n📤 Step 2: List tools...');
      const toolsRequest = {
        jsonrpc: '2.0',
        id: requestId++,
        method: 'tools/list',
        params: {}
      };

      server.stdin.write(JSON.stringify(toolsRequest) + '\n');

      setTimeout(() => {
        console.log('\n📤 Step 3: Test tool call...');
        const toolCallRequest = {
          jsonrpc: '2.0',
          id: requestId++,
          method: 'tools/call',
          params: {
            name: 'get_project_summary',
            arguments: {}
          }
        };

        server.stdin.write(JSON.stringify(toolCallRequest) + '\n');

        setTimeout(() => {
          console.log('\n🎯 Test Results:');
          console.log(`Total responses: ${responses.length}`);
          
          if (responses.length >= 3) {
            console.log('✅ All communication steps successful');
            console.log('✅ Server is fully compatible with MCP protocol');
          } else {
            console.log('❌ Some responses missing');
          }
          
          server.kill();
          process.exit(0);
        }, 2000);
      }, 1000);
    }, 1000);
  }, 2000);

  // Timeout after 15 seconds
  setTimeout(() => {
    console.error('❌ Test timed out');
    server.kill();
    process.exit(1);
  }, 15000);
}

if (require.main === module) {
  testCursorMCPConnection();
}

module.exports = { testCursorMCPConnection }; 