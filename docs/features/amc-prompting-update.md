# AMC Prompting Fields Update System

## Overview

This system provides comprehensive functionality to update all prompting fields in the AMC Defense Law project based on the detailed Visual Style Guide. It maps every element from the brand guide to the project's imagePrompting structure, ensuring consistent "Tactical Noir Justice" aesthetic across all generated content.

## Core Features

### 🎯 **Complete Style Guide Integration**
- **Master Prompt Foundation**: Core AMC aesthetic with tactical noir justice themes
- **Color Palette Mapping**: Charcoal black, gunmetal gray, steel blue, federal navy, AMC gold
- **Lighting Design**: High contrast, dramatic noir lighting from the style guide
- **Texture & Materials**: Professional legal environment materials and surfaces
- **Visual Effects**: Motion comic style with HUD overlays and surveillance aesthetics

### 📸 **Professional Production Standards**
- **4K UHD Resolution**: Maximum detail for legal documentation quality
- **24fps Cinematic**: Professional cable television production standards
- **16:9 Widescreen**: Television broadcasting standard aspect ratio
- **Minimal Compression**: Legal evidence quality preservation

### 🎬 **Artistic References Integration**
- **Legal Thriller Cinema**: Michael Clayton, The Firm, Spotlight, Dark Waters
- **Documentary Realism**: Zodiac, Mindhunter, All the President's Men
- **Visual Artists**: David Fincher, Saul Bass, Gregory Crewdson, Jeff Wall
- **FBI Training Aesthetics**: Government propaganda textures and overlays

## Implementation Files

### `src/utils/updateAmcPromptingFields.ts`
**Main utility functions for updating and validating AMC prompting fields**

```typescript
// Primary update function
await updateAmcPromptingFields('amc');

// Validation function  
const isValid = await validateAmcPromptingFields('amc');

// Summary information
const summary = await getAmcPromptingSummary('amc');
```

**Key Functions:**
- `updateAmcPromptingFields()` - Updates all fields based on style guide
- `validateAmcPromptingFields()` - Validates required fields and content
- `getAmcPromptingSummary()` - Provides configuration overview

### `scripts/update-amc-prompting.js`
**Standalone Node.js script for command-line execution**

```bash
# Run the update script
node scripts/update-amc-prompting.js

# Or add to package.json scripts
npm run update-amc
```

**Script Features:**
- Complete command-line interface
- Comprehensive validation and error handling
- Detailed logging and progress reporting
- Exit codes for CI/CD integration

## AMC Style Guide Mapping

### **Primary Aesthetic Components**

#### **1. Master Prompt Foundation (Core Identity)**
```
Tactical noir justice aesthetic cinematic neo-noir graphic novel realism 
professional legal defense photography dramatic courtroom lighting high 
contrast shadows clean intentional framing documentary grit stylized motion 
comic precision federal law enforcement authority prosecutorial precision 
defense attorney perspective client advocacy visual storytelling criminal 
justice system representation forensic attention to detail
```

#### **2. Visual Style Categories**

**Photography & Cinematography:**
- Locked wides for tension, slow zoom-ins for legal gravity
- Medium close-up professional portraits, surveillance angles  
- 85mm portrait lens with controlled depth of field
- Stable professional movement, tactical positioning

**Lighting Design:**
- High contrast hard light, interrogation room aesthetics
- Practical sources: desk lamps, window blinds, fluorescents
- Strategic shadow placement for mood enhancement
- Federal gravitas through controlled dramatic lighting

**Color Treatment:**
- Primary: Charcoal black, gunmetal gray, steel blue, federal navy
- Accents: Blood red for danger/urgency, AMC gold for prestige
- Desaturated earth tones with selective color enhancement
- Cool professional television color balance

#### **3. Environmental Context**

**Texture & Materials:**
- Polished mahogany conference tables with wood grain
- Brushed metal fixtures for professional atmosphere  
- Rich leather furniture with natural wear patterns
- Clean glass surfaces with minimal reflections
- Subtle film grain overlay for 16mm documentary feel

**Atmospheric Effects:**
- Government building institutional authority
- Courtroom chambers judicial dignity
- Executive office high-rise power dynamics
- Underground parking garage concrete shadows
- Federal law enforcement tactical operations

#### **4. Motion Comic Elements**

**Visual Effects:**
- HUD-style overlays with dynamic text labels
- Stamp transitions: "SEALED," "SUBPOENAED," "DISMISSED"
- Evidence markers, timeline graphics, court dates
- Redacted text blocks, DOJ/FBI folder tabs
- Surveillance camera indicators and record icons

**Post-Processing:**
- Color grading for consistent AMC brand aesthetic
- High contrast enhancement for dramatic noir impact
- Motion comic-style freeze-frames with bold outlines
- Digital glitch effects for classified document overlays

## Usage Examples

### **Basic Update Operation**
```typescript
import { updateAmcPromptingFields } from '@/utils/updateAmcPromptingFields';

// Update AMC project with complete style guide
await updateAmcPromptingFields('amc');
```

### **Validation Check**
```typescript
import { validateAmcPromptingFields } from '@/utils/updateAmcPromptingFields';

// Validate all required fields are present
const isValid = await validateAmcPromptingFields('amc');
if (!isValid) {
  console.error('AMC prompting fields validation failed');
}
```

### **Configuration Summary**
```typescript
import { getAmcPromptingSummary } from '@/utils/updateAmcPromptingFields';

// Get current configuration status
const summary = await getAmcPromptingSummary('amc');
console.log(`Style Guide Compliance: ${summary.styleGuideCompliance}%`);
console.log(`Master Prompt Words: ${summary.masterPromptWords}`);
```

### **Command Line Script**
```bash
# Direct execution
node scripts/update-amc-prompting.js

# With environment variable
NEXT_PUBLIC_BASE_URL=http://localhost:3000 node scripts/update-amc-prompting.js

# Add to package.json
{
  "scripts": {
    "update-amc": "node scripts/update-amc-prompting.js"
  }
}
```

## Validation Rules

### **Required Fields Validation**
The system validates these essential AMC fields:
- `masterPrompt` - Core tactical noir justice aesthetic
- `overallStyle` - Cinematic Neo-Noir x Graphic Novel Realism  
- `aestheticDirection` - Clean framing with heavy shadows
- `mood` - Elite, shadowed, tactical atmosphere
- `cameraAngle` - Locked wides and surveillance angles
- `lightingStyle` - High contrast dramatic lighting
- `colorPalette` - AMC brand color specifications
- `surfaceTextures` - Professional legal environment materials
- `visualEffects` - Motion comic and HUD elements
- `artisticReferences` - Key visual inspiration sources
- `cinematicReferences` - Legal thriller film influences

### **Content Quality Validation**
- **Master Prompt Terms**: Must include "tactical," "noir," "justice," "cinematic," "legal," "dramatic"
- **Artistic References**: Must include key AMC inspirations (Fincher, Bass, Crewdson)
- **Cinematic References**: Must include legal thrillers (Michael Clayton, The Firm, Spotlight)
- **Array Fields**: Must have content in texture, effects, and reference arrays

### **Compliance Scoring**
The system calculates style guide compliance as a percentage:
```typescript
// Based on 15 required AMC fields from style guide
const compliance = (configuredFields / requiredAMCFields) * 100;
```

## API Integration

### **Endpoint Used**
```
PATCH /api/database/projects/{projectId}/prompting
```

### **Request Format**
```typescript
{
  "imagePrompting": {
    "masterPrompt": "...",
    "overallStyle": "...",
    "surfaceTextures": ["..."],
    // ... all other fields
  }
}
```

### **Response Format**
```typescript
{
  "success": true,
  "message": "Image prompting configuration updated successfully",
  "data": { /* updated imagePrompting object */ }
}
```

## Error Handling

### **Network Errors**
- Automatic retry logic for transient failures
- Detailed error messages with HTTP status codes
- Graceful degradation when API is unavailable

### **Validation Errors**
- Field-by-field validation reporting
- Missing required field identification
- Content quality warnings for incomplete data

### **Data Errors**
- Array field length validation (respects API limits)
- String length validation for master prompt (2000 char limit)
- Format validation for technical parameters

## Performance Considerations

### **Single API Call**
- All fields updated in one atomic operation
- No multiple round-trips to database
- Consistent state guaranteed

### **Validation Caching**
- Validation results cached during script execution
- Reduces redundant API calls
- Improves script performance

### **Memory Efficiency**
- Minimal memory footprint
- No large data structure retention
- Efficient string manipulation

## Integration with Existing Systems

### **Prompt Builder Integration**
The updated fields immediately become available in:
- PromptDrawer component sections
- Master prompt foundation
- Technical photography settings
- Visual style configurations
- Atmospheric effect options

### **Image Generation Integration**
Updated prompting fields automatically enhance:
- Flux-LoRA batch generation
- Character-based prompt building
- Scene foundation integration
- Style reference application

### **Project Settings Integration**
The prompting tab in Project Settings Modal will reflect:
- All updated field values
- Complete AMC style guide implementation
- Professional production standards
- Legal thriller aesthetic consistency

## Future Enhancements

### **Brand Variations**
- Support for different AMC show aesthetics
- Season-specific style variations
- Character-specific prompt modifications

### **Quality Metrics**
- Generated image quality scoring
- Style guide adherence measurement
- Automatic prompt optimization

### **Backup and Restore**
- Configuration backup before updates
- Rollback capability for failed updates
- Version history for prompt configurations

## Troubleshooting

### **Common Issues**

**"Project not found"**
- Verify AMC project exists in database
- Check project ID spelling ('amc')
- Ensure database connection is working

**"Validation failed"**
- Check required fields are not empty
- Verify array fields have content
- Confirm master prompt includes key terms

**"API connection failed"**
- Verify localhost:3000 is running
- Check NEXT_PUBLIC_BASE_URL environment variable
- Ensure API endpoint is accessible

### **Debug Mode**
Enable detailed logging by setting:
```bash
NODE_ENV=development node scripts/update-amc-prompting.js
```

This provides:
- Detailed field-by-field updates
- API request/response logging
- Validation step-by-step results
- Performance timing information

---

## Summary

The AMC Prompting Fields Update System provides a complete solution for implementing the AMC Defense Law Visual Style Guide across all image generation systems. It ensures consistent "Tactical Noir Justice" aesthetic while maintaining professional television production standards and legal thriller authenticity.

**Key Benefits:**
- ✅ Complete style guide implementation
- ✅ Professional production standards  
- ✅ Comprehensive validation and error handling
- ✅ Command-line and programmatic interfaces
- ✅ Integration with existing prompt building systems
- ✅ Future-proof extensibility for AMC brand variations 