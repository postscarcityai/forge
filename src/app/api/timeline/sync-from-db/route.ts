import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

/**
 * GET - Get timeline order from database for a project
 * Returns an array of image IDs in timeline order
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get images with timeline_order set, sorted by order
    const imagesStmt = db.prepare(`
      SELECT id, title, timeline_order, 'image' as type FROM images 
      WHERE project_id = ? AND timeline_order IS NOT NULL
    `);
    const images = imagesStmt.all(projectId) as { id: string; title: string; timeline_order: number; type: string }[];

    // Get videos with timeline_order set, sorted by order
    const videosStmt = db.prepare(`
      SELECT id, title, timeline_order, 'video' as type FROM videos 
      WHERE project_id = ? AND timeline_order IS NOT NULL
    `);
    const videos = videosStmt.all(projectId) as { id: string; title: string; timeline_order: number; type: string }[];

    // Merge and sort by timeline_order
    const allItems = [...images, ...videos].sort((a, b) => a.timeline_order - b.timeline_order);

    // Return just the IDs in order
    const timelineIds = allItems.map(item => item.id);

    return NextResponse.json({
      success: true,
      projectId,
      timelineIds,
      count: timelineIds.length,
      details: allItems.map(item => ({ id: item.id, title: item.title, order: item.timeline_order, type: item.type }))
    });
  } catch (error) {
    console.error('Failed to get timeline from database:', error);
    return NextResponse.json(
      { error: 'Failed to get timeline from database' },
      { status: 500 }
    );
  }
}

