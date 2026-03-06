import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/services/databaseService';

interface ImageMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !projectId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: image and projectId'
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only images are allowed.'
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size too large. Maximum 10MB allowed.'
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = uuidv4().substring(0, 8);
    const filename = `uploaded-${timestamp}-${uniqueId}${fileExtension}`;

    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    // Ensure image-info directory exists (FIXED: now matches generated image location)
    const infoDir = path.join(process.cwd(), 'public', 'images', 'image-info');
    if (!existsSync(infoDir)) {
      await mkdir(infoDir, { recursive: true });
    }

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(imagesDir, filename);
    await writeFile(filePath, buffer);

    // Create image metadata
    const imageId = uuidv4();
    const now = new Date().toISOString();

    // Try to get image dimensions (basic implementation)
    let dimensions: { width: number; height: number } | undefined;
    try {
      // For now, we'll leave dimensions undefined
      // In a full implementation, you might use a library like sharp or image-size
      // to extract dimensions from the buffer
    } catch (error) {
      console.warn('Could not extract image dimensions:', error);
    }

    const imageMetadata: ImageMetadata = {
      id: imageId,
      filename,
      title: file.name.replace(fileExtension, ''),
      description: `Uploaded image: ${file.name}`,
      tags: ['uploaded', 'user-content'],
      createdAt: now,
      updatedAt: now,
      projectId,
      fileSize: file.size,
      dimensions,
      metadata: {
        source: 'user-upload',
        originalName: file.name,
        mimeType: file.type,
        uploadedAt: now,
        uploadSize: file.size
      }
    };

    // Save metadata file
    const metadataPath = path.join(infoDir, `${filename}.meta.json`);
    await writeFile(metadataPath, JSON.stringify(imageMetadata, null, 2));

    // Save to database
    try {
      if (databaseService) {
        const success = await databaseService.saveImage(imageMetadata);
        if (!success) {
          console.warn(`⚠️ Failed to save image to database: ${imageMetadata.id}`);
        } else {
          console.log(`✅ Image saved to database: ${imageMetadata.id}`);
        }
      } else {
        console.warn('⚠️ Database service not available');
      }
    } catch (error) {
      console.error('Error saving image to database:', error);
    }

    // Return success response with image data
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        id: imageId,
        filename,
        title: imageMetadata.title,
        description: imageMetadata.description,
        tags: imageMetadata.tags,
        createdAt: now,
        updatedAt: now,
        projectId,
        fileSize: file.size,
        dimensions,
        metadata: imageMetadata.metadata,
        mediaType: 'image'
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 