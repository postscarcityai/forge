import { NextRequest, NextResponse } from 'next/server';
import { getSavedImages } from '@/utils/fal-image-generator';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    
    // Get image metadata
    const savedImages = getSavedImages();
    const imageMetadata = savedImages.find(img => img.id === imageId);
    
    if (!imageMetadata) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Construct file path
    const imagePath = path.join(process.cwd(), 'public', 'images', imageMetadata.filename);
    
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Determine content type based on file extension
    const extension = path.extname(imageMetadata.filename).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (extension) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      default:
        contentType = 'image/jpeg';
    }
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        'ETag': `"${imageId}"`,
        'Last-Modified': new Date(imageMetadata.createdAt).toUTCString(),
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*', // Enable CORS for API access
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 