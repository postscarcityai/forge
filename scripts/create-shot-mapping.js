#!/usr/bin/env node

/**
 * Create shot mapping file for cheesy-movie project
 * 
 * This script:
 * 1. Gets all images for the cheese project from database
 * 2. Extracts shot numbers from concept/title fields
 * 3. Creates a mapping file template with best guesses
 * 4. Outputs to docs/projects/cheesy-movie/data/image-to-shot-mapping.json
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'forge.db');
const MAPPING_FILE = path.join(__dirname, '..', 'docs', 'projects', 'cheesy-movie', 'data', 'image-to-shot-mapping.json');

/**
 * Extract shot number from concept/title
 * e.g., "shot-15-herve-intro" -> "15"
 *       "shot-17a-chayz-performs" -> "17a"
 */
function extractShotNumber(text) {
  if (!text) return null;
  
  // Try concept pattern: shot-15-herve-intro
  const conceptMatch = text.match(/shot-(\d+[a-z]?)/i);
  if (conceptMatch) {
    return conceptMatch[1].toLowerCase();
  }
  
  // Try title pattern: shot-17a-chayz-performing
  const titleMatch = text.match(/shot-(\d+[a-z]?)/i);
  if (titleMatch) {
    return titleMatch[1].toLowerCase();
  }
  
  return null;
}

/**
 * Determine confidence level based on match quality
 */
function getConfidence(image, extractedShot) {
  if (extractedShot) {
    // If we extracted from concept field, high confidence
    if (image.metadata && typeof image.metadata === 'string') {
      try {
        const metadata = JSON.parse(image.metadata);
        if (metadata.concept && metadata.concept.includes(`shot-${extractedShot}`)) {
          return 'high';
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return 'medium';
  }
  return 'low';
}

async function main() {
  console.log('🧀 Creating Shot Mapping File for Cheesy Movie...\n');
  
  const db = new Database(DB_PATH);
  
  // Get all images for cheese project (excluding hidden images)
  const images = db.prepare(`
    SELECT 
      id, 
      title, 
      filename, 
      created_at, 
      metadata,
      timeline_order
    FROM images 
    WHERE project_id = 'cheese'
      AND (hidden = 0 OR hidden IS NULL)
    ORDER BY created_at ASC
  `).all();
  
  console.log(`📸 Found ${images.length} images for cheese project\n`);
  
  // Parse metadata and extract shot numbers
  const mappings = [];
  const unmatched = [];
  
  images.forEach(image => {
    let extractedShot = null;
    let metadataObj = null;
    
    // Parse metadata if it's a string
    if (image.metadata && typeof image.metadata === 'string') {
      try {
        metadataObj = JSON.parse(image.metadata);
      } catch (e) {
        console.warn(`⚠️  Could not parse metadata for ${image.id}: ${e.message}`);
      }
    } else if (image.metadata) {
      metadataObj = image.metadata;
    }
    
    // Try to extract shot number from concept field
    if (metadataObj && metadataObj.concept) {
      extractedShot = extractShotNumber(metadataObj.concept);
    }
    
    // Fallback to title
    if (!extractedShot && image.title) {
      extractedShot = extractShotNumber(image.title);
    }
    
    // Fallback to filename
    if (!extractedShot && image.filename) {
      extractedShot = extractShotNumber(image.filename);
    }
    
    if (extractedShot) {
      mappings.push({
        imageId: image.id,
        shot: extractedShot,
        confidence: getConfidence(image, extractedShot),
        title: image.title,
        concept: metadataObj?.concept || null,
        filename: image.filename,
        createdAt: image.created_at,
        currentTimelineOrder: image.timeline_order
      });
    } else {
      unmatched.push({
        imageId: image.id,
        title: image.title,
        filename: image.filename,
        concept: metadataObj?.concept || null,
        createdAt: image.created_at,
        currentTimelineOrder: image.timeline_order
      });
    }
  });
  
  // Group by shot number
  const shotGroups = {};
  mappings.forEach(mapping => {
    const shot = mapping.shot;
    if (!shotGroups[shot]) {
      shotGroups[shot] = [];
    }
    shotGroups[shot].push(mapping);
  });
  
  // Sort mappings by shot number
  const sortedMappings = mappings.sort((a, b) => {
    const aNum = parseInt(a.shot.replace(/[a-z]/gi, ''), 10);
    const bNum = parseInt(b.shot.replace(/[a-z]/gi, ''), 10);
    if (aNum !== bNum) return aNum - bNum;
    return a.shot.localeCompare(b.shot);
  });
  
  // Create mapping file structure
  const mappingFile = {
    project: "cheesy-movie",
    createdAt: new Date().toISOString(),
    notes: "Manually curated mappings. Review and adjust shot numbers as needed. Add new images here as they're generated.",
    mappings: sortedMappings.map(m => ({
      imageId: m.imageId,
      shot: m.shot,
      confidence: m.confidence,
      // Include helpful context
      title: m.title,
      concept: m.concept
    })),
    unmatched: unmatched.map(u => ({
      imageId: u.imageId,
      title: u.title,
      concept: u.concept,
      filename: u.filename,
      notes: "TODO: Manually assign shot number based on content"
    }))
  };
  
  // Ensure directory exists
  const mappingDir = path.dirname(MAPPING_FILE);
  if (!fs.existsSync(mappingDir)) {
    fs.mkdirSync(mappingDir, { recursive: true });
  }
  
  // Write mapping file
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappingFile, null, 2));
  
  console.log(`✅ Created mapping file: ${MAPPING_FILE}\n`);
  
  // Print summary
  console.log('📊 Summary:\n');
  console.log(`  ✅ Mapped: ${mappings.length} images`);
  console.log(`  ⚠️  Unmatched: ${unmatched.length} images\n`);
  
  if (Object.keys(shotGroups).length > 0) {
    console.log('📋 Shot Breakdown:\n');
    Object.keys(shotGroups).sort((a, b) => {
      const aNum = parseInt(a.replace(/[a-z]/gi, ''), 10);
      const bNum = parseInt(b.replace(/[a-z]/gi, ''), 10);
      if (aNum !== bNum) return aNum - bNum;
      return a.localeCompare(b);
    }).forEach(shotNum => {
      const versions = shotGroups[shotNum];
      const highConf = versions.filter(v => v.confidence === 'high').length;
      const medConf = versions.filter(v => v.confidence === 'medium').length;
      console.log(`  Shot ${shotNum}: ${versions.length} version(s) [${highConf} high, ${medConf} medium confidence]`);
      versions.forEach((v, i) => {
        console.log(`    ${i + 1}. ${v.title || v.filename} (${v.confidence})`);
      });
    });
  }
  
  if (unmatched.length > 0) {
    console.log('\n⚠️  Unmatched Images (need manual assignment):\n');
    unmatched.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.title || u.filename}`);
      if (u.concept) console.log(`     Concept: ${u.concept}`);
      console.log(`     ID: ${u.imageId}`);
    });
  }
  
  console.log('\n💡 Next Steps:');
  console.log('  1. Review the mapping file and adjust shot numbers as needed');
  console.log('  2. Manually assign shot numbers for unmatched images');
  console.log('  3. Run the organize-by-script endpoint to apply the mapping');
  
  db.close();
}

main().catch(console.error);
