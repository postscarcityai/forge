#!/usr/bin/env node

/**
 * Generic Project Settings Update Script
 * 
 * This script can update any project settings section with proper validation.
 * It supports all available sections: general, business, brand, prompting, loras, env
 * 
 * Usage:
 *   node scripts/update-project-settings.js <projectId> <section> [options]
 *   npm run update-settings <projectId> <section> [options]
 * 
 * Examples:
 *   node scripts/update-project-settings.js amc general --name="AMC Defense Law" --color="#1E3A8A"
 *   node scripts/update-project-settings.js amc business --file=./business-data.json
 *   node scripts/update-project-settings.js amc prompting --masterPrompt="Professional legal photography"
 *   node scripts/update-project-settings.js amc bulk --file=./bulk-updates.json
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Available project sections (matches the TypeScript enum)
 */
const PROJECT_SECTIONS = {
  GENERAL: 'general',
  BUSINESS: 'business',
  BRAND: 'brand', 
  PROMPTING: 'prompting',
  LORAS: 'loras',
  ENV: 'env'
};

/**
 * Request body key mapping for each section
 */
const SECTION_BODY_KEYS = {
  general: 'general',
  business: 'businessOverview',
  brand: 'brandStory',
  prompting: 'imagePrompting',
  loras: 'loras',
  env: 'environmentVariables'
};

/**
 * API endpoint mapping for each section
 */
const SECTION_ENDPOINTS = {
  general: 'general',
  business: 'business',
  brand: 'brand',
  prompting: 'prompting', 
  loras: 'loras',
  env: 'env'
};

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Usage: node update-project-settings.js <projectId> <section> [options]');
    console.log('📋 Available sections:', Object.values(PROJECT_SECTIONS).join(', '));
    console.log('📖 Examples:');
    console.log('  node update-project-settings.js amc general --name="AMC Defense Law"');
    console.log('  node update-project-settings.js amc business --file=./business-data.json');
    console.log('  node update-project-settings.js amc bulk --file=./bulk-updates.json');
    process.exit(1);
  }
  
  const projectId = args[0];
  const section = args[1].toLowerCase();
  
  // Validate section
  if (section !== 'bulk' && !Object.values(PROJECT_SECTIONS).includes(section)) {
    console.error(`❌ Invalid section: ${section}`);
    console.log('📋 Available sections:', Object.values(PROJECT_SECTIONS).join(', '), 'bulk');
    process.exit(1);
  }
  
  // Parse options
  const options = {};
  const flags = args.slice(2);
  
  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    
    if (flag.startsWith('--')) {
      const [key, value] = flag.substring(2).split('=');
      if (value !== undefined) {
        // Try to parse as JSON, fallback to string
        try {
          options[key] = JSON.parse(value);
        } catch {
          options[key] = value;
        }
      } else {
        // Boolean flag or next arg is value
        if (i + 1 < flags.length && !flags[i + 1].startsWith('--')) {
          try {
            options[key] = JSON.parse(flags[i + 1]);
          } catch {
            options[key] = flags[i + 1];
          }
          i++; // Skip next arg
        } else {
          options[key] = true;
        }
      }
    }
  }
  
  return { projectId, section, options };
}

/**
 * Load data from file
 */
function loadDataFromFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load file ${filePath}: ${error.message}`);
  }
}

/**
 * Validate section data based on known constraints
 */
function validateData(section, data) {
  const errors = [];
  
  switch (section) {
    case 'general':
      if (data.name && (typeof data.name !== 'string' || !data.name.trim())) {
        errors.push('Name must be a non-empty string');
      }
      if (data.name && data.name.length > 100) {
        errors.push('Name cannot exceed 100 characters');
      }
      if (data.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
        errors.push('Color must be a valid hex format like #FF5733');
      }
      if (data.status && !['active', 'archived', 'completed'].includes(data.status)) {
        errors.push('Status must be active, archived, or completed');
      }
      break;
      
    case 'business':
      if (data.coreValues && Array.isArray(data.coreValues) && data.coreValues.length > 15) {
        errors.push('Core values cannot exceed 15 items');
      }
      if (data.offerings && Array.isArray(data.offerings) && data.offerings.length > 20) {
        errors.push('Offerings cannot exceed 20 items');
      }
      if (data.contactInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactInfo.email)) {
        errors.push('Contact email must be a valid email format');
      }
      break;
      
    case 'prompting':
      if (data.masterPrompt && data.masterPrompt.length > 2000) {
        errors.push('Master prompt cannot exceed 2000 characters');
      }
      if (data.aspectRatio && !/^\d+:\d+$|^(square|portrait|landscape)$/i.test(data.aspectRatio)) {
        errors.push('Aspect ratio must be format like "16:9" or "square", "portrait", "landscape"');
      }
      break;
  }
  
  return errors;
}

/**
 * Update a single section
 */
async function updateSection(projectId, section, data) {
  console.log(`🔧 Updating ${section} settings for project: ${projectId}`);
  
  try {
    // Validate data
    const validationErrors = validateData(section, data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Build request body
    const bodyKey = SECTION_BODY_KEYS[section];
    const requestBody = {
      [bodyKey]: data
    };
    
    // Make API call
    const endpoint = SECTION_ENDPOINTS[section];
    const response = await fetch(`${BASE_URL}/api/database/projects/${projectId}/${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.error}`);
    }
    
    console.log(`✅ ${section} settings updated successfully!`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to update ${section} settings:`, error.message);
    throw error;
  }
}

/**
 * Bulk update multiple sections
 */
async function updateBulk(projectId, updates) {
  console.log(`🔧 Bulk updating settings for project: ${projectId}`);
  console.log(`📝 Sections to update: ${Object.keys(updates).join(', ')}`);
  
  const results = {};
  let overallSuccess = true;
  
  for (const [section, data] of Object.entries(updates)) {
    if (data && Object.values(PROJECT_SECTIONS).includes(section)) {
      try {
        const result = await updateSection(projectId, section, data);
        results[section] = { success: true, data: result.data };
      } catch (error) {
        results[section] = { success: false, error: error.message };
        overallSuccess = false;
      }
    } else {
      console.warn(`⚠️ Skipping invalid section: ${section}`);
    }
  }
  
  console.log(`${overallSuccess ? '✅' : '⚠️'} Bulk update completed with ${overallSuccess ? 'success' : 'some failures'}`);
  
  return { success: overallSuccess, results };
}

/**
 * Main execution function
 */
async function main() {
  const { projectId, section, options } = parseArguments();
  
  console.log(`🚀 Starting project settings update...`);
  console.log(`📂 Project ID: ${projectId}`);
  console.log(`🔧 Section: ${section}`);
  console.log(`📡 API URL: ${BASE_URL}`);
  
  try {
    let data;
    
    // Load data from file or use command line options
    if (options.file) {
      console.log(`📄 Loading data from file: ${options.file}`);
      data = loadDataFromFile(options.file);
    } else {
      // Remove internal options
      delete options.file;
      data = options;
    }
    
    console.log(`📋 Data to update:`, JSON.stringify(data, null, 2));
    
    // Perform update
    if (section === 'bulk') {
      await updateBulk(projectId, data);
    } else {
      await updateSection(projectId, section, data);
    }
    
    console.log('🎉 Update completed successfully!');
    
  } catch (error) {
    console.error('💥 Update failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  updateSection, 
  updateBulk, 
  PROJECT_SECTIONS,
  validateData 
}; 