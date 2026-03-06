import { NextRequest, NextResponse } from 'next/server';
import { getProjectGenerationOptions } from '@/utils/characterPromptGeneration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    const options = await getProjectGenerationOptions(projectId);
    
    return NextResponse.json({
      success: true,
      projectId,
      data: options,
      message: `Found ${options.characters.length} characters and ${options.scenes.length} scenes with ${options.totalCombinations} total combinations`
    });
  } catch (error) {
    console.error('Error fetching project options:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch project options',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 