'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectDrawer } from '@/components/ui/ProjectDrawer';
import { PromptDrawer } from '@/components/ui/PromptDrawer';
import { CreateProjectModal } from '@/components/ui/CreateProjectModal';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useProjectContext } from '@/contexts/ProjectContext';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export const AppLayoutWrapper: React.FC<AppLayoutWrapperProps> = ({ children }) => {
  const { isProjectDrawerOpen, setIsProjectDrawerOpen, isPromptDrawerOpen, setIsPromptDrawerOpen } = useLayoutContext();
  const { currentProject, projects, user, setCurrentProject, addProject } = useProjectContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent background scroll on mobile when drawer is open
  useEffect(() => {
    if (isMobile && (isProjectDrawerOpen || isPromptDrawerOpen)) {
      // Disable body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original scroll behavior
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMobile, isProjectDrawerOpen, isPromptDrawerOpen]);

  const handleCreateProject = async (projectData: { 
    name: string; 
    slug: string; 
    description: string; 
    color: string; 
    businessUrl?: string; 
    defaultImageOrientation?: 'portrait' | 'landscape' | 'square';
    loraSettings?: {
      lora1?: { id: string; strength: number; enabled: boolean };
      lora2?: { id: string; strength: number; enabled: boolean };
    }; 
  }) => {
    try {
      // Prepare business overview with URL if provided
      const businessOverview = projectData.businessUrl ? {
        contactInfo: {
          website: projectData.businessUrl
        }
      } : undefined;
      
      // Convert loraSettings to the project settings format
      const loras: any = {};
      
      if (projectData.loraSettings?.lora1?.enabled && projectData.loraSettings.lora1.id) {
        loras.lora1 = {
          id: projectData.loraSettings.lora1.id,
          enabled: projectData.loraSettings.lora1.enabled,
          scale: projectData.loraSettings.lora1.strength
        };
      }
      
      if (projectData.loraSettings?.lora2?.enabled && projectData.loraSettings.lora2.id) {
        loras.lora2 = {
          id: projectData.loraSettings.lora2.id,
          enabled: projectData.loraSettings.lora2.enabled,
          scale: projectData.loraSettings.lora2.strength
        };
      }
      
      await addProject({
        id: projectData.slug,
        name: projectData.name,
        slug: projectData.slug,
        color: projectData.color,
        status: 'active',
        imageCount: 0,
        description: projectData.description,
        businessOverview,
        loras: Object.keys(loras).length > 0 ? loras : undefined,
        defaultImageOrientation: projectData.defaultImageOrientation || 'portrait',
      });
      console.log('✅ New project created:', projectData.name);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      // You might want to show a toast notification here
      alert(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  // Calculate layout values based on sidebar states
  const getLayoutValues = () => {
    const leftSidebarWidth = 320;
    const rightSidebarWidth = 384;
    const bothSidebarsOpen = isProjectDrawerOpen && isPromptDrawerOpen;
    
    if (isMobile) {
      // Mobile: no layout adjustments (sidebars overlay)
      return {
        mainContentStyle: {},
        useOverlayMode: false
      };
    }

    if (bothSidebarsOpen) {
      // When both sidebars are open, use overlay mode for better UX
      return {
        mainContentStyle: {
          marginLeft: 0,
          marginRight: 0,
        },
        useOverlayMode: true
      };
    } else {
      // Standard behavior with sidebar margins
      return {
        mainContentStyle: {
          marginLeft: isProjectDrawerOpen ? leftSidebarWidth : 0,
          marginRight: isPromptDrawerOpen ? rightSidebarWidth : 0,
        },
        useOverlayMode: false
      };
    }
  };

  const { mainContentStyle, useOverlayMode } = getLayoutValues();

  return (
    <div className="relative min-h-screen flex overflow-x-hidden">
      {/* Mobile Backdrop - Only on mobile when drawer is open */}
      <AnimatePresence>
        {isMobile && (isProjectDrawerOpen || isPromptDrawerOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => {
              setIsProjectDrawerOpen(false);
              setIsPromptDrawerOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Overlay Backdrop - When both sidebars are open */}
      <AnimatePresence>
        {useOverlayMode && !isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => {
              // Close the prompt drawer first (most recently used) to provide more space
              setIsPromptDrawerOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Project Drawer */}
      <ProjectDrawer
        isOpen={isProjectDrawerOpen}
        onClose={() => setIsProjectDrawerOpen(false)}
        currentProject={currentProject}
        projects={projects}
        user={user}
        onProjectSelect={(project) => {
          setCurrentProject(project);
        }}
        onCreateProject={() => {
          setIsCreateModalOpen(true);
        }}
        isMobile={isMobile}
      />

      {/* Prompt Drawer */}
      <PromptDrawer
        isOpen={isPromptDrawerOpen}
        onClose={() => setIsPromptDrawerOpen(false)}
        isMobile={isMobile}
      />

      {/* Main content area - improved responsive behavior */}
      <motion.div
        animate={mainContentStyle}
        transition={{
          duration: 0.3,
          ease: [0.04, 0.62, 0.23, 0.98]
        }}
        className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden"
      >
        <div className="flex-1 w-full">
          {children}
        </div>
      </motion.div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}; 