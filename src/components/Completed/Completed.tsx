'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Icon, Settings, RotateCcw } from '@/components/ui/Icon';
import { useProjectContext } from '@/contexts/ProjectContext';
import { ProjectSettingsModal } from '@/components/ui/ProjectSettingsModal';
import { StatusPill } from '@/components/ui/StatusPill';

interface Project {
  id: string;
  name: string;
  slug: string;
  color?: string;
  status: 'active' | 'archived' | 'completed';
  imageCount?: number;
  lastActivity?: Date;
  description?: string;
}

export const Completed: React.FC = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedProjects, setSelectedProjects] = React.useState<Set<string>>(new Set());
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [selectedProjectForSettings, setSelectedProjectForSettings] = React.useState<Project | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  
  // Get ProjectContext to update global state
  const projectContext = useProjectContext();
  
  // Fetch projects directly from API
  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/database/projects');
        const result = await response.json();
        
        if (result.success && result.data) {
          setProjects(result.data.map((dbProject: any) => ({
            id: String(dbProject.id),
            name: String(dbProject.name),
            slug: String(dbProject.settings?.slug || dbProject.id),
            color: String(dbProject.settings?.color || '#6B7280'),
            status: String(dbProject.settings?.status || 'active') as 'active' | 'archived' | 'completed',
            imageCount: Number(dbProject.settings?.imageCount || 0),
            lastActivity: dbProject.settings?.lastActivity ? new Date(String(dbProject.settings.lastActivity)) : new Date(String(dbProject.updated_at)),
            description: dbProject.description ? String(dbProject.description) : undefined,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setIsClient(true);
    fetchProjects();
  }, []);

  // Filter completed projects
  const completedProjects = projects.filter(project => project.status === 'completed');
  
  const formatLastActivity = (date: Date) => {
    return date.toLocaleDateString();
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(projectId)) {
        newSelected.delete(projectId);
      } else {
        newSelected.add(projectId);
      }
      return newSelected;
    });
  };

  const handleRestoreProjects = async () => {
    if (selectedProjects.size === 0) return;
    
    setIsRestoring(true);
    try {
      // Restore selected projects to active status
      const restorePromises = Array.from(selectedProjects).map(async (projectId) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          const response = await fetch(`/api/database/projects?id=${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...project,
              status: 'active'
            })
          });
          return response.json();
        }
      });

      await Promise.all(restorePromises);
      
      // Update local state
      setProjects(prev => prev.map(project => 
        selectedProjects.has(project.id) 
          ? { ...project, status: 'active' as const }
          : project
      ));
      
      // Update global ProjectContext state so ProjectDrawer updates immediately
      Array.from(selectedProjects).forEach(projectId => {
        projectContext.updateProject(projectId, { status: 'active' });
      });
      
      // Clear selection
      setSelectedProjects(new Set());
      
      console.log(`✅ Restored ${selectedProjects.size} projects to active status`);
    } catch (error) {
      console.error('❌ Failed to restore projects:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenProjectSettings = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent project selection
    setSelectedProjectForSettings(project);
    setSettingsModalOpen(true);
  };

  const handleCloseProjectSettings = () => {
    setSettingsModalOpen(false);
    setSelectedProjectForSettings(null);
  };

  // Show loading during hydration or data fetching
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading completed projects...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Completed Projects</h1>
        <p className="text-muted-foreground">
          {completedProjects.length} completed {completedProjects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>

      <div className="min-h-[200px]">
        {completedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {completedProjects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "group relative bg-background border rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer",
                  selectedProjects.has(project.id) 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                    : "border-border"
                )}
                onClick={() => handleProjectSelect(project.id)}
              >
                {/* Selection Indicator */}
                <div className="absolute top-3 right-3">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    selectedProjects.has(project.id)
                      ? "bg-blue-500 border-blue-500"
                      : "border-border"
                  )}>
                    {selectedProjects.has(project.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Project Color Indicator */}
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6B7280' }}
                  />
                  <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                </div>
                
                {/* Project Description */}
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}
                
                {/* Project Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{project.imageCount || 0} images</span>
                  <span>{formatLastActivity(project.lastActivity!)}</span>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <StatusPill status="completed" />
                  
                  {/* Settings Button */}
                  <button
                    onClick={(e) => handleOpenProjectSettings(project, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Project settings"
                  >
                    <Icon icon={Settings} size="sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No completed projects</p>
              <p className="text-sm text-muted-foreground mt-1">
                Projects you complete will appear here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Restore Button */}
      {selectedProjects.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleRestoreProjects}
            disabled={isRestoring}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full shadow-lg transition-all duration-200 font-medium"
          >
            {isRestoring ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Icon icon={RotateCcw} size="sm" />
                Restore {selectedProjects.size} {selectedProjects.size === 1 ? 'Project' : 'Projects'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Project Settings Modal */}
      {selectedProjectForSettings && (
        <ProjectSettingsModal
          isOpen={settingsModalOpen}
          onClose={handleCloseProjectSettings}
          project={selectedProjectForSettings}
        />
      )}
    </section>
  );
}; 