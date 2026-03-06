'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SettingsContextType {
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => Promise<void>;
  setError: (error: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  registerSaveFunction: (saveFunction: () => Promise<void>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSaveFunction, setRegisteredSaveFunction] = useState<(() => Promise<void>) | null>(null);
  const pathname = usePathname();

  // Navigation warning when in edit mode
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        const message = '⚠️ Hold on, traveller! You have unsaved changes to your waypoint. Save your progress before venturing forth into the unknown! 🗺️';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      if (!isEditing) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        // Check if this is a navigation to a different page/tab
        const currentUrl = new URL(window.location.href);
        const linkUrl = new URL(link.href, window.location.origin);
        
        // If it's a different pathname or hash, show warning
        if (currentUrl.pathname !== linkUrl.pathname || currentUrl.hash !== linkUrl.hash) {
          e.preventDefault();
          e.stopPropagation();
          
          const confirmed = window.confirm(
            '⚠️ Warning, brave traveller!\n\n' +
            'You are about to abandon your waypoint without saving your progress. ' +
            'Your changes will be lost to the void!\n\n' +
            'Are you sure you wish to leave this sacred editing realm? 🗺️⚡'
          );
          
          if (confirmed) {
            // User confirmed, proceed with navigation
            setIsEditing(false); // Clear editing state
            window.location.href = link.href;
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

    const handleSave = async () => {
    if (!registeredSaveFunction) {
      setError('No save function registered');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await registeredSaveFunction();
      setIsEditing(false); // Clear editing state on successful save
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const registerSaveFunction = (saveFunction: () => Promise<void>) => {
    setRegisteredSaveFunction(() => saveFunction);
  };

  const value: SettingsContextType = {
    isEditing,
    isSaving,
    error,
    setIsEditing,
    setIsSaving,
    setError,
    handleEdit,
    handleCancel,
    handleSave,
    registerSaveFunction,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 