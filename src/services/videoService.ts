export interface VideoMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string; // Project association - defaults to 'default' if not specified
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailPath?: string; // Path to video thumbnail image
  metadata?: Record<string, unknown>;
  tags?: string[];
  hidden?: boolean; // Whether the video is hidden
  timelineOrder?: number | null; // Position in timeline, null if not in timeline
}

interface VideoApiResponse {
  success: boolean;
  data?: VideoMetadata[];
  error?: string;
  message?: string;
}

export const getAllVideos = async (): Promise<VideoMetadata[]> => {
  try {
    const response = await fetch('/api/videos/sync');
    const result: VideoApiResponse = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Failed to load videos:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error loading videos:', error);
    return [];
  }
};

export const getAllVideosFromDatabase = async (projectId: string = 'default'): Promise<VideoMetadata[]> => {
  try {
    console.log(`🎥 Loading all videos from database for project: ${projectId}`);
    
    // Include hidden videos so frontend can manage complete state
    const response = await fetch(`/api/database/videos?projectId=${projectId}&includeHidden=true`);
    const result: VideoApiResponse = await response.json();
    
    if (result.success && result.data) {
      console.log(`✅ Loaded ${result.data.length} videos from database (including hidden)`);
      
      // Special logging for talking heads videos
      const talkingHeadsVideos = result.data.filter(video => video.filename.includes('talking-heads'));
      if (talkingHeadsVideos.length > 0) {
        console.log(`🎬 Found ${talkingHeadsVideos.length} talking heads videos:`);
        talkingHeadsVideos.forEach(video => {
          console.log(`   - ${video.filename} (ID: ${video.id})`);
        });
      }
      
      return result.data;
    } else {
      console.error('❌ Failed to load videos from database:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading videos from database:', error);
    return [];
  }
}; 