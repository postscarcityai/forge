# Forge Workspace Layout System

## 🏗️ Overview

The Forge workspace uses a sophisticated responsive layout system that provides a seamless experience across all screen sizes. The layout dynamically adjusts based on drawer states while maintaining consistent behavior between the navbar, timeline, and main content area.

## 🖥️ Architecture

### **Core Layout Principles**

1. **Unified Content Area**: The navbar, timeline, and main content are treated as one responsive unit
2. **Adaptive Positioning**: Components adjust their positioning based on drawer states
3. **Mobile-First Design**: Different behaviors for mobile vs desktop to optimize UX
4. **Smooth Transitions**: All layout changes are animated for a polished feel

### **Layout Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    Fixed Navbar                             │
├─────────────────────────────────────────────────────────────┤
│                 Fixed Timeline (when open)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  Main Content Area                          │
│              (Gallery, Settings, etc.)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Behavior

### **Desktop Layout (≥768px)**

#### **Default State**
- **Navbar**: Full width across viewport (`left: 0, right: 0`)
- **Timeline**: Full width when open
- **Main Content**: Uses CSS Grid with `1fr` column
- **Drawers**: Hidden by default

#### **Left Drawer Open**
- **Navbar**: Adjusts positioning (`left: 320px, right: 0`)
- **Timeline**: Adjusts positioning (`left: 320px, right: 0`) 
- **Main Content**: Grid column becomes `320px 1fr 0px`
- **Result**: Content area shrinks to accommodate drawer

#### **Right Drawer Open**
- **Navbar**: Adjusts positioning (`left: 0, right: 384px`)
- **Timeline**: Adjusts positioning (`left: 0, right: 384px`)
- **Main Content**: Grid column becomes `0px 1fr 384px`
- **Result**: Content area shrinks to accommodate drawer

#### **Both Drawers Open**
- **Navbar**: Adjusts positioning (`left: 320px, right: 384px`)
- **Timeline**: Adjusts positioning (`left: 320px, right: 384px`)
- **Main Content**: Grid column becomes `320px 1fr 384px`
- **Result**: Content area fits between both drawers

### **Mobile Layout (<768px)**

#### **All States**
- **Navbar**: Always full width (`left: 0, right: 0`)
- **Timeline**: Always full width when open
- **Main Content**: Uses single column layout (`1fr`)
- **Drawers**: Overlay with backdrop, don't affect navbar positioning

#### **Drawer Behavior**
- **Overlay Mode**: Drawers slide over content with dark backdrop
- **Full Height**: Drawers take full viewport height
- **Touch Gestures**: Tap backdrop or swipe to close
- **Scroll Lock**: Background scroll disabled when drawer open

## 🎯 Technical Implementation

### **Positioning System**

```typescript
// Shared positioning logic used by navbar and timeline
const getPositioning = () => {
  if (isMobile) {
    return { left: 0, right: 0 }; // Mobile: full width
  }
  
  // Desktop: adjust for drawer widths
  const leftOffset = isProjectDrawerOpen ? 320 : 0;
  const rightOffset = isPromptDrawerOpen ? 384 : 0;
  
  return { left: leftOffset, right: rightOffset };
};
```

### **Grid Layout System**

```typescript
// Dynamic grid template based on drawer states
const getGridTemplate = () => {
  if (isMobile) {
    return '1fr'; // Single column on mobile
  }
  
  const leftWidth = isProjectDrawerOpen ? '320px' : '0px';
  const rightWidth = isPromptDrawerOpen ? '384px' : '0px';
  
  return `${leftWidth} 1fr ${rightWidth}`;
};
```

### **Fixed Element Coordination**

```typescript
// Timeline height tracking for content padding
const getMainContentPadding = () => {
  const navbarHeight = isMobile ? 32 : 40;
  
  if (isTimelineOpen && timelineHeight > 0) {
    return navbarHeight + timelineHeight; // Stack navbar + timeline
  }
  
  return navbarHeight; // Just navbar when timeline closed
};
```

## 🔄 Animation & Transitions

### **Smooth Positioning**
- **Duration**: 300ms ease-out transitions
- **Properties**: `left`, `right`, `padding-top` all animated
- **Coordination**: All elements transition simultaneously

### **Timeline Expansion**
- **Height Animation**: Grows from 0 to auto height
- **Opacity Fade**: Smooth fade in/out
- **Content Padding**: Main content adjusts padding as timeline expands

## 📐 Breakpoints & Measurements

### **Screen Size Breakpoints**
- **Mobile**: `< 768px` (md breakpoint)
- **Desktop**: `≥ 768px`

### **Component Dimensions**
- **Navbar Height**: `32px` mobile, `40px` desktop
- **Left Drawer Width**: `320px` (project drawer)
- **Right Drawer Width**: `384px` (prompt drawer)
- **Timeline Height**: Dynamic, measured in real-time

### **Z-Index Hierarchy**
- **Mobile Backdrop**: `z-50`
- **Navbar**: `z-50` (fixed at top)
- **Timeline**: `z-40` (below navbar)
- **Drawers**: `z-50` mobile, natural stacking desktop

## 🧩 Component Coordination

### **Layout Context**
Central state management for all layout-related states:

```typescript
interface LayoutContextType {
  // Drawer states
  isProjectDrawerOpen: boolean;
  isPromptDrawerOpen: boolean;
  
  // Timeline state & measurement
  isTimelineOpen: boolean;
  timelineHeight: number;
  
  // Actions
  toggleProjectDrawer: () => void;
  togglePromptDrawer: () => void;
  toggleTimeline: () => void;
}
```

### **Component Responsibilities**

#### **Navbar**
- Renders navigation controls
- Adjusts positioning based on drawer states
- Triggers drawer toggle actions

#### **Timeline**
- Measures its own height
- Reports height to layout context
- Adjusts positioning to match navbar

#### **LayoutContainer**
- Manages CSS Grid layout
- Calculates content padding
- Handles mobile backdrop

#### **Drawers**
- Project drawer (left): 320px width
- Prompt drawer (right): 384px width
- Mobile: overlay mode with backdrop

## 📱 Mobile-Specific Features

### **Scroll Management**
- Background scroll locked when drawer open
- Restored when drawer closed
- Prevents unwanted page scrolling

### **Touch Interaction**
- Backdrop tap to close drawers
- Swipe gestures supported
- 44px minimum touch targets

### **Viewport Considerations**
- Full-height drawers on mobile
- Respects safe areas (iOS notch, etc.)
- Dynamic viewport height handling

## 🎨 Design System Integration

### **Consistent Spacing**
- Follows design system spacing scale
- Maintains visual rhythm across breakpoints
- Proper padding/margins at all sizes

### **Color & Theming**
- Backdrop opacity: `bg-black/50`
- Border colors: `border-border`
- Smooth transitions maintain theme consistency

## 🚀 Performance Considerations

### **Efficient Measurements**
- Timeline height measured via ResizeObserver
- Debounced resize event handling
- Minimal re-renders through context optimization

### **Animation Performance**
- Hardware-accelerated transforms
- Efficient CSS transitions
- Framer Motion for complex animations

## 🔧 Maintenance Guidelines

### **Adding New Breakpoints**
1. Update `isMobile` detection logic
2. Add new breakpoint to positioning functions
3. Test drawer behavior at new sizes

### **Modifying Drawer Widths**
1. Update width constants in positioning functions
2. Test content overflow at various screen sizes
3. Verify mobile overlay still works correctly

### **Timeline Integration**
1. Ensure height measurement accuracy
2. Test content padding adjustments
3. Verify smooth expand/collapse animations

---

## 🎯 Key Benefits

✅ **Responsive**: Works seamlessly across all screen sizes  
✅ **Consistent**: Unified behavior between navbar and timeline  
✅ **Smooth**: Animated transitions for professional feel  
✅ **Accessible**: Touch-friendly on mobile, precise on desktop  
✅ **Performance**: Efficient measurements and animations  
✅ **Maintainable**: Clear separation of concerns and responsibilities  

The workspace layout system transforms Forge from a simple web app into a professional creative workspace that adapts intelligently to user needs and device capabilities. 