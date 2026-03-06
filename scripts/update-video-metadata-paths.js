#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update video metadata files to include correct relativePath for clips directory
 */
function updateVideoMetadataPaths() {
  const videoInfoDir = path.join(process.cwd(), 'public', 'videos', 'clips', 'video-info');
  
  if (!fs.existsSync(videoInfoDir)) {
    console.log('❌ Video info directory does not exist:', videoInfoDir);
    return;
  }

  const files = fs.readdirSync(videoInfoDir);
  const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
  
  console.log(`📁 Found ${metadataFiles.length} metadata files to update`);
  
  let updatedCount = 0;
  
  for (const file of metadataFiles) {
    try {
      const filePath = path.join(videoInfoDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const metadata = JSON.parse(content);
      
      // Check if metadata needs updating
      let needsUpdate = false;
      
      // Update relativePath in main metadata
      if (!metadata.metadata) {
        metadata.metadata = {};
      }
      
      if (metadata.metadata.relativePath !== 'clips') {
        metadata.metadata.relativePath = 'clips';
        needsUpdate = true;
      }
      
      // Update local_path if it exists and doesn't include clips
      if (metadata.metadata.local_path && !metadata.metadata.local_path.includes('clips')) {
        const filename = metadata.filename || path.basename(metadata.metadata.local_path);
        metadata.metadata.local_path = path.join('videos', 'clips', filename);
        needsUpdate = true;
      }
      
      // Update updatedAt timestamp
      if (needsUpdate) {
        metadata.updatedAt = new Date().toISOString();
        
        // Write back the updated metadata
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
        updatedCount++;
        
        console.log(`✅ Updated ${file}`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error);
    }
  }
  
  console.log(`🎯 Migration complete: Updated ${updatedCount} metadata files`);
}

// Run the update
updateVideoMetadataPaths(); 