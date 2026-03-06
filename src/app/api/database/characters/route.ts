import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';
import { Character } from '@/contexts/ProjectContext';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const name = searchParams.get('name');

    if (characterId) {
      // Get single character by ID
      const character = await databaseService.getCharacter(characterId);
      
      if (!character) {
        return NextResponse.json({
          success: false,
          error: 'Character not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: character
      });
    } else if (name && projectId) {
      // Get character by name and project (for prompt generation)
      const character = await databaseService.getCharacterByName(name, projectId);
      
      if (!character) {
        return NextResponse.json({
          success: false,
          error: 'Character not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: character
      });
    } else if (projectId) {
      // Get all characters for a project
      const characters = await databaseService.getCharacters(projectId);
      
      return NextResponse.json({
        success: true,
        data: characters,
        message: `Retrieved ${characters.length} characters for project ${projectId}`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in characters API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character, characters } = body;

    if (character) {
      // Save single character
      const characterData: Character = {
        id: character.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: character.name,
        projectId: character.projectId,
        age: character.age,
        gender: character.gender,
        race: character.race,
        height: character.height,
        hairColor: character.hairColor,
        eyeColor: character.eyeColor,
        physicalAppearance: character.physicalAppearance,
        outfits: character.outfits || [],
        defaultOutfit: character.defaultOutfit || 0,
        background: character.background,
        profession: character.profession,
        caseDetails: character.caseDetails,
        sceneOfCrime: character.sceneOfCrime,
        tags: character.tags,
        notes: character.notes,
        createdAt: character.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const success = await databaseService.saveCharacter(characterData);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to save character'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Character saved successfully',
        data: characterData
      });
    } else if (characters && Array.isArray(characters)) {
      // Save multiple characters
      let savedCount = 0;
      const errors: string[] = [];

      for (const char of characters) {
        const characterData: Character = {
          id: char.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: char.name,
          projectId: char.projectId,
          age: char.age,
          gender: char.gender,
          race: char.race,
          height: char.height,
          hairColor: char.hairColor,
          eyeColor: char.eyeColor,
          physicalAppearance: char.physicalAppearance,
          outfits: char.outfits || [],
          defaultOutfit: char.defaultOutfit || 0,
          background: char.background,
          profession: char.profession,
          caseDetails: char.caseDetails,
          sceneOfCrime: char.sceneOfCrime,
          tags: char.tags,
          notes: char.notes,
          createdAt: char.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const success = await databaseService.saveCharacter(characterData);
        if (success) {
          savedCount++;
        } else {
          errors.push(`Failed to save character: ${char.name}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${savedCount} characters`,
        savedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected character or characters array'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving characters:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('id');
    
    if (!characterId) {
      return NextResponse.json({
        success: false,
        error: 'Character ID is required'
      }, { status: 400 });
    }

    const body = await request.json();

    // Get existing character
    const existingCharacter = await databaseService.getCharacter(characterId);
    if (!existingCharacter) {
      return NextResponse.json({
        success: false,
        error: 'Character not found'
      }, { status: 404 });
    }

    // Update character with new data
    const updatedCharacter: Character = {
      ...existingCharacter,
      ...body,
      id: characterId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    const success = await databaseService.saveCharacter(updatedCharacter);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update character'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Character updated successfully',
      data: updatedCharacter
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update character',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('id');

    if (!characterId) {
      return NextResponse.json({
        success: false,
        error: 'Character ID is required'
      }, { status: 400 });
    }

    const success = await databaseService.deleteCharacter(characterId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Character not found or failed to delete'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Character deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete character',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 