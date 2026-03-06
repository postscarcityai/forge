const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Get database path
const dbPath = path.join(process.cwd(), 'forge.db');

const lorasToSeed = [
  {
    id: 'artistic-blur',
    name: 'Artistic Blur',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Artistic_Blur-000008.safetensors',
    civitaiLink: 'https://civitai.com/models/1596722/artistic-blur',
    triggerWords: ['bsBlur'],
    description: '',
    tags: []
  },
  {
    id: 'guofeng',
    name: 'Chinese Illustration',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/guofeng.safetensors',
    civitaiLink: '',
    triggerWords: ['guofeng', 'chinese style illustration'],
    description: '',
    tags: []
  },
  {
    id: 'cinematic-surrealistic',
    name: 'Cinematic Surrealistic',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/cinematic%20surrealistic%20style%20v2.2.safetensors',
    civitaiLink: '',
    triggerWords: ['cinematic surrealistic style', 'surrealism style'],
    description: '',
    tags: ['realism']
  },
  {
    id: 'collage-art-style',
    name: 'Collage Art Style',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Collage_Concept.safetensors',
    civitaiLink: '',
    triggerWords: ['hyacinthcollage'],
    description: '',
    tags: []
  },
  {
    id: 'cute-3d-cartoon',
    name: 'Cute 3D Cartoon LoRA',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Cute_3d_Cartoon_Flux.safetensors',
    civitaiLink: '',
    triggerWords: ['3d cartoon', 'cute', 'stylized', 'pixar'],
    description: 'Pixar-style character rendering with enhanced cartoon expressiveness and stylized features',
    tags: ['character', 'cartoon', '3d', 'pixar']
  },
  {
    id: 'editorial-zine',
    name: 'Editorial Zine',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/FLUX_Editorial%20Zine.safetensors',
    civitaiLink: '',
    triggerWords: ['N$CFW', 'editoral', 'fashion', 'text', 'booklet', 'spiral bound', 'collage', 'typography', 'magazine', 'hand made'],
    description: '',
    tags: ['collage']
  },
  {
    id: 'eldritch-classic-comics',
    name: 'Eldritch Classic Comics',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Eldritch_Classic_Comics_1.1.5.safetensors',
    civitaiLink: '',
    triggerWords: ['comic book illustration', 'retro hero'],
    description: 'A LoRA that creates charming hand-drawn old-school comics illustration style with convincing artistic aesthetic',
    tags: ['comic', 'illustration', 'classic', 'vintage']
  },
  {
    id: 'minimal-design',
    name: 'MinimalDesign LoRA',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/flux_s_MinimalDesign.safetensors',
    civitaiLink: '',
    triggerWords: ['minimal design', 'clean', 'professional', 'simple'],
    description: 'Clean, professional aesthetic with minimal design elements and enhanced color saturation',
    tags: ['style', 'minimal', 'professional']
  },
  {
    id: 'minimalist-oriental-art-poster',
    name: 'Minimalist Oriental Art Poster',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/CynthiaPoster.safetensors',
    civitaiLink: '',
    triggerWords: ['CynthiaPoster'],
    description: '',
    tags: []
  },
  {
    id: 'line-art',
    name: 'Minimalist line illustrations',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/F.1_Minimalist%20line%20illustrations%20for%20Internet%20commerce.safetensors',
    civitaiLink: '',
    triggerWords: [],
    description: '',
    tags: []
  },
  {
    id: 'realism',
    name: 'Realism',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Enhanced_Lighting_and_Textures_flux_lora.safetensors',
    civitaiLink: '',
    triggerWords: [],
    description: '',
    tags: []
  },
  {
    id: 'retro-hero-flux',
    name: 'Retro Hero',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/RetroHeroFlux.safetensors',
    civitaiLink: '',
    triggerWords: ['retro hero'],
    description: 'A LoRA for creating retro-style superhero and comic book character illustrations with vintage aesthetic',
    tags: ['character', 'comic book', 'vintage', 'comic', 'hero', 'super hero', 'retro']
  },
  {
    id: 'skin-texture',
    name: 'Skin Texture',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/skin%20texture%20style%20v5.safetensors',
    civitaiLink: '',
    triggerWords: ['skin texture style', 'realism'],
    description: '',
    tags: []
  },
  {
    id: 'fluxlisimo-aura',
    name: 'Fluxlisimo Aura',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/fluxlisimo_aura_v2-FLUX.safetensors',
    civitaiLink: '',
    triggerWords: ['fluxlisimo_aura'],
    description: '',
    tags: []
  },
  {
    id: 'reticulating-noise',
    name: 'Reticulating Noise',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Reticulating_Noise_Gradient_Flux.safetensors',
    civitaiLink: '',
    triggerWords: [],
    description: '',
    tags: []
  },
  {
    id: 'solarization',
    name: 'Solarization',
    safetensorsLink: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Solarization_gradient_Style_for_Flux_-_by_Ethanar.safetensors',
    civitaiLink: '',
    triggerWords: [],
    description: '',
    tags: []
  }
];

function seedLoRAs() {
  console.log('🌱 Starting LoRA database seeding...\n');
  
  let db;
  try {
    // Open database connection (will create database if it doesn't exist)
    db = new Database(dbPath);
    console.log(`✅ Connected to database: ${dbPath}\n`);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Create loras table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS loras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        safetensors_link TEXT,
        civitai_link TEXT,
        trigger_words TEXT,
        description TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ LoRAs table ready\n');
    
    // Prepare insert statement
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO loras (
        id, name, safetensors_link, civitai_link, trigger_words, description, tags, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    let successCount = 0;
    let skipCount = 0;
    
    // Insert each LoRA
    for (const lora of lorasToSeed) {
      try {
        // Check if LoRA already exists
        const existing = db.prepare('SELECT id FROM loras WHERE id = ?').get(lora.id);
        
        if (existing) {
          console.log(`⏭️  Skipping "${lora.name}" (already exists)`);
          skipCount++;
          continue;
        }
        
        // Insert LoRA
        stmt.run(
          lora.id,
          lora.name,
          lora.safetensorsLink || null,
          lora.civitaiLink || null,
          lora.triggerWords && lora.triggerWords.length > 0 ? JSON.stringify(lora.triggerWords) : null,
          lora.description || null,
          lora.tags && lora.tags.length > 0 ? JSON.stringify(lora.tags) : null
        );
        
        console.log(`✅ Seeded: ${lora.name} (${lora.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error seeding "${lora.name}":`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully seeded: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   📦 Total LoRAs in database: ${db.prepare('SELECT COUNT(*) as count FROM loras').get().count}`);
    
  } catch (error) {
    // Don't fail npm install if seeding fails - just log and continue
    console.warn('⚠️  LoRA seeding skipped:', error.message);
    console.log('   Database may not be initialized yet. LoRAs will be seeded on first app run.\n');
  } finally {
    if (db) {
      db.close();
    }
  }
}

// Run seeding
seedLoRAs();

