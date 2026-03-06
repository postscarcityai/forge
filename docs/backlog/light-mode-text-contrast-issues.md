# Light Mode Text Contrast Issues

## Problem Statement
Multiple components throughout the application are displaying light/unreadable text colors in light mode, making content difficult or impossible to read. This is a critical accessibility and usability issue affecting user experience.

## Affected Components
1. **StatusPill Component** (`src/components/ui/StatusPill.tsx`)
   - Archived status badges showing light orange text
   - Completed status badges showing light green text
   - Text appears washed out against white/light backgrounds

2. **ProjectDrawer Component** (`src/components/ui/ProjectDrawer.tsx`)
   - Active project text showing as light blue instead of dark
   - Poor contrast against light blue background (`bg-blue-50`)

3. **Potentially Other Components**
   - Issue may be systemic across the design system

## Attempted Solutions (All Failed)

### Round 1: Color Variants
- **Tried**: `text-orange-900`, `text-green-900` → `text-orange-950`, `text-green-950`
- **Result**: Still too light in light mode

### Round 2: Semantic Colors
- **Tried**: `bg-muted text-foreground` for universal contrast
- **Result**: Lost color coding, user feedback was negative

### Round 3: White Backgrounds + Dark Text
- **Tried**: `bg-white text-slate-800` for light mode
- **Result**: Still experiencing readability issues

### Round 4: CSS Compilation Issues
- **Issue**: `/30` opacity classes causing build errors
- **Tried**: Replaced with solid `950` variants
- **Result**: Fixed compilation but contrast issues persist

### Round 5: Alternative Dark Colors
- **Tried**: `text-slate-900` instead of `text-blue-950` for active projects
- **Result**: Still not resolved

## Root Cause Analysis Needed
The issue appears to be deeper than individual color choices. Potential causes:
1. **CSS Framework Issues**: Tailwind classes not applying correctly in light mode
2. **Theme System Problems**: Light/dark mode detection or CSS variable resolution
3. **Build System**: CSS purging or compilation affecting color classes
4. **Browser Rendering**: Specific browser or device rendering issues

## Technical Requirements for Fix
1. **Audit Design System**: Review all color tokens and their actual rendered values
2. **Test Cross-Browser**: Verify color rendering across different browsers/devices
3. **CSS Debugging**: Inspect computed styles to see what's actually being applied
4. **Fallback Strategy**: Implement more reliable color contrast mechanism

## Acceptance Criteria
- [ ] All text in light mode has WCAG AA contrast ratio (4.5:1 minimum)
- [ ] StatusPill components show dark, readable text on white backgrounds
- [ ] Active project text in ProjectDrawer is clearly visible
- [ ] Color coding is maintained for different status types
- [ ] Solution works across all supported browsers
- [ ] No CSS compilation errors or warnings

## Priority
**HIGH** - This is an accessibility issue affecting core user workflows

## Impact
- Poor user experience in light mode
- Accessibility compliance violations
- Potential user frustration and abandonment
- Professional appearance concerns

## Notes
This issue has been persistent despite multiple attempts with different approaches. A comprehensive audit of the color system and build process may be required to identify the root cause.

## Next Steps
1. Investigate actual computed CSS values in browser dev tools
2. Test with different Tailwind versions/configurations
3. Consider implementing custom CSS variables as fallback
4. Review global theme switching mechanism
5. Test on different devices/browsers to isolate the issue 