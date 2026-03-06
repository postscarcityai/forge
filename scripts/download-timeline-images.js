#!/usr/bin/env node

/**
 * Download Timeline Images Script
 * 
 * Downloads ONLY images that are in the timeline (have timeline_order) from the current project to Downloads folder.
 * 
 * Usage:
 *   node scripts/download-timeline-images.js [options]
 * 
 * Options:
 *   --project-id <id>    Override current project (optional)
 *   --output-dir <path>  Custom output directory (default: ~/Downloads/forge-timeline-images)
 *   --dry-run           Show what would be downloaded without downloading
 *   --help              Show this help message
 */

const fs = require('fs');
const path = require('path');

// Database path (same as in database.ts)
const DB_PATH = path.join(process.cwd(), 'forge.db');
const STATE_FILE = path.join(process.cwd(), '.forge-state.json');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  projectId: null,
  outputDir: path.join(require('os').homedir(), 'Downloads', 'forge-timeline-images'),
  dryRun: false,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--project-id':
      options.projectId = args[++i];
      break;
    case '--output-dir':
      options.outputDir = args[++i];
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
📋 Forge Timeline Images Download Script

Downloads ONLY images that are in the timeline (have timeline_order) from the current project.

Usage:
  node scripts/download-timeline-images.js [options]

Options:
  --project-id <id>    Override current project (optional)
  --output-dir <path>  Custom output directory (default: ~/Downloads/forge-timeline-images)
  --dry-run           Show what would be downloaded without downloading
  --help              Show this help message

Examples:
  # Download current project timeline images to default location
  node scripts/download-timeline-images.js

  # Download specific project timeline images
  node scripts/download-timeline-images.js --project-id amc

  # Download to custom directory
  node scripts/download-timeline-images.js --output-dir ./my-timeline-images

  # Preview what would be downloaded
  node scripts/download-timeline-images.js --dry-run
`);
  process.exit(0);
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
    
    // Try to install better-sqlite3 if not found
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
function getCurrentProjectFromServerSync() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.log('📁 No server state file found, using default project');
      return 'default';
    }
    
    const stateData = fs.readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(stateData);
    
    console.log(`📁 Read current project from server state: ${state.currentProject}`);
    return state.currentProject || 'default';
  } catch (error) {
    console.warn('Failed to read current project from server state:', error.message);
    return 'default';
  }
}

/**
 * Get the current project ID
 */
function getCurrentProject() {
  if (options.projectId) {
    console.log(`📁 Using override project ID: ${options.projectId}`);
    return options.projectId;
  }
  
  try {
    const projectId = getCurrentProjectFromServerSync();
    console.log(`📁 Current project from server state: ${projectId}`);
    return projectId;
  } catch (error) {
    console.warn('⚠️  Failed to get current project, using "default":', error.message);
    return 'default';
  }
}

/**
 * Get ONLY timeline images for a project (those with timeline_order)
 */
function getTimelineImages(db, projectId) {
  try {
    const query = `
      SELECT 
        id, 
        filename, 
        title, 
        description, 
        created_at, 
        file_size,
        width,
        height,
        metadata,
        timeline_order
      FROM images 
      WHERE project_id = ? 
        AND (hidden = 0 OR hidden IS NULL)
        AND timeline_order IS NOT NULL
      ORDER BY timeline_order ASC
    `;
    
    const stmt = db.prepare(query);
    const images = stmt.all(projectId);
    
    console.log(`📋 Found ${images.length} timeline images in project "${projectId}"`);
    
    if (images.length > 0) {
      const minOrder = Math.min(...images.map(img => img.timeline_order));
      const maxOrder = Math.max(...images.map(img => img.timeline_order));
      console.log(`   📊 Timeline order range: ${minOrder} - ${maxOrder}`);
    }
    
    return images;
  } catch (error) {
    console.error('❌ Failed to query timeline images:', error.message);
    return [];
  }
}

/**
 * Download a single timeline image file
 */
function downloadTimelineImage(image, outputDir, index) {
  const sourcePath = path.join(process.cwd(), 'public', 'images', image.filename);
  
  // Create filename with timeline order prefix
  const orderPrefix = String(image.timeline_order).padStart(3, '0');
  const prefixedFilename = `${orderPrefix}-${image.filename}`;
  const targetPath = path.join(outputDir, prefixedFilename);
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return { success: false, error: 'Source file not found', originalFilename: image.filename, prefixedFilename };
    }
    
    // Get file stats
    const stats = fs.statSync(sourcePath);
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would copy: ${prefixedFilename} [Timeline: ${image.timeline_order}] (${formatBytes(stats.size)})`);
      return { success: true, dryRun: true, originalFilename: image.filename, prefixedFilename };
    }
    
    // Copy file
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`✅ Downloaded: ${prefixedFilename} [Timeline: ${image.timeline_order}] (${formatBytes(stats.size)})`);
    return { success: true, size: stats.size, originalFilename: image.filename, prefixedFilename };
  } catch (error) {
    console.error(`❌ Failed to download ${image.filename}:`, error.message);
    return { success: false, error: error.message, originalFilename: image.filename, prefixedFilename };
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create timeline metadata file
 */
function createTimelineMetadataFile(projectId, images, outputDir, results) {
  const metadata = {
    project: projectId,
    downloadDate: new Date().toISOString(),
    downloadType: 'timeline-only',
    totalTimelineImages: images.length,
    successfulDownloads: results.filter(r => r.success).length,
    failedDownloads: results.filter(r => !r.success).length,
    totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0),
    orderingInfo: {
      description: "Only timeline images downloaded. Images are numbered based on their timeline_order (001, 002, etc.).",
      timelineOrderOnly: true
    },
    timelineRange: images.length > 0 ? {
      min: Math.min(...images.map(img => img.timeline_order)),
      max: Math.max(...images.map(img => img.timeline_order))
    } : null,
    images: images.map((img, index) => ({
      id: img.id,
      originalFilename: img.filename,
      downloadedFilename: results[index]?.prefixedFilename || `${String(img.timeline_order).padStart(3, '0')}-${img.filename}`,
      title: img.title,
      description: img.description,
      createdAt: img.created_at,
      fileSize: img.file_size,
      dimensions: img.width && img.height ? `${img.width}x${img.height}` : null,
      timelineOrder: img.timeline_order,
      downloadStatus: results[index]?.success ? 'success' : 'failed',
      downloadError: results[index]?.error || null
    }))
  };
  
  const metadataPath = path.join(outputDir, `${projectId}-timeline-metadata.json`);
  
  if (options.dryRun) {
    console.log(`[DRY RUN] Would create metadata file: ${metadataPath}`);
    return;
  }
  
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Created timeline metadata file: ${metadataPath}`);
  } catch (error) {
    console.warn('⚠️  Failed to create metadata file:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Forge Timeline Images Download\n');
  
  // Get current project
  const projectId = getCurrentProject();
  
  // Initialize database
  const db = initDatabase();
  
  // Get timeline images only
  const images = getTimelineImages(db, projectId);
  
  if (images.length === 0) {
    console.log('📭 No timeline images found to download');
    console.log('💡 Timeline images are those with a timeline_order value set');
    db.close();
    return;
  }
  
  // Create output directory
  try {
    if (!options.dryRun) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${options.outputDir}`);
    } else {
      console.log(`[DRY RUN] Would create output directory: ${options.outputDir}`);
    }
  } catch (error) {
    console.error('❌ Failed to create output directory:', error.message);
    db.close();
    process.exit(1);
  }
  
  console.log(`\n📋 ${options.dryRun ? '[DRY RUN] Would download' : 'Downloading'} ${images.length} timeline images...\n`);
  
  // Download all timeline images
  const results = [];
  let totalSize = 0;
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const result = downloadTimelineImage(image, options.outputDir, i);
    results.push(result);
    
    if (result.success && result.size) {
      totalSize += result.size;
    }
  }
  
  // Create metadata file
  createTimelineMetadataFile(projectId, images, options.outputDir, results);
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Download Summary:');
  console.log(`   Project: ${projectId}`);
  console.log(`   Timeline Images: ${images.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  
  if (!options.dryRun && totalSize > 0) {
    console.log(`   Total Size: ${formatBytes(totalSize)}`);
    console.log(`   Output Directory: ${options.outputDir}`);
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Some downloads failed. Check the metadata file for details.');
  }
  
  // Close database
  db.close();
  
  console.log('\n✨ Timeline download completed!');
  console.log(`📋 Downloaded ${successful} timeline images in order`);
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

