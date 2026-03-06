import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * Image Prompting API for Project Settings
 * Handles image generation configuration: master prompt, styles, lighting, technical parameters, etc.
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

    // Get project from database
    const project = await databaseService.getProject(projectId);
    
    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    const imagePrompting = project.settings?.imagePrompting || {};

    return NextResponse.json({
      success: true,
      data: imagePrompting,
      message: 'Image prompting configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading image prompting configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read image prompting configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(
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
    const { imagePrompting } = body;

    if (!imagePrompting || typeof imagePrompting !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Image prompting configuration is required'
      }, { status: 400 });
    }

    // Validation for image prompting arrays
    const arrayFieldLimits = {
      surfaceTextures: 25,
      materialProperties: 25,
      visualEffects: 30,
      atmosphericEffects: 20,
      postProcessing: 25,
      videoTransitions: 15,
      artisticReferences: 20,
      cinematicReferences: 20
    };

    for (const [field, limit] of Object.entries(arrayFieldLimits)) {
      const value = imagePrompting[field];
      if (value && Array.isArray(value) && value.length > limit) {
        return NextResponse.json({
          success: false,
          error: `Too many ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}. Maximum ${limit} allowed.`
        }, { status: 400 });
      }
    }

    // Validate aspect ratio format if provided
    if (imagePrompting.aspectRatio && typeof imagePrompting.aspectRatio === 'string') {
      const aspectRatioRegex = /^\d+:\d+$|^(square|portrait|landscape)$/i;
      if (!aspectRatioRegex.test(imagePrompting.aspectRatio)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid aspect ratio format. Use format like "16:9", "4:3", or "square", "portrait", "landscape"'
        }, { status: 400 });
      }
    }

    // Validate resolution format if provided
    if (imagePrompting.resolution && typeof imagePrompting.resolution === 'string') {
      const resolutionRegex = /^\d+x\d+$|^(HD|FHD|4K|8K)$/i;
      if (!resolutionRegex.test(imagePrompting.resolution)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid resolution format. Use format like "1920x1080", "HD", "FHD", "4K", or "8K"'
        }, { status: 400 });
      }
    }

    // Validate frame rate format if provided
    if (imagePrompting.frameRate && typeof imagePrompting.frameRate === 'string') {
      const frameRateRegex = /^\d+fps$|^\d+$/i;
      if (!frameRateRegex.test(imagePrompting.frameRate)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid frame rate format. Use format like "30fps", "60fps", or just "30", "60"'
        }, { status: 400 });
      }
    }

    // Validate focal length format if provided
    if (imagePrompting.focalLength && typeof imagePrompting.focalLength === 'string') {
      const focalLengthRegex = /^\d+mm$|^\d+-\d+mm$/i;
      if (!focalLengthRegex.test(imagePrompting.focalLength)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid focal length format. Use format like "50mm", "24-70mm"'
        }, { status: 400 });
      }
    }

    // Master prompt length validation
    if (imagePrompting.masterPrompt && typeof imagePrompting.masterPrompt === 'string' && imagePrompting.masterPrompt.length > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Master prompt is too long. Maximum 2000 characters allowed.'
      }, { status: 400 });
    }

    // Get existing project
    const existingProject = await databaseService.getProject(projectId);
    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Update only image prompting in settings - MERGE with existing data
    const updatedProject = {
      ...existingProject,
      settings: {
        ...existingProject.settings,
        imagePrompting: {
          ...existingProject.settings?.imagePrompting,  // Keep existing data
          ...imagePrompting  // Merge in new data
        }
      },
      updated_at: new Date().toISOString()
    };

    console.log('📸 Updating image prompting configuration for project:', {
      projectId,
      hasMasterPrompt: !!imagePrompting.masterPrompt,
      hasOverallStyle: !!imagePrompting.overallStyle,
      hasLightingStyle: !!imagePrompting.lightingStyle,
      hasColorPalette: !!imagePrompting.colorPalette,
      surfaceTexturesCount: imagePrompting.surfaceTextures?.length || 0,
      visualEffectsCount: imagePrompting.visualEffects?.length || 0,
      artisticReferencesCount: imagePrompting.artisticReferences?.length || 0,
      hasAspectRatio: !!imagePrompting.aspectRatio,
      hasResolution: !!imagePrompting.resolution
    });

    const success = await databaseService.saveProject(updatedProject);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update image prompting configuration'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image prompting configuration updated successfully',
      data: imagePrompting
    });
  } catch (error) {
    console.error('Error updating image prompting configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update image prompting configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 