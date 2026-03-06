# Active Toggle Switches - Full Persistence & Functionality

## **User Story**

**As a user**, I want all active/inactive toggle switches in scenes and characters to work properly and persist immediately to the database, so that I can control which fields are included in prompt generation and see my preferences saved automatically.

## **Problem Statement**

**Current Toggle State:**
- ✅ **UI Display**: Toggle switches appear and can be clicked
- ✅ **Local State**: Changes update in component state immediately  
- ✅ **Database Schema**: All `*_active` columns exist in database
- ❌ **Persistence**: Toggles don't save to database, reset on refresh
- ❌ **Visual Feedback**: No indication when toggles are being saved
- ❌ **Error Handling**: No feedback if toggle save fails

**Affected Components:**
- **Scenes**: 7 toggle types (`setting_active`, `time_of_day_active`, `lighting_active`, `mood_active`, `camera_angle_active`, `props_active`, `atmosphere_active`)
- **Characters**: 10+ toggle types (`ageActive`, `genderActive`, `raceActive`, etc.)

**Current Field Mapping Issues:**
```typescript
// Database columns (snake_case)
setting_active: boolean
time_of_day_active: boolean  
lighting_active: boolean

// Frontend properties (camelCase) 
settingActive: boolean
timeOfDayActive: boolean
lightingActive: boolean

// ScenesTab uses mixed format (inconsistent)
scene.setting_active        // ❌ Should be settingActive
scene.time_of_day_active    // ❌ Should be timeOfDayActive
```

## **Required Implementation**

### **Phase 1: Fix Toggle Persistence (Immediate)**

**1. Field Name Standardization**
- Standardize all toggle field names to camelCase in frontend
- Update `ScenesTab.tsx` to use consistent naming
- Ensure proper mapping in database service layer

**2. Immediate Toggle Save**
- When toggle is clicked → immediate API call to update that specific field
- Use PATCH endpoint to update only the changed toggle
- Show mini loading spinner next to toggle during save

**3. Error Handling for Toggles**
- If toggle save fails → revert toggle to previous state
- Show error toast: "Failed to save toggle"
- Retry mechanism for failed toggle saves

### **Phase 2: Enhanced Toggle UX (Short-term)**

**4. Visual Save Feedback**
```typescript
// Desired toggle states
type ToggleState = 'idle' | 'saving' | 'saved' | 'error';

// Visual indicators:
// 🔄 Saving... (spinner next to toggle)
// ✅ Saved (green checkmark, fade after 1s)  
// ❌ Error (red X, stays until resolved)
```

**5. Batch Toggle Updates**
- When multiple toggles changed quickly → debounce and batch
- Single API call for multiple toggle changes
- Atomic success/failure for batched changes

**6. Toggle State Consistency**
- Real-time sync between tabs (if same scene open in multiple tabs)
- Prevent race conditions from concurrent toggle changes
- Lock toggles during save operations

### **Phase 3: Advanced Toggle Features (Future)**

**7. Toggle Groups & Dependencies**
- "Enable All" / "Disable All" buttons for scene sections
- Smart dependencies (e.g., if props disabled, props_active auto-disabled)
- Preset toggle configurations ("Minimal", "Full Detail", "Custom")

**8. Toggle Analytics & Insights**
- Track which toggles are most/least used
- Suggest optimal toggle configurations based on project type
- Export toggle preferences for reuse across projects

## **Technical Implementation**

### **Database Mapping Fix**
```typescript
// In convertToScene() function - ensure consistent mapping
settingActive: dbScene.setting_active !== 0,
timeOfDayActive: dbScene.time_of_day_active !== 0,
lightingActive: dbScene.lighting_active !== 0,
moodActive: dbScene.mood_active !== 0,
cameraAngleActive: dbScene.camera_angle_active !== 0,
propsActive: dbScene.props_active !== 0,
atmosphereActive: dbScene.atmosphere_active !== 0,
```

### **Immediate Save Function**
```typescript
const saveToggleState = async (sceneId: string, field: string, value: boolean) => {
  try {
    const response = await fetch(`/api/database/scenes?id=${sceneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    
    if (!response.ok) throw new Error('Failed to save toggle');
    
    // Success feedback
    showToast('Toggle saved', 'success');
  } catch (error) {
    // Revert toggle and show error
    revertToggle(sceneId, field);
    showToast('Failed to save toggle preference', 'error');
  }
};
```

### **Updated Toggle Component**
```typescript
const ToggleWithStatus = ({ isActive, onToggle, saveStatus }) => (
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={isActive}
      onChange={onToggle}
      disabled={saveStatus === 'saving'}
      className="toggle-input"
    />
    {saveStatus === 'saving' && <Spinner size="sm" />}
    {saveStatus === 'saved' && <CheckIcon className="text-green-500" />}
    {saveStatus === 'error' && <XIcon className="text-red-500" />}
  </div>
);
```

## **Acceptance Criteria**

### **Must Have (Phase 1)**
- [ ] All scene toggles persist immediately to database
- [ ] All character toggles persist immediately to database  
- [ ] Failed toggle saves revert to previous state
- [ ] Toggle state preserved across page refreshes
- [ ] Consistent field naming (camelCase) across frontend

### **Should Have (Phase 2)**
- [ ] Visual save status for each toggle (saving/saved/error)
- [ ] Debounced batch updates for rapid toggle changes
- [ ] Error recovery and retry mechanism
- [ ] Loading states prevent accidental double-clicks

### **Could Have (Phase 3)**
- [ ] Bulk toggle operations ("Enable All")
- [ ] Toggle dependency management
- [ ] Toggle usage analytics and optimization suggestions

## �� **Priority: HIGH**

**Rationale:** Toggle switches are a core UX feature that users expect to work reliably. Currently broken persistence creates confusion and data loss, undermining user trust in the application.

## **Estimated Effort**

| Task | Effort | Priority |
|------|--------|----------|
| Field name standardization | 0.5 day | HIGH |
| Immediate toggle persistence | 1 day | HIGH |
| Error handling & revert | 0.5 day | HIGH |
| Visual save feedback | 0.5 day | MEDIUM |
| Batch updates & debouncing | 1 day | MEDIUM |
| Advanced toggle features | 2 days | LOW |

**Total: 5.5 days (2 days for HIGH priority)**

## **Testing Checklist**

### **Functional Tests**
- [ ] Each toggle type saves correctly to database
- [ ] Failed saves revert toggle to previous state  
- [ ] Page refresh preserves all toggle states
- [ ] Rapid clicking doesn't cause race conditions
- [ ] Network failures handled gracefully

### **Database Tests**
- [ ] All `*_active` columns update correctly
- [ ] Field mapping between frontend/database works
- [ ] Concurrent toggle updates don't conflict
- [ ] Database constraints prevent invalid states

### **User Experience Tests**
- [ ] Toggle feedback is clear and immediate
- [ ] Error messages are helpful and actionable
- [ ] Loading states prevent user confusion
- [ ] Toggle groups work logically together 