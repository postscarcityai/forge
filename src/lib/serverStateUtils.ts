// This file should ONLY be imported in API routes (server-side)
import fs from 'fs';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), '.forge-state.json');

interface ServerState {
  currentProject: string;
  lastUpdated: string;
}

/**
 * Save the current project to server state (server-side only)
 */
export function saveCurrentProjectToServerSync(projectId: string): boolean {
  try {
    const state: ServerState = {
      currentProject: projectId,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`📁 Server state updated: current project = ${projectId}`);
    return true;
  } catch (error) {
    console.warn('Failed to save current project to server state:', error);
    return false;
  }
}

/**
 * Get the current project from server state (server-side only)
 */
export function getCurrentProjectFromServerSync(): string {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.log('📁 No server state file found, using default project');
      return 'default';
    }
    
    const stateData = fs.readFileSync(STATE_FILE, 'utf8');
    const state: ServerState = JSON.parse(stateData);
    
    console.log(`📁 Read current project from server state: ${state.currentProject}`);
    return state.currentProject || 'default';
  } catch (error) {
    console.warn('Failed to read current project from server state:', error);
    return 'default';
  }
} 