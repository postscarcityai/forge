#!/usr/bin/env node

/**
 * Brand Image Generator Script
 * 
 * A reusable script for generating brand images using the Fal AI API.
 * This script can be used standalone or imported into other processes.
 * 
 * Usage:
 *   node scripts/brand-image-generator.js --concepts "concept1,concept2" --prompts "prompt1,prompt2"
 *   node scripts/brand-image-generator.js --batch-file ./docs/image-batch.json
 *   node scripts/brand-image-generator.js --interactive
 */

const readline = require('readline')
const fs = require('fs')
const path = require('path')

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const BATCH_GENERATE_ENDPOINT = '/api/fal-images/batch-generate'

// Removed hardcoded master prompt - scripts should use project-specific prompts from the database

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await runInteractiveMode()
    return
  }
  
  const batchFileIndex = args.indexOf('--batch-file')
  if (batchFileIndex !== -1 && args[batchFileIndex + 1]) {
    await runBatchFile(args[batchFileIndex + 1])
    return
  }
  
  const conceptsIndex = args.indexOf('--concepts')
  const promptsIndex = args.indexOf('--prompts')
  const promptsOnlyIndex = args.indexOf('--prompts-only')
  
  // Handle prompts-only mode (auto-generate concept names)
  if (promptsOnlyIndex !== -1 && args[promptsOnlyIndex + 1]) {
    const prompts = args[promptsOnlyIndex + 1].split(',')
    const concepts = prompts.map((_, index) => `image_${index + 1}`)
    await runDirectGeneration(concepts, prompts)
    return
  }
  
  if (conceptsIndex !== -1 && promptsIndex !== -1) {
    const concepts = args[conceptsIndex + 1]?.split(',') || []
    const prompts = args[promptsIndex + 1]?.split(',') || []
    await runDirectGeneration(concepts, prompts)
    return
  }
  
  // Handle single argument modes
  if (conceptsIndex !== -1 && promptsIndex === -1) {
    const concepts = args[conceptsIndex + 1]?.split(',') || []
    const prompts = concepts // Use concepts as prompts
    await runDirectGeneration(concepts, prompts)
    return
  }
  
  if (promptsIndex !== -1 && conceptsIndex === -1) {
    const prompts = args[promptsIndex + 1]?.split(',') || []
    const concepts = prompts.map((_, index) => `image_${index + 1}`)
    await runDirectGeneration(concepts, prompts)
    return
  }
  
  // If no valid arguments, show help
  showHelp()
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🎨 Brand Image Generator Script

Usage:
  node scripts/brand-image-generator.js [options]

Options:
  --concepts "concept1,concept2"        Comma-separated list of concepts
  --prompts "prompt1,prompt2"           Comma-separated list of prompts  
  --prompts-only "prompt1,prompt2"      Just prompts (auto-generate concept names)
  --batch-file <path>                   Path to JSON file with batch configuration
  --interactive, -i                     Run in interactive mode
  --help, -h                            Show this help message

Examples:
  # Multiple superhero variations (easiest)
  node scripts/brand-image-generator.js --prompts-only "powerful superhero in dynamic pose,superhero flying through city,superhero landing on rooftop"

  # Single concept with multiple prompts
  node scripts/brand-image-generator.js --concepts "superhero" --prompts "flying through city,landing on rooftop,fighting villain"

  # Multiple concepts and prompts  
  node scripts/brand-image-generator.js --concepts "superhero,villain,sidekick" --prompts "heroic pose,menacing stance,ready for action"

  # Just concepts (will use as prompts too)
  node scripts/brand-image-generator.js --concepts "superhero flying,superhero landing"

  # Batch file generation
  node scripts/brand-image-generator.js --batch-file ./docs/superhero-batch.json

  # Interactive mode
  node scripts/brand-image-generator.js --interactive

Batch File Format (JSON):
{
  "master_prompt": "Optional custom master prompt",
  "save_to_disk": true,
  "images": [
    {
      "concept": "concept name",
      "prompt": "detailed prompt",
      "filename": "optional-custom-filename"
    }
  ]
}
`)
}

/**
 * Run interactive mode
 */
async function runInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  console.log('🎨 Brand Image Generator - Interactive Mode')
  console.log('Enter image concepts and prompts. Type "done" when finished.\n')
  
  const images = []
  let index = 1
  
  while (true) {
    const concept = await question(rl, `Concept ${index}: `)
    if (concept.toLowerCase() === 'done') break
    
    const prompt = await question(rl, `Prompt ${index}: `)
    if (prompt.toLowerCase() === 'done') break
    
    images.push({ concept: concept.trim(), prompt: prompt.trim() })
    index++
    console.log('✅ Added\n')
  }
  
  if (images.length === 0) {
    console.log('No images to generate.')
    rl.close()
    return
  }
  
  const customMaster = await question(rl, `Custom master prompt (required): `)
  const masterPrompt = customMaster.trim()
  
  rl.close()
  
  console.log(`\n🚀 Generating ${images.length} images...`)
  
  const result = await generateImages({
    images,
    master_prompt: masterPrompt,
    save_to_disk: true
  })
  
  displayResults(result)
}

/**
 * Run batch file generation
 */
async function runBatchFile(filePath) {
  try {
    const fullPath = path.resolve(filePath)
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Batch file not found: ${fullPath}`)
      return
    }
    
    const batchConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    
    if (!batchConfig.images || !Array.isArray(batchConfig.images)) {
      console.error('❌ Invalid batch file format. Missing "images" array.')
      return
    }
    
    console.log(`🚀 Processing batch file: ${filePath}`)
    console.log(`📊 Images to generate: ${batchConfig.images.length}`)
    
    const result = await generateImages(batchConfig)
    displayResults(result)
    
  } catch (error) {
    console.error('❌ Error processing batch file:', error.message)
  }
}

/**
 * Run direct generation from command line arguments
 */
async function runDirectGeneration(concepts, prompts) {
  // Auto-generate concepts if only prompts provided
  if (concepts.length === 1 && prompts.length > 1) {
    concepts = prompts.map((_, index) => `${concepts[0]}_${index + 1}`)
  }
  
  // Auto-generate prompts if only concepts provided  
  if (prompts.length === 1 && concepts.length > 1) {
    prompts = concepts.map(() => prompts[0])
  }
  
  if (concepts.length !== prompts.length) {
    console.error('❌ Number of concepts must match number of prompts')
    console.error(`   Got ${concepts.length} concepts and ${prompts.length} prompts`)
    console.error('   Try: --concepts "superhero" --prompts "prompt1,prompt2,prompt3"')
    console.error('   Or:  --concepts "concept1,concept2" --prompts "shared prompt"')
    return
  }
  
  const images = concepts.map((concept, index) => ({
    concept: concept.trim(),
    prompt: prompts[index].trim()
  }))
  
  console.log(`🚀 Generating ${images.length} images...`)
  console.log(`📝 Concepts: ${concepts.join(', ')}`)
  
  const result = await generateImages({
    images,
    master_prompt: '', // No default - must be specified in project settings
    save_to_disk: true
  })
  
  displayResults(result)
}

/**
 * Generate images using the API
 */
async function generateImages(requestBody) {
  try {
    const response = await fetch(`${API_BASE_URL}${BATCH_GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API Error: ${errorData.error || response.statusText}`)
    }
    
    return await response.json()
    
  } catch (error) {
    console.error('❌ Error generating images:', error.message)
    throw error
  }
}

/**
 * Display generation results
 */
function displayResults(result) {
  console.log('\n📊 Generation Results:')
  console.log(`✅ Successful: ${result.successful}/${result.total_requested}`)
  console.log(`❌ Failed: ${result.failed}/${result.total_requested}`)
  console.log(`💰 Estimated Cost: ${result.estimated_total_cost}`)
  
  if (result.results && result.results.length > 0) {
    console.log('\n📁 Generated Images:')
    result.results.forEach((img, index) => {
      if (img.status === 'success') {
        console.log(`  ${index + 1}. ✅ ${img.concept}`)
        console.log(`     Local: ${img.local_path}`)
        console.log(`     Remote: ${img.image.fal_image_url}`)
      } else {
        console.log(`  ${index + 1}. ❌ ${img.concept}: ${img.error}`)
      }
    })
  }
  
  console.log('\n🎉 Generation complete!')
  
  // Inform about automatic detection
  if (result.successful > 0) {
    console.log('✨ Images saved successfully!')
    console.log('📁 File watcher will automatically detect new images within 2 seconds')
    console.log('💡 Keep your browser tab open to see them appear automatically')
    console.log('⚠️  If you see duplicates, clear localStorage and refresh')
  }
}

/**
 * Helper function for readline questions
 */
function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

/**
 * Export functions for use in other scripts
 */
module.exports = {
  generateImages,
  API_BASE_URL,
  BATCH_GENERATE_ENDPOINT
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
} 