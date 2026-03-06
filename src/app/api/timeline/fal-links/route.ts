import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

interface TimelineItem {
  id: string;
  type: 'image' | 'video';
  metadata?: Record<string, unknown>;
  title: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    
    console.log(`🎬 Getting timeline Fal AI links for project: ${projectId}`);
    
    // Get timeline configuration for the project
    const timelineConfig = await databaseService.getTimelineConfig(projectId);
    
    if (!timelineConfig || !timelineConfig.timeline || !Array.isArray(timelineConfig.timeline)) {
      console.log('📝 No timeline configuration found, checking images/videos with timeline_order');
      
      // Fallback: get images and videos that have timeline_order set
      const [images, videos] = await Promise.all([
        databaseService.getImages(projectId),
        databaseService.getVideos(projectId)
      ]);
      
      // Filter items that might be in timeline (you could also check for timeline_order column)
      const allItems: TimelineItem[] = [
        ...images.map(img => ({ 
          id: img.id, 
          type: 'image' as const, 
          metadata: img.metadata, 
          title: img.title 
        })),
        ...videos.map(vid => ({ 
          id: vid.id, 
          type: 'video' as const, 
          metadata: vid.metadata, 
          title: vid.title 
        }))
      ];
      
      // Extract Fal AI links
      const falLinks = allItems
        .map(item => {
          const falImageUrl = item.metadata?.fal_image_url as string;
          const falVideoUrl = item.metadata?.fal_video_url as string;
          const falUrl = falVideoUrl || falImageUrl;
          
          if (falUrl) {
            return {
              id: item.id,
              title: item.title,
              type: item.type,
              fal_url: falUrl
            };
          }
          return null;
        })
        .filter(Boolean);
      
      return NextResponse.json({
        success: true,
        project_id: projectId,
        timeline_method: 'all_items_fallback',
        fal_links: falLinks,
        count: falLinks.length,
        message: `Found ${falLinks.length} Fal AI links from all project items`
      });
    }
    
    // Get timeline items from configuration
    const timelineItemIds = timelineConfig.timeline as string[];
    console.log(`📋 Timeline has ${timelineItemIds.length} items`);
    
    if (timelineItemIds.length === 0) {
      return NextResponse.json({
        success: true,
        project_id: projectId,
        timeline_method: 'config_empty',
        fal_links: [],
        count: 0,
        message: 'Timeline is empty'
      });
    }
    
    // Get all images and videos for the project
    const [images, videos] = await Promise.all([
      databaseService.getImages(projectId),
      databaseService.getVideos(projectId)
    ]);
    
    // Create a map of all items by ID
    const allItemsMap = new Map<string, TimelineItem>();
    
    images.forEach(img => {
      allItemsMap.set(img.id, {
        id: img.id,
        type: 'image',
        metadata: img.metadata,
        title: img.title
      });
    });
    
    videos.forEach(vid => {
      allItemsMap.set(vid.id, {
        id: vid.id,
        type: 'video',
        metadata: vid.metadata,
        title: vid.title
      });
    });
    
    // Get timeline items in order and extract Fal AI links
    const timelineFalLinks = timelineItemIds
      .map((itemId, index) => {
        const item = allItemsMap.get(itemId);
        if (!item) {
          console.warn(`⚠️ Timeline item ${itemId} not found in database`);
          return null;
        }
        
        const falImageUrl = item.metadata?.fal_image_url as string;
        const falVideoUrl = item.metadata?.fal_video_url as string;
        const falUrl = falVideoUrl || falImageUrl;
        
        if (falUrl) {
          return {
            id: item.id,
            title: item.title,
            type: item.type,
            timeline_order: index + 1,
            fal_url: falUrl
          };
        }
        
        console.warn(`⚠️ Timeline item ${itemId} (${item.title}) has no Fal AI URL`);
        return null;
      })
      .filter(Boolean);
    
    return NextResponse.json({
      success: true,
      project_id: projectId,
      timeline_method: 'config_based',
      fal_links: timelineFalLinks,
      count: timelineFalLinks.length,
      total_timeline_items: timelineItemIds.length,
      message: `Found ${timelineFalLinks.length} Fal AI links from ${timelineItemIds.length} timeline items`
    });
    
  } catch (error) {
    console.error('❌ Error getting timeline Fal AI links:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get timeline Fal AI links',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 