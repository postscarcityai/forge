#!/usr/bin/env node

/**
 * Sync Timeline to Database Script
 * 
 * Syncs timeline order from IndexedDB to SQLite database by updating timeline_order column.
 * This script takes timeline image IDs and updates the database with proper timeline ordering.
 * 
 * Usage:
 *   node scripts/sync-timeline-to-database.js --timeline-ids "id1,id2,id3" [options]
 * 
 * Options:
 *   --timeline-ids <ids>  Comma-separated list of image IDs in timeline order (required)
 *   --project-id <id>     Override current project (optional)
 *   --dry-run            Show what would be updated without updating
 *   --help               Show this help message
 */

const fs = require('fs');
const path = require('path');

// Database path (same as in database.ts)
const DB_PATH = path.join(process.cwd(), 'forge.db');
const STATE_FILE = path.join(process.cwd(), '.forge-state.json');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  timelineIds: null,
  projectId: null,
  dryRun: false,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--timeline-ids':
      options.timelineIds = args[++i];
      break;
    case '--project-id':
      options.projectId = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--help':
      options.help = true;
      break;
    default:
      console.warn(`⚠️  Unknown argument: ${arg}`);
  }
}

// Show help and exit
if (options.help) {
  console.log(`
📋 Sync Timeline to Database Script

Syncs timeline order from IndexedDB to SQLite database by updating timeline_order column.

Usage:
  node scripts/sync-timeline-to-database.js --timeline-ids "id1,id2,id3" [options]

Options:
  --timeline-ids <ids>  Comma-separated list of image IDs in timeline order (required)
  --project-id <id>     Override current project (optional)
  --dry-run            Show what would be updated without updating
  --help               Show this help message

Examples:
  # Sync timeline order to database
  node scripts/sync-timeline-to-database.js --timeline-ids "img-123,img-456,img-789"

  # Preview what would be updated (dry run)
  node scripts/sync-timeline-to-database.js --timeline-ids "img-123,img-456" --dry-run

  # Sync for specific project
  node scripts/sync-timeline-to-database.js --timeline-ids "img-123,img-456" --project-id amc

Getting Timeline IDs:
  1. Run: node scripts/get-timeline-image-ids.js
  2. Follow the instructions to get image IDs from browser's IndexedDB
  3. Use those IDs with this script
`);
  process.exit(0);
}

// Validate required arguments
if (!options.timelineIds) {
  console.error('❌ Error: --timeline-ids is required');
  console.log('💡 Run with --help for usage information');
  console.log('💡 Run: node scripts/get-timeline-image-ids.js to get timeline IDs');
  process.exit(1);
}

/**
 * Initialize SQLite database connection
 */
function initDatabase() {
  try {
    const Database = require('better-sqlite3');
    
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database not found at ${DB_PATH}`);
    }
    
    const db = new Database(DB_PATH);
    console.log('✅ Database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    
    if (error.message.includes("Cannot find module 'better-sqlite3'")) {
      console.log('\n💡 It looks like better-sqlite3 is not installed.');
      console.log('   Run: npm install better-sqlite3');
      console.log('   Or: npm install (to install all dependencies)');
    }
    
    process.exit(1);
  }
}

/**
 * Get the current project from server state
 */
function getCurrentProject() {
  if (options.projectId) {
    console.log(`📁 Using override project ID: ${options.projectId}`);
    return options.projectId;
  }
  
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.log('📁 No server state file found, using default project');
      return 'default';
    }
    
    const stateData = fs.readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(stateData);
    
    console.log(`📁 Current project from server state: ${state.currentProject}`);
    return state.currentProject || 'default';
  } catch (error) {
    console.warn('⚠️  Failed to read current project from server state, using "default":', error.message);
    return 'default';
  }
}

/**
 * Parse timeline IDs from command line argument
 */
function parseTimelineIds() {
  const idsString = options.timelineIds.trim();
  if (!idsString) {
    throw new Error('Timeline IDs string is empty');
  }
  
  // Split by comma and trim each ID
  const ids = idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  if (ids.length === 0) {
    throw new Error('No valid timeline IDs found');
  }
  
  console.log(`📋 Parsed ${ids.length} timeline image IDs:`);
  ids.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });
  
  return ids;
}

/**
 * Verify images exist in database
 */
function verifyImagesExist(db, projectId, imageIds) {
  try {
    const query = `
      SELECT id, filename, title
      FROM images 
      WHERE project_id = ? AND id = ?
    `;
    
    const stmt = db.prepare(query);
    const existingImages = [];
    const missingImages = [];
    
    for (const imageId of imageIds) {
      const image = stmt.get(projectId, imageId);
      if (image) {
        existingImages.push(image);
      } else {
        missingImages.push(imageId);
      }
    }
    
    console.log(`📊 Image verification for project "${projectId}":`);
    console.log(`   ✅ Found: ${existingImages.length} images`);
    console.log(`   ❌ Missing: ${missingImages.length} images`);
    
    if (missingImages.length > 0) {
      console.log('\n❌ Missing image IDs:');
      missingImages.forEach(id => console.log(`   - ${id}`));
    }
    
    if (existingImages.length > 0) {
      console.log('\n✅ Found images:');
      existingImages.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.id} - ${img.filename} - ${img.title || 'No title'}`);
      });
    }
    
    return { existingImages, missingImages };
  } catch (error) {
    console.error('❌ Failed to verify images:', error.message);
    return { existingImages: [], missingImages: imageIds };
  }
}

/**
 * Update timeline order in database
 */
function updateTimelineOrder(db, projectId, imageIds) {
  try {
    // First, clear existing timeline_order for this project
    const clearQuery = `
      UPDATE images 
      SET timeline_order = NULL 
      WHERE project_id = ?
    `;
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would clear existing timeline_order for project "${projectId}"`);
    } else {
      const clearStmt = db.prepare(clearQuery);
      const clearResult = clearStmt.run(projectId);
      console.log(`🧹 Cleared timeline_order for ${clearResult.changes} images in project "${projectId}"`);
    }
    
    // Then, set timeline_order for the specified images
    const updateQuery = `
      UPDATE images 
      SET timeline_order = ? 
      WHERE project_id = ? AND id = ?
    `;
    
    const updateStmt = db.prepare(updateQuery);
    let updatedCount = 0;
    
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const timelineOrder = i + 1; // 1-based ordering
      
      if (options.dryRun) {
        console.log(`[DRY RUN] Would set timeline_order=${timelineOrder} for image ${imageId}`);
      } else {
        const result = updateStmt.run(timelineOrder, projectId, imageId);
        if (result.changes > 0) {
          updatedCount++;
          console.log(`✅ Set timeline_order=${timelineOrder} for image ${imageId}`);
        } else {
          console.warn(`⚠️  No rows updated for image ${imageId} (may not exist)`);
        }
      }
    }
    
    if (!options.dryRun) {
      console.log(`\n📊 Updated timeline_order for ${updatedCount} images`);
    }
    
    return updatedCount;
  } catch (error) {
    console.error('❌ Failed to update timeline order:', error.message);
    return 0;
  }
}

/**
 * Verify the timeline order was set correctly
 */
function verifyTimelineOrder(db, projectId) {
  try {
    const query = `
      SELECT id, filename, title, timeline_order
      FROM images 
      WHERE project_id = ? AND timeline_order IS NOT NULL
      ORDER BY timeline_order ASC
    `;
    
    const stmt = db.prepare(query);
    const timelineImages = stmt.all(projectId);
    
    console.log(`\n📋 Verification - Timeline images in database (${timelineImages.length} total):`);
    timelineImages.forEach(img => {
      console.log(`   ${img.timeline_order}. ${img.id} - ${img.filename} - ${img.title || 'No title'}`);
    });
    
    return timelineImages;
  } catch (error) {
    console.error('❌ Failed to verify timeline order:', error.message);
    return [];
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Timeline to Database Sync\n');
  
  // Parse timeline IDs
  const timelineIds = parseTimelineIds();
  
  // Get current project
  const projectId = getCurrentProject();
  
  // Initialize database
  const db = initDatabase();
  
  // Verify images exist
  const { existingImages, missingImages } = verifyImagesExist(db, projectId, timelineIds);
  
  if (existingImages.length === 0) {
    console.log('❌ No images found in database - nothing to sync');
    db.close();
    return;
  }
  
  if (missingImages.length > 0) {
    console.log(`\n⚠️  Warning: ${missingImages.length} images not found in database`);
    console.log('💡 These images may need to be synced to the database first');
    console.log('💡 Consider running the image sync API endpoint first');
  }
  
  console.log(`\n📋 ${options.dryRun ? '[DRY RUN] Would sync' : 'Syncing'} timeline order for ${existingImages.length} images...\n`);
  
  // Update timeline order
  const updatedCount = updateTimelineOrder(db, projectId, timelineIds);
  
  // Verify results (only if not dry run)
  if (!options.dryRun && updatedCount > 0) {
    verifyTimelineOrder(db, projectId);
  }
  
  // Summary
  console.log('\n📊 Sync Summary:');
  console.log(`   Project: ${projectId}`);
  console.log(`   Timeline Images: ${timelineIds.length}`);
  console.log(`   Found in DB: ${existingImages.length}`);
  console.log(`   Missing from DB: ${missingImages.length}`);
  
  if (!options.dryRun) {
    console.log(`   Updated: ${updatedCount}`);
  }
  
  // Close database
  db.close();
  
  console.log('\n✨ Timeline sync completed!');
  
  if (!options.dryRun && updatedCount > 0) {
    console.log('💡 Now you can run the timeline download script:');
    console.log('   node scripts/download-timeline-images.js');
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});

