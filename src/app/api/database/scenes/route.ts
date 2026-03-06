import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';
import { Scene } from '@/contexts/ProjectContext';

// ===== GET SCENES =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sceneId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const dbService = databaseService;

    // Get specific scene by ID
    if (sceneId) {
      const scene = await dbService.getScene(sceneId);
      if (!scene) {
        return NextResponse.json({
          success: false,
          error: 'Scene not found'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: scene
      });
    }

    // Get all scenes for project
    const scenes = await dbService.getScenes(projectId);
    return NextResponse.json({
      success: true,
      data: scenes,
      message: `Retrieved ${scenes.length} scenes for project ${projectId}`
    });

  } catch (error) {
    console.error('Scene GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve scenes' },
      { status: 500 }
    );
  }
}

// ===== CREATE/UPDATE SCENE =====
export async function POST(request: NextRequest) {
  try {
    const scene = await request.json() as Scene;
    
    // Validate required fields
    if (!scene.id || !scene.name || !scene.projectId) {
      return NextResponse.json(
        { error: 'Scene ID, name, and project ID are required' },
        { status: 400 }
      );
    }

    if (!scene.setting || !scene.timeOfDay || !scene.lighting || !scene.mood || !scene.cameraAngle || !scene.description) {
      return NextResponse.json(
        { error: 'All scene details are required' },
        { status: 400 }
      );
    }

    // Ensure timestamps
    const now = new Date().toISOString();
    if (!scene.createdAt) scene.createdAt = now;
    scene.updatedAt = now;

    // Ensure characterIds is an array
    if (!Array.isArray(scene.characterIds)) {
      scene.characterIds = [];
    }

    const dbService = databaseService;
    const success = await dbService.saveScene(scene);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save scene to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scene
    });

  } catch (error) {
    console.error('Scene POST error:', error);
    return NextResponse.json(
      { error: 'Invalid scene data' },
      { status: 400 }
    );
  }
}

// ===== UPDATE SCENE =====
export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('id');

    if (!sceneId) {
      return NextResponse.json(
        { error: 'Scene ID is required' },
        { status: 400 }
      );
    }

    const dbService = databaseService;
    
    // Get existing scene
    const existingScene = await dbService.getScene(sceneId);
    if (!existingScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Merge updates with existing scene
    const updatedScene: Scene = {
      ...existingScene,
      ...updates,
      id: sceneId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    const success = await dbService.saveScene(updatedScene);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update scene' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scene: updatedScene
    });

  } catch (error) {
    console.error('Scene PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    );
  }
}

// ===== DELETE SCENE =====
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('id');

    if (!sceneId) {
      return NextResponse.json(
        { error: 'Scene ID is required' },
        { status: 400 }
      );
    }

    const dbService = databaseService;
    const success = await dbService.deleteScene(sceneId);

    if (!success) {
      return NextResponse.json(
        { error: 'Scene not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scene deleted successfully'
    });

  } catch (error) {
    console.error('Scene DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scene' },
      { status: 500 }
    );
  }
} 