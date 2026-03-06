import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'forge.db'));

console.log('🔧 Adding thumbnail_path column to videos table...');

try {
  // Add thumbnail_path column to videos table
  db.exec(`
    ALTER TABLE videos ADD COLUMN thumbnail_path TEXT;
  `);

  console.log('✅ Successfully added thumbnail_path column to videos table');

  // Verify column was added
  const columns = db.prepare("PRAGMA table_info(videos)").all();
  const thumbnailColumn = columns.find((col: any) => col.name === 'thumbnail_path');

  if (thumbnailColumn) {
    console.log('✅ Verified: thumbnail_path column exists');
    console.log(`   Type: ${thumbnailColumn.type}`);
  } else {
    console.error('❌ Error: thumbnail_path column not found after creation');
  }

} catch (error: any) {
  if (error.message.includes('duplicate column name')) {
    console.log('ℹ️  Column already exists, skipping...');
  } else {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
} finally {
  db.close();
  console.log('✅ Database migration complete');
}
