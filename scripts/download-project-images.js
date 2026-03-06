#!/usr/bin/env node

/**
 * Download Project Images Script
 * 
 * Downloads all non-hidden images from the current project to a local directory.
 * 
 * Usage:
 *   node scripts/download-project-images.js [options]
 * 
 * Options:
 *   --project-id <id>    Override current project (optional)
 *   --output-dir <path>  Custom output directory (default: ./downloads/images)
 *   --dry-run           Show what would be downloaded without downloading
 *   --help              Show this help message
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCurrentProjectFromServerSync } from '../src/lib/serverStateUtils.js';

// Get current file directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path (same as in database.ts)
const DB_PATH = path.join(process.cwd(), 'forge.db');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  projectId: null,
  outputDir: path.join(require('os').homedir(), 'Downloads', 'forge-images'),
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
📸 Forge Project Image Download Script

Downloads all non-hidden images from the current project.

Usage:
  node scripts/download-project-images.js [options]

Options:
  --project-id <id>    Override current project (optional)
  --output-dir <path>  Custom output directory (default: ~/Downloads/forge-images)
  --dry-run           Show what would be downloaded without downloading
  --help              Show this help message

Examples:
  # Download current project images to default location
  node scripts/download-project-images.js

  # Download specific project images
  node scripts/download-project-images.js --project-id amc

  # Download to custom directory
  node scripts/download-project-images.js --output-dir ./my-images

  # Preview what would be downloaded
  node scripts/download-project-images.js --dry-run
`);
  process.exit(0);
}

/**
 * Initialize SQLite database connection
 */
function initDatabase() {
  try {
    // Dynamic import for ES modules compatibility
    const Database = require('better-sqlite3');
    
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database not found at ${DB_PATH}`);
    }
    
    const db = new Database(DB_PATH);
    console.log('✅ Database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
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
 * Get all non-hidden images for a project
 */
function getProjectImages(db, projectId) {
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
      WHERE project_id = ? 
        AND (hidden = 0 OR hidden IS NULL)
      ORDER BY created_at DESC
    `;
    
    const stmt = db.prepare(query);
    const images = stmt.all(projectId);
    
    console.log(`📊 Found ${images.length} non-hidden images in project "${projectId}"`);
    return images;
  } catch (error) {
    console.error('❌ Failed to query images:', error.message);
    return [];
  }
}

/**
 * Download a single image file
 */
async function downloadImage(image, outputDir) {
  const sourcePath = path.join(process.cwd(), 'public', 'images', image.filename);
  const targetPath = path.join(outputDir, image.filename);
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return { success: false, error: 'Source file not found' };
    }
    
    // Get file stats
    const stats = fs.statSync(sourcePath);
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would copy: ${image.filename} (${formatBytes(stats.size)})`);
      return { success: true, dryRun: true };
    }
    
    // Copy file
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`✅ Downloaded: ${image.filename} (${formatBytes(stats.size)})`);
    return { success: true, size: stats.size };
  } catch (error) {
    console.error(`❌ Failed to download ${image.filename}:`, error.message);
    return { success: false, error: error.message };
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
 * Create project metadata file
 */
function createMetadataFile(projectId, images, outputDir, results) {
  const metadata = {
    project: projectId,
    downloadDate: new Date().toISOString(),
    totalImages: images.length,
    successfulDownloads: results.filter(r => r.success).length,
    failedDownloads: results.filter(r => !r.success).length,
    totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0),
    images: images.map((img, index) => ({
      id: img.id,
      filename: img.filename,
      title: img.title,
      description: img.description,
      createdAt: img.created_at,
      fileSize: img.file_size,
      dimensions: img.width && img.height ? `${img.width}x${img.height}` : null,
      downloadStatus: results[index]?.success ? 'success' : 'failed',
      downloadError: results[index]?.error || null
    }))
  };
  
  const metadataPath = path.join(outputDir, `${projectId}-metadata.json`);
  
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
  console.log('🚀 Starting Forge Project Image Download\n');
  
  // Get current project
  const projectId = getCurrentProject();
  
  // Initialize database
  const db = initDatabase();
  
  // Get project images
  const images = getProjectImages(db, projectId);
  
  if (images.length === 0) {
    console.log('📭 No images found to download');
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
  
  console.log(`\n📸 ${options.dryRun ? '[DRY RUN] Would download' : 'Downloading'} ${images.length} images...\n`);
  
  // Download all images
  const results = [];
  let totalSize = 0;
  
  for (const image of images) {
    const result = await downloadImage(image, options.outputDir);
    results.push(result);
    
    if (result.success && result.size) {
      totalSize += result.size;
    }
  }
  
  // Create metadata file
  createMetadataFile(projectId, images, options.outputDir, results);
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Download Summary:');
  console.log(`   Project: ${projectId}`);
  console.log(`   Total Images: ${images.length}`);
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
