'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectDrawer } from '@/components/ui/ProjectDrawer';
import { PromptDrawer } from '@/components/ui/PromptDrawer';
import { CreateProjectModal } from '@/components/ui/CreateProjectModal';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useProjectContext } from '@/contexts/ProjectContext';

interface LayoutContainerProps {
  children: React.ReactNode;
}

export const LayoutContainer: React.FC<LayoutContainerProps> = ({ children }) => {
  const { isProjectDrawerOpen, setIsProjectDrawerOpen, isPromptDrawerOpen, setIsPromptDrawerOpen, isTimelineOpen, timelineHeight } = useLayoutContext();
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
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
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
      const businessOverview = projectData.businessUrl ? {
        contactInfo: {
          website: projectData.businessUrl
        }
      } : undefined;
      
      // Convert loraSettings to the project format
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
      alert(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  // Grid template columns based on sidebar states
  const getGridTemplate = () => {
    if (isMobile) {
      return '1fr'; // Mobile: single column, sidebars overlay
    }
    
    const leftWidth = isProjectDrawerOpen ? '320px' : '0px';
    const rightWidth = isPromptDrawerOpen ? '384px' : '0px';
    
    return `${leftWidth} 1fr ${rightWidth}`;
  };

  // Calculate top padding for fixed navbar and timeline
  const getMainContentPadding = () => {
    // Base navbar height: 32px on mobile, 40px on desktop
    const navbarHeight = isMobile ? 32 : 40;
    
    if (isTimelineOpen && timelineHeight > 0) {
      // Use actual measured timeline height
      return navbarHeight + timelineHeight;
    }
    
    // When timeline is closed or not measured yet, just use navbar height
    return navbarHeight;
  };

  return (
    <>
      {/* Mobile Backdrop */}
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

      {/* Main Content Area with Grid Layout */}
      <motion.div
        className="min-h-screen transition-all duration-300 ease-out"
        style={{
          display: 'grid',
          gridTemplateColumns: getGridTemplate(),
          gridTemplateRows: '1fr',
        }}
      >
        {/* Left Sidebar Space - Hidden on mobile */}
        {!isMobile && (
          <div className="relative overflow-hidden">
            {/* Grid space for left sidebar */}
          </div>
        )}

        {/* Main Content Area with dynamic padding for fixed elements */}
        <motion.div 
          className="min-h-screen flex flex-col overflow-x-hidden"
          animate={{ paddingTop: getMainContentPadding() }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
        >
          {children}
        </motion.div>

        {/* Right Sidebar Space - Hidden on mobile */}
        {!isMobile && (
          <div className="relative overflow-hidden">
            {/* Grid space for right sidebar */}
          </div>
        )}
      </motion.div>

      {/* Project Drawer - Fixed positioned for all screen sizes */}
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

      {/* Prompt Drawer - Fixed positioned for all screen sizes */}
      <PromptDrawer
        isOpen={isPromptDrawerOpen}
        onClose={() => setIsPromptDrawerOpen(false)}
        isMobile={isMobile}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </>
  );
}; 