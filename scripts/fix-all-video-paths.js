#!/usr/bin/env node

/**
 * Fix all video paths in the database by ensuring correct relativePath metadata
 * This script will update all videos to have the proper relativePath set to 'clips'
 * if they don't already have a valid relativePath
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Get database path
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

console.log('🔄 Starting video path migration for all videos...');
console.log(`📍 Database path: ${DB_PATH}`);

try {
  // Open database
  const db = new Database(DB_PATH);
  
  // Get all videos from database
  const videos = db.prepare(`
    SELECT id, filename, metadata 
    FROM videos 
    WHERE metadata IS NOT NULL
  `).all();
  
  console.log(`📊 Found ${videos.length} videos in database`);
  
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let errorCount = 0;
  
  // Prepare update statement
  const updateStmt = db.prepare(`
    UPDATE videos 
    SET metadata = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  
  // Process each video
  for (const video of videos) {
    try {
      const metadata = JSON.parse(video.metadata);
      let needsUpdate = false;
      
      // Check if relativePath is missing or incorrect
      const currentRelativePath = metadata.relativePath;
      
      if (!currentRelativePath || currentRelativePath.trim() === '') {
        // Set relativePath to 'clips' if missing
        metadata.relativePath = 'clips';
        needsUpdate = true;
        console.log(`📝 Setting relativePath to 'clips' for video: ${video.filename}`);
      } else if (currentRelativePath === 'clips') {
        // Already correct
        alreadyCorrectCount++;
      } else {
        // Has a different relativePath - leave it alone but log it
        console.log(`ℹ️  Video ${video.filename} has custom relativePath: '${currentRelativePath}' - keeping it`);
        alreadyCorrectCount++;
      }
      
      // Also ensure local_path is correct if it exists
      if (metadata.local_path && !metadata.local_path.includes('clips')) {
        const filename = video.filename;
        metadata.local_path = path.join('videos', 'clips', filename).replace(/\\/g, '/');
        needsUpdate = true;
        console.log(`📝 Fixed local_path for video: ${video.filename}`);
      }
      
      if (needsUpdate) {
        // Update the metadata in database
        updateStmt.run(JSON.stringify(metadata), video.id);
        fixedCount++;
        console.log(`✅ Fixed video: ${video.filename} (ID: ${video.id})`);
      }
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing video ${video.filename}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Video path migration completed!`);
  console.log(`✅ Fixed: ${fixedCount} videos`);
  console.log(`✓  Already correct: ${alreadyCorrectCount} videos`);
  console.log(`❌ Errors: ${errorCount} videos`);
  
  // Verify the results
  const verificationQuery = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN json_extract(metadata, '$.relativePath') = 'clips' THEN 1 END) as with_clips_path,
      COUNT(CASE WHEN json_extract(metadata, '$.relativePath') IS NOT NULL AND json_extract(metadata, '$.relativePath') != 'clips' THEN 1 END) as with_custom_path,
      COUNT(CASE WHEN json_extract(metadata, '$.relativePath') IS NULL THEN 1 END) as missing_path
    FROM videos 
    WHERE metadata IS NOT NULL
  `).get();
  
  console.log(`\n📊 Final verification:`);
  console.log(`Total videos: ${verificationQuery.total}`);
  console.log(`Videos with 'clips' path: ${verificationQuery.with_clips_path}`);
  console.log(`Videos with custom paths: ${verificationQuery.with_custom_path}`);
  console.log(`Videos missing relativePath: ${verificationQuery.missing_path}`);
  
  // Show a few examples of videos and their paths
  const examples = db.prepare(`
    SELECT filename, json_extract(metadata, '$.relativePath') as relativePath
    FROM videos 
    WHERE metadata IS NOT NULL
    LIMIT 5
  `).all();
  
  console.log(`\n📝 Example video paths:`);
  examples.forEach(ex => {
    console.log(`   ${ex.filename} -> relativePath: '${ex.relativePath || 'NULL'}'`);
  });
  
  db.close();
  
  if (fixedCount > 0) {
    console.log(`\n🔄 ${fixedCount} videos were updated. Please restart your application to see the changes.`);
  } else {
    console.log(`\n✨ All videos already had correct paths!`);
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
