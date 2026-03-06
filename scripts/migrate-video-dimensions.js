#!/usr/bin/env node

/**
 * Migration script to add width, height, and duration columns to existing videos
 * and extract this information from existing metadata
 */

const Database = require('better-sqlite3');
const path = require('path');

// Get database path
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

console.log('🔄 Starting video dimensions migration...');
console.log(`📍 Database path: ${DB_PATH}`);

try {
  // Open database
  const db = new Database(DB_PATH);
  
  // Check if new columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(videos)").all();
  const hasWidthColumn = tableInfo.some(col => col.name === 'width');
  const hasHeightColumn = tableInfo.some(col => col.name === 'height');
  const hasDurationColumn = tableInfo.some(col => col.name === 'duration');
  
  if (hasWidthColumn && hasHeightColumn && hasDurationColumn) {
    console.log('✅ Video dimensions columns already exist, updating existing records...');
  } else {
    console.log('🔧 Adding new columns to videos table...');
    
    // Add new columns if they don't exist
    if (!hasWidthColumn) {
      db.exec('ALTER TABLE videos ADD COLUMN width INTEGER;');
      console.log('✅ Added width column');
    }
    
    if (!hasHeightColumn) {
      db.exec('ALTER TABLE videos ADD COLUMN height INTEGER;');
      console.log('✅ Added height column');
    }
    
    if (!hasDurationColumn) {
      db.exec('ALTER TABLE videos ADD COLUMN duration REAL;');
      console.log('✅ Added duration column');
    }
  }
  
  // Get all videos that need dimension extraction
  const videos = db.prepare(`
    SELECT id, metadata 
    FROM videos 
    WHERE (width IS NULL OR height IS NULL) AND metadata IS NOT NULL
  `).all();
  
  console.log(`📊 Found ${videos.length} videos that need dimension extraction`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  // Prepare update statement
  const updateStmt = db.prepare(`
    UPDATE videos 
    SET width = ?, height = ?, duration = ? 
    WHERE id = ?
  `);
  
  // Process each video
  for (const video of videos) {
    try {
      const metadata = JSON.parse(video.metadata);
      const dimensions = extractVideoMetadata(metadata);
      
      if (dimensions.width || dimensions.height || dimensions.duration) {
        updateStmt.run(
          dimensions.width || null,
          dimensions.height || null,
          dimensions.duration || null,
          video.id
        );
        updatedCount++;
        
        console.log(`✅ Updated video ${video.id}: ${dimensions.width}x${dimensions.height}${dimensions.duration ? ` (${dimensions.duration}s)` : ''}`);
      } else {
        skippedCount++;
        console.log(`⚠️ Skipped video ${video.id}: no dimensions found in metadata`);
      }
    } catch (error) {
      skippedCount++;
      console.error(`❌ Error processing video ${video.id}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Migration completed!`);
  console.log(`✅ Updated: ${updatedCount} videos`);
  console.log(`⚠️ Skipped: ${skippedCount} videos`);
  
  // Show summary of video dimensions
  const dimensionStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(width) as with_dimensions,
      COUNT(duration) as with_duration
    FROM videos
  `).get();
  
  console.log(`\n📊 Final statistics:`);
  console.log(`Total videos: ${dimensionStats.total}`);
  console.log(`Videos with dimensions: ${dimensionStats.with_dimensions}`);
  console.log(`Videos with duration: ${dimensionStats.with_duration}`);
  
  db.close();
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

/**
 * Extract video metadata (dimensions and duration) from various API formats
 */
function extractVideoMetadata(metadata) {
  const result = {};

  // Try direct width/height properties
  if (typeof metadata.width === 'number') result.width = metadata.width;
  if (typeof metadata.height === 'number') result.height = metadata.height;
  if (typeof metadata.duration === 'number') result.duration = metadata.duration;

  // Try API response video object
  if (metadata.api_response?.video && typeof metadata.api_response.video === 'object') {
    const video = metadata.api_response.video;
    if (typeof video.width === 'number') result.width = video.width;
    if (typeof video.height === 'number') result.height = video.height;
    if (typeof video.duration === 'number') result.duration = video.duration;
  }

  // Try generation parameters
  if (metadata.generationParams) {
    if (typeof metadata.generationParams.width === 'number') result.width = metadata.generationParams.width;
    if (typeof metadata.generationParams.height === 'number') result.height = metadata.generationParams.height;
    if (typeof metadata.generationParams.duration === 'number') result.duration = metadata.generationParams.duration;
  }

  // Try other common parameter locations
  if (typeof metadata.num_frames === 'number' && typeof metadata.fps === 'number') {
    result.duration = metadata.num_frames / metadata.fps;
  }

  // Infer from aspect ratio if dimensions not found
  if (!result.width || !result.height) {
    const aspectRatio = metadata.aspect_ratio || metadata.generationParams?.aspect_ratio;
    if (aspectRatio) {
      const inferred = inferDimensionsFromAspectRatio(aspectRatio);
      if (inferred) {
        result.width = result.width || inferred.width;
        result.height = result.height || inferred.height;
      }
    }
  }

  return result;
}

/**
 * Infer dimensions from aspect ratio string
 */
function inferDimensionsFromAspectRatio(aspectRatio) {
  switch (aspectRatio) {
    case '16:9': return { width: 1920, height: 1080 };
    case '9:16': return { width: 1080, height: 1920 };
    case '1:1': return { width: 1080, height: 1080 };
    case '4:5': return { width: 1080, height: 1350 };
    case '3:4': return { width: 1080, height: 1440 };
    case '4:3': return { width: 1440, height: 1080 };
    default: return null;
  }
}
