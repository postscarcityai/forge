import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';
import { VideoMetadata } from '@/services/videoService';
import fs from 'fs';
import path from 'path';

/**
 * Sync videos from file system to SQLite database
 * This bridges the gap between file-based storage and database persistence
 */

/**
 * Validates and normalizes video metadata, deriving filename if missing
 */
function validateAndNormalizeMetadata(
  rawMetadata: any,
  metadataFileName: string
): VideoMetadata | null {
  // Early validation: check for required fields
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return null;
  }

  // Derive filename from metadata file name if missing
  let filename = rawMetadata.filename;
  if (!filename || typeof filename !== 'string') {
    // Derive from metadata file name: "video-name.meta.json" -> "video-name.mp4"
    filename = metadataFileName.replace('.meta.json', '');
    // If it doesn't already have an extension, assume .mp4
    if (!filename.match(/\.(mp4|mov|avi|webm)$/i)) {
      filename = `${filename}.mp4`;
    }
  }

  // Validate critical fields
  if (!rawMetadata.id || typeof rawMetadata.id !== 'string') {
    return null;
  }

  // Return normalized metadata
  return {
    id: rawMetadata.id,
    filename: filename,
    title: rawMetadata.title || filename,
    description: rawMetadata.description,
    createdAt: rawMetadata.createdAt || new Date().toISOString(),
    updatedAt: rawMetadata.updatedAt || rawMetadata.createdAt || new Date().toISOString(),
    projectId: rawMetadata.projectId,
    fileSize: rawMetadata.fileSize || 0,
    width: rawMetadata.width,
    height: rawMetadata.height,
    duration: rawMetadata.duration,
    metadata: rawMetadata.metadata,
    tags: rawMetadata.tags || []
  };
}

function getFileSystemVideos(): VideoMetadata[] {
  try {
    const videosDir = path.join(process.cwd(), 'public', 'videos', 'clips');
    const videoInfoDir = path.join(videosDir, 'video-info');
    
    console.log(`🔍 Scanning video directory: ${videoInfoDir}`);
    
    if (!fs.existsSync(videoInfoDir)) {
      return [];
    }

    const files = fs.readdirSync(videoInfoDir);
    const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
    
    console.log(`📁 Found ${metadataFiles.length} metadata files in ${videoInfoDir}`);
    
    const videos: VideoMetadata[] = [];
    let invalidCount = 0;
    let missingFileCount = 0;
    
    for (const file of metadataFiles) {
      try {
        const filePath = path.join(videoInfoDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const rawMetadata = JSON.parse(content);
        
        // Validate and normalize metadata
        const metadata = validateAndNormalizeMetadata(rawMetadata, file);
        if (!metadata) {
          invalidCount++;
          continue; // Skip invalid metadata files
        }
        
        // Verify the actual video file exists
        const videoPath = path.join(videosDir, metadata.filename);
        if (fs.existsSync(videoPath)) {
          videos.push(metadata);
          
          // Special logging for talking heads videos
          if (metadata.filename.includes('talking-heads')) {
            console.log(`🎬 Found talking heads video: ${metadata.filename}`);
            console.log(`   ID: ${metadata.id}`);
            console.log(`   Title: ${metadata.title}`);
            console.log(`   Project: ${metadata.projectId}`);
            console.log(`   Created: ${metadata.createdAt}`);
          }
        } else {
          missingFileCount++;
        }
      } catch (error) {
        invalidCount++;
        // Don't log individual errors - we'll log summary at the end
      }
    }
    
    // Log summary instead of per-file errors
    if (invalidCount > 0 || missingFileCount > 0) {
      console.log(`⚠️ Skipped ${invalidCount} invalid metadata files and ${missingFileCount} missing video files`);
    }
    
    console.log(`✅ Successfully loaded ${videos.length} videos from file system`);
    return videos;
  } catch (error) {
    console.error('❌ Error getting file system videos:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      forceSync = false, 
      projectId = 'default',
      lastSync 
    } = body;

    // Get all saved videos from file system
    const fileSystemVideos = getFileSystemVideos();
    
    console.log(`🔄 Starting video sync - Found ${fileSystemVideos.length} videos in file system`);
    
    // Filter for new videos since last sync (unless forceSync is true)
    let videosToSync = fileSystemVideos;
    if (lastSync && !forceSync) {
      const lastSyncTime = new Date(lastSync).getTime();
      videosToSync = fileSystemVideos.filter(video => {
        const videoTime = new Date(video.createdAt).getTime();
        return videoTime > lastSyncTime;
      });
      console.log(`📅 Delta sync: ${videosToSync.length} videos newer than ${lastSync}`);
    } else {
      console.log(`🔄 Force sync: Processing all ${videosToSync.length} videos`);
    }

    // Convert file system metadata to database format
    const videosToSave: VideoMetadata[] = videosToSync.map(fsVideo => ({
      id: fsVideo.id,
      filename: fsVideo.filename,
      title: fsVideo.title || fsVideo.filename,
      description: fsVideo.description,
      tags: fsVideo.tags || [],
      createdAt: fsVideo.createdAt,
      updatedAt: fsVideo.updatedAt || fsVideo.createdAt,
      projectId: fsVideo.projectId || projectId,
      fileSize: fsVideo.fileSize,
      metadata: {
        ...fsVideo.metadata,
        relativePath: 'clips', // Add relativePath since videos are stored in clips subdirectory
        syncedAt: new Date().toISOString(),
        source: 'file-system-sync'
      }
    }));

    console.log(`💾 Preparing to save ${videosToSave.length} videos to database`);

    // Save to SQLite database
    let savedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const video of videosToSave) {
      // Check if video already exists
      const existingVideo = await databaseService.getVideo(video.id);
      
      // Special logging for talking heads videos
      if (video.filename.includes('talking-heads')) {
        console.log(`🎬 Processing talking heads video: ${video.filename}`);
        console.log(`   ID: ${video.id}`);
        console.log(`   Exists in DB: ${existingVideo ? 'YES' : 'NO'}`);
        console.log(`   Project ID: ${video.projectId}`);
      }
      
      const success = await databaseService.saveVideo(video);
      if (success) {
        if (existingVideo) {
          updatedCount++;
          if (video.filename.includes('talking-heads')) {
            console.log(`✅ Updated talking heads video: ${video.filename}`);
          }
        } else {
          savedCount++;
          if (video.filename.includes('talking-heads')) {
            console.log(`✅ Saved new talking heads video: ${video.filename}`);
          }
        }
      } else {
        errors.push(`Failed to sync video: ${video.id}`);
        if (video.filename.includes('talking-heads')) {
          console.log(`❌ Failed to save talking heads video: ${video.filename}`);
        }
      }
    }

    console.log(`🎯 Sync complete - New: ${savedCount}, Updated: ${updatedCount}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      message: `Synced ${savedCount + updatedCount} videos to database`,
      stats: {
        totalProcessed: videosToSync.length,
        newVideos: savedCount,
        updatedVideos: updatedCount,
        errors: errors.length
      },
      syncedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error syncing videos to database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync videos to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const includeFileSystemCheck = searchParams.get('checkFileSystem') === 'true';

    // Get videos from database
    const dbVideos = await databaseService.getVideos(projectId);
    
    let syncStatus = null;
    if (includeFileSystemCheck) {
      // Compare with file system
      const fsVideos = getFileSystemVideos();
      const dbVideoIds = new Set(dbVideos.map(video => video.id));
      const fsVideoIds = new Set(fsVideos.map(video => video.id));
      
      const onlyInDB = [...dbVideoIds].filter(id => !fsVideoIds.has(id));
      const onlyInFS = [...fsVideoIds].filter(id => !dbVideoIds.has(id));
      
      syncStatus = {
        databaseCount: dbVideos.length,
        fileSystemCount: fsVideos.length,
        inSyncCount: dbVideos.length - onlyInDB.length,
        onlyInDatabase: onlyInDB.length,
        onlyInFileSystem: onlyInFS.length,
        needsSync: onlyInFS.length > 0
      };
    }

    return NextResponse.json({
      success: true,
      data: dbVideos,
      count: dbVideos.length,
      projectId,
      syncStatus,
      message: `Retrieved ${dbVideos.length} videos from database`
    });

  } catch (error) {
    console.error('Error getting synced videos:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get synced videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 