import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'

export async function POST(request: NextRequest) {
  try {
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🔄 Gallery refresh requested for project: ${currentProjectId}`)

    // Sync videos to database
    const videoSyncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/sync/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        forceSync: false,
        projectId: currentProjectId
      })
    })

    // Sync images to database  
    const imageSyncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/sync/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        forceSync: false
      })
    })

    const videoResult = videoSyncResponse.ok ? await videoSyncResponse.json() : { success: false }
    const imageResult = imageSyncResponse.ok ? await imageSyncResponse.json() : { success: false }

    return NextResponse.json({
      success: true,
      message: 'Gallery refresh completed',
      project_id: currentProjectId,
      video_sync: videoResult,
      image_sync: imageResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error refreshing gallery:', error)
    return NextResponse.json(
      { 
        error: 'Failed to refresh gallery', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
} 