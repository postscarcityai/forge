#!/usr/bin/env node

/**
 * Debug script to see what dimension information is available for videos
 * This will help us understand why aspect ratios aren't working for videos
 */

const Database = require('better-sqlite3');
const path = require('path');

// Get database path
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

console.log('🔍 Debugging video dimensions and aspect ratios...');
console.log(`📍 Database path: ${DB_PATH}`);

try {
  // Open database
  const db = new Database(DB_PATH, { readonly: true });
  
  // Get all videos with their dimensions and metadata
  const videos = db.prepare(`
    SELECT id, filename, width, height, metadata, created_at
    FROM videos 
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  
  console.log(`📊 Analyzing ${videos.length} most recent videos:\n`);
  
  if (videos.length === 0) {
    console.log('ℹ️  No videos found in database');
    db.close();
    return;
  }
  
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.filename}`);
    console.log(`   ID: ${video.id}`);
    console.log(`   Database dimensions: ${video.width || 'NULL'} x ${video.height || 'NULL'}`);
    
    if (video.width && video.height) {
      const ratio = video.width / video.height;
      const orientation = ratio > 1.1 ? 'LANDSCAPE' : ratio < 0.9 ? 'PORTRAIT' : 'SQUARE';
      console.log(`   Aspect ratio: ${ratio.toFixed(2)} (${orientation})`);
    }
    
    try {
      if (video.metadata) {
        const metadata = JSON.parse(video.metadata);
        
        // Check various places where dimensions might be stored
        const metadataWidth = metadata.width;
        const metadataHeight = metadata.height;
        const aspectRatio = metadata.aspect_ratio;
        
        console.log(`   Metadata dimensions: ${metadataWidth || 'NULL'} x ${metadataHeight || 'NULL'}`);
        if (aspectRatio) {
          console.log(`   Metadata aspect_ratio: ${aspectRatio}`);
        }
        
        // Check API response
        if (metadata.api_response && metadata.api_response.video) {
          const apiVideo = metadata.api_response.video;
          console.log(`   API response dimensions: ${apiVideo.width || 'NULL'} x ${apiVideo.height || 'NULL'}`);
        }
        
        // Check generation parameters
        if (metadata.generationParams) {
          const genParams = metadata.generationParams;
          console.log(`   Generation params: ${genParams.width || 'NULL'} x ${genParams.height || 'NULL'}`);
        }
        
        // Check for dimensions object
        if (metadata.dimensions) {
          console.log(`   Metadata.dimensions: ${metadata.dimensions.width || 'NULL'} x ${metadata.dimensions.height || 'NULL'}`);
        }
        
      } else {
        console.log(`   Metadata: NULL`);
      }
    } catch (error) {
      console.log(`   Metadata: ERROR - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  });
  
  // Summary statistics
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(width) as with_width,
      COUNT(height) as with_height,
      COUNT(CASE WHEN width IS NOT NULL AND height IS NOT NULL THEN 1 END) as with_both_dimensions
    FROM videos
  `).get();
  
  console.log('📊 Database Dimension Statistics:');
  console.log(`   Total videos: ${stats.total}`);
  console.log(`   Videos with width: ${stats.with_width}`);
  console.log(`   Videos with height: ${stats.with_height}`);
  console.log(`   Videos with both dimensions: ${stats.with_both_dimensions}`);
  
  if (stats.with_both_dimensions === 0) {
    console.log('\n❌ NO VIDEOS HAVE DIMENSIONS IN DATABASE!');
    console.log('This is likely why aspect ratios are not working.');
    console.log('\n💡 Solutions:');
    console.log('   1. Run the migration script: node scripts/migrate-video-dimensions.js');
    console.log('   2. Re-sync videos to extract dimensions: node scripts/fix-all-video-paths.js');
  } else if (stats.with_both_dimensions < stats.total) {
    console.log(`\n⚠️  Only ${stats.with_both_dimensions}/${stats.total} videos have dimensions.`);
    console.log('Some videos may not display with correct aspect ratios.');
  } else {
    console.log('\n✅ All videos have dimensions in database!');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}
