#!/usr/bin/env node

/**
 * Get Timeline Image IDs Script
 * 
 * Reads the timeline configuration from IndexedDB to show which images are currently in the timeline.
 * This helps debug why the download script didn't find timeline images.
 * 
 * Usage:
 *   node scripts/get-timeline-image-ids.js [options]
 * 
 * Options:
 *   --help              Show this help message
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
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
📋 Get Timeline Image IDs Script

Reads the timeline configuration from IndexedDB to show which images are currently in the timeline.
This is useful for debugging timeline-related issues.

Usage:
  node scripts/get-timeline-image-ids.js [options]

Options:
  --help              Show this help message

Note: 
  This script simulates reading IndexedDB data by accessing the browser's IndexedDB.
  For actual IndexedDB access, you'll need to run this in a browser context or 
  access the browser's developer tools.
`);
  process.exit(0);
}

/**
 * Instructions for accessing IndexedDB timeline data
 */
function showIndexedDBInstructions() {
  console.log('🔍 How to Get Timeline Image IDs from IndexedDB:\n');
  
  console.log('📋 METHOD 1: Browser Developer Tools');
  console.log('1. Open your Forge app in the browser');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Application tab');
  console.log('4. Expand IndexedDB > forge-cache');
  console.log('5. Click on "settings" object store');
  console.log('6. Look for key "timeline_config"');
  console.log('7. The value will show: { timeline: ["image-id-1", "image-id-2", ...], featured: [...] }');
  
  console.log('\n📋 METHOD 2: Browser Console');
  console.log('1. Open your Forge app in the browser');
  console.log('2. Open Developer Tools Console (F12)');
  console.log('3. Paste this code:');
  console.log(`
// Copy and paste this into your browser console:
(async () => {
  const dbRequest = indexedDB.open('forge-cache', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('timeline_config');
    
    request.onsuccess = () => {
      const timelineConfig = request.result;
      if (timelineConfig) {
        console.log('📋 Timeline Configuration:', timelineConfig);
        console.log('📸 Timeline Image IDs:', timelineConfig.timeline);
        console.log('⭐ Featured Image IDs:', timelineConfig.featured);
        console.log('📊 Total Timeline Images:', timelineConfig.timeline?.length || 0);
      } else {
        console.log('❌ No timeline configuration found in IndexedDB');
      }
    };
    
    request.onerror = () => {
      console.error('❌ Error reading timeline config:', request.error);
    };
  };
  
  dbRequest.onerror = () => {
    console.error('❌ Error opening IndexedDB:', dbRequest.error);
  };
})();
  `);
  
  console.log('\n📋 METHOD 3: Check Current Project State');
  console.log('Also check the current project ID:');
  console.log(`
// Check current project in browser console:
(async () => {
  const dbRequest = indexedDB.open('forge-cache', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('current_project');
    
    request.onsuccess = () => {
      const currentProject = request.result;
      console.log('📁 Current Project:', currentProject);
    };
  };
})();
  `);
  
  console.log('\n🔧 TROUBLESHOOTING:');
  console.log('- If timeline_config is empty/null: Timeline hasn\'t been set up yet');
  console.log('- If current_project doesn\'t match: You might be checking the wrong project');
  console.log('- IndexedDB data is per-browser, so check the same browser you use for Forge');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Get the timeline image IDs using one of the methods above');
  console.log('2. Update the download script to use those specific IDs');
  console.log('3. Or check if timeline data needs to be synced to SQLite database');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Getting Timeline Image IDs from IndexedDB\n');
  
  showIndexedDBInstructions();
  
  console.log('\n✨ Once you have the image IDs, we can:');
  console.log('1. Create a script to download those specific images');
  console.log('2. Sync the IndexedDB timeline data to the SQLite database');
  console.log('3. Update the download script to read from IndexedDB directly');
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

