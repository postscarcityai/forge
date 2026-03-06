#!/usr/bin/env node

/**
 * Check the current state of video paths in the database
 * This script analyzes video metadata to show which videos need path fixes
 */

const Database = require('better-sqlite3');
const path = require('path');

// Get database path
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

console.log('🔍 Checking video paths in database...');
console.log(`📍 Database path: ${DB_PATH}`);

try {
  // Open database
  const db = new Database(DB_PATH, { readonly: true });
  
  // Get all videos with their metadata
  const videos = db.prepare(`
    SELECT id, filename, metadata, created_at
    FROM videos 
    ORDER BY created_at DESC
  `).all();
  
  console.log(`📊 Found ${videos.length} total videos in database\n`);
  
  if (videos.length === 0) {
    console.log('ℹ️  No videos found in database');
    db.close();
    return;
  }
  
  let correctPaths = 0;
  let missingPaths = 0;
  let customPaths = 0;
  let needsFixing = [];
  
  console.log('📋 Video Path Analysis:');
  console.log('=' .repeat(60));
  
  videos.forEach((video, index) => {
    try {
      const metadata = video.metadata ? JSON.parse(video.metadata) : {};
      const relativePath = metadata.relativePath;
      const localPath = metadata.local_path;
      
      let status = '';
      let pathInfo = '';
      
      if (!relativePath || relativePath.trim() === '') {
        status = '❌ MISSING';
        pathInfo = 'No relativePath set';
        missingPaths++;
        needsFixing.push({
          filename: video.filename,
          issue: 'Missing relativePath',
          id: video.id
        });
      } else if (relativePath === 'clips') {
        status = '✅ CORRECT';
        pathInfo = `relativePath: '${relativePath}'`;
        correctPaths++;
      } else {
        status = '⚠️  CUSTOM';
        pathInfo = `relativePath: '${relativePath}'`;
        customPaths++;
      }
      
      // Only show first 10 videos to avoid spam
      if (index < 10) {
        console.log(`${String(index + 1).padStart(2, ' ')}. ${video.filename}`);
        console.log(`    ${status} - ${pathInfo}`);
        if (localPath) {
          console.log(`    Local path: ${localPath}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`${String(index + 1).padStart(2, ' ')}. ${video.filename}`);
      console.log(`    ❌ ERROR - Invalid metadata: ${error.message}`);
      console.log('');
      needsFixing.push({
        filename: video.filename,
        issue: 'Invalid metadata JSON',
        id: video.id
      });
    }
  });
  
  if (videos.length > 10) {
    console.log(`... and ${videos.length - 10} more videos\n`);
  }
  
  console.log('📊 Summary:');
  console.log('=' .repeat(40));
  console.log(`✅ Correct paths (clips):     ${correctPaths}`);
  console.log(`⚠️  Custom paths:             ${customPaths}`);
  console.log(`❌ Missing/broken paths:      ${missingPaths}`);
  console.log(`📁 Total videos:              ${videos.length}`);
  
  if (needsFixing.length > 0) {
    console.log(`\n🔧 Videos that need fixing (${needsFixing.length}):`);
    needsFixing.forEach((video, i) => {
      console.log(`   ${i + 1}. ${video.filename} - ${video.issue}`);
    });
    
    console.log(`\n💡 To fix these videos, run:`);
    console.log(`   node scripts/fix-all-video-paths.js`);
  } else {
    console.log(`\n✨ All videos have correct paths!`);
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Check failed:', error);
  process.exit(1);
}
