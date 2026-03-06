import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * Project-specific Environment Variables API
 * Manages environment variables at the project level
 * These can override user-level defaults
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Get user-level env vars
    const userEnvVars = await databaseService.getSetting('env_variables') || {};
    
    // Get project-specific env vars
    const projectEnvVars = await databaseService.getSetting(`project_env_${projectId}`) || {};
    
    // Hierarchy: project env vars > user env vars
    const mergedEnvVars = { ...userEnvVars, ...projectEnvVars };

    return NextResponse.json({
      success: true,
      data: {
        merged: mergedEnvVars,
        project: projectEnvVars,
        user: userEnvVars
      },
      hierarchy: 'project > user'
    });
  } catch (error) {
    console.error('Error reading project environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read project environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const { envVars } = body;

    if (!envVars || typeof envVars !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Environment variables object is required'
      }, { status: 400 });
    }

    // Validate environment variable names
    for (const key of Object.keys(envVars)) {
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
        return NextResponse.json({
          success: false,
          error: `Invalid environment variable name: ${key}. Use only letters, numbers, and underscores.`
        }, { status: 400 });
      }
    }

    // Save project-specific env vars to database
    const success = await databaseService.saveSetting(`project_env_${projectId}`, envVars);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save project environment variables to database'
      }, { status: 500 });
    }

    // Get user env vars for merged response
    const userEnvVars = await databaseService.getSetting('env_variables') || {};
    const mergedEnvVars = { ...userEnvVars, ...envVars };

    return NextResponse.json({
      success: true,
      message: 'Project environment variables updated successfully',
      data: {
        merged: mergedEnvVars,
        project: envVars,
        user: userEnvVars
      },
      projectId
    });
  } catch (error) {
    console.error('Error saving project environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save project environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Environment variable key is required'
      }, { status: 400 });
    }

    // Get current project env vars
    const projectEnvVars = await databaseService.getSetting(`project_env_${projectId}`) || {};
    
    if (!(key in projectEnvVars)) {
      return NextResponse.json({
        success: false,
        error: 'Project environment variable not found'
      }, { status: 404 });
    }

    // Remove the key
    delete projectEnvVars[key];
    
    // Save back to database
    const success = await databaseService.saveSetting(`project_env_${projectId}`, projectEnvVars);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove project environment variable from database'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project environment variable removed successfully',
      projectId
    });
  } catch (error) {
    console.error('Error deleting project environment variable:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project environment variable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 