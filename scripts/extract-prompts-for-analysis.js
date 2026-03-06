// Script to extract prompts from database for analysis
const sqlite = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'forge.db');

try {
  const db = sqlite(dbPath);
  
  console.log('🔍 Extracting prompts from database...');
  
  // Query to get prompts from images table
  // Get up to 100 random prompts that have valid prompt data
  const query = `
    SELECT 
      id,
      project_id,
      JSON_EXTRACT(metadata, '$.prompt') as prompt,
      JSON_EXTRACT(metadata, '$.user_prompt') as user_prompt,
      JSON_EXTRACT(metadata, '$.character_name') as character_name,
      JSON_EXTRACT(metadata, '$.scene_name') as scene_name,
      JSON_EXTRACT(metadata, '$.concept') as concept,
      JSON_EXTRACT(metadata, '$.model') as model,
      created_at
    FROM images 
    WHERE metadata IS NOT NULL 
      AND JSON_EXTRACT(metadata, '$.prompt') IS NOT NULL
      AND JSON_EXTRACT(metadata, '$.prompt') != ''
      AND JSON_EXTRACT(metadata, '$.prompt') != 'null'
    ORDER BY RANDOM()
    LIMIT 100
  `;
  
  const prompts = db.prepare(query).all();
  
  console.log(`✅ Found ${prompts.length} prompts`);
  
  // Save to JSON file for analysis
  const outputPath = path.join(__dirname, '..', 'extracted-prompts.json');
  fs.writeFileSync(outputPath, JSON.stringify(prompts, null, 2));
  
  console.log(`💾 Saved prompts to: ${outputPath}`);
  
  // Also save just the prompt text for easier analysis
  const promptTexts = prompts.map(p => ({
    id: p.id,
    project_id: p.project_id,
    prompt: p.prompt,
    word_count: p.prompt ? p.prompt.split(/\s+/).length : 0
  }));
  
  const textsPath = path.join(__dirname, '..', 'extracted-prompt-texts.json');
  fs.writeFileSync(textsPath, JSON.stringify(promptTexts, null, 2));
  
  console.log(`💾 Saved prompt texts to: ${textsPath}`);
  
  // Print some stats
  const wordCounts = promptTexts.map(p => p.word_count);
  const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const minWords = Math.min(...wordCounts);
  const maxWords = Math.max(...wordCounts);
  
  console.log('\n📊 Stats:');
  console.log(`  Average word count: ${avgWords.toFixed(0)}`);
  console.log(`  Min word count: ${minWords}`);
  console.log(`  Max word count: ${maxWords}`);
  
  // Group by project
  const byProject = {};
  prompts.forEach(p => {
    const proj = p.project_id || 'unknown';
    if (!byProject[proj]) byProject[proj] = 0;
    byProject[proj]++;
  });
  
  console.log('\n📁 By project:');
  Object.entries(byProject).forEach(([proj, count]) => {
    console.log(`  ${proj}: ${count} prompts`);
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error extracting prompts:', error);
  process.exit(1);
}


