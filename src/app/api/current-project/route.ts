import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), '.forge-state.json');

interface ServerState {
  currentProject: string;
  lastUpdated: string;
}

/**
 * GET /api/current-project - Get the current project
 */
export async function GET() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return NextResponse.json({ currentProject: 'default' });
    }
    
    const stateData = fs.readFileSync(STATE_FILE, 'utf8');
    const state: ServerState = JSON.parse(stateData);
    
    return NextResponse.json({ 
      currentProject: state.currentProject || 'default',
      lastUpdated: state.lastUpdated 
    });
  } catch (error) {
    console.warn('Failed to read current project:', error);
    return NextResponse.json({ currentProject: 'default' });
  }
}

/**
 * POST /api/current-project - Set the current project
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const state: ServerState = {
      currentProject: projectId,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`📁 Server state updated: current project = ${projectId}`);
    
    return NextResponse.json({ 
      success: true, 
      currentProject: projectId,
      lastUpdated: state.lastUpdated 
    });
  } catch (error) {
    console.error('Failed to save current project:', error);
    return NextResponse.json(
      { error: 'Failed to save current project' },
      { status: 500 }
    );
  }
} 