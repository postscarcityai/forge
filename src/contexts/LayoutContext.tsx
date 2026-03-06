'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbCache } from '@/lib/indexedDB';

export interface LayoutContextType {
  // Drawers
  isProjectDrawerOpen: boolean;
  setIsProjectDrawerOpen: (open: boolean) => void;
  toggleProjectDrawer: () => void;
  
  isPromptDrawerOpen: boolean;
  setIsPromptDrawerOpen: (open: boolean) => void;
  togglePromptDrawer: () => void;
  
  // Timeline
  isTimelineOpen: boolean;
  setIsTimelineOpen: (open: boolean) => void;
  toggleTimeline: () => void;
  timelineHeight: number;
  setTimelineHeight: (height: number) => void;
  
  // Utility
  closeBothSidebars: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [isPromptDrawerOpen, setIsPromptDrawerOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(0);

  // Load drawer visibility state on mount
  useEffect(() => {
    const loadDrawerVisibility = async () => {
      try {
        const [savedProjectDrawerVisibility, savedPromptDrawerVisibility, savedTimelineVisibility] = await Promise.all([
          dbCache.loadDrawerVisibility(),
          dbCache.loadPromptDrawerVisibility(),
          dbCache.loadTimelineVisibility()
        ]);
        setIsProjectDrawerOpen(savedProjectDrawerVisibility);
        setIsPromptDrawerOpen(savedPromptDrawerVisibility);
        setIsTimelineOpen(savedTimelineVisibility);
      } catch (error) {
        console.warn('Failed to load drawer visibility:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadDrawerVisibility();
  }, []);

  // Save drawer visibility state when it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      dbCache.saveDrawerVisibility(isProjectDrawerOpen).catch(err => 
        console.warn('Failed to save drawer visibility:', err)
      );
    }
  }, [isProjectDrawerOpen, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      dbCache.savePromptDrawerVisibility(isPromptDrawerOpen).catch(err => 
        console.warn('Failed to save prompt drawer visibility:', err)
      );
    }
  }, [isPromptDrawerOpen, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      dbCache.saveTimelineVisibility(isTimelineOpen).catch(err => 
        console.warn('Failed to save timeline visibility:', err)
      );
    }
  }, [isTimelineOpen, isInitialized]);

  const toggleProjectDrawer = () => {
    setIsProjectDrawerOpen(prev => !prev);
  };

  const togglePromptDrawer = () => {
    setIsPromptDrawerOpen(prev => !prev);
  };

  const toggleTimeline = () => {
    setIsTimelineOpen(prev => !prev);
  };

  const closeBothSidebars = () => {
    setIsProjectDrawerOpen(false);
    setIsPromptDrawerOpen(false);
    setIsTimelineOpen(false);
  };

  const value: LayoutContextType = {
    isProjectDrawerOpen,
    setIsProjectDrawerOpen,
    toggleProjectDrawer,
    isPromptDrawerOpen,
    setIsPromptDrawerOpen,
    togglePromptDrawer,
    isTimelineOpen,
    setIsTimelineOpen,
    toggleTimeline,
    closeBothSidebars,
    timelineHeight,
    setTimelineHeight,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
}; 