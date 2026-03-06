// Script to fix database schema
const sqlite = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'forge.db');

try {
  const db = sqlite(dbPath);
  
  console.log('🔧 Fixing database schema...');
  
  // Add missing scene_of_crime_active column
  try {
    db.exec('ALTER TABLE characters ADD COLUMN scene_of_crime_active BOOLEAN DEFAULT true');
    console.log('✅ Added scene_of_crime_active column');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('📋 scene_of_crime_active column already exists');
    } else {
      console.error('❌ Error adding scene_of_crime_active:', error.message);
    }
  }
  
  // Check final schema
  console.log('\n📋 Updated characters table schema:');
  const charactersInfo = db.prepare("PRAGMA table_info(characters)").all();
  const activeColumns = charactersInfo.filter(col => col.name.endsWith('_active'));
  console.log('Active columns:');
  activeColumns.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Test insert with all active flags
  console.log('\n🧪 Testing character insert with all active flags...');
  try {
    const testInsert = db.prepare(`
      INSERT OR REPLACE INTO characters (
        id, name, project_id, age, gender, race, height, hair_color, eye_color,
        physical_appearance, outfits, default_outfit, background, profession,
        case_details, scene_of_crime, tags, notes, created_at, updated_at,
        age_active, gender_active, race_active, height_active, hair_color_active,
        eye_color_active, physical_appearance_active, profession_active,
        background_active, case_details_active, scene_of_crime_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    testInsert.run(
      'schema_test',
      'Schema Test',
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
      new Date().toISOString(),
      1, // age_active
      1, // gender_active
      1, // race_active
      1, // height_active
      1, // hair_color_active
      1, // eye_color_active
      1, // physical_appearance_active
      1, // profession_active
      1, // background_active
      1, // case_details_active
      1  // scene_of_crime_active
    );
    
    console.log('✅ Insert with all active flags succeeded');
    
    // Clean up
    db.prepare('DELETE FROM characters WHERE id = ?').run('schema_test');
    
  } catch (error) {
    console.log('❌ Insert with active flags failed:', error.message);
  }
  
  db.close();
  console.log('\n🎉 Database schema fix completed!');
  
} catch (error) {
  console.error('Database fix error:', error);
} 