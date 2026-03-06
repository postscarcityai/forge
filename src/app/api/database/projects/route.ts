import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

// Deep merge utility to safely merge nested objects
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

export async function GET(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (projectId) {
      // Get single project
      const project = await databaseService.getProject(projectId);
      
      if (!project) {
        return NextResponse.json({
          success: false,
          error: 'Project not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: project
      });
    } else {
      // Get all projects
      const projects = await databaseService.getProjects();
      
      return NextResponse.json({
        success: true,
        data: projects,
        message: `Retrieved ${projects.length} projects`
      });
    }
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { project, projects } = body;

    if (project) {
      // Save single project
      const projectData = {
        id: project.id,
        name: project.name,
        description: project.description || '',
        settings: project.settings || {},
        created_at: project.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const success = await databaseService.saveProject(projectData);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to save project'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Project saved successfully',
        data: projectData
      });
    } else if (projects && Array.isArray(projects)) {
      // Save multiple projects
      let savedCount = 0;
      const errors: string[] = [];

      for (const proj of projects) {
        const projectData = {
          id: proj.id,
          name: proj.name,
          description: proj.description || '',
          settings: proj.settings || {},
          created_at: proj.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const success = await databaseService.saveProject(projectData);
        if (success) {
          savedCount++;
        } else {
          errors.push(`Failed to save project: ${proj.id}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${savedCount} projects`,
        savedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected project or projects array'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving projects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    
    // Convert the full project object to database format
    const projectData = {
      id: projectId,
      name: body.name || 'Untitled Project',
      description: body.description || '',
      settings: {
        // Store all the detailed project data in settings
        slug: body.slug,
        color: body.color,
        status: body.status,
        defaultImageOrientation: body.defaultImageOrientation,
        businessOverview: body.businessOverview,
        brandStory: body.brandStory,
        imagePrompting: body.imagePrompting,
        loras: body.loras,
        lastActivity: body.lastActivity || new Date().toISOString(),
        imageCount: body.imageCount || 0
      },
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Updating project in database:', {
      id: projectData.id,
      name: projectData.name,
      settingsKeys: Object.keys(projectData.settings)
    });

    const success = await databaseService.saveProject(projectData);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update project'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      data: projectData
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { id, settings } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Get existing project
    const existingProject = await databaseService.getProject(id);
    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Deep merge settings with existing project data to prevent accidental overwrites
    const updatedProject = {
      ...existingProject,
      settings: deepMerge(existingProject.settings || {}, settings),
      updated_at: new Date().toISOString()
    };

    // Validate that we're not accidentally overwriting complex nested objects
    const dangerousKeys = ['imagePrompting', 'businessOverview', 'loras'];
    const providedDangerousKeys = dangerousKeys.filter(key => 
      settings[key] && typeof settings[key] === 'object'
    );
    
    if (providedDangerousKeys.length > 0) {
      console.warn('⚠️  DANGEROUS OPERATION: Updating complex nested objects:', {
        id,
        dangerousKeys: providedDangerousKeys,
        settingsKeys: Object.keys(settings),
        willDeepMerge: true
      });
    }

    console.log('🔄 Updating project settings:', {
      id,
      settingsKeys: Object.keys(settings),
      hasImagePrompting: !!settings.imagePrompting,
      imagePromptingKeys: settings.imagePrompting ? Object.keys(settings.imagePrompting) : [],
      loraTriggerWords: {
        lora1: settings.loras?.lora1?.triggerWords,
        lora2: settings.loras?.lora2?.triggerWords
      }
    });

    const success = await databaseService.saveProject(updatedProject);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update project settings'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project settings updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update project settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Don't allow deleting the default project
    if (projectId === 'default') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete the default project'
      }, { status: 400 });
    }

    // Note: In a real implementation, you might want to:
    // 1. Move all images/videos from this project to 'default'
    // 2. Or prevent deletion if project has content
    // For now, we'll implement a simple delete

    const success = await databaseService.deleteProject(projectId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete project or project not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 