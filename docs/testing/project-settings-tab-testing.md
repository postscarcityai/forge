# Project Settings Tab Testing Checklist

## 🎯 Overview
Testing plan for the new tab-specific project settings endpoints and functionality.

## 📋 Tab-by-Tab Testing Checklist

### ✅ **1. General Tab** (`/api/database/projects/[id]/general`)
**Route:** `value` ➜ `/api/database/projects/[id]/general`

**Test Steps:**
- [ ] Open project settings modal
- [ ] Navigate to General tab  
- [ ] Click Edit mode
- [ ] Modify project name
- [ ] Modify project description
- [ ] Change project color
- [ ] Change project status
- [ ] Look for yellow "modified" indicator on tab
- [ ] Click "Save Tab" button (individual save)
- [ ] Verify green "saved" indicator appears
- [ ] Verify changes persist after refresh

**Expected Data Saved:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description", 
  "slug": "updated-slug",
  "color": "#ff6b35",
  "status": "active",
  "isEditable": true,
  "defaultImageOrientation": "landscape",
  "imageCount": 10
}
```

---

### ✅ **2. Value Tab** (`/api/database/projects/[id]/value`)  
**Route:** `business` ➜ `value` ➜ `/api/database/projects/[id]/value`

**Test Steps:**
- [ ] Navigate to Value tab
- [ ] Click Edit mode  
- [ ] Modify Company Name
- [ ] Update Mission Statement
- [ ] Add/edit Company Values
- [ ] Modify Target Audience
- [ ] Update Contact Information
- [ ] Look for yellow "modified" indicator
- [ ] Click "Save Tab" button
- [ ] Verify green "saved" indicator appears

**Expected Data Saved:**
```json
{
  "businessOverview": {
    "companyName": "Updated Company",
    "mission": "Updated mission statement",
    "values": ["innovation", "integrity"],
    "targetAudience": ["millennials", "professionals"],
    "contactInfo": {
      "email": "contact@company.com",
      "phone": "+1-555-0123"
    }
  }
}
```

---

### ✅ **3. Story Tab** (`/api/database/projects/[id]/story`)
**Route:** `brand` ➜ `story` ➜ `/api/database/projects/[id]/story`

**Test Steps:**
- [ ] Navigate to Story tab
- [ ] Click Edit mode
- [ ] Update Brand Narrative
- [ ] Modify Brand Personality traits
- [ ] Edit Visual Identity elements
- [ ] Update Brand Voice & Tone
- [ ] Modify Messaging Framework
- [ ] Look for yellow "modified" indicator
- [ ] Click "Save Tab" button  
- [ ] Verify green "saved" indicator appears

**Expected Data Saved:**
```json
{
  "brandStory": {
    "brandNarrative": "Updated brand story",
    "brandPersonality": ["innovative", "trustworthy", "bold"],
    "visualIdentity": {
      "primaryColors": ["#ff6b35", "#004080"],
      "logoStyle": "modern"
    },
    "voiceAndTone": "professional yet approachable",
    "messagingFramework": ["quality", "innovation", "customer-first"]
  }
}
```

---

### ✅ **4. Prompting Tab** (`/api/database/projects/[id]/prompting`)

**Test Steps:**
- [ ] Navigate to Prompting tab
- [ ] Click Edit mode
- [ ] Update Master Prompt
- [ ] Modify Art Style
- [ ] Change Lighting settings
- [ ] Update Technical Parameters
- [ ] Modify Aspect Ratio
- [ ] Look for yellow "modified" indicator
- [ ] Click "Save Tab" button
- [ ] Verify green "saved" indicator appears

**Expected Data Saved:**
```json
{
  "imagePrompting": {
    "masterPrompt": "Updated master prompt",
    "artStyle": "photorealistic",
    "lighting": "natural",
    "aspectRatio": "16:9",
    "technicalParams": {
      "quality": "high",
      "detail": "ultra"
    }
  }
}
```

---

### ✅ **5. Characters Tab** (Existing endpoint)
**Route:** `/api/database/characters?projectId=[id]`

**Test Steps:**
- [ ] Navigate to Characters tab
- [ ] Verify existing character management works
- [ ] Add/edit/delete characters
- [ ] Verify characters save properly
- [ ] Check tab status indicators work

---

### ✅ **6. Scenes Tab** (Existing endpoint)  
**Route:** `/api/database/scenes?projectId=[id]`

**Test Steps:**
- [ ] Navigate to Scenes tab
- [ ] Verify existing scene management works
- [ ] Add/edit/delete scenes
- [ ] Verify scenes save properly
- [ ] Check tab status indicators work

---

### ✅ **7. LoRAs Tab** (`/api/database/projects/[id]/loras`)

**Test Steps:**
- [ ] Navigate to LoRAs tab
- [ ] Click Edit mode
- [ ] Configure LoRA 1 settings
- [ ] Configure LoRA 2 settings
- [ ] Adjust weights and parameters
- [ ] Look for yellow "modified" indicator
- [ ] Click "Save Tab" button
- [ ] Verify green "saved" indicator appears

**Expected Data Saved:**
```json
{
  "loras": {
    "lora1": {
      "name": "character-lora",
      "weight": 0.8,
      "enabled": true
    },
    "lora2": {
      "name": "style-lora", 
      "weight": 0.6,
      "enabled": false
    }
  }
}
```

---

### ✅ **8. Environment Tab** (`/api/database/projects/[id]/env`)

**Test Steps:**
- [ ] Navigate to Environment tab
- [ ] Click Edit mode
- [ ] Add new environment variable
- [ ] Edit existing environment variable
- [ ] Delete environment variable
- [ ] Toggle visibility of sensitive values
- [ ] Look for yellow "modified" indicator
- [ ] Click "Save Tab" button
- [ ] Verify green "saved" indicator appears

**Expected Data Saved:**
```json
{
  "envVars": {
    "API_KEY": "secret-key-value",
    "DEBUG_MODE": "true",
    "CUSTOM_SETTING": "custom-value"
  }
}
```

---

## 🎮 **Multi-Tab Testing Scenarios**

### **Scenario 1: Multi-Tab Modification**
- [ ] Edit multiple tabs without saving
- [ ] Verify each tab shows yellow "modified" indicator
- [ ] Switch between tabs (should auto-save previous tab)
- [ ] Verify tab status changes: modified → saving → saved
- [ ] Check that all tabs retain their changes

### **Scenario 2: Error Handling**
- [ ] Force a save error (disconnect internet, etc.)
- [ ] Verify tab shows red "error" indicator
- [ ] Verify error message appears with retry button
- [ ] Click retry button
- [ ] Verify recovery works

### **Scenario 3: Auto-Save on Tab Switch**
- [ ] Make changes in one tab
- [ ] Switch to another tab without manually saving
- [ ] Verify automatic save occurs
- [ ] Verify tab status: modified → saving → saved

### **Scenario 4: Bulk Save**
- [ ] Modify multiple tabs
- [ ] Click main "Save All Changes" button
- [ ] Verify all modified tabs save simultaneously
- [ ] Check footer status summary updates correctly

---

## 🔧 **Technical Validation**

### **API Response Validation**
- [ ] All endpoints return proper JSON responses
- [ ] Success responses include `{ success: true, data: {...} }`
- [ ] Error responses include `{ success: false, error: "message" }`
- [ ] HTTP status codes are appropriate (200, 400, 404, 500)

### **Database Validation** 
- [ ] Check that data is actually persisted in database
- [ ] Verify foreign key relationships maintained
- [ ] Confirm no data corruption occurs

### **UI State Management**
- [ ] Tab status indicators work correctly
- [ ] Error states clear properly
- [ ] Success states display correctly
- [ ] Loading states show during saves

---

## 🐛 **Known Issues to Watch For**

- [ ] Tab name mismatches (business/value, brand/story)
- [ ] Missing markTabAsModified calls
- [ ] Incorrect endpoint URLs
- [ ] TypeScript compilation errors
- [ ] State management race conditions

---

## ✅ **Success Criteria**

**Each tab should:**
1. ✅ Load data correctly
2. ✅ Accept edits in edit mode
3. ✅ Show proper status indicators
4. ✅ Save data to correct endpoint
5. ✅ Handle errors gracefully
6. ✅ Auto-save on tab switch
7. ✅ Persist changes across refreshes

**The modal should:**
1. ✅ Track all tab states independently
2. ✅ Show accurate modification summaries
3. ✅ Handle bulk saves properly
4. ✅ Provide clear user feedback
5. ✅ Recover from errors gracefully 