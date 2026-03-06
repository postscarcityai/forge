import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * Brand Story API for Project Settings
 * Handles brand-specific data: narrative, personality, visual identity, messaging, etc.
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

    const brandStory = project.settings?.brandStory || {};

    return NextResponse.json({
      success: true,
      data: brandStory,
      message: 'Brand story retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading brand story:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read brand story',
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
    const { brandStory } = body;

    if (!brandStory || typeof brandStory !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Brand story data is required'
      }, { status: 400 });
    }

    // Validation for brand story
    if (brandStory.messagingPillars && Array.isArray(brandStory.messagingPillars) && brandStory.messagingPillars.length > 12) {
      return NextResponse.json({
        success: false,
        error: 'Too many messaging pillars. Maximum 12 allowed.'
      }, { status: 400 });
    }

    if (brandStory.contentThemes && Array.isArray(brandStory.contentThemes) && brandStory.contentThemes.length > 15) {
      return NextResponse.json({
        success: false,
        error: 'Too many content themes. Maximum 15 allowed.'
      }, { status: 400 });
    }

    // Visual identity validation
    if (brandStory.visualIdentity) {
      const { primaryColors, secondaryColors, typography } = brandStory.visualIdentity;
      
      if (primaryColors && Array.isArray(primaryColors) && primaryColors.length > 8) {
        return NextResponse.json({
          success: false,
          error: 'Too many primary colors. Maximum 8 allowed.'
        }, { status: 400 });
      }

      if (secondaryColors && Array.isArray(secondaryColors) && secondaryColors.length > 12) {
        return NextResponse.json({
          success: false,
          error: 'Too many secondary colors. Maximum 12 allowed.'
        }, { status: 400 });
      }

      if (typography && Array.isArray(typography) && typography.length > 10) {
        return NextResponse.json({
          success: false,
          error: 'Too many typography options. Maximum 10 allowed.'
        }, { status: 400 });
      }

      // Color format validation (hex colors)
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      const allColors = [...(primaryColors || []), ...(secondaryColors || [])];
      
      for (const color of allColors) {
        if (typeof color === 'string' && color.startsWith('#') && !colorRegex.test(color)) {
          return NextResponse.json({
            success: false,
            error: `Invalid color format: ${color}. Use hex format like #FF5733`
          }, { status: 400 });
        }
      }
    }

    // Get existing project
    const existingProject = await databaseService.getProject(projectId);
    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Update only brand story in settings - MERGE with existing data
    const updatedProject = {
      ...existingProject,
      settings: {
        ...existingProject.settings,
        brandStory: {
          ...existingProject.settings?.brandStory,  // Keep existing data
          ...brandStory  // Merge in new data
        }
      },
      updated_at: new Date().toISOString()
    };

    console.log('🎨 Updating brand story for project:', {
      projectId,
      hasBrandNarrative: !!brandStory.brandNarrative,
      hasBrandPersonality: !!brandStory.brandPersonality,
      messagingPillarsCount: brandStory.messagingPillars?.length || 0,
      contentThemesCount: brandStory.contentThemes?.length || 0,
      hasVisualIdentity: !!brandStory.visualIdentity,
      primaryColorsCount: brandStory.visualIdentity?.primaryColors?.length || 0
    });

    const success = await databaseService.saveProject(updatedProject);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update brand story'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Brand story updated successfully',
      data: brandStory
    });
  } catch (error) {
    console.error('Error updating brand story:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update brand story',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 