import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const imageId = searchParams.get('id');
    const hiddenOnly = searchParams.get('hidden') === 'true';
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

    if (imageId) {
      // Get single image
      const image = await databaseService.getImage(imageId);
      
      if (!image) {
        return NextResponse.json({
          success: false,
          error: 'Image not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: image
      });
    } else if (hiddenOnly) {
      // Get only hidden images for project
      const images = await databaseService.getHiddenImages(projectId);
      
      return NextResponse.json({
        success: true,
        data: images,
        message: `Retrieved ${images.length} hidden images`
      });
    } else if (includeHidden) {
      // Get ALL images for project (including hidden) - used by frontend for complete state
      const images = await databaseService.getAllImages(projectId);
      
      return NextResponse.json({
        success: true,
        data: images,
        message: `Retrieved ${images.length} images (including hidden)`
      });
    } else if (limit !== undefined || offset !== undefined) {
      const images = await databaseService.getRecentImages(projectId, limit, offset);

      return NextResponse.json({
        success: true,
        data: images,
        limit,
        offset: offset ?? 0,
        message: `Retrieved ${images.length} images`
      });
    } else {
      // Get all visible images for project (excludes hidden)
      const images = await databaseService.getImages(projectId);
      
      return NextResponse.json({
        success: true,
        data: images,
        message: `Retrieved ${images.length} images`
      });
    }
  } catch (error) {
    console.error('Error in images API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { image, images } = body;

    if (images && Array.isArray(images)) {
      // Save multiple images
      let savedCount = 0;
      const errors: string[] = [];

      for (const img of images) {
        try {
          const success = await databaseService.saveImage(img);
          if (success) {
            savedCount++;
          } else {
            errors.push(`Failed to save image: ${img.id}`);
          }
        } catch (error) {
          errors.push(`Failed to save image: ${img.id} - ${error instanceof Error ? error.message : 'unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${savedCount} images to database`,
        savedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } else if (image) {
      // Save single image
      const success = await databaseService.saveImage(image);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to save image to database'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Image saved to database'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No image or images provided'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving images to database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save images to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { imageId, hidden, items } = body;

    if (items && Array.isArray(items)) {
      // Batch update hidden state for multiple items
      const success = await databaseService.batchUpdateHiddenState(items);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update hidden state for items'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated hidden state for ${items.length} items`
      });
    } else if (imageId !== undefined && hidden !== undefined) {
      // Single image hidden state update
      
      // First check if image exists
      const existingImage = await databaseService.getImage(imageId);
      if (!existingImage) {
        console.log(`❌ Image ${imageId} not found in database`);
        return NextResponse.json({
          success: false,
          error: `Image ${imageId} not found in database`
        }, { status: 404 });
      }
      
      const success = await databaseService.updateImageHiddenState(imageId, hidden);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update image hidden state'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Image ${imageId} ${hidden ? 'hidden' : 'restored'} successfully`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: imageId and hidden, or items array'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating image hidden state:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update image hidden state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({
        success: false,
        error: 'Missing image ID'
      }, { status: 400 });
    }

    const success = await databaseService.deleteImage(imageId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete image'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 