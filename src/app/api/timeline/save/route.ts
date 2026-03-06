import { NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * POST - Save timeline order to database
 * Body: { projectId: string, timelineIds: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, timelineIds } = body;

    if (!projectId || !Array.isArray(timelineIds)) {
      return NextResponse.json(
        { error: 'projectId and timelineIds array are required' },
        { status: 400 }
      );
    }

    if (!databaseService) {
      return NextResponse.json(
        { error: 'Database service not available' },
        { status: 500 }
      );
    }

    // Get all images and videos for this project to determine types
    const [images, videos] = await Promise.all([
      databaseService.getImages(projectId),
      databaseService.getVideos(projectId)
    ]);

    const imageIds = new Set(images.map(img => img.id));
    const videoIds = new Set(videos.map(vid => vid.id));

    // Build items array with order and type
    const items: { id: string; order: number; type: 'image' | 'video' }[] = [];
    
    timelineIds.forEach((id, index) => {
      const order = index + 1;
      if (imageIds.has(id)) {
        items.push({ id, order, type: 'image' });
      } else if (videoIds.has(id)) {
        items.push({ id, order, type: 'video' });
      }
    });

    // Clear timeline_order for items not in timeline
    const allItemIds = new Set(timelineIds);
    const imagesToClear = images.filter(img => !allItemIds.has(img.id));
    const videosToClear = videos.filter(vid => !allItemIds.has(vid.id));

    // Update timeline order for items in timeline
    if (items.length > 0) {
      await databaseService.updateTimelineOrder(items);
    }

    // Clear timeline_order for items not in timeline
    const clearItems: { id: string; order: number; type: 'image' | 'video' }[] = [];
    imagesToClear.forEach(img => {
      clearItems.push({ id: img.id, order: 0, type: 'image' });
    });
    videosToClear.forEach(vid => {
      clearItems.push({ id: vid.id, order: 0, type: 'video' });
    });

    // Clear timeline_order for items not in timeline
    if (clearItems.length > 0) {
      const db = (databaseService as any).db;
      if (db) {
        clearItems.forEach(item => {
          if (item.type === 'image') {
            db.prepare('UPDATE images SET timeline_order = NULL WHERE id = ?').run(item.id);
          } else {
            db.prepare('UPDATE videos SET timeline_order = NULL WHERE id = ?').run(item.id);
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      timelineCount: items.length,
      clearedCount: clearItems.length
    });
  } catch (error) {
    console.error('Failed to save timeline to database:', error);
    return NextResponse.json(
      { error: 'Failed to save timeline to database' },
      { status: 500 }
    );
  }
}

