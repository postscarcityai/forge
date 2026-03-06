# Project Settings Update Scripts

This directory contains scripts for updating project settings across all available sections with proper TypeScript validation.

## 🚀 Generic Update Script

### `update-project-settings.js`

A powerful, type-safe script that can update any project settings section with validation.

#### Available Sections:
- `general` - Project name, color, status, etc.
- `business` - Business overview, values, offerings
- `brand` - Brand story and visual identity  
- `prompting` - Image generation prompting settings
- `loras` - LoRA configurations
- `env` - Environment variables
- `bulk` - Update multiple sections at once

#### Usage Examples:

```bash
# Update general settings via command line
npm run update-settings amc general --name="AMC Defense Law" --color="#1E3A8A" --status="active"

# Update business settings from JSON file
npm run update-settings amc business --file=./business-data.json

# Update prompting settings
npm run update-settings amc prompting --masterPrompt="Professional legal photography" --aspectRatio="16:9"

# Bulk update multiple sections
npm run update-settings amc bulk --file=./bulk-updates.json

# Direct script usage
node scripts/update-project-settings.js <projectId> <section> [options]
```

#### Command Line Options:

- `--file=<path>` - Load data from JSON file
- `--<fieldName>=<value>` - Set individual field values
- `--<fieldName>=<jsonArray>` - Set array values (JSON format)

#### JSON File Examples:

**General Settings** (`general-update.json`):
```json
{
  "name": "AMC Defense Law",
  "description": "Premier federal criminal defense firm",
  "color": "#1E3A8A", 
  "status": "active",
  "isEditable": true,
  "defaultImageOrientation": "landscape"
}
```

**Business Settings** (`business-update.json`):
```json
{
  "companyDescription": "Premier criminal defense firm...",
  "missionStatement": "To provide unmatched legal defense...",
  "coreValues": [
    "Excellence in Legal Defense",
    "Client-Centered Advocacy",
    "Ethical Practice"
  ],
  "offerings": [
    "Federal Criminal Defense",
    "White-Collar Crime Defense"
  ],
  "contactInfo": {
    "phone": "(561) 665-8020",
    "email": "contact@amcdefenselaw.com"
  }
}
```

**Bulk Update** (`bulk-update.json`):
```json
{
  "general": {
    "name": "AMC Defense Law",
    "color": "#1E3A8A"
  },
  "business": {
    "companyDescription": "Updated description..."
  },
  "prompting": {
    "masterPrompt": "Professional legal photography",
    "aspectRatio": "16:9"
  }
}
```

#### Validation Features:

✅ **Type Checking** - All fields validated against TypeScript interfaces  
✅ **Format Validation** - Email, hex colors, aspect ratios, etc.  
✅ **Length Limits** - Respects API field length constraints  
✅ **Array Limits** - Enforces maximum array sizes  
✅ **Required Fields** - Nothing is required, all updates are partial  
✅ **Error Handling** - Detailed validation and API error messages  

#### Response Format:

```json
{
  "success": true,
  "data": { /* updated data */ },
  "message": "Settings updated successfully"
}
```

For bulk updates:
```json
{
  "success": true,
  "results": {
    "general": { "success": true, "data": {...} },
    "business": { "success": true, "data": {...} },
    "prompting": { "success": false, "error": "Validation failed" }
  }
}
```

---

## 🎯 Specialized Update Scripts

### `update-amc-business.js`
Updates AMC project with comprehensive business data from real website audit.

```bash
npm run update-amc-business
```

### `update-amc-prompting.js` 
Updates AMC project with comprehensive prompting configuration.

```bash
npm run update-amc
```

---

## 🔧 TypeScript Utilities

### `src/utils/updateProjectSettings.ts`

Provides typed functions for updating project settings programmatically:

```typescript
import { updateProjectSettings, ProjectSection } from '@/utils/updateProjectSettings';

// Update a single section
await updateProjectSettings('amc', ProjectSection.GENERAL, {
  name: 'AMC Defense Law',
  color: '#1E3A8A'
});

// Bulk update multiple sections
await updateMultipleProjectSettings('amc', {
  [ProjectSection.GENERAL]: { name: 'Updated Name' },
  [ProjectSection.BUSINESS]: { companyDescription: 'Updated description' }
});

// Get current settings
const result = await getProjectSettings('amc', ProjectSection.BUSINESS);
```

#### Available Types:

- `ProjectSection` - Enum of all available sections
- `GeneralSettings` - General project settings interface
- `BusinessOverview` - Business data interface  
- `BrandStory` - Brand story interface
- `ImagePrompting` - Prompting configuration interface
- `LoRASettings` - LoRA configuration interface
- `EnvironmentSettings` - Environment variables interface

---

## 📋 API Endpoints Supported

| Section | Endpoint | Body Key | Status |
|---------|----------|----------|---------|
| General | `/api/database/projects/{id}/general` | `general` | ✅ Active |
| Business | `/api/database/projects/{id}/business` | `businessOverview` | ✅ Active |
| Brand | `/api/database/projects/{id}/brand` | `brandStory` | ✅ Active |
| Prompting | `/api/database/projects/{id}/prompting` | `imagePrompting` | ✅ Active |
| LoRAs | `/api/database/projects/{id}/loras` | `loras` | ✅ Active |
| Environment | `/api/database/projects/{id}/env` | `environmentVariables` | ⚠️ Not Implemented |

---

## 🛡️ Security & Validation

- **Input Sanitization** - All inputs validated before API calls
- **Type Safety** - Full TypeScript type checking
- **Error Handling** - Graceful error handling with detailed messages
- **Partial Updates** - Only provided fields are updated
- **Rollback Safe** - Individual section failures don't affect others in bulk updates

---

## 🚀 Getting Started

1. **Single Section Update:**
   ```bash
   npm run update-settings amc general --name="My Project" --color="#FF5733"
   ```

2. **File-Based Update:**
   ```bash
   echo '{"name": "Test Project", "color": "#1E3A8A"}' > test.json
   npm run update-settings amc general --file=test.json
   ```

3. **Bulk Update:**
   ```bash
   npm run update-settings amc bulk --file=scripts/examples/bulk-update.json
   ```

4. **In Code:**
   ```typescript
   import { updateProjectSettings, ProjectSection } from '@/utils/updateProjectSettings';
   
   const result = await updateProjectSettings('myProject', ProjectSection.BUSINESS, {
     companyDescription: 'Updated description'
   });
   ```

The script provides comprehensive project settings management with full type safety and validation! 🎉 