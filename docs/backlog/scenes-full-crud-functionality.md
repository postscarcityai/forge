# Scenes Full CRUD Functionality & Real-Time Updates

## **User Story**

**As a user**, I want full Create, Read, Update, Delete functionality for scenes with real-time persistence and immediate UI feedback, so that all my scene edits are automatically saved to the database and displayed instantly without requiring page refreshes.

## **Problem Statement**

**Current State Analysis:**
- ✅ **Reading**: Scenes display properly from database  
- ✅ **Database Schema**: All active/inactive toggle columns exist
- ✅ **API Layer**: Full CRUD endpoints available (`GET`, `POST`, `PATCH`, `DELETE`)
- ❌ **Frontend Save Flow**: ProjectSettingsPage doesn't save scenes to database
- ❌ **Real-time Updates**: Changes only persist in local state, not database
- ❌ **Active Toggle Persistence**: UI toggles work but don't save to database

**Critical Gap:**
The `handleSave()` function in `ProjectSettingsPage.tsx` only saves project-level data but **completely ignores scenes and characters data**:

```typescript
const updatedFields = {
  name: editedProject.name.trim(),
  slug: editedProject.slug.trim(),
  // ... other project fields
  // ❌ MISSING: scenes and characters are not saved!
};
updateProject(project.id, updatedFields); // Only updates project context
```

**Impact:**
- Users can edit scenes in UI but changes are lost on page refresh
- Active/inactive toggles appear to work but don't persist
- No way to create new scenes or delete existing ones
- Inconsistent UX between different tabs

## **Required Implementation**

### **Phase 1: Scene Persistence Integration (High Priority)**

**1. Extend handleSave() Function**
- Add scene saving logic to `ProjectSettingsPage.tsx`
- Iterate through all modified scenes and call scenes API
- Handle both new scenes (POST) and updated scenes (PATCH)
- Delete removed scenes (DELETE)

**2. Real-Time Scene Updates**
- Save scenes immediately when any field changes (debounced)
- Update `updateScene()` function to trigger API calls
- Provide visual feedback for save status (saving/saved/error)

**3. Active Toggle Persistence**
- Ensure all `*_active` flags persist to database
- Map frontend toggle states to database columns correctly
- Test all 7 toggle types: `setting_active`, `time_of_day_active`, `lighting_active`, `mood_active`, `camera_angle_active`, `props_active`, `atmosphere_active`

### **Phase 2: Enhanced CRUD Operations (Medium Priority)**

**4. New Scene Creation**
- Generate proper scene IDs and timestamps
- Validate required fields before saving
- Immediate database persistence for new scenes

**5. Scene Deletion**
- Confirm deletion with user
- Remove from database and update UI immediately
- Handle deletion errors gracefully

**6. Bulk Operations**
- Save all scenes at once when switching tabs
- Batch API calls for better performance
- Optimistic UI updates with rollback on failure

### **Phase 3: User Experience Enhancements (Medium Priority)**

**7. Auto-Save with Visual Feedback**
```typescript
// Desired UX Pattern
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

// Show status indicators:
// 💾 Saving...  
// ✅ Saved
// ❌ Error: Failed to save
```

**8. Optimistic Updates**
- Update UI immediately when user makes changes
- Revert changes if API call fails
- Show diff indicators for unsaved changes

**9. Field-Level Validation**
- Validate required fields (name, setting, description, etc.)
- Show inline error messages
- Prevent saving invalid data

## **Technical Requirements**

### **API Integration Points**
```typescript
// Required API calls in ProjectSettingsPage
POST   /api/database/scenes          // Create new scene
PATCH  /api/database/scenes?id={id}  // Update existing scene  
DELETE /api/database/scenes?id={id}  // Delete scene
GET    /api/database/scenes?projectId={id} // Refresh scene list
```

### **Data Flow Architecture**
```
User Edit → updateScene() → API Call → Database → UI Update
     ↓                                              ↑
Local State Update ←————————————————————————————————
```

### **Error Handling Strategy**
- Network errors: Retry mechanism with exponential backoff
- Validation errors: Inline field-specific error messages  
- Conflict errors: Show merge conflict resolution UI
- Permission errors: Clear messaging about read-only state

## **Acceptance Criteria**

### **Must Have (Phase 1)**
- [ ] Scene data persists to database on every edit
- [ ] All active/inactive toggles save properly
- [ ] Page refresh preserves all scene changes
- [ ] New scenes can be created and saved
- [ ] Existing scenes can be deleted
- [ ] Save status visible to user

### **Should Have (Phase 2)**  
- [ ] Auto-save with 500ms debounce delay
- [ ] Optimistic UI updates with error rollback
- [ ] Bulk save operation when switching tabs
- [ ] Validation prevents saving invalid data

### **Could Have (Phase 3)**
- [ ] Offline support with sync when reconnected
- [ ] Undo/redo functionality for scene edits
- [ ] Export/import scenes between projects
- [ ] Scene versioning and history

## **Priority: HIGH**

**Rationale:** Users are currently experiencing data loss when editing scenes. This breaks the fundamental expectation that edits should persist. Must be fixed before any new scene features are added.

## **Estimated Effort**

| Phase | Component | Effort | Priority |
|-------|-----------|--------|----------|
| Phase 1 | Scene Save Integration | 1 day | HIGH |
| Phase 1 | Toggle Persistence Fix | 0.5 day | HIGH |  
| Phase 1 | CRUD Operations | 1 day | HIGH |
| Phase 2 | Auto-save & Feedback | 1 day | MEDIUM |
| Phase 2 | Validation & Error Handling | 0.5 day | MEDIUM |
| Phase 3 | Advanced UX Features | 2 days | LOW |

**Total: 6 days (3 days for HIGH priority items)**

## **Testing Strategy**

### **Unit Tests**
- Scene save/update/delete functions
- Active toggle state management
- API error handling scenarios

### **Integration Tests**  
- End-to-end scene editing workflow
- Cross-tab data consistency
- Network failure recovery

### **User Testing**
- Scene creation and editing workflow
- Visual feedback clarity and timing
- Error message comprehension 