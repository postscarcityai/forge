import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * Business Overview API for Project Settings
 * Handles business-specific data: company info, mission, values, target audience, etc.
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

    const businessOverview = project.settings?.businessOverview || {};

    return NextResponse.json({
      success: true,
      data: businessOverview,
      message: 'Business overview retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading business overview:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read business overview',
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
    const { businessOverview } = body;

    if (!businessOverview || typeof businessOverview !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Business overview data is required'
      }, { status: 400 });
    }

    // Validation for business overview
    if (businessOverview.coreValues && Array.isArray(businessOverview.coreValues) && businessOverview.coreValues.length > 15) {
      return NextResponse.json({
        success: false,
        error: 'Too many core values. Maximum 15 allowed.'
      }, { status: 400 });
    }

    if (businessOverview.offerings && Array.isArray(businessOverview.offerings) && businessOverview.offerings.length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Too many offerings. Maximum 20 allowed.'
      }, { status: 400 });
    }

    if (businessOverview.keyDifferentiators && Array.isArray(businessOverview.keyDifferentiators) && businessOverview.keyDifferentiators.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Too many key differentiators. Maximum 10 allowed.'
      }, { status: 400 });
    }

    // Email validation if provided
    if (businessOverview.contactInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessOverview.contactInfo.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format in contact information'
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

    // Update only business overview in settings - MERGE with existing data
    const updatedProject = {
      ...existingProject,
      settings: {
        ...existingProject.settings,
        businessOverview: {
          ...existingProject.settings?.businessOverview,  // Keep existing data
          ...businessOverview  // Merge in new data
        }
      },
      updated_at: new Date().toISOString()
    };

    console.log('📊 Updating business overview for project:', {
      projectId,
      hasCompanyDescription: !!businessOverview.companyDescription,
      hasMissionStatement: !!businessOverview.missionStatement,
      coreValuesCount: businessOverview.coreValues?.length || 0,
      offeringsCount: businessOverview.offerings?.length || 0
    });

    const success = await databaseService.saveProject(updatedProject);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update business overview'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Business overview updated successfully',
      data: businessOverview
    });
  } catch (error) {
    console.error('Error updating business overview:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update business overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 