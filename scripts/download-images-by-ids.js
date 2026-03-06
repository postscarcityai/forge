#!/usr/bin/env node

/**
 * Download Images by IDs Script
 * 
 * Downloads specific images by their IDs, regardless of timeline order in database.
 * Perfect for downloading timeline images when you have the IDs from IndexedDB.
 * 
 * Usage:
 *   node scripts/download-images-by-ids.js --image-ids "id1,id2,id3" [options]
 * 
 * Options:
 *   --image-ids <ids>     Comma-separated list of image IDs to download (required)
 *   --project-id <id>     Override current project (optional)
 *   --output-dir <path>   Custom output directory (default: ~/Downloads/forge-timeline-images)
 *   --dry-run            Show what would be downloaded without downloading
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
  imageIds: null,
  projectId: null,
  outputDir: path.join(require('os').homedir(), 'Downloads', 'forge-timeline-images'),
  dryRun: false,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--image-ids':
      options.imageIds = args[++i];
      break;
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
📸 Download Images by IDs Script

Downloads specific images by their IDs, perfect for downloading timeline images.

Usage:
  node scripts/download-images-by-ids.js --image-ids "id1,id2,id3" [options]

Options:
  --image-ids <ids>     Comma-separated list of image IDs to download (required)
  --project-id <id>     Override current project (optional)
  --output-dir <path>   Custom output directory (default: ~/Downloads/forge-timeline-images)
  --dry-run            Show what would be downloaded without downloading
  --help               Show this help message

Examples:
  # Download specific images
  node scripts/download-images-by-ids.js --image-ids "img-123,img-456,img-789"

  # Preview what would be downloaded
  node scripts/download-images-by-ids.js --image-ids "img-123,img-456" --dry-run

  # Download to custom directory
  node scripts/download-images-by-ids.js --image-ids "img-123" --output-dir ./my-images

Getting Image IDs:
  1. Open your Forge app in browser
  2. Open Developer Tools (F12) → Console
  3. Paste the code from: node scripts/get-timeline-image-ids.js
  4. Copy the image IDs and use them here
`);
  process.exit(0);
}

// Validate required arguments
if (!options.imageIds) {
  console.error('❌ Error: --image-ids is required');
  console.log('💡 Run with --help for usage information');
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
 * Parse image IDs from command line argument
 */
function parseImageIds() {
  const idsString = options.imageIds.trim();
  if (!idsString) {
    throw new Error('Image IDs string is empty');
  }
  
  // Split by comma and trim each ID
  const ids = idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  if (ids.length === 0) {
    throw new Error('No valid image IDs found');
  }
  
  console.log(`📋 Parsed ${ids.length} image IDs:`);
  ids.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });
  
  return ids;
}

/**
 * Get images by IDs from database
 */
function getImagesByIds(db, projectId, imageIds) {
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
        metadata
      FROM images 
      WHERE project_id = ? AND id = ?
    `;
    
    const stmt = db.prepare(query);
    const foundImages = [];
    const missingImages = [];
    
    for (const imageId of imageIds) {
      const image = stmt.get(projectId, imageId);
      if (image) {
        foundImages.push(image);
      } else {
        missingImages.push(imageId);
      }
    }
    
    console.log(`📊 Found ${foundImages.length} images in project "${projectId}"`);
    
    if (missingImages.length > 0) {
      console.log(`⚠️  Missing ${missingImages.length} images:`);
      missingImages.forEach(id => console.log(`   - ${id}`));
    }
    
    return { foundImages, missingImages };
  } catch (error) {
    console.error('❌ Failed to query images:', error.message);
    return { foundImages: [], missingImages: imageIds };
  }
}

/**
 * Download a single image file
 */
function downloadImage(image, outputDir, index) {
  const sourcePath = path.join(process.cwd(), 'public', 'images', image.filename);
  
  // Create filename with order prefix
  const orderPrefix = String(index + 1).padStart(3, '0');
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
      console.log(`[DRY RUN] Would copy: ${prefixedFilename} (${formatBytes(stats.size)})`);
      return { success: true, dryRun: true, originalFilename: image.filename, prefixedFilename };
    }
    
    // Copy file
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`✅ Downloaded: ${prefixedFilename} (${formatBytes(stats.size)})`);
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
 * Create metadata file
 */
function createMetadataFile(projectId, images, imageIds, outputDir, results) {
  const metadata = {
    project: projectId,
    downloadDate: new Date().toISOString(),
    downloadType: 'specific-ids',
    requestedImages: imageIds.length,
    foundImages: images.length,
    successfulDownloads: results.filter(r => r.success).length,
    failedDownloads: results.filter(r => !r.success).length,
    totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0),
    requestedIds: imageIds,
    images: images.map((img, index) => ({
      id: img.id,
      originalFilename: img.filename,
      downloadedFilename: results[index]?.prefixedFilename || `${String(index + 1).padStart(3, '0')}-${img.filename}`,
      title: img.title,
      description: img.description,
      createdAt: img.created_at,
      fileSize: img.file_size,
      dimensions: img.width && img.height ? `${img.width}x${img.height}` : null,
      downloadOrder: index + 1,
      downloadStatus: results[index]?.success ? 'success' : 'failed',
      downloadError: results[index]?.error || null
    }))
  };
  
  const metadataPath = path.join(outputDir, `${projectId}-specific-images-metadata.json`);
  
  if (options.dryRun) {
    console.log(`[DRY RUN] Would create metadata file: ${metadataPath}`);
    return;
  }
  
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Created metadata file: ${metadataPath}`);
  } catch (error) {
    console.warn('⚠️  Failed to create metadata file:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Image Download by IDs\n');
  
  // Parse image IDs
  const imageIds = parseImageIds();
  
  // Get current project
  const projectId = getCurrentProject();
  
  // Initialize database
  const db = initDatabase();
  
  // Get images by IDs
  const { foundImages, missingImages } = getImagesByIds(db, projectId, imageIds);
  
  if (foundImages.length === 0) {
    console.log('📭 No images found to download');
    console.log('💡 Check that the image IDs are correct for this project');
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
  
  console.log(`\n📸 ${options.dryRun ? '[DRY RUN] Would download' : 'Downloading'} ${foundImages.length} images...\n`);
  
  // Download all images
  const results = [];
  let totalSize = 0;
  
  for (let i = 0; i < foundImages.length; i++) {
    const image = foundImages[i];
    const result = downloadImage(image, options.outputDir, i);
    results.push(result);
    
    if (result.success && result.size) {
      totalSize += result.size;
    }
  }
  
  // Create metadata file
  createMetadataFile(projectId, foundImages, imageIds, options.outputDir, results);
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Download Summary:');
  console.log(`   Project: ${projectId}`);
  console.log(`   Requested: ${imageIds.length} images`);
  console.log(`   Found: ${foundImages.length} images`);
  console.log(`   Downloaded: ${successful}`);
  console.log(`   Failed: ${failed}`);
  
  if (missingImages.length > 0) {
    console.log(`   Missing: ${missingImages.length}`);
  }
  
  if (!options.dryRun && totalSize > 0) {
    console.log(`   Total Size: ${formatBytes(totalSize)}`);
    console.log(`   Output Directory: ${options.outputDir}`);
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Some downloads failed. Check the metadata file for details.');
  }
  
  if (missingImages.length > 0) {
    console.log('\n💡 Missing images might be in a different project or have different IDs');
  }
  
  // Close database
  db.close();
  
  console.log('\n✨ Download completed!');
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

