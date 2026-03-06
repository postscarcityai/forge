#!/usr/bin/env node

/**
 * Test MCP Server Database Access
 * Validates that the MCP server can access the database and current project
 */

const { spawn } = require('child_process');
const path = require('path');

// Create a TypeScript test file and execute it with tsx
const testScript = `
import { getCurrentProjectFromServerSync } from '../src/lib/serverStateUtils';
import { databaseService } from '../src/services/databaseService';

async function testMCPServerAccess() {
  console.log('🧪 Testing MCP Server Database Access...\\n');

  try {
    // Test 1: Check if we can get current project
    console.log('1️⃣ Testing current project detection...');
    const currentProjectId = getCurrentProjectFromServerSync();
    console.log(\`   ✅ Current project ID: \${currentProjectId}\\n\`);

    // Test 2: Check database connection
    console.log('2️⃣ Testing database connection...');
    
    if (!databaseService) {
      console.log('   ❌ DatabaseService not available (server-side only)');
      return;
    }
    
    // Get current project data
    const project = await databaseService.getProject(currentProjectId);
    if (project) {
      console.log(\`   ✅ Found project: \${project.name}\`);
      console.log(\`   📝 Description: \${project.description || 'No description'}\`);
      
      // Check for image prompting configuration
      if (project.settings?.imagePrompting?.masterPrompt) {
        const wordCount = project.settings.imagePrompting.masterPrompt.split(/\\s+/).length;
        console.log(\`   🎨 Master prompt configured: \${wordCount} words\`);
      } else {
        console.log(\`   ⚠️  No master prompt configured\`);
      }
    } else {
      console.log(\`   ❌ Project '\${currentProjectId}' not found\`);
    }
    console.log('');

    // Test 3: Check characters and scenes
    console.log('3️⃣ Testing characters and scenes...');
    const characters = await databaseService.getCharacters(currentProjectId);
    const scenes = await databaseService.getScenes(currentProjectId);
    console.log(\`   👥 Characters: \${characters.length}\`);
    console.log(\`   🎬 Scenes: \${scenes.length}\`);
    
    if (characters.length > 0) {
      console.log(\`   📋 Character examples: \${characters.slice(0, 2).map(c => c.name).join(', ')}\`);
    }
    if (scenes.length > 0) {
      console.log(\`   📋 Scene examples: \${scenes.slice(0, 2).map(s => s.name).join(', ')}\`);
    }
    console.log('');

    console.log('🎉 MCP Server validation complete!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   • Run "npm run mcp:server" to start the MCP server');
    console.log('   • Run "npm run dev:with-mcp" to start both Next.js and MCP server');
    console.log('   • Connect from an MCP-compatible AI assistant');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   • Ensure SQLite database exists');
    console.error('   • Check that current project is set');
    console.error('   • Verify all dependencies are installed');
    process.exit(1);
  }
}

// Run the test
testMCPServerAccess();
`;

// Write the test script to a temporary file
const fs = require('fs');
const testFile = path.join(__dirname, 'temp-mcp-test.ts');
fs.writeFileSync(testFile, testScript);

// Execute with tsx
const testProcess = spawn('npx', ['tsx', testFile], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

testProcess.on('close', (code) => {
  // Clean up temp file
  fs.unlinkSync(testFile);
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to run test:', error);
  fs.unlinkSync(testFile);
  process.exit(1);
}); 