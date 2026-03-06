# Project Image Download Scripts

These scripts allow you to download all non-hidden images from a Forge project to a local directory.

## 📥 Available Scripts

### `download-project-images-simple.js` (Recommended)
CommonJS version with broader Node.js compatibility.

### `download-project-images.js` 
ES Modules version (requires Node.js 14+ with ES modules support).

## 🚀 Quick Start

### Using npm scripts (easiest):
```bash
# Download current project images to ~/Downloads/forge-images
npm run download-images

# Preview what would be downloaded (dry-run)
npm run download-images:dry-run
```

### Using node directly:
```bash
# Download current project images
node scripts/download-project-images-simple.js

# Download specific project
node scripts/download-project-images-simple.js --project-id amc

# Custom output directory
node scripts/download-project-images-simple.js --output-dir ./my-images

# Preview without downloading
node scripts/download-project-images-simple.js --dry-run
```

## ⚙️ Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project-id <id>` | Override current project | Current project from server state |
| `--output-dir <path>` | Custom output directory | `~/Downloads/forge-images` |
| `--dry-run` | Show what would be downloaded without downloading | `false` |
| `--help` | Show help message | - |

## 📂 Output

### Downloaded Files
- All non-hidden images from the specified project
- Original filenames preserved
- Files copied (not moved) from `public/images/`

### Metadata File
A JSON file named `{project-id}-metadata.json` is created with:
```json
{
  "project": "sage",
  "downloadDate": "2025-08-14T16:56:23.758Z",
  "totalImages": 138,
  "successfulDownloads": 138,
  "failedDownloads": 0,
  "totalSize": 16947187,
  "images": [
    {
      "id": "image-id",
      "filename": "image-filename.jpg",
      "title": "Image Title",
      "description": "Image description...",
      "createdAt": "2025-08-14T16:45:22.523Z",
      "fileSize": 152418,
      "dimensions": "1024x576",
      "downloadStatus": "success",
      "downloadError": null
    }
  ]
}
```

## 🔍 How It Works

1. **Current Project Detection**: Reads from `.forge-state.json` or uses `--project-id` override
2. **Database Query**: Fetches non-hidden images (`hidden = 0 OR hidden IS NULL`) from SQLite
3. **File Copy**: Copies images from `public/images/` to output directory
4. **Metadata Creation**: Generates comprehensive metadata file with download results

## 🛠️ Requirements

- Node.js (any recent version)
- `better-sqlite3` package (included in project dependencies)
- Valid `forge.db` database file
- Images stored in `public/images/` directory

## 📊 What Gets Downloaded

✅ **Included:**
- All non-hidden images from the specified project
- Images with `hidden = 0` or `hidden IS NULL`
- All file formats (JPG, PNG, GIF, etc.)

❌ **Excluded:**
- Hidden images (`hidden = 1`)
- Images from other projects
- Video files (use separate video download if needed)

## 🎯 Example Use Cases

### Backup Project Images
```bash
# Backup all images from current project
npm run download-images

# Backup specific project to dated folder
node scripts/download-project-images-simple.js --project-id amc --output-dir "./backups/amc-$(date +%Y%m%d)"
```

### Export for External Use
```bash
# Export for sharing
node scripts/download-project-images-simple.js --output-dir "./exports/project-images"
```

### Audit Before Cleanup
```bash
# Preview what would be downloaded before cleaning up
npm run download-images:dry-run
```

## 🚨 Error Handling

The script handles various error conditions gracefully:

- **Missing database**: Clear error message with troubleshooting
- **Missing images**: Individual files are skipped with warnings
- **Permission errors**: Detailed error messages
- **Empty projects**: Informative message when no images found

## 📈 Performance

- **Concurrent processing**: Files copied synchronously for reliability
- **Progress indicators**: Real-time download status
- **Size reporting**: Human-readable file sizes and totals
- **Error resilience**: Individual file failures don't stop the process

## 🔧 Troubleshooting

### "Database not found"
Ensure `forge.db` exists in the project root. The database is created when you first use the Forge app.

### "No images found"
Check that:
- You're in the correct project
- Images aren't all hidden
- The project has generated images

### "Module not found: better-sqlite3"
Run: `npm install` to install dependencies.

### Permission Errors
Ensure you have write permissions to the output directory.

---

## 🎉 Success!

After running the script, you'll have:
- All project images in your chosen directory
- A detailed metadata file for reference
- Summary statistics of the download operation

Perfect for backups, exports, or sharing your Forge project images! 
