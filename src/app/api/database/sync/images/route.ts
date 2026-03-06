import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';
import { getSavedImages } from '@/utils/fal-image-generator';
import { ImageMetadata } from '@/data/images';

/**
 * Sync images from file system to SQLite database
 * This bridges the gap between file-based storage and database persistence
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      forceSync = false, 
      projectId = 'default',
      lastSync 
    } = body;

    // Get all saved images from file system
    const fileSystemImages = getSavedImages();
    
    // Filter for new images since last sync (unless forceSync is true)
    let imagesToSync = fileSystemImages;
    if (lastSync && !forceSync) {
      const lastSyncTime = new Date(lastSync).getTime();
      imagesToSync = fileSystemImages.filter(img => {
        const imgTime = new Date(img.createdAt).getTime();
        return imgTime > lastSyncTime;
      });
    }

    // Convert file system metadata to database format
    const imagesToSave: ImageMetadata[] = imagesToSync.map(fsImage => ({
      id: fsImage.id,
      filename: fsImage.filename,
      title: fsImage.title || fsImage.filename,
      description: fsImage.description,
      tags: fsImage.tags || [],
      // Convert timestamp to ISO string if necessary
      createdAt: typeof fsImage.createdAt === 'number' 
        ? new Date(fsImage.createdAt).toISOString() 
        : fsImage.createdAt,
      updatedAt: typeof fsImage.updatedAt === 'number' 
        ? new Date(fsImage.updatedAt).toISOString() 
        : (fsImage.updatedAt || (typeof fsImage.createdAt === 'number' 
          ? new Date(fsImage.createdAt).toISOString() 
          : fsImage.createdAt)),
      projectId: fsImage.projectId || projectId,
      fileSize: fsImage.fileSize,
      // Extract dimensions from metadata if available
      dimensions: fsImage.metadata?.api_response && 
                  typeof fsImage.metadata.api_response === 'object' &&
                  'images' in fsImage.metadata.api_response &&
                  Array.isArray(fsImage.metadata.api_response.images) &&
                  fsImage.metadata.api_response.images[0] &&
                  typeof fsImage.metadata.api_response.images[0] === 'object' &&
                  'width' in fsImage.metadata.api_response.images[0] &&
                  'height' in fsImage.metadata.api_response.images[0] ? {
        width: fsImage.metadata.api_response.images[0].width as number,
        height: fsImage.metadata.api_response.images[0].height as number
      } : undefined,
      metadata: {
        ...fsImage.metadata,
        // Add sync metadata
        syncedAt: new Date().toISOString(),
        source: 'file-system-sync'
      }
    }));

    // Save to SQLite database
    let savedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const image of imagesToSave) {
      try {
        // Check if image already exists
        const existingImage = await databaseService.getImage(image.id);
        
        const success = await databaseService.saveImage(image);
        if (success) {
          if (existingImage) {
            updatedCount++;
          } else {
            savedCount++;
          }
        } else {
          errors.push(`Failed to sync image: ${image.id} - database operation failed`);
        }
      } catch (error) {
        errors.push(`Failed to sync image: ${image.id} - ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${savedCount + updatedCount} images to database`,
      stats: {
        totalProcessed: imagesToSync.length,
        newImages: savedCount,
        updatedImages: updatedCount,
        errors: errors.length
      },
      syncedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error syncing images to database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync images to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const includeFileSystemCheck = searchParams.get('checkFileSystem') === 'true';

    // Get images from database (all projects if checking file system)
    const dbImages = includeFileSystemCheck 
      ? [
          ...(await databaseService.getImages('default')),
        ]
      : await databaseService.getImages(projectId);
    
    let syncStatus = null;
    if (includeFileSystemCheck) {
      // Compare with file system
      const fsImages = getSavedImages();
      const dbImageIds = new Set(dbImages.map(img => img.id));
      const fsImageIds = new Set(fsImages.map(img => img.id));
      
      const onlyInDB = [...dbImageIds].filter(id => !fsImageIds.has(id));
      const onlyInFS = [...fsImageIds].filter(id => !dbImageIds.has(id));
      
      syncStatus = {
        databaseCount: dbImages.length,
        fileSystemCount: fsImages.length,
        inSyncCount: dbImages.length - onlyInDB.length,
        onlyInDatabase: onlyInDB.length,
        onlyInFileSystem: onlyInFS.length,
        needsSync: onlyInFS.length > 0
      };
    }

    return NextResponse.json({
      success: true,
      data: dbImages,
      count: dbImages.length,
      projectId,
      syncStatus,
      message: `Retrieved ${dbImages.length} images from database`
    });

  } catch (error) {
    console.error('Error getting synced images:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get synced images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 