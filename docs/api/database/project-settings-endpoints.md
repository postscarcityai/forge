# Project Settings Tab-Specific API Endpoints

## 🎯 Overview

Tab-specific endpoints for the Forge Project Settings Modal. Each endpoint handles a specific section of project configuration, providing focused, performant, and granular updates.

## 📊 Endpoint Summary

| Tab | Endpoint | Purpose | Key Features |
|-----|----------|---------|--------------|
| **General** | `/api/database/projects/{id}/general` | Basic project metadata | Name, slug, color, status, description |
| **Business** | `/api/database/projects/{id}/business` | Business overview data | Company info, mission, values, contact |
| **Brand** | `/api/database/projects/{id}/brand` | Brand story configuration | Narrative, visual identity, messaging |
| **Prompting** | `/api/database/projects/{id}/prompting` | Image generation settings | Master prompt, styles, technical params |
| **LoRAs** | `/api/database/projects/{id}/loras` | AI model configuration | LoRA settings, scales, trigger words |
| **Characters** | `/api/database/characters` | Character management | *(Already exists)* |
| **Scenes** | `/api/database/scenes` | Scene management | *(Already exists)* |
| **Environment** | `/api/database/projects/{id}/env` | Environment variables | *(Already exists)* |

---

## 🔧 General Settings API

### **GET** `/api/database/projects/{id}/general`
Retrieve basic project metadata.

#### **Response**
```typescript
{
  "success": true,
  "data": {
    "id": "dvs",
    "name": "Detective Visual Series",
    "description": "A visual storytelling project",
    "slug": "dvs",
    "color": "#6B7280",
    "status": "active",
    "imageCount": 150,
    "lastActivity": "2024-01-15T10:30:00.000Z",
    "isEditable": true,
    "defaultImageOrientation": "portrait",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "General project settings retrieved successfully"
}
```

### **PATCH** `/api/database/projects/{id}/general`
Update basic project metadata.

#### **Request Body**
```typescript
{
  "name": "Updated Project Name",           // Max 100 chars
  "description": "Updated description",     // Max 500 chars
  "slug": "updated-project-slug",          // Lowercase, hyphens only, max 50 chars
  "color": "#FF5733",                      // Hex color format
  "status": "active",                      // "active" | "archived" | "completed"
  "isEditable": true,                      // Boolean
  "defaultImageOrientation": "landscape",   // "portrait" | "landscape" | "square"
  "imageCount": 42                         // Non-negative number
}
```

#### **Validation Rules**
- **Name**: Required, 1-100 characters
- **Slug**: Lowercase letters, numbers, hyphens only (e.g., `my-project`)
- **Color**: Valid hex format (`#FF5733` or `#F53`)
- **Status**: Must be `active`, `archived`, or `completed`
- **Description**: Optional, max 500 characters

---

## 📊 Business Overview API

### **GET** `/api/database/projects/{id}/business`
Retrieve business overview configuration.

#### **Response**
```typescript
{
  "success": true,
  "data": {
    "companyDescription": "Tech startup focused on AI...",
    "missionStatement": "To revolutionize visual storytelling",
    "visionStatement": "A world where stories come alive",
    "coreValues": ["Innovation", "Quality", "Collaboration"],
    "targetAudience": "Creative professionals and agencies",
    "offerings": ["Video Production", "Image Generation", "AI Tools"],
    "keyDifferentiators": ["AI-powered", "User-friendly", "Cost-effective"],
    "contactInfo": {
      "phone": "+1-555-0123",
      "email": "contact@company.com",
      "address": "123 Main St, City, State",
      "website": "https://company.com",
      "social": {
        "twitter": "https://twitter.com/company",
        "linkedin": "https://linkedin.com/company/company"
      }
    },
    "keyMetrics": {
      "revenue": "$1M ARR",
      "customers": "500+ active users"
    },
    "industryContext": "Creative Technology",
    "geographicScope": "Global"
  }
}
```

### **PATCH** `/api/database/projects/{id}/business`
Update business overview data.

#### **Request Body**
```typescript
{
  "businessOverview": {
    // All BusinessOverview interface fields
    "companyDescription": "Updated description...",
    "coreValues": ["Value 1", "Value 2"], // Max 15 items
    "offerings": ["Offering 1", "Offering 2"], // Max 20 items
    "keyDifferentiators": ["Diff 1", "Diff 2"], // Max 10 items
    "contactInfo": {
      "email": "valid@email.com" // Email format validation
    }
  }
}
```

#### **Validation Rules**
- **Core Values**: Maximum 15 items
- **Offerings**: Maximum 20 items  
- **Key Differentiators**: Maximum 10 items
- **Email**: Must be valid email format if provided

---

## 🎨 Brand Story API

### **GET** `/api/database/projects/{id}/brand`
Retrieve brand story configuration.

#### **Response**
```typescript
{
  "success": true,
  "data": {
    "brandNarrative": "Our brand story begins with...",
    "brandPersonality": "Professional, innovative, approachable",
    "voiceAndTone": "Conversational yet authoritative",
    "messagingPillars": ["Innovation", "Quality", "Customer-First"],
    "visualIdentity": {
      "primaryColors": ["#FF5733", "#3498DB"],
      "secondaryColors": ["#2ECC71", "#F39C12"],
      "typography": ["Roboto", "Open Sans"],
      "imageryStyle": "Clean, modern, professional",
      "logoGuidelines": "Use on white backgrounds with minimum 20px padding"
    },
    "contentThemes": ["Innovation", "Success Stories", "Behind the Scenes"],
    "brandGuidelines": "Complete brand guidelines document...",
    "storytellingApproach": "Data-driven narratives with human touch",
    "audienceConnection": "Empathy-first communication"
  }
}
```

### **PATCH** `/api/database/projects/{id}/brand`
Update brand story configuration.

#### **Request Body**
```typescript
{
  "brandStory": {
    "brandNarrative": "Updated brand story...",
    "messagingPillars": ["Pillar 1", "Pillar 2"], // Max 12 items
    "visualIdentity": {
      "primaryColors": ["#FF5733", "#3498DB"], // Max 8 colors, hex format
      "secondaryColors": ["#2ECC71", "#F39C12"], // Max 12 colors
      "typography": ["Font 1", "Font 2"] // Max 10 items
    },
    "contentThemes": ["Theme 1", "Theme 2"] // Max 15 items
  }
}
```

#### **Validation Rules**
- **Messaging Pillars**: Maximum 12 items
- **Content Themes**: Maximum 15 items
- **Primary Colors**: Maximum 8 colors, valid hex format
- **Secondary Colors**: Maximum 12 colors, valid hex format
- **Typography**: Maximum 10 font options

---

## 📸 Image Prompting API

### **GET** `/api/database/projects/{id}/prompting`
Retrieve image prompting configuration.

#### **Response**
```typescript
{
  "success": true,
  "data": {
    "masterPrompt": "Professional photography with natural lighting...",
    "overallStyle": "photorealistic",
    "aestheticDirection": "modern minimalist",
    "mood": "confident and approachable",
    "cameraAngle": "eye level",
    "shotType": "medium shot",
    "lensType": "prime lens",
    "focalLength": "50mm",
    "lightingStyle": "natural window light",
    "lightDirection": "soft front lighting",
    "colorPalette": "warm earth tones",
    "colorTemperature": "daylight 5600K",
    "surfaceTextures": ["smooth", "matte", "fabric"],
    "materialProperties": ["cotton", "wood", "metal"],
    "visualEffects": ["depth of field", "subtle vignette"],
    "atmosphericEffects": ["soft shadows", "natural haze"],
    "postProcessing": ["color grading", "sharpening"],
    "artisticReferences": ["Annie Leibovitz", "Peter Lindbergh"],
    "cinematicReferences": ["Blade Runner 2049", "Her"],
    "aspectRatio": "16:9",
    "resolution": "4K",
    "frameRate": "30fps"
  }
}
```

### **PATCH** `/api/database/projects/{id}/prompting`
Update image prompting configuration.

#### **Request Body**
```typescript
{
  "imagePrompting": {
    "masterPrompt": "Updated master prompt...", // Max 2000 chars
    "surfaceTextures": ["texture1", "texture2"], // Max 25 items
    "visualEffects": ["effect1", "effect2"], // Max 30 items
    "aspectRatio": "16:9", // Format: "16:9", "4:3", or "square"
    "resolution": "4K", // Format: "1920x1080", "HD", "FHD", "4K"
    "frameRate": "30fps", // Format: "30fps", "60fps", or just "30"
    "focalLength": "50mm" // Format: "50mm", "24-70mm"
  }
}
```

#### **Validation Rules**
- **Master Prompt**: Maximum 2000 characters
- **Surface Textures**: Maximum 25 items
- **Material Properties**: Maximum 25 items
- **Visual Effects**: Maximum 30 items
- **Atmospheric Effects**: Maximum 20 items
- **Post Processing**: Maximum 25 items
- **Video Transitions**: Maximum 15 items
- **Artistic References**: Maximum 20 items
- **Cinematic References**: Maximum 20 items
- **Aspect Ratio**: Format like `16:9`, `4:3`, or keywords
- **Resolution**: Format like `1920x1080` or keywords
- **Frame Rate**: Format like `30fps` or just `30`
- **Focal Length**: Format like `50mm` or `24-70mm`

---

## 🎯 LoRAs API

### **GET** `/api/database/projects/{id}/loras`
Retrieve LoRA configuration.

#### **Response**
```typescript
{
  "success": true,
  "data": {
    "lora1": {
      "id": "character-lora-v1",
      "name": "Character LoRA",
      "path": "/models/character.safetensors",
      "scale": 0.8,
      "enabled": true,
      "triggerWords": ["character", "portrait", "professional"]
    },
    "lora2": {
      "id": "style-lora-v1", 
      "name": "Style LoRA",
      "path": "/models/style.safetensors",
      "scale": 0.6,
      "enabled": false,
      "triggerWords": ["artistic", "painterly", "stylized"]
    }
  }
}
```

### **PATCH** `/api/database/projects/{id}/loras`
Update LoRA configuration.

#### **Request Body**
```typescript
{
  "loras": {
    "lora1": {
      "id": "character-lora-v2",
      "name": "Updated Character LoRA",
      "path": "/models/character-v2.safetensors",
      "scale": 0.9,
      "enabled": true,
      "triggerWords": ["character", "portrait"]
    },
    "lora2": null // Remove lora2
  }
}
```

#### **Validation Rules**
- **ID**: Required string (if LoRA provided)
- **Name**: Required string (if LoRA provided)
- **Path**: Required string, valid model file extension (`.safetensors`, `.ckpt`, `.bin`, `.pt`, `.pth`)
- **Scale**: Number between 0 and 2
- **Enabled**: Boolean
- **Trigger Words**: Optional array, max 20 items, each max 50 characters
- **No Duplicates**: lora1 and lora2 cannot have same ID or path

---

## 🚀 Usage Examples

### **Tab-Specific Save Function**
```typescript
const saveTab = async (tabId: string, data: any) => {
  const endpoints = {
    general: `/api/database/projects/${projectId}/general`,
    business: `/api/database/projects/${projectId}/business`, 
    brand: `/api/database/projects/${projectId}/brand`,
    prompting: `/api/database/projects/${projectId}/prompting`,
    loras: `/api/database/projects/${projectId}/loras`
  };

  const response = await fetch(endpoints[tabId], {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  return response.json();
};
```

### **Load Tab Data**
```typescript
const loadTabData = async (tabId: string) => {
  const response = await fetch(`/api/database/projects/${projectId}/${tabId}`);
  return response.json();
};
```

### **Progressive Save with Status Tracking**
```typescript
const [tabSaveStatus, setTabSaveStatus] = useState({
  general: 'pristine',
  business: 'pristine',
  brand: 'pristine', 
  prompting: 'pristine',
  loras: 'pristine'
});

const handleTabSave = async (tabId: string) => {
  setTabSaveStatus(prev => ({ ...prev, [tabId]: 'saving' }));
  
  try {
    const result = await saveTab(tabId, getTabData(tabId));
    if (result.success) {
      setTabSaveStatus(prev => ({ ...prev, [tabId]: 'saved' }));
    } else {
      setTabSaveStatus(prev => ({ ...prev, [tabId]: 'error' }));
    }
  } catch (error) {
    setTabSaveStatus(prev => ({ ...prev, [tabId]: 'error' }));
  }
};
```

---

## ⚠️ Error Handling

### **Common Error Responses**
```typescript
// Validation Error
{
  "success": false,
  "error": "Too many core values. Maximum 15 allowed.",
  "status": 400
}

// Project Not Found
{
  "success": false, 
  "error": "Project not found",
  "status": 404
}

// Server Error
{
  "success": false,
  "error": "Failed to update business overview",
  "details": "Database connection failed",
  "status": 500
}
```

### **Frontend Error Handling**
```typescript
const handleTabSave = async (tabId: string) => {
  try {
    const response = await fetch(`/api/database/projects/${projectId}/${tabId}`, {
      method: 'PATCH',
      body: JSON.stringify(tabData)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Save failed');
    }
    
    setTabErrors(prev => ({ ...prev, [tabId]: null }));
    setTabSaveStatus(prev => ({ ...prev, [tabId]: 'saved' }));
  } catch (error) {
    setTabErrors(prev => ({ 
      ...prev, 
      [tabId]: error.message 
    }));
    setTabSaveStatus(prev => ({ ...prev, [tabId]: 'error' }));
  }
};
```

---

## 🔧 Performance Benefits

### **Before: Single Endpoint**
- **Payload Size**: ~50KB for complete project
- **Network Time**: ~200ms
- **Database Writes**: Full project replacement
- **Error Scope**: All tabs affected by single failure

### **After: Tab-Specific Endpoints**
- **Payload Size**: ~2-8KB per tab
- **Network Time**: ~50-100ms per tab
- **Database Writes**: Targeted section updates
- **Error Scope**: Isolated per tab

### **Bandwidth Comparison**
```
Single Update (Current):
└── 50KB project payload

Tab Updates (New):
├── General: ~1KB
├── Business: ~5KB  
├── Brand: ~4KB
├── Prompting: ~8KB
└── LoRAs: ~2KB
```

---

## 🎯 Next Steps

1. **Update ProjectSettingsModal** to use new endpoints
2. **Implement progressive saving** per tab
3. **Add auto-save functionality** when switching tabs
4. **Create tab status indicators** (saved/error/saving)
5. **Add optimistic updates** for better UX
6. **Implement tab-specific validation** in the frontend

This architecture provides better performance, clearer separation of concerns, and improved user experience with granular error handling and save status tracking. 