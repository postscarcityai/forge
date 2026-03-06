#!/usr/bin/env node

/**
 * Start MCP Server Script
 * Starts the Forge MCP server for project context access
 */

const { spawn } = require('child_process');
const path = require('path');

const MCP_SERVER_PATH = path.join(__dirname, '../src/mcp/server.ts');

/**
 * Start the MCP server
 */
function startMCPServer() {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] 🚀 Starting Forge MCP Server...`);
  console.error(`[${timestamp}] 📁 Working directory: ${path.join(__dirname, '..')}`);
  console.error(`[${timestamp}] 📄 Server path: ${MCP_SERVER_PATH}`);
  console.error(`[${timestamp}] 🔧 Command: npx tsx ${MCP_SERVER_PATH}`);
  
  // Use tsx to run TypeScript directly
  const mcpServer = spawn('npx', ['tsx', MCP_SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'], // stdin: pipe, stdout: pipe, stderr: pipe (capture all)
    cwd: path.join(__dirname, '..')
  });

  mcpServer.stdout.on('data', (data) => {
    // Log stdout data for debugging
    console.error(`[${new Date().toISOString()}] 📤 STDOUT: ${data.toString().substring(0, 200)}...`);
    // Forward stdout directly for MCP protocol messages
    process.stdout.write(data);
  });

  mcpServer.stderr.on('data', (data) => {
    // Log stderr data for debugging
    console.error(`[${new Date().toISOString()}] 🔍 STDERR: ${data.toString()}`);
  });

  mcpServer.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] ❌ Failed to start MCP server:`, error);
    console.error(`[${new Date().toISOString()}] 🔍 Error details:`, {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      path: error.path
    });
  });

  mcpServer.on('close', (code, signal) => {
    const timestamp = new Date().toISOString();
    if (code !== 0) {
      console.error(`[${timestamp}] ❌ MCP server exited with code ${code}, signal: ${signal}`);
    } else {
      console.error(`[${timestamp}] ✅ MCP server shut down gracefully`);
    }
  });

  mcpServer.on('spawn', () => {
    console.error(`[${new Date().toISOString()}] ✅ MCP server process spawned successfully`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MCP server...');
    mcpServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down MCP server...');
    mcpServer.kill('SIGTERM');
    process.exit(0);
  });

  return mcpServer;
}

// Start the server if this script is run directly
if (require.main === module) {
  startMCPServer();
}

module.exports = { startMCPServer }; 