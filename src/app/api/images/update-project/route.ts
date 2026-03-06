import { NextRequest, NextResponse } from 'next/server'
import { updateAllImagesToProject } from '@/utils/fal-image-generator'

/**
 * API Endpoint: Update all images to a specific project
 * 
 * This endpoint updates all existing images to be associated with a specific project.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body
    
    if (!projectId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing projectId in request body'
        },
        { status: 400 }
      )
    }
    
    // Update all images to the specified project
    const updatedCount = updateAllImagesToProject(projectId)
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} images to project: ${projectId}`,
      updatedCount: updatedCount
    })
    
  } catch (error) {
    console.error('Error updating images to project:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update images to project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to update images to a project',
    usage: 'POST /api/images/update-project with body: { "projectId": "your-project-id" }'
  })
} 