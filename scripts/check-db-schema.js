// Script to check database schema
const sqlite = require('better-sqlite3');
const path = require('path');

// Database path (same as in the app)
const dbPath = path.join(__dirname, '..', 'forge.db');

try {
  const db = sqlite(dbPath);
  
  console.log('🔍 Checking database schema...');
  
  // Check characters table schema
  console.log('\n📋 Characters table schema:');
  const charactersInfo = db.prepare("PRAGMA table_info(characters)").all();
  charactersInfo.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Check scenes table schema
  console.log('\n📋 Scenes table schema:');
  const scenesInfo = db.prepare("PRAGMA table_info(scenes)").all();
  scenesInfo.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Check for migration table
  console.log('\n📋 Migration status:');
  try {
    const migrations = db.prepare("SELECT * FROM schema_migrations").all();
    console.log('Applied migrations:', migrations);
  } catch (e) {
    console.log('No migration table found');
  }
  
  // Test insert manually
  console.log('\n🧪 Testing manual character insert...');
  try {
    const testInsert = db.prepare(`
      INSERT INTO characters (
        id, name, project_id, age, gender, race, height, hair_color, eye_color,
        physical_appearance, outfits, default_outfit, background, profession,
        case_details, scene_of_crime, tags, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    testInsert.run(
      'manual_test',
      'Manual Test',
      'amc',
      30,
      'Male',
      'Test',
      '6-0',
      'Brown',
      'Blue',
      'Test description',
      JSON.stringify([{name: 'Test outfit', active: true}]),
      0,
      'Test background',
      'Test profession',
      'Test case',
      'Test scene',
      JSON.stringify(['Test']),
      'Test notes',
      new Date().toISOString(),
      new Date().toISOString()
    );
    
    console.log('✅ Manual insert without active flags succeeded');
    
    // Clean up
    db.prepare('DELETE FROM characters WHERE id = ?').run('manual_test');
    
  } catch (error) {
    console.log('❌ Manual insert failed:', error.message);
  }
  
  db.close();
  
} catch (error) {
  console.error('Database check error:', error);
} 