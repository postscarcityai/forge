# Forge MCP Server Troubleshooting

## 🚨 "0 tools enabled" in Cursor

If you see "0 tools enabled" in Cursor after setting up the MCP server, try these steps:

### 1. Restart Cursor Completely
**This is the most common fix!**
- Quit Cursor completely (⌘+Q on Mac)
- Wait 5 seconds
- Restart Cursor
- Check the MCP status in the bottom bar

### 2. Verify MCP Configuration
Check your `~/.cursor/mcp.json` file:
```json
{
  "mcpServers": {
    "forge-project-context": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/forge/src/mcp/server.ts"],
      "cwd": "/absolute/path/to/forge"
    }
  }
}
```

**Important**: Use absolute paths, not relative paths!

### 3. Test Server Manually
```bash
# Test database connectivity
npm run mcp:test

# Test MCP protocol communication
npm run mcp:connection

# Start server manually
npm run mcp:server
```

### 4. Check Dependencies
Make sure `tsx` is available:
```bash
npx tsx --version
```

If not installed globally:
```bash
npm install -g tsx
```

### 5. Verify File Paths
```bash
# Check if the server file exists
ls -la /absolute/path/to/forge/src/mcp/server.ts

# Check if you can run it manually
cd /absolute/path/to/forge
npx tsx src/mcp/server.ts
```

### 6. Check Cursor Logs
Look for MCP-related errors in Cursor's developer console:
- **View** → **Toggle Developer Tools**
- Check the **Console** tab for errors
- Look for messages containing "mcp" or "forge-project-context"

## 🔍 Common Issues

### "Failed to start server"
- Verify absolute paths in mcp.json
- Check that tsx is installed and accessible
- Ensure working directory (cwd) is correct

### "Server starts but no tools"
- Restart Cursor completely
- Check that server outputs only JSON to stdout
- Verify MCP protocol version compatibility

### "Database connection failed"
- Ensure you're in the Forge project directory
- Check that `forge.db` exists
- Verify `.forge-state.json` has a valid project ID

### "TypeScript compilation errors"
- Run `npm install` to ensure dependencies
- Check that your Node.js version is 18+
- Verify tsx can compile the TypeScript files

## 📊 Verification Steps

### Step 1: Manual Server Test
```bash
cd /path/to/forge
npm run mcp:connection
```

Should output:
```
✅ Server is ready, testing protocol...
Server Response: {"result":{"protocolVersion":"2024-11-05",...}}
```

### Step 2: Cursor Integration Test
1. Add server to `~/.cursor/mcp.json`
2. Restart Cursor completely
3. Look for server name in MCP section
4. Toggle should show green/enabled
5. Ask Claude: "What tools do you have access to?"

### Step 3: Functionality Test
Ask Claude:
- "What's the current project about?"
- "Show me the characters in this project"
- "What's the master prompt?"

## 🎯 Success Indicators

When working correctly:
- ✅ Cursor shows "forge-project-context" with toggle enabled
- ✅ Number of tools > 0 (should show 21 tools)
- ✅ Claude can answer questions about your Forge project
- ✅ Server logs show "ready for connections"

## 🆘 Still Having Issues?

1. **Check Node.js version**: `node --version` (needs 18+)
2. **Verify npm scripts**: `npm run mcp:test` should pass
3. **Test protocol manually**: `npm run mcp:connection`
4. **Check file permissions**: Server files should be readable
5. **Try different MCP client**: Test with Claude Desktop if available

If all else fails, try creating a minimal test by temporarily disabling other MCP servers in your configuration to isolate the issue. 