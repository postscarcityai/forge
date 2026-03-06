import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * Project LoRA Settings API
 * Manages LoRA references and strength settings for projects
 * LoRAs are stored in the global library and referenced by ID
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

    // Handle both old and new LoRA data structures
    const loraSettings = project.settings?.loraSettings || {};
    const legacyLoras = project.settings?.loras || {};

    // Get the full LoRA library for reference
    const availableLoRAs = await databaseService.getLoRAs();

    // Migrate legacy LoRA structure to new format if needed
    const migratedSettings = { ...loraSettings };
    
    if (legacyLoras.lora1 && !migratedSettings.lora1) {
      migratedSettings.lora1 = {
        id: legacyLoras.lora1.id || legacyLoras.lora1.name?.toLowerCase().replace(/\s+/g, '-') || 'lora1',
        strength: legacyLoras.lora1.scale || 0.8,
        enabled: legacyLoras.lora1.enabled || true
      };
    }
    
    if (legacyLoras.lora2 && !migratedSettings.lora2) {
      migratedSettings.lora2 = {
        id: legacyLoras.lora2.id || legacyLoras.lora2.name?.toLowerCase().replace(/\s+/g, '-') || 'lora2',
        strength: legacyLoras.lora2.scale || 0.6,
        enabled: legacyLoras.lora2.enabled || true
      };
    }

    // Enrich the response with full LoRA details
    const enrichedSettings = {
      ...migratedSettings,
      availableLoRAs,
      // Include legacy structure for backward compatibility
      legacy: legacyLoras
    };

    // Add resolved LoRA details for currently selected LoRAs
    if (loraSettings.lora1?.id) {
      const lora1Details = availableLoRAs.find(l => l.id === loraSettings.lora1.id);
      if (lora1Details) {
        enrichedSettings.lora1 = {
          ...loraSettings.lora1,
          ...lora1Details
        };
      }
    }

    if (loraSettings.lora2?.id) {
      const lora2Details = availableLoRAs.find(l => l.id === loraSettings.lora2.id);
      if (lora2Details) {
        enrichedSettings.lora2 = {
          ...loraSettings.lora2,
          ...lora2Details
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedSettings,
      message: 'LoRA settings retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading LoRA settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read LoRA settings',
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
    const { loraSettings } = body;

    if (!loraSettings || typeof loraSettings !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'LoRA settings are required'
      }, { status: 400 });
    }

    // Validation for LoRA settings (new simplified format)
    const validateLoRAReference = (loraRef: any, loraKey: string) => {
      if (!loraRef) return null; // Optional LoRA
      
      // LoRA ID validation
      if (!loraRef.id || typeof loraRef.id !== 'string') {
        return `${loraKey}: LoRA ID is required and must be a string`;
      }
      
      // Strength validation
      if (typeof loraRef.strength !== 'number') {
        return `${loraKey}: LoRA strength must be a number`;
      }
      
      if (loraRef.strength < 0 || loraRef.strength > 2) {
        return `${loraKey}: LoRA strength must be between 0 and 2`;
      }
      
      // Enabled validation
      if (typeof loraRef.enabled !== 'boolean') {
        return `${loraKey}: LoRA enabled must be a boolean`;
      }
      
      return null;
    };

    // Validate lora1 and lora2 references
    const lora1Error = validateLoRAReference(loraSettings.lora1, 'lora1');
    if (lora1Error) {
      return NextResponse.json({
        success: false,
        error: lora1Error
      }, { status: 400 });
    }

    const lora2Error = validateLoRAReference(loraSettings.lora2, 'lora2');
    if (lora2Error) {
      return NextResponse.json({
        success: false,
        error: lora2Error
      }, { status: 400 });
    }

    // Check for duplicate LoRA IDs
    if (loraSettings.lora1 && loraSettings.lora2 && 
        loraSettings.lora1.id === loraSettings.lora2.id) {
      return NextResponse.json({
        success: false,
        error: 'LoRA 1 and LoRA 2 cannot reference the same LoRA'
      }, { status: 400 });
    }

    // Verify referenced LoRAs exist in the library
    const availableLoRAs = await databaseService.getLoRAs();
    const availableLoRAIds = availableLoRAs.map(l => l.id);

    if (loraSettings.lora1?.id && !availableLoRAIds.includes(loraSettings.lora1.id)) {
      return NextResponse.json({
        success: false,
        error: `LoRA 1 references unknown LoRA ID: ${loraSettings.lora1.id}`
      }, { status: 400 });
    }

    if (loraSettings.lora2?.id && !availableLoRAIds.includes(loraSettings.lora2.id)) {
      return NextResponse.json({
        success: false,
        error: `LoRA 2 references unknown LoRA ID: ${loraSettings.lora2.id}`
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

    // Update only LoRA settings in project settings - MERGE with existing data
    const updatedProject = {
      ...existingProject,
      settings: {
        ...existingProject.settings,
        loraSettings: {
          ...existingProject.settings?.loraSettings,  // Keep existing data
          ...loraSettings  // Merge in new data
        }
      },
      updated_at: new Date().toISOString()
    };

    console.log('🎯 Updating LoRA settings for project:', {
      projectId,
      lora1Id: loraSettings.lora1?.id || null,
      lora1Enabled: loraSettings.lora1?.enabled || false,
      lora1Strength: loraSettings.lora1?.strength || 0,
      lora2Id: loraSettings.lora2?.id || null,
      lora2Enabled: loraSettings.lora2?.enabled || false,
      lora2Strength: loraSettings.lora2?.strength || 0
    });

    const success = await databaseService.saveProject(updatedProject);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update LoRA settings'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'LoRA settings updated successfully',
      data: loraSettings
    });
  } catch (error) {
    console.error('Error updating LoRA settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update LoRA settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 