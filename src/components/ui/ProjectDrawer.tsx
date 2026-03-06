'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Icon, X, Plus, Settings, User as UserIcon } from '@/components/ui/Icon';

import { UserSettingsModal } from '@/components/ui/UserSettingsModal';
import { cn } from '@/lib/utils';
import { Project, useProjectContext } from '@/contexts/ProjectContext';
import { useImageContext } from '@/contexts/ImageContext';
import { dbCache } from '@/lib/indexedDB';

interface User {
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    notifications?: boolean;
    autoSave?: boolean;
    language?: string;
  };
}

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject?: Project;
  projects?: Project[];
  user?: User;
  onProjectSelect?: (project: Project) => void;
  onCreateProject?: () => void;
  isMobile?: boolean;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  isOpen,
  onClose,
  currentProject,
  projects,
  user,
  onProjectSelect,
  onCreateProject,
  isMobile = false,
}) => {
  const [userSettingsModalOpen, setUserSettingsModalOpen] = useState(false);
  
  const router = useRouter();
  
  // Get context data as fallback
  const context = useProjectContext();
  const { getImageCountByProject, forceReloadImages } = useImageContext();
  
  // Use props if provided, otherwise fall back to context (memoized to prevent unnecessary re-renders)
  const activeProject = React.useMemo(() => currentProject || context.currentProject, [currentProject, context.currentProject]);
  const projectList = React.useMemo(() => projects || context.projects, [projects, context.projects]);
  const userInfo = React.useMemo(() => user || context.user, [user, context.user]);

  // Pre-calculate filtered project lists to avoid doing it in render
  const activeProjects = React.useMemo(() => 
    projectList.filter((project) => project.status !== 'archived' && project.status !== 'completed'),
    [projectList]
  );
  
  const archivedProjects = React.useMemo(() => 
    projectList.filter((project) => project.status === 'archived'),
    [projectList]
  );
  
  const completedProjects = React.useMemo(() => 
    projectList.filter((project) => project.status === 'completed'),
    [projectList]
  );
  
  // Track project state changes
  React.useEffect(() => {
    // Project state tracking without verbose logging
  }, [projectList.length, activeProject?.id]);
  
  const handleProjectSelect = (project: Project) => {
    // Use the passed callback or fall back to context
    if (onProjectSelect) {
      onProjectSelect(project);
    } else {
      context.setCurrentProject(project);
    }
    
    onClose();
  };

  const handleRefreshData = async () => {
    try {
      await forceReloadImages();
      
      // Also refresh timeline visibility cache
      await dbCache.loadTimelineVisibility();
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
    }
  };

  const handleOpenProjectSettings = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent project selection
    router.push(`/${project.id}/settings`);
    onClose(); // Close drawer
  };



  const handleOpenUserSettings = () => {
    setUserSettingsModalOpen(true);
  };

  const handleCloseUserSettings = () => {
    setUserSettingsModalOpen(false);
  };

  const handleNavigateToArchived = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/archived');
    onClose();
  };

  const handleNavigateToCompleted = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/completed');
    onClose();
  };

  const formatLastActivity = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: isMobile ? '-100vw' : -320 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? '-100vw' : -320 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className={`fixed left-0 top-0 h-full bg-background shadow-xl z-60 flex flex-col border-r border-border ${
              isMobile ? 'w-full' : 'w-80'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-[41px] border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                >
                  <Icon icon={X} size="sm" />
                </button>
                <h2 className="text-lg font-semibold text-foreground">Projects</h2>
              </div>
              {/* Refresh Data Button */}
              <button
                onClick={handleRefreshData}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                title="Refresh image data"
              >
                ↻
              </button>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-8">
                {/* Create New Project Button */}
                <button
                  onClick={onCreateProject}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors duration-200 mb-4"
                >
                  <Icon icon={Plus} size="sm" />
                  <span className="text-sm font-medium">Create New Project</span>
                </button>

                {/* Projects */}
                <div className="space-y-2">
                  {/* Active Projects */}
                  {activeProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        'group relative w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors duration-200 cursor-pointer',
                        activeProject?.id === project.id
                          ? 'bg-blue-50 dark:bg-blue-950/20 text-slate-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                          : 'text-foreground hover:bg-accent'
                      )}
                      onClick={() => handleProjectSelect(project)}
                    >
                      {/* Project Color Indicator */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || '#6B7280' }}
                      />
                      
                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center space-x-2">
                          <span>{getImageCountByProject(project.id)} images</span>
                          <span>•</span>
                          <span>{formatLastActivity(project.lastActivity!)}</span>
                        </div>
                      </div>

                      {/* Settings Icon (visible on hover) */}
                      <button
                        onClick={(e) => handleOpenProjectSettings(project, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 flex-shrink-0"
                        title="Project settings"
                      >
                        <Icon icon={Settings} size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hidden Projects Links */}
            {(archivedProjects.length > 0 || completedProjects.length > 0) && (
                <div className="px-6 pb-4">
                  <div className="text-xs text-muted-foreground px-3 py-2 bg-accent/30 rounded-lg border border-border text-center">
                    hidden projects: {' '}
                    {archivedProjects.length > 0 && (
                      <button 
                        className="underline cursor-pointer"
                        onClick={handleNavigateToArchived}
                      >
                        archived
                      </button>
                    )}
                    {archivedProjects.length > 0 && completedProjects.length > 0 && <span dangerouslySetInnerHTML={{ __html: '&nbsp;•&nbsp;' }} />}
                    {completedProjects.length > 0 && (
                      <button 
                        className="underline cursor-pointer"
                        onClick={handleNavigateToCompleted}
                      >
                        completed
                      </button>
                    )}
                  </div>
                </div>
              )}

            {/* Profile Section */}
            <div className="border-t border-border p-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors duration-200">
                {/* Avatar */}
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon={UserIcon} size="sm" className="text-muted-foreground" />
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {userInfo.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {userInfo.email}
                  </div>
                </div>

                {/* Settings Button */}
                <button 
                  onClick={handleOpenUserSettings}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                  title="User settings"
                >
                  <Icon icon={Settings} size="sm" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={userSettingsModalOpen}
        onClose={handleCloseUserSettings}
        user={userInfo}
        onUpdateUser={(updates) => {
          console.log('🔄 ProjectDrawer: User update from modal:', updates);
          context.updateUser(updates);
        }}
      />
    </>
  );
}; 