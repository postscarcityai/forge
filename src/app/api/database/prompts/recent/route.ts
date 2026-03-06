import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

interface PromptEntry {
  id: string;
  type: 'image' | 'video';
  created_at: string;
  local_path: string;
  prompt: string | null;
  user_prompt: string | null;
  character_name: string | null;
  scene_name: string | null;
  model: string | null;
  image_size: string | null;
  loras: unknown[] | null;
}

function buildLocalPath(filename: string, type: 'image' | 'video'): string {
  return type === 'image'
    ? `public/images/${filename}`
    : `public/videos/clips/${filename}`;
}

function extractPromptFields(
  item: { id: string; filename: string; createdAt: string; metadata?: Record<string, unknown> },
  type: 'image' | 'video'
): PromptEntry {
  const meta = item.metadata ?? {};
  return {
    id: item.id,
    type,
    created_at: item.createdAt,
    local_path: buildLocalPath(item.filename, type),
    prompt: (meta.prompt as string) ?? null,
    user_prompt: (meta.user_prompt as string) ?? null,
    character_name: (meta.character_name as string) ?? null,
    scene_name: (meta.scene_name as string) ?? null,
    model: (meta.model as string) ?? null,
    image_size: (meta.image_size as string) ?? null,
    loras: (meta.loras as unknown[]) ?? null,
  };
}

/**
 * GET /api/database/prompts/recent
 *
 * Returns prompt/input data for the most recent X images and/or videos.
 *
 * Query params:
 *   projectId    (required)  - which project
 *   type         (optional)  - "image", "video", or "all" (default: "all")
 *   limit        (optional)  - max items to return (default: 10)
 *   timelineOnly (optional)  - "true" to only return items in the timeline
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
    const type = searchParams.get('type') || 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const timelineOnly = searchParams.get('timelineOnly') === 'true';

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!['image', 'video', 'all'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be "image", "video", or "all"' },
        { status: 400 }
      );
    }

    if (timelineOnly) {
      const timelineItems = await databaseService.getTimelineItemsWithDetails(projectId);

      let filtered = timelineItems;
      if (type !== 'all') {
        filtered = timelineItems.filter(item => item.type === type);
      }

      const capped = filtered.slice(0, limit);

      const prompts: PromptEntry[] = capped.map(item => ({
        id: item.id,
        type: item.type,
        created_at: item.created_at,
        local_path: item.local_path,
        prompt: item.prompt ?? null,
        user_prompt: item.user_prompt ?? null,
        character_name: item.character_name ?? null,
        scene_name: item.scene_name ?? null,
        model: item.model ?? null,
        image_size: item.image_size ?? null,
        loras: (item.loras as unknown[]) ?? null,
      }));

      return NextResponse.json({
        success: true,
        projectId,
        type,
        timelineOnly: true,
        count: prompts.length,
        prompts,
      });
    }

    const results: PromptEntry[] = [];

    if (type === 'image' || type === 'all') {
      const images = await databaseService.getRecentImages(
        projectId,
        type === 'all' ? limit : limit
      );
      results.push(...images.map(img => extractPromptFields(img, 'image')));
    }

    if (type === 'video' || type === 'all') {
      const videos = await databaseService.getRecentVideos(
        projectId,
        type === 'all' ? limit : limit
      );
      results.push(...videos.map(vid => extractPromptFields(vid, 'video')));
    }

    if (type === 'all') {
      results.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    const prompts = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      projectId,
      type,
      timelineOnly: false,
      count: prompts.length,
      prompts,
    });
  } catch (error) {
    console.error('Error getting recent prompts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get recent prompts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
