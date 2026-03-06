import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * Environment Variables API
 * Manages database storage for user-level environment variables
 */

export async function GET(_request: NextRequest) {
  try {
    const envVars = await databaseService.getSetting('env_variables') || {};

    return NextResponse.json({
      success: true,
      data: envVars
    });
  } catch (error) {
    console.error('Error reading environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Save to database
    const success = await databaseService.saveSetting('env_variables', envVars);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save environment variables to database'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variables updated successfully',
      data: envVars
    });
  } catch (error) {
    console.error('Error saving environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Environment variable key is required'
      }, { status: 400 });
    }

    // Get current env vars from database
    const envVars = await databaseService.getSetting('env_variables') || {};
    
    if (!(key in envVars)) {
      return NextResponse.json({
        success: false,
        error: 'Environment variable not found'
      }, { status: 404 });
    }

    // Remove the key
    delete envVars[key];
    
    // Save back to database
    const success = await databaseService.saveSetting('env_variables', envVars);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove environment variable from database'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variable removed successfully'
    });
  } catch (error) {
    console.error('Error deleting environment variable:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete environment variable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 