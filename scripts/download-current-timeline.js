#!/usr/bin/env node

/**
 * Download Current Timeline Images Script
 * 
 * Downloads the specific timeline images that are currently in your timeline.
 * 
 * Usage:
 *   node scripts/download-current-timeline.js [options]
 * 
 * Options:
 *   --output-dir <path>  Custom output directory (default: ~/Downloads/forge-timeline-images)
 *   --dry-run           Show what would be downloaded without downloading
 *   --help              Show this help message
 */

const fs = require('fs');
const path = require('path');

// Timeline image paths - these are your current timeline images
const timelineImages = [
  "/images/psychic-adept-channeling-telepathic-octopus-mind-2025-08-16T23-31-17-779Z-09.jpg",
  "/images/cyber-witch-hacking-digital-owl-interface-2025-08-16T23-28-32-340Z-03.jpg",
  "/images/halftone-student-2-2025-08-16T02-29-20-463Z-01.jpg",
  "/images/fox-portrait-in-fog-1-2025-08-16T02-40-33-682Z-00.jpg",
  "/images/halftone-dolphin-innovation-guide-2025-08-16T20-28-30-355Z-02.jpg",
  "/images/halftone-elephant-memory-scholar-2025-08-16T20-28-30-355Z-01.jpg",
  "/images/halftone-raven-knowledge-keeper-2025-08-16T20-28-30-355Z-03.jpg",
  "/images/halftone-wise-owl-teacher-2025-08-16T20-28-30-354Z-00.jpg",
  "/images/halftone-turtle-patience-professor-2025-08-16T20-35-35-572Z-04.jpg",
  "/images/halftone-wolf-pack-learning-leader-2025-08-16T20-35-35-567Z-02.jpg",
  "/images/halftone-child-science-experiment-2025-08-16T20-37-46-886Z-02.jpg",
  "/images/halftone-teacher-at-whiteboard-2025-08-16T21-01-49-960Z-00.jpg",
  "/images/halftone-teacher-reading-to-class-2025-08-16T21-01-49-962Z-01.jpg",
  "/images/halftone-knowledge-dna-helix-2025-08-16T21-20-11-276Z-05.jpg",
  "/images/halftone-adaptive-wisdom-web-2025-08-16T21-21-01-872Z-05.jpg",
  "/images/halftone-learning-flow-state-2025-08-16T21-21-01-869Z-03.jpg",
  "/images/halftone-learning-metamorphosis-2025-08-16T21-21-01-864Z-00.jpg",
  "/images/halftone-individual-learning-fingerprint-2025-08-16T21-21-01-870Z-04.jpg",
  "/images/halftone-lion-in-military-dress-uniform-2025-08-16T21-22-29-583Z-04.jpg",
  "/images/halftone-owl-professor-in-academic-robes-2025-08-16T21-22-29-581Z-00.jpg",
  "/images/halftone-fox-in-business-suit-2025-08-16T21-22-29-582Z-01.jpg",
  "/images/the-sage-owl-guide-2025-08-16T21-29-42-218Z-00.jpg",
  "/images/adaptive-learning-pathways-2025-08-16T21-29-42-219Z-01.jpg",
  "/images/interactive-knowledge-globe-2025-08-16T21-29-42-219Z-02.jpg",
  "/images/purpose-driven-learning-compass-2025-08-16T21-32-18-509Z-03.jpg",
  "/images/personal-learning-assistant-2025-08-16T21-29-42-219Z-03.jpg",
  "/images/the-listening-sage-2025-08-16T21-32-18-510Z-04.jpg",
  "/images/real-time-knowledge-2-2025-08-16T21-41-51-169Z-01.jpg",
  "/images/thoughtful-student-character-2025-08-16T21-32-18-506Z-01.jpg",
  "/images/real-time-knowledge-3-2025-08-16T21-41-51-171Z-02.jpg",
  "/images/potter-wheels-molding-understanding-2025-08-16T21-52-44-532Z-01.jpg",
  "/images/wise-fox-sage---optimized-2025-08-16T21-57-54-679Z-00.jpg",
  "/images/listening-fox---optimized-2025-08-16T21-57-54-682Z-02.jpg",
  "/images/teaching-fox---optimized-2025-08-16T21-57-54-681Z-01.jpg",
  "/images/elephant-memory-keeper-2025-08-16T21-59-38-906Z-01.jpg",
  "/images/dolphin-collaborative-learner-2025-08-16T21-59-38-908Z-02.jpg",
  "/images/wise-owl-professor-2025-08-16T21-59-38-904Z-00.jpg",
  "/images/bear-gentle-mentor-2025-08-16T21-59-38-909Z-03.jpg",
  "/images/child-building-robot---educational-maker-2025-08-16T22-00-05-288Z-00.jpg",
  "/images/octopus-tutors-with-multiple-teaching-arms-2025-08-16T22-02-08-239Z-02.jpg",
  "/images/neural-network-trees-with-synaptic-branches-2025-08-16T22-02-08-237Z-00.jpg",
  "/images/circuit-boards-processing-educational-data-2025-08-16T22-07-09-893Z-04.jpg",
  "/images/child-testing-robot-movement-2025-08-16T22-08-31-956Z-02.jpg",
  "/images/child-building-robot---basic-assembly-2025-08-16T22-08-31-947Z-00.jpg",
  "/images/child-meticulously-working-on-robot-part-2025-08-16T22-10-34-769Z-00.jpg",
  "/images/young-adult-working-on-large-robot-2025-08-16T22-12-31-183Z-00.jpg",
  "/images/athletic-young-woman-with-sports-robot-2025-08-16T22-14-42-525Z-04.jpg",
  "/images/muscular-man-forging-industrial-robot-2025-08-16T22-14-42-523Z-02.jpg",
  "/images/small-child-with-tiny-companion-robot-2025-08-16T22-14-42-516Z-00.jpg",
  "/images/chef-building-culinary-robot-2025-08-16T22-14-42-530Z-09.jpg",
  "/images/student-building-study-companion-robot-2025-08-16T22-14-42-531Z-10.jpg",
  "/images/elderly-grandmother-with-knitting-robot-2025-08-16T22-14-42-524Z-03.jpg",
  "/images/bearded-engineer-with-rescue-robot-2025-08-16T22-14-42-526Z-05.jpg",
  "/images/twin-siblings-building-mirror-robots-2025-08-16T22-14-42-528Z-07.jpg",
  "/images/teenage-girl-building-sleek-humanoid-2025-08-16T22-14-42-521Z-01.jpg",
  "/images/musician-composing-with-songbird-orchestra-2025-08-16T22-16-48-309Z-10.jpg",
  "/images/explorer-learning-survival-from-desert-fox-2025-08-16T22-16-48-310Z-11.jpg",
  "/images/child-learning-from-wise-owl-teacher-2025-08-16T22-16-48-301Z-00.jpg",
  "/images/elderly-man-sharing-stories-with-ancient-turtle-2025-08-16T22-16-48-305Z-02.jpg",
  "/images/athletic-woman-training-with-cheetah-speed-2025-08-16T22-16-48-306Z-03.jpg",
  "/images/master-baker-teaching-bread-making-2025-08-16T22-21-00-077Z-00.jpg",
  "/images/grandmother-teaching-traditional-quilting-2025-08-16T22-21-00-081Z-02.jpg",
  "/images/high-school-mathematics-classroom-2025-08-16T22-22-57-470Z-01.jpg",
  "/images/elementary-science-classroom-discovery-2025-08-16T22-22-57-468Z-00.jpg",
  "/images/harbor-traditional-ships-vs-sage-vessels-2025-08-16T22-29-34-356Z-11.jpg",
  "/images/treasure-map-knowledge-desert-vs-learning-oasis-2025-08-16T22-29-34-354Z-04.jpg",
  "/images/literature-circle-discussion-2025-08-16T22-22-57-476Z-05.jpg",
  "/images/history-classroom-timeline-activity-2025-08-16T22-22-57-478Z-07.jpg",
  "/images/dusty-textbooks-dissolving-into-holographic-updates-2025-08-16T22-29-34-349Z-00.jpg",
  "/images/octopus-scientist-connecting-github-repositories-2025-08-16T22-29-34-354Z-05.jpg",
  "/images/genie-blacksmith-creating-learning-modules-2025-08-16T22-29-34-353Z-03.jpg",
  "/images/wilted-course-flowers-vs-blooming-sage-trees-2025-08-16T22-29-34-354Z-06.jpg",
  "/images/time-lapse-uniswap-updates-to-solutions-2025-08-16T22-29-34-355Z-09.jpg",
  "/images/violin-workshop-traditional-vs-sage-tuning-2025-08-16T22-30-31-203Z-00.jpg",
  "/images/mirror-maze-static-vs-updated-reflections-2025-08-16T22-30-31-211Z-05.jpg",
  "/images/echo-chamber-repeating-vs-new-harmonics-2025-08-16T22-30-31-213Z-07.jpg",
  "/images/sundial-garden-static-vs-learning-temporal-2025-08-16T22-30-31-210Z-04.jpg",
  "/images/young-philosopher-learning-from-ancient-sage-2025-08-16T22-40-27-827Z-11.jpg",
  "/images/master-blacksmith-teaching-young-apprentice-2025-08-16T22-40-27-816Z-02.jpg",
  "/images/elderly-librarian-sharing-knowledge-with-student-2025-08-16T22-40-27-815Z-01.jpg",
  "/images/young-artist-learning-from-master-painter-2025-08-16T22-40-27-813Z-00.jpg",
  "/images/child-learning-music-from-grandmother-pianist-2025-08-16T22-40-27-816Z-03.jpg",
  "/images/master-gardener-teaching-botanical-wisdom-2025-08-16T22-40-27-819Z-05.jpg",
  "/images/child-learning-storytelling-from-village-elder-2025-08-16T22-40-27-824Z-09.jpg",
  "/images/young-scientist-learning-from-research-mentor-2025-08-16T22-40-27-823Z-08.jpg",
  "/images/expanded-dolphin-collaborative-learning---rich-detail-2025-08-16T22-43-07-252Z-01.jpg",
  "/images/expanded-fox-teacher-authority---rich-detail-2025-08-16T22-43-07-255Z-02.jpg",
  "/images/expanded-child-building-robot---rich-detail-2025-08-16T22-43-07-248Z-00.jpg",
  "/images/fox-digital-innovation-leader-2025-08-16T22-50-27-333Z-03.jpg",
  "/images/fox-sage-teaching-ancient-wisdom-2025-08-16T22-50-27-330Z-00.jpg",
  "/images/fox-research-scientist-in-laboratory-2025-08-16T22-50-27-332Z-01.jpg",
  "/images/fox-creative-arts-mentor-2025-08-16T22-50-27-336Z-07.jpg",
  "/images/wolf-storyteller-cultural-guardian-2025-08-16T22-52-22-750Z-04.jpg",
  "/images/elephant-research-scientist-in-laboratory-2025-08-16T22-52-22-749Z-01.jpg",
  "/images/owl-sage-teaching-ancient-wisdom-2025-08-16T22-52-22-748Z-00.jpg",
  "/images/dolphin-digital-innovation-leader-2025-08-16T22-52-22-750Z-03.jpg",
  "/images/peacock-creative-arts-mentor-2025-08-16T22-52-22-751Z-07.jpg",
  "/images/octopus-mathematical-philosopher-2025-08-16T22-52-22-751Z-05.jpg",
  "/images/fox-master-craftsman-workshop-2025-08-16T22-50-27-333Z-02.jpg",
  "/images/fox-environmental-guide-ecosystem-2025-08-16T22-50-27-335Z-06.jpg",
  "/images/fox-storyteller-cultural-guardian-2025-08-16T22-50-27-334Z-04.jpg",
  "/images/fox-mathematical-philosopher-2025-08-16T22-50-27-335Z-05.jpg",
  "/images/chameleon-reality-hacker-professor-2025-08-16T23-04-26-662Z-00.jpg",
  "/images/sloth-time-dilation-physics-sage-2025-08-16T23-04-26-666Z-03.jpg",
  "/images/flamingo-neon-dance-theory-choreographer-2025-08-16T23-04-26-666Z-02.jpg",
  "/images/elephant-memory-guide-for-lost-safari-tourist-2025-08-16T23-09-05-395Z-05.jpg",
  "/images/wolf-pack-guide-leading-lost-hiker-2025-08-16T23-09-05-390Z-00.jpg",
  "/images/eagle-sky-navigator-for-lost-pilot-2025-08-16T23-09-05-393Z-02.jpg",
  "/images/desert-fox-guide-for-lost-explorer-2025-08-16T23-09-05-394Z-03.jpg",
  "/images/arctic-shaman-invoking-polar-bear-spirit-2025-08-16T23-28-32-342Z-06.jpg",
  "/images/shaman-summoning-wolf-spirit-guide-2025-08-16T23-28-32-336Z-00.jpg",
  "/images/druid-calling-forest-dragon-guardian-2025-08-16T23-28-32-339Z-02.jpg",
  "/images/child-prodigy-summoning-rainbow-butterfly-swarm-2025-08-16T23-28-32-343Z-07.jpg",
  "/images/sea-turtle-ancient-path-guide-for-lost-diver-2025-08-16T23-09-05-395Z-07.jpg",
  "/images/young-wizard-conjuring-phoenix-familiar-2025-08-16T23-28-32-337Z-01.jpg",
  "/images/cosmic-ritualist-invoking-stellar-whale-entity-2025-08-16T23-31-17-780Z-11.jpg",
  "/images/void-sorcerer-conjuring-shadow-panther-familiar-2025-08-16T23-31-17-773Z-04.jpg",
  "/images/blood-mage-invoking-crimson-bat-colony-2025-08-16T23-31-17-776Z-07.jpg",
  "/images/storm-caller-invoking-thunder-eagle-avatar-2025-08-16T23-31-17-769Z-02.jpg",
  "/images/chaos-ritualist-manifesting-reality-glitch-tiger-2025-08-16T23-31-17-780Z-10.jpg",
  "/images/crystal-mage-channeling-prism-unicorn-spirit-2025-08-16T23-31-17-771Z-03.jpg",
  "/images/time-wizard-summoning-temporal-dragon-construct-2025-08-16T23-31-17-774Z-05.jpg",
  "/images/blockchain-smart-contract-sage-deployment-2025-08-16T23-32-48-647Z-04.jpg",
  "/images/neural-brain-interface-sage-direct-connection-2025-08-16T23-32-48-649Z-06.jpg",
  "/images/augmented-reality-sage-overlay-activation-2025-08-16T23-32-48-648Z-05.jpg",
  "/images/ssh-remote-terminal--summon-sage-connection-2025-08-16T23-44-51-126Z-04.jpg",
  "/images/docker-container--summon-sage-deployment-log-2025-08-16T23-44-51-126Z-06.jpg",
  "/images/vs-code-integrated-terminal--summon-sage-debug-2025-08-16T23-44-51-126Z-05.jpg",
  "/images/bold-typography-poster--summon-sage-command-2025-08-16T23-48-08-253Z-00.jpg",
  "/images/massive--summon-sage-typography-poster-with-multiple-text-repetitions-2025-08-16T23-50-10-914Z-00.jpg",
  "/images/-learn-command-typography-poster-2025-08-16T23-54-17-590Z-00.jpg",
  "/images/-explore-command-typography-poster-2025-08-16T23-54-17-596Z-04.jpg",
  "/images/-explain-command-typography-poster-2025-08-16T23-54-17-593Z-01.jpg",
  "/images/-roadmap-command-typography-poster-2025-08-16T23-54-17-599Z-07.jpg",
  "/images/-connect-command-typography-poster-2025-08-16T23-54-17-597Z-05.jpg",
  "/images/-practice-command-typography-poster-2025-08-16T23-54-17-594Z-02.jpg",
  "/images/-assess-command-typography-poster-2025-08-16T23-54-17-598Z-06.jpg",
  "/images/-tutor-command-typography-poster-2025-08-16T23-54-17-595Z-03.jpg",
  "/images/-pay-command-crypto-typography-poster-2025-08-16T23-58-01-343Z-01.jpg",
  "/images/-mint-command-crypto-typography-poster-2025-08-16T23-58-01-347Z-04.jpg",
  "/images/-vault-command-crypto-typography-poster-2025-08-16T23-58-01-349Z-08.jpg",
  "/images/-bridge-command-crypto-typography-poster-2025-08-16T23-58-01-348Z-07.jpg",
  "/images/-deploy-command-crypto-typography-poster-2025-08-16T23-58-01-351Z-11.jpg",
  "/images/-token-command-crypto-typography-poster-2025-08-16T23-58-01-345Z-02.jpg",
  "/images/-dao-command-crypto-typography-poster-2025-08-16T23-58-01-349Z-09.jpg",
  "/images/-auth-command-crypto-typography-poster-2025-08-16T23-58-01-346Z-03.jpg",
  "/images/-stake-command-crypto-typography-poster-2025-08-16T23-58-01-347Z-05.jpg",
  "/images/-earn-command-crypto-typography-poster-2025-08-16T23-58-01-338Z-00.jpg",
  "/images/-yield-command-crypto-typography-poster-2025-08-16T23-58-01-350Z-10.jpg",
  "/images/-webhook-command-event-driven-infrastructure-poster-2025-08-17T00-00-03-842Z-11.jpg",
  "/images/-swap-command-crypto-typography-poster-2025-08-16T23-58-01-348Z-06.jpg",
  "/images/-402-http-payment-required-error-command-poster-2025-08-17T00-00-03-832Z-00.jpg",
  "/images/-rate-command-api-rate-limiting-poster-2025-08-17T00-00-03-834Z-01.jpg",
  "/images/-auth-command-api-authentication-infrastructure-poster-2025-08-17T00-00-03-838Z-06.jpg",
  "/images/-scale-command-infrastructure-scaling-poster-2025-08-17T00-00-03-837Z-04.jpg",
  "/images/-cache-command-infrastructure-caching-poster-2025-08-17T00-00-03-835Z-02.jpg",
  "/images/-monitor-command-infrastructure-monitoring-poster-2025-08-17T00-00-03-840Z-08.jpg",
  "/images/-load-command-load-balancing-infrastructure-poster-2025-08-17T00-00-03-839Z-07.jpg",
  "/images/-acp-agent-commerce-protocol-command-poster-2025-08-17T00-02-25-377Z-00.jpg",
  "/images/agent-autonomous-ai-typography-poster-2025-08-17T00-02-25-380Z-01.jpg",
  "/images/commerce-economic-transaction-typography-poster-2025-08-17T00-02-25-384Z-02.jpg",
  "/images/protocol-blockchain-framework-typography-poster-2025-08-17T00-02-25-386Z-03.jpg"
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  outputDir: path.join(require('os').homedir(), 'Downloads', 'forge-timeline-images'),
  dryRun: false,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
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
📋 Download Current Timeline Images Script

Downloads your current timeline images (${timelineImages.length} images) to your Downloads folder.

Usage:
  node scripts/download-current-timeline.js [options]

Options:
  --output-dir <path>  Custom output directory (default: ~/Downloads/forge-timeline-images)
  --dry-run           Show what would be downloaded without downloading
  --help              Show this help message

Examples:
  # Download all timeline images to default location
  node scripts/download-current-timeline.js

  # Preview what would be downloaded
  node scripts/download-current-timeline.js --dry-run

  # Download to custom directory
  node scripts/download-current-timeline.js --output-dir ./my-timeline-images
`);
  process.exit(0);
}

/**
 * Download a single image file
 */
function downloadImage(imagePath, outputDir, index) {
  // Extract filename from path
  const filename = path.basename(imagePath);
  
  // Source path in your public directory
  const sourcePath = path.join(process.cwd(), 'public', imagePath);
  
  // Create filename with order prefix
  const orderPrefix = String(index + 1).padStart(3, '0');
  const prefixedFilename = `${orderPrefix}-${filename}`;
  const targetPath = path.join(outputDir, prefixedFilename);
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return { success: false, error: 'Source file not found', filename, prefixedFilename };
    }
    
    // Get file stats
    const stats = fs.statSync(sourcePath);
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would copy: ${prefixedFilename} (${formatBytes(stats.size)})`);
      return { success: true, dryRun: true, filename, prefixedFilename };
    }
    
    // Copy file
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`✅ Downloaded: ${prefixedFilename} (${formatBytes(stats.size)})`);
    return { success: true, size: stats.size, filename, prefixedFilename };
  } catch (error) {
    console.error(`❌ Failed to download ${filename}:`, error.message);
    return { success: false, error: error.message, filename, prefixedFilename };
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
function createMetadataFile(outputDir, results) {
  const metadata = {
    downloadDate: new Date().toISOString(),
    downloadType: 'current-timeline',
    totalImages: timelineImages.length,
    successfulDownloads: results.filter(r => r.success).length,
    failedDownloads: results.filter(r => !r.success).length,
    totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0),
    images: timelineImages.map((imagePath, index) => ({
      order: index + 1,
      originalPath: imagePath,
      originalFilename: path.basename(imagePath),
      downloadedFilename: results[index]?.prefixedFilename || `${String(index + 1).padStart(3, '0')}-${path.basename(imagePath)}`,
      downloadStatus: results[index]?.success ? 'success' : 'failed',
      downloadError: results[index]?.error || null
    }))
  };
  
  const metadataPath = path.join(outputDir, 'timeline-download-metadata.json');
  
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
  console.log('🚀 Starting Current Timeline Images Download\n');
  console.log(`📋 Timeline contains ${timelineImages.length} images`);
  
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
    process.exit(1);
  }
  
  console.log(`\n📸 ${options.dryRun ? '[DRY RUN] Would download' : 'Downloading'} ${timelineImages.length} timeline images...\n`);
  
  // Download all images
  const results = [];
  let totalSize = 0;
  
  for (let i = 0; i < timelineImages.length; i++) {
    const imagePath = timelineImages[i];
    const result = downloadImage(imagePath, options.outputDir, i);
    results.push(result);
    
    if (result.success && result.size) {
      totalSize += result.size;
    }
  }
  
  // Create metadata file
  createMetadataFile(options.outputDir, results);
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Download Summary:');
  console.log(`   Timeline Images: ${timelineImages.length}`);
  console.log(`   Downloaded: ${successful}`);
  console.log(`   Failed: ${failed}`);
  
  if (!options.dryRun && totalSize > 0) {
    console.log(`   Total Size: ${formatBytes(totalSize)}`);
    console.log(`   Output Directory: ${options.outputDir}`);
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Some downloads failed. Check the metadata file for details.');
  }
  
  console.log('\n✨ Timeline download completed!');
  console.log(`📁 Images saved to: ${options.outputDir}`);
  console.log(`📄 Metadata file: timeline-download-metadata.json`);
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

