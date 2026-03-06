'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SettingsNavigationContainer } from '@/components/ui/SettingsNavigationContainer';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { SettingsProvider, useSettingsContext } from '@/contexts/SettingsContext';

type TabType = 'general' | 'business' | 'brand' | 'prompting' | 'characters' | 'scenes' | 'loras' | 'env' | 'api-keys';

// Inner component that uses the settings context
function SettingsLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { closeBothSidebars } = useLayoutContext();
  const { currentProject } = useProjectContext();
  const { isEditing, isSaving, error, handleEdit, handleCancel, handleSave } = useSettingsContext();
  const hasInitializedRef = useRef(false);
  const params = useParams();
  const router = useRouter();
  
  // Extract the active tab from the URL
  const activeTab = (params.tab as TabType) || 'general';
  const projectId = params.projectId as string;

  // Handle navigation warning for route changes
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Check if there's a navigation warning function
      const warningFn = (window as any).__settingsNavigationWarning;
      if (warningFn && typeof warningFn === 'function') {
        const shouldProceed = warningFn();
        if (!shouldProceed) {
          // Prevent navigation by throwing an error
          throw new Error('Navigation cancelled by user');
        }
      }
    };

    // Listen for route change events
    const originalPush = router.push;
    const originalReplace = router.replace;
    
    router.push = (...args) => {
      try {
        handleRouteChangeStart(args[0] as string);
        return originalPush.apply(router, args);
      } catch (e) {
        // Navigation was cancelled
        return Promise.resolve(false as any);
      }
    };
    
    router.replace = (...args) => {
      try {
        handleRouteChangeStart(args[0] as string);
        return originalReplace.apply(router, args);
      } catch (e) {
        // Navigation was cancelled
        return Promise.resolve(false as any);
      }
    };

    return () => {
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  // Close both sidebars only on initial entry to settings, not on tab navigation
  useEffect(() => {
    // Check if this is the first time accessing settings in this session
    const settingsSessionKey = 'settings-sidebars-initialized';
    const hasInitialized = sessionStorage.getItem(settingsSessionKey);
    
    if (!hasInitialized && !hasInitializedRef.current) {
      // First time accessing settings - close sidebars for clean view
      closeBothSidebars();
      
      // Mark as initialized for this session
      sessionStorage.setItem(settingsSessionKey, 'true');
      hasInitializedRef.current = true;
    }
  }, [closeBothSidebars]);

  // Clear the session flag when the component unmounts (leaving settings)
  useEffect(() => {
    return () => {
      // Clear the flag when leaving settings so next entry will reset sidebars
      sessionStorage.removeItem('settings-sidebars-initialized');
    };
  }, []);

  // If no current project, show loading
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <>
      <SettingsNavigationContainer
        project={currentProject}
        projectId={projectId}
        activeTab={activeTab}
        isEditing={isEditing}
        isSaving={isSaving}
        error={error}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSave}
      />
      {children}
    </>
  );
}

// Main layout component with provider
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <SettingsLayoutInner>
        {children}
      </SettingsLayoutInner>
    </SettingsProvider>
  );
} 