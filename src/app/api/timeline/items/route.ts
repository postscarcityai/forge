import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * GET /api/timeline/items
 *
 * Returns full timeline details (images + videos) sorted by timeline_order,
 * with optional prompt data extracted from metadata.
 *
 * Query params:
 *   projectId      (required)  - which project to query
 *   includePrompts (optional)  - "true" (default) to include prompt fields, "false" to omit
 *   limit          (optional)  - cap the number of items returned
 */
export async function GET(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json(
        { success: false, error: 'Database service not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const includePrompts = searchParams.get('includePrompts') !== 'false';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    const items = await databaseService.getTimelineItemsWithDetails(projectId);

    const capped = limit !== undefined ? items.slice(0, limit) : items;

    const formatted = capped.map(item => {
      const base: Record<string, unknown> = {
        id: item.id,
        type: item.type,
        title: item.title,
        timeline_order: item.timeline_order,
        created_at: item.created_at,
        filename: item.filename,
        local_path: item.local_path,
      };

      if (includePrompts) {
        base.prompt = item.prompt ?? null;
        base.user_prompt = item.user_prompt ?? null;
        base.character_name = item.character_name ?? null;
        base.scene_name = item.scene_name ?? null;
        base.model = item.model ?? null;
        base.image_size = item.image_size ?? null;
        base.loras = item.loras ?? null;
      }

      return base;
    });

    return NextResponse.json({
      success: true,
      projectId,
      count: formatted.length,
      total_timeline_items: items.length,
      items: formatted,
    });
  } catch (error) {
    console.error('Error getting timeline items:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get timeline items',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
