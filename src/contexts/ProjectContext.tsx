'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { dbCache } from '@/lib/indexedDB';

export interface BusinessOverview {
  companyDescription?: string;
  missionStatement?: string;
  visionStatement?: string;
  coreValues?: string[];
  targetAudience?: string;
  offerings?: string[]; // Products, services, or content types
  keyDifferentiators?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    social?: Record<string, string>; // platform -> url
  };
  keyMetrics?: Record<string, string>; // flexible key-value pairs
  industryContext?: string;
  geographicScope?: string;
}

export interface BrandStory {
  brandNarrative?: string;
  brandPersonality?: string;
  voiceAndTone?: string;
  messagingPillars?: string[];
  visualIdentity?: {
    primaryColors?: string[];
    secondaryColors?: string[];
    typography?: string[];
    imageryStyle?: string;
    logoGuidelines?: string;
  };
  contentThemes?: string[];
  brandGuidelines?: string;
  storytellingApproach?: string;
  audienceConnection?: string;
}

export interface LoRA {
  id: string;
  name: string;
  path: string;
  scale: number;
  enabled: boolean;
  triggerWords?: string[];
}

export interface LoRAConfig {
  lora1?: LoRA;
  lora2?: LoRA;
}

export interface LoRALibraryItem {
  id: string;
  name: string;
  description?: string;
  triggerWords?: string[];
  link?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Character {
  id: string;
  name: string;
  projectId: string;
  
  // Demographics
  age: number;
  gender: string;
  race: string;
  height: string;
  hairColor: string;
  eyeColor: string;
  
  // Physical Appearance
  physicalAppearance: string; // Detailed description
  
  // Outfits (array of outfit objects with name only)
  outfits: Array<{
    name: string;
  }>;
  defaultOutfit?: number; // Index of default outfit
  
  // Professional/Character Details
  background: string;
  profession?: string;
  caseDetails?: string;
  
  // Scene Information
  sceneOfCrime?: string; // Detailed scene description
  
  // Metadata
  tags?: string[];
  notes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CharacterOutfit {
  id: string;
  characterId: string;
  name: string;
  description: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  name: string;
  projectId: string;
  
  // Scene Details
  setting: string;           // Location/environment description
  timeOfDay: string;         // Morning, afternoon, evening, night
  lighting: string;          // Lighting conditions
  mood: string;              // Emotional tone
  cameraAngle: string;       // Shot perspective
  
  // Scene Context
  description: string;       // Full scene description
  props?: string[];          // Objects/props in scene
  atmosphere?: string;       // Weather, ambiance
  
  // Character Relationships (One-to-Many)
  characterIds: string[];    // Characters that can appear in this scene
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImagePrompting {
  // Master Prompt (Foundation)
  masterPrompt?: string;
  
  // Core Creative Direction
  overallStyle?: string;
  aestheticDirection?: string;
  mood?: string;
  
  // Photography & Cinematography
  cameraAngle?: string;
  shotType?: string;
  lensType?: string;
  focalLength?: string;
  cameraMovement?: string;
  
  // Lighting Design
  lightingStyle?: string;
  lightDirection?: string;
  lightQuality?: string;
  shadowStyle?: string;
  timeOfDay?: string;
  
  // Color & Visual Treatment
  colorPalette?: string;
  colorTemperature?: string;
  saturation?: string;
  contrast?: string;
  
  // Subject & Composition
  subjectMatter?: string;
  composition?: string;
  framing?: string;
  perspective?: string;
  
  // Texture & Materials
  surfaceTextures?: string[];
  materialProperties?: string[];
  
  // Visual Effects & Post-Processing
  visualEffects?: string[];
  atmosphericEffects?: string[];
  postProcessing?: string[];
  
  // Video-Specific Elements
  motionBlur?: string;
  depthOfField?: string;
  frameRate?: string;
  videoTransitions?: string[];
  
  // Style References
  artisticReferences?: string[];
  cinematicReferences?: string[];
  
  // Prompting Styles
  promptingStyles?: string[];
  styleIntensity?: 'low' | 'medium' | 'high';
  
  // Technical Parameters
  aspectRatio?: string;
  resolution?: string;
  compressionLevel?: string;
}

export interface ProjectOptions {
  characters?: any[];
  scenes?: any[];
  totalCombinations?: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  color?: string;
  status: 'active' | 'archived' | 'completed';
  imageCount?: number;
  lastActivity?: Date;
  description?: string;
  isEditable?: boolean; // Controls whether the project can be edited
  environment_variables?: Record<string, string>; // Project-specific environment variables
  businessOverview?: BusinessOverview;
  brandStory?: BrandStory;
  imagePrompting?: ImagePrompting;
  loras?: LoRAConfig;
  defaultImageOrientation?: string; // Aspect ratio for Fal API calls (e.g., '9:16', '16:9', '11:17', etc.)
}

/**
 * Helper function to get the appropriate image_size for Fal API based on project settings
 * @deprecated Use toApiAspectRatio from @/config/aspectRatios instead
 */
export const getProjectImageSize = (project: Project): string => {
  const orientation = project.defaultImageOrientation || '9:16';
  
  // Handle legacy values
  switch (orientation) {
    case 'landscape':
      return 'landscape_16_9';
    case 'square':
      return 'square';
    case 'portrait':
      return 'portrait_16_9';
    default:
      // For new aspect ratio format, convert to Fal format
      if (orientation.includes(':')) {
        const [w, h] = orientation.split(':').map(Number);
        if (w > h) return 'landscape_16_9';
        if (w < h) return 'portrait_16_9';
        return 'square';
      }
      return 'portrait_16_9';
  }
};

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  user: User;
  // Centralized project data
  characters: Character[];
  scenes: Scene[];
  loraLibrary: LoRALibraryItem[];
  isLoadingProjectData: boolean;
  projectDataError: string | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, 'lastActivity'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  updateUser: (updates: Partial<User>) => void;
  // Character and scene helpers
  getCharacterById: (id: string) => Character | undefined;
  getSceneById: (id: string) => Scene | undefined;
  getCharactersByProject: (projectId: string) => Character[];
  getScenesByProject: (projectId: string) => Scene[];
  // LoRA helpers
  getLoRAById: (id: string) => LoRALibraryItem | undefined;
  getProjectLoRATriggerWords: (project: Project) => string[];
  refreshProjectData: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// No hardcoded projects - all data loaded from database
const initialProjects: Project[] = [];

const initialUser: User = {
  name: 'Carl Sagan',
  email: 'learn@postscarcity.ai',
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const params = useParams();
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null); // No default project
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [user, setUser] = useState<User>(initialUser);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProjectsLoaded, setIsProjectsLoaded] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loraLibrary, setLoraLibrary] = useState<LoRALibraryItem[]>([]);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [projectDataError, setProjectDataError] = useState<string | null>(null);

  // Load projects from SQLite database on initialization
  useEffect(() => {
    const loadProjectsFromDatabase = async () => {
      try {

        
        // Load projects from SQLite via API
        const response = await fetch('/api/database/projects');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          // Convert database projects to frontend format
          const dbProjects: Project[] = result.data.map((dbProject: unknown) => {
            const typedProject = dbProject as Record<string, unknown>;
            const settings = (typedProject.settings as Record<string, unknown>) || {};
            
            return {
              id: String(typedProject.id),
              name: String(typedProject.name),
              slug: String(settings.slug || typedProject.id),
              color: String(settings.color || '#6B7280'),
              status: String(settings.status || 'active') as 'active' | 'archived' | 'completed',
              imageCount: Number(settings.imageCount || 0),
              lastActivity: settings.lastActivity ? new Date(String(settings.lastActivity)) : new Date(String(typedProject.updated_at)),
              description: typedProject.description ? String(typedProject.description) : undefined,
              businessOverview: settings.businessOverview as BusinessOverview | undefined,
              brandStory: settings.brandStory as BrandStory | undefined,
              imagePrompting: settings.imagePrompting as ImagePrompting | undefined,
              loras: settings.loras as LoRAConfig | undefined,
              defaultImageOrientation: settings.defaultImageOrientation as 'portrait' | 'landscape' | 'square' | undefined
            };
          });
          
          setProjects(dbProjects);
          
          // Also save to IndexedDB for offline capability
          await dbCache.saveProjects(dbProjects);
        } else {
          console.log('📂 No projects in database, starting with empty project list');
        }
        
        setIsProjectsLoaded(true);
      } catch (error) {
        console.warn('❌ Failed to load projects from database, falling back to IndexedDB:', error);
        
        // Fallback to IndexedDB if database fails
        try {
          const storedProjects = await dbCache.loadProjects();
          if (storedProjects.length > 0) {
            setProjects(storedProjects);
            console.log('📂 Loaded projects from IndexedDB fallback:', storedProjects.map(p => ({ id: p.id, name: p.name })));
          }
        } catch (fallbackError) {
          console.warn('Failed to load from IndexedDB fallback:', fallbackError);
        }
        
        setIsProjectsLoaded(true);
      }
    };

    loadProjectsFromDatabase();
  }, []);

  // Load user settings from SQLite database
  useEffect(() => {
    const loadUserSettingsFromDatabase = async () => {
      try {

        
        // Load user settings from SQLite via API
        const response = await fetch('/api/database/settings?keys=userName,userEmail,theme,autoSync');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Update user with database settings
          const updatedUser = { ...initialUser };
          
          if (result.data.userName) {
            updatedUser.name = result.data.userName;
          }
          if (result.data.userEmail) {
            updatedUser.email = result.data.userEmail;
          }
          
          setUser(updatedUser);
        } else {
          console.log('📂 No user settings in database, using initial user');
          // Save initial user to database for future use
          await fetch('/api/database/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              settings: {
                userName: initialUser.name,
                userEmail: initialUser.email
              }
            })
          });
          console.log('💾 Saved initial user settings to database');
        }
        
        setIsUserLoaded(true);
      } catch (error) {
        console.warn('❌ Failed to load user settings from database:', error);
        setIsUserLoaded(true);
      }
    };

    loadUserSettingsFromDatabase();
  }, []);

  // Load project data when current project changes
  useEffect(() => {
    if (currentProject) {
      refreshProjectData();
    }
  }, [currentProject?.id]);

  // Helper function to navigate to project route
  const navigateToProject = (projectId: string) => {
    router.replace(`/${projectId}`, { scroll: false });
  };

  // Load current project from URL params, then fallback to IndexedDB
  useEffect(() => {
    // Wait for both projects and user to be loaded before trying to set current project
    if (!isProjectsLoaded || !isUserLoaded) {
      return;
    }
    
    // Only run once
    if (isInitialized) {
      return;
    }

    const loadCurrentProject = async () => {
      try {
        // Skip project loading for special pages like /archived, /completed, etc.
        const currentPath = window.location.pathname;
        if (currentPath === '/archived' || currentPath === '/completed' || currentPath === '/hidden' || currentPath === '/styles') {
          console.log('📍 Skipping project loading for special page:', currentPath);
          setIsInitialized(true);
          return;
        }

        // First priority: URL path parameter
        const projectIdFromUrl = params.projectId as string;
        if (projectIdFromUrl) {
          const project = projects.find(p => p.id === projectIdFromUrl);
          if (project) {
            setCurrentProjectState(project);
            // Save to IndexedDB for future sessions
            await dbCache.saveCurrentProject(project.id);
            // Save to server state for API routes
            fetch('/api/current-project', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: project.id }),
            }).catch(err => console.warn('Failed to save current project to server:', err));
            setIsInitialized(true);
            return;
          }
        }

        // Second priority: IndexedDB saved preference (only if we're on root route)
        if (!projectIdFromUrl) {
          const savedProjectId = await dbCache.loadCurrentProject();
          if (savedProjectId) {
            const project = projects.find(p => p.id === savedProjectId);
            if (project) {
              setCurrentProjectState(project);
              // Save to server state for API routes
              fetch('/api/current-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id }),
              }).catch(err => console.warn('Failed to save current project to server:', err));
              // Navigate to the project route
              navigateToProject(project.id);
              setIsInitialized(true);
              return;
            }
          }

          // Default: First project (if any exists)
          if (projects.length > 0) {
            setCurrentProjectState(projects[0]);
            // Save to server state for API routes
            fetch('/api/current-project', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: projects[0].id }),
            }).catch(err => console.warn('Failed to save current project to server:', err));
            navigateToProject(projects[0].id);
          }
        }
      } catch (error) {
        console.warn('Failed to load current project:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadCurrentProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectsLoaded, isUserLoaded, projects, params.projectId, isInitialized]);

  // Save current project to IndexedDB when it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized && currentProject) {
      dbCache.saveCurrentProject(currentProject.id).catch(err => 
        console.warn('Failed to save current project:', err)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, isInitialized]); // currentProject is accessed for its id only

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    
    // Save to server state for API routes to access
    fetch('/api/current-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    }).catch(err => console.warn('Failed to save current project to server:', err));
    
    // Navigate to project route
    navigateToProject(project.id);
    
    // Update last activity
    setProjects(prev => prev.map(p => 
      p.id === project.id 
        ? { ...p, lastActivity: new Date() }
        : p
    ));
  };

  const addProject = async (projectData: Omit<Project, 'lastActivity'>) => {
    // Use slug as the project ID if provided, ensuring consistency between slug and ID
    const projectId = projectData.slug || projectData.id;
    const projectSlug = projectData.slug || projectData.id;
    
    // Check if project with this ID already exists
    const existingProject = projects.find(p => p.id === projectId);
    if (existingProject) {
      throw new Error(`Project with ID "${projectId}" already exists`);
    }

    const newProject: Project = {
      ...projectData,
      id: projectId, // Use slug as ID for route consistency
      slug: projectSlug,
      lastActivity: new Date(),
      color: projectData.color || '#6B7280', // Default gray color
      status: projectData.status || 'active',
      imageCount: 0,
      defaultImageOrientation: projectData.defaultImageOrientation
    };
    
    try {
      // Save to SQLite database (primary storage)
      const response = await fetch('/api/database/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            id: newProject.id,
            name: newProject.name,
            description: newProject.description || '',
            settings: {
              slug: newProject.slug,
              color: newProject.color,
              status: newProject.status,
              businessOverview: newProject.businessOverview,
              brandStory: newProject.brandStory,
              imagePrompting: newProject.imagePrompting,
              loras: newProject.loras,
              lastActivity: newProject.lastActivity.toISOString(),
              imageCount: newProject.imageCount,
              defaultImageOrientation: newProject.defaultImageOrientation
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save project to database');
      }

      console.log('✅ Project saved to database successfully:', newProject.name);
    } catch (error) {
      console.error('❌ Failed to save project to database:', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setProjects(prev => {
      const updated = [...prev, newProject];
      // Also save to IndexedDB for offline capability
      dbCache.saveProjects(updated).catch(err => 
        console.warn('Failed to save projects to IndexedDB:', err)
      );
      return updated;
    });
    
    // Automatically switch to the new project
    setCurrentProject(newProject);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    // Check if slug is being updated and if we need to navigate to new route
    const isSlugUpdate = updates.slug && updates.slug !== currentProject?.slug;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    
    setProjects(prev => {
      const updated = prev.map(p => 
        p.id === id 
          ? { ...p, ...updates, lastActivity: new Date() }
          : p
      );
      
      // Save to SQLite database (primary storage)
      const saveProjectToDatabase = async () => {
        try {
          const projectToSave = updated.find(p => p.id === id);
          if (projectToSave) {
            await fetch(`/api/database/projects?id=${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectToSave)
            });
          }
        } catch (error) {
          console.error('❌ Failed to save project to database:', error);
        }
      };
      
      saveProjectToDatabase();
      
      // Also save to IndexedDB for offline capability
      dbCache.saveProjects(updated).catch(err => 
        console.warn('Failed to save projects to IndexedDB:', err)
      );
      
      return updated;
    });
    
    // Update current project if it's the one being updated
    if (currentProject && currentProject.id === id) {
      const updatedCurrentProject = { ...currentProject, ...updates };
      setCurrentProjectState(updatedCurrentProject);
      
      // Handle slug change - redirect to new route
      if (isSlugUpdate && typeof window !== 'undefined') {
        const newSlug = updates.slug!;
        
        // Determine what part of the current route to preserve
        const pathParts = currentPath.split('/');
        const projectIdIndex = pathParts.findIndex(part => part === id);
        
        if (projectIdIndex !== -1) {
          // Replace the project ID with the new slug in the URL
          pathParts[projectIdIndex] = newSlug;
          const newPath = pathParts.join('/');
          
          router.replace(newPath);
        }
      }
    }
  };

  const deleteProject = (id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      // Save to IndexedDB
      dbCache.saveProjects(updated).catch(err => 
        console.warn('Failed to save projects to storage:', err)
      );
      return updated;
    });
    
    // If deleting current project, switch to first available project or null
    if (currentProject && currentProject.id === id) {
      const remainingProjects = projects.filter(p => p.id !== id);
      if (remainingProjects.length > 0) {
        setCurrentProject(remainingProjects[0]);
      } else {
        setCurrentProjectState(null);
      }
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      
      // Save to SQLite database
      const saveUserToDatabase = async () => {
        try {
          await fetch('/api/database/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              settings: {
                userName: updated.name,
                userEmail: updated.email
              }
            })
          });
        } catch (error) {
          console.error('❌ Failed to save user settings to database:', error);
        }
      };
      
      saveUserToDatabase();
      
      return updated;
    });
  };

  const getCharacterById = (id: string): Character | undefined => {
    return characters.find(c => c.id === id);
  };

  const getSceneById = (id: string): Scene | undefined => {
    return scenes.find(s => s.id === id);
  };

  const getCharactersByProject = (projectId: string): Character[] => {
    return characters.filter(c => c.projectId === projectId);
  };

  const getScenesByProject = (projectId: string): Scene[] => {
    return scenes.filter(s => s.projectId === projectId);
  };

  const getLoRAById = (id: string): LoRALibraryItem | undefined => {
    return loraLibrary.find(l => l.id === id);
  };

  const getProjectLoRATriggerWords = (project: Project): string[] => {
    const triggerWords: string[] = [];
    
    if (project.loras) {
      // Get trigger words from LoRA1
      if (project.loras.lora1?.enabled && project.loras.lora1.id) {
        const lora1 = getLoRAById(project.loras.lora1.id);
        if (lora1?.triggerWords) {
          triggerWords.push(...lora1.triggerWords);
        }
      }
      
      // Get trigger words from LoRA2
      if (project.loras.lora2?.enabled && project.loras.lora2.id) {
        const lora2 = getLoRAById(project.loras.lora2.id);
        if (lora2?.triggerWords) {
          triggerWords.push(...lora2.triggerWords);
        }
      }
    }
    
    return triggerWords;
  };

  const refreshProjectData = async () => {
    if (!currentProject) return;
    
    try {
      setIsLoadingProjectData(true);
      setProjectDataError(null);

      // Load all data in parallel for better performance
      const [characterResponse, sceneResponse, loraResponse] = await Promise.all([
        fetch(`/api/database/characters?projectId=${currentProject.id}`),
        fetch(`/api/database/scenes?projectId=${currentProject.id}`),
        fetch('/api/database/loras')
      ]);

      // Load characters for current project
      const characterResult = await characterResponse.json();
      if (characterResult.success && characterResult.data) {
        setCharacters(characterResult.data.map((c: unknown) => c as Character));
      }

      // Load scenes for current project
      const sceneResult = await sceneResponse.json();
      if (sceneResult.success && sceneResult.data) {
        setScenes(sceneResult.data.map((s: unknown) => s as Scene));
      }

      // Load LoRA library (global data)
      const loraResult = await loraResponse.json();
      if (loraResult.success && loraResult.data) {
        setLoraLibrary(loraResult.data.map((l: unknown) => l as LoRALibraryItem));
      }

    } catch (error) {
      console.error('Failed to load project data:', error);
      setProjectDataError(error instanceof Error ? error.message : 'Failed to load project data');
    } finally {
      setIsLoadingProjectData(false);
    }
  };

  const value: ProjectContextType = {
    currentProject,
    projects,
    user,
    characters,
    scenes,
    loraLibrary,
    isLoadingProjectData,
    projectDataError,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    updateUser,
    getCharacterById,
    getSceneById,
    getCharactersByProject,
    getScenesByProject,
    getLoRAById,
    getProjectLoRATriggerWords,
    refreshProjectData,
  };

  // Don't render children until initial data is loaded to prevent weird initialization order
  const isDataLoaded = isProjectsLoaded && isUserLoaded;
  
  return (
    <ProjectContext.Provider value={value}>
      {isDataLoaded ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <div className="text-sm text-muted-foreground">Loading projects...</div>
          </div>
        </div>
      )}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}; 