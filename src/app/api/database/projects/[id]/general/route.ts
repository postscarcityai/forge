import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * General Project Settings API
 * Handles basic project metadata: name, slug, color, status, description, etc.
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

    // Extract general project data
    const generalData = {
      id: project.id,
      name: project.name,
      description: project.description,
      slug: project.settings?.slug || project.id,
      color: project.settings?.color || '#6B7280',
      status: project.settings?.status || 'active',
      imageCount: project.settings?.imageCount || 0,
      lastActivity: project.settings?.lastActivity || project.updated_at,
      isEditable: project.settings?.isEditable !== false, // Default to true
      defaultImageOrientation: project.settings?.defaultImageOrientation || 'portrait',
      created_at: project.created_at,
      updated_at: project.updated_at
    };

    return NextResponse.json({
      success: true,
      data: generalData,
      message: 'General project settings retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading general project settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read general project settings',
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
    const { 
      name, 
      description, 
      slug, 
      color, 
      status, 
      isEditable, 
      defaultImageOrientation,
      imageCount 
    } = body;

    // Validation for general settings
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Project name is required and must be a non-empty string'
        }, { status: 400 });
      }
      
      if (name.length > 100) {
        return NextResponse.json({
          success: false,
          error: 'Project name is too long. Maximum 100 characters allowed.'
        }, { status: 400 });
      }
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !slug.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Project slug is required and must be a non-empty string'
        }, { status: 400 });
      }
      
      // Slug format validation
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only (e.g., "my-project")'
        }, { status: 400 });
      }
      
      if (slug.length > 50) {
        return NextResponse.json({
          success: false,
          error: 'Project slug is too long. Maximum 50 characters allowed.'
        }, { status: 400 });
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'Project description must be a string'
        }, { status: 400 });
      }
      
      if (description.length > 500) {
        return NextResponse.json({
          success: false,
          error: 'Project description is too long. Maximum 500 characters allowed.'
        }, { status: 400 });
      }
    }

    if (color !== undefined) {
      if (typeof color !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'Project color must be a string'
        }, { status: 400 });
      }
      
      // Color format validation (hex color)
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(color)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid color format. Use hex format like #FF5733 or #F53'
        }, { status: 400 });
      }
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'archived', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        }, { status: 400 });
      }
    }

    if (isEditable !== undefined && typeof isEditable !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'isEditable must be a boolean'
      }, { status: 400 });
    }

    if (defaultImageOrientation !== undefined) {
      const validOrientations = ['portrait', 'landscape', 'square'];
      if (!validOrientations.includes(defaultImageOrientation)) {
        return NextResponse.json({
          success: false,
          error: `Invalid image orientation. Must be one of: ${validOrientations.join(', ')}`
        }, { status: 400 });
      }
    }

    if (imageCount !== undefined && (typeof imageCount !== 'number' || imageCount < 0)) {
      return NextResponse.json({
        success: false,
        error: 'Image count must be a non-negative number'
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

    // Update project with new general settings
    const updatedProject = {
      ...existingProject,
      name: name !== undefined ? name.trim() : existingProject.name,
      description: description !== undefined ? (description?.trim() || null) : existingProject.description,
      settings: {
        ...existingProject.settings,
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(isEditable !== undefined && { isEditable }),
        ...(defaultImageOrientation !== undefined && { defaultImageOrientation }),
        ...(imageCount !== undefined && { imageCount }),
        lastActivity: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    console.log('⚙️ Updating general project settings:', {
      projectId,
      name: updatedProject.name,
      slug: updatedProject.settings?.slug,
      color: updatedProject.settings?.color,
      status: updatedProject.settings?.status,
      isEditable: updatedProject.settings?.isEditable,
      defaultImageOrientation: updatedProject.settings?.defaultImageOrientation
    });

    const success = await databaseService.saveProject(updatedProject);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update general project settings'
      }, { status: 500 });
    }

    // Return updated general data
    const updatedGeneralData = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      slug: updatedProject.settings?.slug || updatedProject.id,
      color: updatedProject.settings?.color || '#6B7280',
      status: updatedProject.settings?.status || 'active',
      imageCount: updatedProject.settings?.imageCount || 0,
      lastActivity: updatedProject.settings?.lastActivity,
      isEditable: updatedProject.settings?.isEditable !== false,
      defaultImageOrientation: updatedProject.settings?.defaultImageOrientation || 'portrait',
      created_at: updatedProject.created_at,
      updated_at: updatedProject.updated_at
    };

    return NextResponse.json({
      success: true,
      message: 'General project settings updated successfully',
      data: updatedGeneralData
    });
  } catch (error) {
    console.error('Error updating general project settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update general project settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 