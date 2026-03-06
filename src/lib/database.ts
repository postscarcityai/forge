/**
 * SQLite Database for Forge
 * Provides persistent server-side storage for images, videos, projects, and settings
 */

// Only import server-side modules when running on server
const isServer = typeof window === 'undefined';

let Database: typeof import('better-sqlite3').default | null = null;
let path: typeof import('path') | null = null;
let fs: typeof import('fs') | null = null;

if (isServer) {
  Database = require('better-sqlite3');
  path = require('path');
  fs = require('fs');
}

// Database configuration (only on server)
const DB_PATH = isServer && path ? path.join(process.cwd(), 'forge.db') : '';

// Ensure database directory exists (only on server)
if (isServer && fs && path && DB_PATH) {
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Initialize database connection
let db: any | null = null;

function getDatabase(): any {
  if (!isServer) {
    throw new Error('Database can only be accessed on the server-side');
  }
  
  if (!Database || !DB_PATH) {
    throw new Error('Database dependencies not available');
  }
  
  if (!db) {
    db = new Database(DB_PATH);
    initializeSchema();
    console.error('✅ SQLite database connected:', DB_PATH);
  }
  return db;
}

// Database schema initialization
function initializeSchema() {
  if (!db || !isServer) return;

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      settings TEXT, -- JSON string for project settings
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT, -- JSON array as string
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      project_id TEXT DEFAULT 'default',
      file_size INTEGER,
      width INTEGER,
      height INTEGER,
      metadata TEXT, -- JSON string for extended metadata
      hidden INTEGER DEFAULT 0, -- 0 = false, 1 = true
      timeline_order INTEGER, -- Position in timeline, NULL if not in timeline
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT, -- JSON array as string
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      project_id TEXT DEFAULT 'default',
      file_size INTEGER NOT NULL,
      width INTEGER, -- Video width for aspect ratio calculation
      height INTEGER, -- Video height for aspect ratio calculation
      duration REAL, -- Video duration in seconds
      metadata TEXT, -- JSON string for extended metadata
      hidden INTEGER DEFAULT 0, -- 0 = false, 1 = true
      timeline_order INTEGER, -- Position in timeline, NULL if not in timeline
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Timeline configurations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      config TEXT NOT NULL, -- JSON string for timeline configuration
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      UNIQUE(project_id) -- One config per project
    );
  `);

  // API cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      params TEXT, -- JSON string for parameters
      response_data TEXT NOT NULL, -- JSON string for cached response
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL, -- JSON string for setting value
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Characters table
  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      race TEXT NOT NULL,
      height TEXT NOT NULL,
      hair_color TEXT NOT NULL,
      eye_color TEXT NOT NULL,
      physical_appearance TEXT NOT NULL,
      outfits TEXT NOT NULL, -- JSON array of outfit descriptions
      default_outfit INTEGER DEFAULT 0, -- Index of default outfit
      background TEXT NOT NULL,
      profession TEXT,
      case_details TEXT,
      scene_of_crime TEXT,
      tags TEXT, -- JSON array as string
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Scenes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT NOT NULL,
      setting TEXT NOT NULL,
      time_of_day TEXT NOT NULL,
      lighting TEXT NOT NULL,
      mood TEXT NOT NULL,
      camera_angle TEXT NOT NULL,
      description TEXT NOT NULL,
      props TEXT, -- JSON array as string
      atmosphere TEXT,
      character_ids TEXT NOT NULL, -- JSON array of character IDs
      tags TEXT, -- JSON array as string
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Prompt defaults table - for database-driven fallback values
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_defaults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL, -- 'master', 'technical', 'style', 'atmospheric', etc.
      field_name TEXT NOT NULL, -- 'cameraAngle', 'overallStyle', etc.
      default_value TEXT NOT NULL, -- The default text value
      description TEXT, -- Human-readable description
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, field_name)
    );
  `);

  // LoRAs library table - for reusable LoRA configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS loras (
      id TEXT PRIMARY KEY, -- Unique identifier for the LoRA
      name TEXT NOT NULL, -- Display name
      safetensors_link TEXT, -- URL to the safetensors file
      civitai_link TEXT, -- URL to the Civit AI page
      trigger_words TEXT, -- JSON array of trigger words
      description TEXT, -- Optional description
      tags TEXT, -- JSON array of tags for categorization
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for better performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_images_timeline_order ON images(timeline_order);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_videos_timeline_order ON videos(timeline_order);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_characters_project_id ON characters(project_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_scenes_name ON scenes(name);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_api_cache_endpoint_params ON api_cache(endpoint, params);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_prompt_defaults_category_field ON prompt_defaults(category, field_name);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_loras_name ON loras(name);');

  // Insert default project if it doesn't exist
  const defaultProject = db.prepare('SELECT id FROM projects WHERE id = ?').get('default');
  if (!defaultProject) {
    db.prepare(`
      INSERT INTO projects (id, name, description)
      VALUES (?, ?, ?)
    `).run('default', 'Default Project', 'Default project for images and videos');
  }

  // Insert default prompt values if they don't exist
  const promptDefaults = [
    // Master prompt defaults
    { category: 'master', field_name: 'fallback', default_value: '', description: 'Default master prompt when none specified' },
    
    // User input defaults
    { category: 'user', field_name: 'fallback', default_value: '', description: 'Default user input when none provided' },
    
    // Technical photography defaults
    { category: 'technical', field_name: 'cameraAngle', default_value: 'eye-level perspective', description: 'Default camera angle' },
    { category: 'technical', field_name: 'shotType', default_value: 'medium close-up', description: 'Default shot type' },
    { category: 'technical', field_name: 'lensType', default_value: '85mm portrait lens', description: 'Default lens type' },
    { category: 'technical', field_name: 'focalLength', default_value: 'shallow depth of field', description: 'Default focal length' },
    { category: 'technical', field_name: 'lightingStyle', default_value: 'dramatic directional lighting', description: 'Default lighting style' },
    { category: 'technical', field_name: 'lightDirection', default_value: 'key light 45-degree angle', description: 'Default light direction' },
    { category: 'technical', field_name: 'lightQuality', default_value: 'hard shadows with fill light', description: 'Default light quality' },
    { category: 'technical', field_name: 'shadowStyle', default_value: 'strategic shadow placement', description: 'Default shadow style' },
    
    // Visual style defaults
    { category: 'style', field_name: 'overallStyle', default_value: 'professional documentary realism', description: 'Default overall style' },
    { category: 'style', field_name: 'aestheticDirection', default_value: 'cinematic composition', description: 'Default aesthetic direction' },
    { category: 'style', field_name: 'mood', default_value: 'serious focused atmosphere', description: 'Default mood' },
    { category: 'style', field_name: 'colorPalette', default_value: 'desaturated earth tones', description: 'Default color palette' },
    { category: 'style', field_name: 'colorTemperature', default_value: 'cool temperature balance', description: 'Default color temperature' },
    { category: 'style', field_name: 'saturation', default_value: 'controlled saturation levels', description: 'Default saturation' },
    { category: 'style', field_name: 'artisticReferences', default_value: 'high-end commercial photography aesthetic', description: 'Default artistic references fallback' },
    
    // Atmospheric defaults
    { category: 'atmospheric', field_name: 'timeOfDay', default_value: 'natural daylight', description: 'Default time of day' },
    { category: 'atmospheric', field_name: 'environment', default_value: 'controlled environmental conditions professional studio setting', description: 'Default environmental conditions' },
    
    // Supporting elements defaults
    { category: 'supporting', field_name: 'surfaceTextures', default_value: 'clean professional surfaces polished materials', description: 'Default surface textures' },
    { category: 'supporting', field_name: 'materialProperties', default_value: 'high-quality materials refined finishes elegant details', description: 'Default material properties' },
    
    // Post-processing defaults
    { category: 'postprocessing', field_name: 'visualEffects', default_value: 'subtle enhancement professional grade', description: 'Default visual effects' },
    { category: 'postprocessing', field_name: 'postProcessing', default_value: 'color correction final polish', description: 'Default post-processing' },
  ];

  const insertDefault = db.prepare(`
    INSERT OR IGNORE INTO prompt_defaults (category, field_name, default_value, description)
    VALUES (?, ?, ?, ?)
  `);

  promptDefaults.forEach(({ category, field_name, default_value, description }) => {
    insertDefault.run(category, field_name, default_value, description);
  });

  // Run schema migrations
  runSchemaMigrations(db);

  console.error('🔧 SQLite schema initialized');
}

/**
 * Run database schema migrations
 */
function runSchemaMigrations(db: any) {
  // Check if migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration 1: Add isActive columns to characters table
  const migration1Applied = db.prepare('SELECT version FROM schema_migrations WHERE version = 1').get();
  if (!migration1Applied) {
    console.log('🔄 Applying migration 1: Adding isActive columns to characters table...');
    
    // Add isActive columns for character fields
    const characterActiveColumns = [
      'age_active BOOLEAN DEFAULT true',
      'gender_active BOOLEAN DEFAULT true', 
      'race_active BOOLEAN DEFAULT true',
      'height_active BOOLEAN DEFAULT true',
      'hair_color_active BOOLEAN DEFAULT true',
      'eye_color_active BOOLEAN DEFAULT true',
      'physical_appearance_active BOOLEAN DEFAULT true',
      
      'profession_active BOOLEAN DEFAULT true',
      'background_active BOOLEAN DEFAULT true',
      'case_details_active BOOLEAN DEFAULT true'
    ];

    characterActiveColumns.forEach(column => {
      try {
        db.exec(`ALTER TABLE characters ADD COLUMN ${column}`);
      } catch (error) {
        // Column might already exist, ignore error
        console.log(`Column already exists: ${column}`);
      }
    });

    db.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
    console.log('✅ Migration 1 completed');
  }

  // Migration 2: Add isActive columns to scenes table
  const migration2Applied = db.prepare('SELECT version FROM schema_migrations WHERE version = 2').get();
  if (!migration2Applied) {
    console.log('🔄 Applying migration 2: Adding isActive columns to scenes table...');
    
    const sceneActiveColumns = [
      'setting_active BOOLEAN DEFAULT true',
      'time_of_day_active BOOLEAN DEFAULT true',
      'lighting_active BOOLEAN DEFAULT true', 
      'mood_active BOOLEAN DEFAULT true',
      'camera_angle_active BOOLEAN DEFAULT true',
      'props_active BOOLEAN DEFAULT true',
      'atmosphere_active BOOLEAN DEFAULT true'
    ];

    sceneActiveColumns.forEach(column => {
      try {
        db.exec(`ALTER TABLE scenes ADD COLUMN ${column}`);
      } catch (error) {
        // Column might already exist, ignore error
        console.log(`Column already exists: ${column}`);
      }
    });

    db.prepare('INSERT INTO schema_migrations (version) VALUES (2)').run();
    console.log('✅ Migration 2 completed');
  }

  // Migration 3: Remove all isActive columns (Phase 3 of Active Flag Removal)
  const migration3Applied = db.prepare('SELECT version FROM schema_migrations WHERE version = 3').get();
  if (!migration3Applied) {
    console.log('🔄 Applying migration 3: Removing all isActive columns...');
    
    // Character active columns to remove
    const characterActiveColumns = [
      'age_active',
      'gender_active', 
      'race_active',
      'height_active',
      'hair_color_active',
      'eye_color_active',
      'physical_appearance_active',
      'profession_active',
      'background_active',
      'case_details_active'
    ];

    // Scene active columns to remove
    const sceneActiveColumns = [
      'setting_active',
      'time_of_day_active',
      'lighting_active',
      'mood_active',
      'camera_angle_active',
      'props_active',
      'atmosphere_active'
    ];

    // Drop character active columns
    characterActiveColumns.forEach(column => {
      try {
        db.exec(`ALTER TABLE characters DROP COLUMN ${column}`);
        console.log(`✅ Dropped column: characters.${column}`);
      } catch (error) {
        console.log(`Column doesn't exist or already dropped: characters.${column}`);
      }
    });

    // Drop scene active columns
    sceneActiveColumns.forEach(column => {
      try {
        db.exec(`ALTER TABLE scenes DROP COLUMN ${column}`);
        console.log(`✅ Dropped column: scenes.${column}`);
      } catch (error) {
        console.log(`Column doesn't exist or already dropped: scenes.${column}`);
      }
    });

    db.prepare('INSERT INTO schema_migrations (version) VALUES (3)').run();
    console.log('✅ Migration 3 completed - All isActive columns removed');
  }

  // Migration 4: Add safetensors_link and civitai_link columns, migrate existing link data
  const migration4Applied = db.prepare('SELECT version FROM schema_migrations WHERE version = 4').get();
  if (!migration4Applied) {
    console.log('🔄 Applying migration 4: Adding safetensors_link and civitai_link columns...');
    
    // Check if loras table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='loras'
    `).get();
    
    if (tableExists) {
      // Add new columns
      try {
        db.exec('ALTER TABLE loras ADD COLUMN safetensors_link TEXT');
        console.log('✅ Added safetensors_link column');
      } catch (error) {
        console.log('safetensors_link column may already exist');
      }
      
      try {
        db.exec('ALTER TABLE loras ADD COLUMN civitai_link TEXT');
        console.log('✅ Added civitai_link column');
      } catch (error) {
        console.log('civitai_link column may already exist');
      }
      
      // Migrate existing link data to safetensors_link if link column exists
      try {
        // Check if link column exists by trying to query it
        const tableInfo = db.prepare(`PRAGMA table_info(loras)`).all() as Array<{ name: string }>;
        const hasLinkColumn = tableInfo.some(col => col.name === 'link');
        
        if (hasLinkColumn) {
          db.exec(`
            UPDATE loras 
            SET safetensors_link = link 
            WHERE link IS NOT NULL AND (safetensors_link IS NULL OR safetensors_link = '')
          `);
          console.log('✅ Migrated existing link data to safetensors_link');
        }
      } catch (error) {
        console.log('Could not migrate link data (column may not exist)');
      }
    }

    db.prepare('INSERT INTO schema_migrations (version) VALUES (4)').run();
    console.log('✅ Migration 4 completed');
  }
}

// Export database instance
export { getDatabase };

// Types for database operations
export interface DatabaseImage {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  project_id: string;
  file_size?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
  hidden: boolean;
  timeline_order?: number;
}

export interface DatabaseVideo {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  project_id: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  hidden: boolean;
  timeline_order?: number;
}

export interface DatabaseProject {
  id: string;
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTimelineConfig {
  id: number;
  project_id: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseApiCache {
  id: number;
  endpoint: string;
  params?: string;
  response_data: unknown;
  expires_at: string;
  created_at: string;
}

export interface DatabaseUserSetting {
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCharacter {
  id: string;
  name: string;
  project_id: string;
  age: number;
  gender: string;
  race: string;
  height: string;
  hair_color: string;
  eye_color: string;
  physical_appearance: string;
  outfits: Array<{
    name: string;
  }>; // JSON array of outfit objects
  default_outfit: number;
  background: string;
  profession?: string;
  case_details?: string;
  scene_of_crime?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseScene {
  id: string;
  name: string;
  project_id: string;
  setting: string;
  time_of_day: string;
  lighting: string;
  mood: string;
  camera_angle: string;
  description: string;
  props?: string[]; // JSON array
  atmosphere?: string;
  character_ids: string[]; // JSON array
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseLoRA {
  id: string;
  name: string;
  safetensors_link?: string;
  civitai_link?: string;
  trigger_words?: string[]; // JSON array
  description?: string;
  tags?: string[]; // JSON array
  created_at: string;
  updated_at: string;
} 