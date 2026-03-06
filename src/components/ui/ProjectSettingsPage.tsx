'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon, Edit, Check, AlertCircle, Settings, Building2, Palette, Camera, Layers, Folder, User, MapPin, ChevronLeft, X } from './Icon';
import { Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, BusinessOverview, BrandStory, ImagePrompting, useProjectContext } from '@/contexts/ProjectContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import {
  GeneralTab,
  BusinessOverviewTab,
  BrandStoryTab,
  ImagePromptingTab,
  CharactersTab,
  ScenesTab,
  LoRAsTab,
  EnvironmentVariablesTab,
  ApiKeysTab
} from './project-setting-components';

type TabType = 'general' | 'business' | 'brand' | 'prompting' | 'characters' | 'scenes' | 'loras' | 'env' | 'api-keys';

interface ProjectSettingsPageProps {
  projectId: string;
  activeTab: TabType;
}

export const ProjectSettingsPage: React.FC<ProjectSettingsPageProps> = ({
  projectId,
  activeTab,
}) => {
  const router = useRouter();
  const { projects, updateProject } = useProjectContext();
  const { isEditing, isSaving, error, setError, registerSaveFunction } = useSettingsContext();
  
  // Find the current project
  const project = projects.find(p => p.id === projectId);
  
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  // Project options state for Characters and Scenes tabs
  const [projectOptions, setProjectOptions] = useState<any>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Environment variables visibility state
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  // Redirect if project not found
  useEffect(() => {
    if (!project) {
      router.push('/');
    } else {
      setEditedProject(project);
      loadProjectOptions();
    }
  }, [project, router]);

  // Save function that will be called by the context
  const saveProject = useCallback(async () => {
    if (!project || !editedProject) return;
    
    // Check if project is editable before saving
    if (project.isEditable === false) {
      throw new Error('This project is marked as read-only and cannot be edited');
    }

    // Basic validation
    if (!editedProject.name.trim()) {
      throw new Error('Project name is required');
    }

    if (!editedProject.slug.trim()) {
      throw new Error('Project slug is required');
    }

    const updatedFields = {
      name: editedProject.name.trim(),
      slug: editedProject.slug.trim(),
      description: editedProject.description?.trim(),
      color: editedProject.color,
      status: editedProject.status,
      isEditable: editedProject.isEditable,
      defaultImageOrientation: editedProject.defaultImageOrientation,
      environment_variables: editedProject.environment_variables,
      businessOverview: editedProject.businessOverview,
      brandStory: editedProject.brandStory,
      imagePrompting: editedProject.imagePrompting,
      loras: editedProject.loras,
    };

    // Update project in context
    updateProject(project.id, updatedFields);
  }, [project, editedProject, updateProject]);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setEditedProject(project);
      setError(null);
    }
  }, [project, setError]);

  // Register save function with context
  useEffect(() => {
    registerSaveFunction(saveProject);
  }, [registerSaveFunction, saveProject]);

  const loadProjectOptions = async () => {
    if (!project) return;
    
    setLoadingOptions(true);
    try {
      const [charactersRes, scenesRes] = await Promise.all([
        fetch(`/api/database/characters?projectId=${project.id}`),
        fetch(`/api/database/scenes?projectId=${project.id}`)
      ]);

      const charactersData = await charactersRes.json();
      const scenesData = await scenesRes.json();

      setProjectOptions({
        characters: charactersData.success ? charactersData.data : [],
        scenes: scenesData.success ? scenesData.data : []
      });
    } catch (error) {
      console.error('Failed to load project options:', error);
      setProjectOptions({ characters: [], scenes: [] });
    } finally {
      setLoadingOptions(false);
    }
  };

  // Field change handlers (same as modal)
  const handleFieldChange = (field: keyof Project, value: unknown) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGeneralChange = (field: string, value: unknown) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBusinessOverviewChange = (field: string, value: unknown) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      const businessOverview = { ...prev.businessOverview };
      
      // Handle nested object properties (e.g., contactInfo.phone)
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        businessOverview[parentKey as keyof BusinessOverview] = {
          ...(businessOverview[parentKey as keyof BusinessOverview] as any),
          [childKey]: value,
        };
      } else {
        businessOverview[field as keyof BusinessOverview] = value as any;
      }
      
      return {
        ...prev,
        businessOverview,
      };
    });
  };

  const handleBrandStoryChange = (field: string, value: unknown) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      const brandStory = { ...prev.brandStory };
      
      // Handle nested object properties (e.g., visualIdentity.imageryStyle)
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        brandStory[parentKey as keyof BrandStory] = {
          ...(brandStory[parentKey as keyof BrandStory] as any),
          [childKey]: value,
        };
      } else {
        brandStory[field as keyof BrandStory] = value as any;
      }
      
      return {
        ...prev,
        brandStory,
      };
    });
  };

  const handleImagePromptingChange = (field: string, value: unknown) => {
    if (!editedProject) return;
    
    setEditedProject(prev => prev ? {
      ...prev,
      imagePrompting: {
        ...prev.imagePrompting,
        [field]: value
      }
    } : null);
  };

  const handleLoRAChange = (field: 'lora1' | 'lora2', value: any) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        loras: {
          ...prev.loras,
          [field]: value
        }
      };
    });
  };

  const handleArrayFieldChange = (
    section: 'businessOverview' | 'brandStory' | 'imagePrompting',
    field: string,
    index: number,
    value: string
  ) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      const sectionData = { ...prev[section] };
      
      // Handle nested properties
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        const parentData = { ...(sectionData as any)[parentKey] };
        const items = [...(parentData[childKey] || [])];
        items[index] = value;
        parentData[childKey] = items;
        (sectionData as any)[parentKey] = parentData;
      } else {
        const items = [...((sectionData as any)[field] || [])];
        items[index] = value;
        (sectionData as any)[field] = items;
      }
      
      return {
        ...prev,
        [section]: sectionData,
      };
    });
  };

  const handleAddArrayItem = (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      const sectionData = { ...prev[section] };
      
      // Handle nested properties
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        const parentData = { ...(sectionData as any)[parentKey] };
        const items = [...(parentData[childKey] || [])];
        items.push('');
        parentData[childKey] = items;
        (sectionData as any)[parentKey] = parentData;
      } else {
        const items = [...((sectionData as any)[field] || [])];
        items.push('');
        (sectionData as any)[field] = items;
      }
      
      return {
        ...prev,
        [section]: sectionData,
      };
    });
  };

  const handleRemoveArrayItem = (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      const sectionData = { ...prev[section] };
      
      // Handle nested properties
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        const parentData = { ...(sectionData as any)[parentKey] };
        const items = [...(parentData[childKey] || [])];
        items.splice(index, 1);
        parentData[childKey] = items;
        (sectionData as any)[parentKey] = parentData;
      } else {
        const items = [...((sectionData as any)[field] || [])];
        items.splice(index, 1);
        (sectionData as any)[field] = items;
      }
      
      return {
        ...prev,
        [section]: sectionData,
      };
    });
  };

  // Environment variable handlers
  const handleEnvVarChange = (key: string, value: string) => {
    if (!editedProject) return;
    
    setEditedProject(prev => prev ? ({
      ...prev,
      environment_variables: {
        ...prev.environment_variables,
        [key]: value
      }
    }) : null);
  };

  const handleAddEnvVar = () => {
    const newKey = `NEW_VAR_${Date.now()}`;
    handleEnvVarChange(newKey, '');
  };

  const handleRemoveEnvVar = (key: string) => {
    if (!editedProject) return;
    
    setEditedProject(prev => {
      if (!prev) return null;
      
      const newEnvVars = { ...prev.environment_variables };
      delete newEnvVars[key];
      return {
        ...prev,
        environment_variables: newEnvVars
      };
    });
  };

  const toggleValueVisibility = (key: string) => {
    setShowValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Render helper functions (copied from modal)
  const renderTextField = (
    label: string,
    section: 'businessOverview' | 'brandStory' | 'imagePrompting',
    field: string,
    placeholder: string = '',
    isTextarea: boolean = false
  ) => {
    if (!editedProject) return null;
    
    const editedSectionData = editedProject[section] || {};
    const projectSectionData = project[section] || {};
    
    // Handle nested properties
    let value: string = '';
    let readOnlyValue: string = '';
    
    if (field.includes('.')) {
      const [parentKey, childKey] = field.split('.');
      const editedParent = (editedSectionData as any)[parentKey] || {};
      const projectParent = (projectSectionData as any)[parentKey] || {};
      value = editedParent[childKey] || '';
      readOnlyValue = projectParent[childKey] || '';
    } else {
      const editedValue = (editedSectionData as any)[field];
      const projectValue = (projectSectionData as any)[field];
      
      // Ensure we only use string values, not objects
      value = typeof editedValue === 'string' ? editedValue : '';
      readOnlyValue = typeof projectValue === 'string' ? projectValue : '';
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        {isEditing ? (
          isTextarea ? (
            <textarea
              value={value}
              onChange={(e) => {
                if (section === 'businessOverview') {
                  handleBusinessOverviewChange(field, e.target.value);
                } else if (section === 'brandStory') {
                  handleBrandStoryChange(field, e.target.value);
                } else {
                  handleImagePromptingChange(field, e.target.value);
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
              placeholder={placeholder}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => {
                if (section === 'businessOverview') {
                  handleBusinessOverviewChange(field, e.target.value);
                } else if (section === 'brandStory') {
                  handleBrandStoryChange(field, e.target.value);
                } else {
                  handleImagePromptingChange(field, e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              placeholder={placeholder}
            />
          )
        ) : (
          <div className={cn(
            "p-3 bg-accent rounded-md text-foreground text-sm",
            isTextarea && "min-h-[100px]"
          )}>
            {readOnlyValue || `No ${label.toLowerCase()} provided`}
          </div>
        )}
      </div>
    );
  };

  const renderArrayField = (
    label: string,
    section: 'businessOverview' | 'brandStory' | 'imagePrompting',
    field: string,
    placeholder: string = 'Add item...'
  ) => {
    if (!editedProject) return null;
    
    const editedSectionData = editedProject[section] || {};
    const projectSectionData = project[section] || {};
    
    // Handle nested properties
    let items: string[] = [];
    let readOnlyItems: string[] = [];
    
    if (field.includes('.')) {
      const [parentKey, childKey] = field.split('.');
      const editedParent = (editedSectionData as any)[parentKey] || {};
      const projectParent = (projectSectionData as any)[parentKey] || {};
      items = editedParent[childKey] || [];
      readOnlyItems = projectParent[childKey] || [];
    } else {
      const editedValue = (editedSectionData as any)[field];
      const projectValue = (projectSectionData as any)[field];
      
      // Ensure we only use array values
      items = Array.isArray(editedValue) ? editedValue : [];
      readOnlyItems = Array.isArray(projectValue) ? projectValue : [];
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        {isEditing ? (
          <div className="space-y-2">
            {items.map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleArrayFieldChange(section, field, index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                  placeholder={placeholder}
                />
                <button
                  onClick={() => handleRemoveArrayItem(section, field, index)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Icon icon={X} size="xs" />
                </button>
              </div>
            ))}
            <button
              onClick={() => handleAddArrayItem(section, field)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              + Add {label.slice(0, -1).toLowerCase()}
            </button>
          </div>
        ) : (
          <div className="p-3 bg-accent rounded-md space-y-2">
            {readOnlyItems.length > 0 ? (
              readOnlyItems.map((item: string, index: number) => (
                <div key={index} className="text-foreground text-sm flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No {label.toLowerCase()} defined</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: <Icon icon={Settings} size="xs" /> },
    { id: 'business' as TabType, label: 'Business', icon: <Icon icon={Building2} size="xs" /> },
    { id: 'brand' as TabType, label: 'Brand', icon: <Icon icon={Palette} size="xs" /> },
    { id: 'prompting' as TabType, label: 'Prompting', icon: <Icon icon={Camera} size="xs" /> },
    { id: 'characters' as TabType, label: 'Characters', icon: <Icon icon={User} size="xs" /> },
    { id: 'scenes' as TabType, label: 'Scenes', icon: <Icon icon={MapPin} size="xs" /> },
    { id: 'loras' as TabType, label: 'LoRAs', icon: <Icon icon={Layers} size="xs" /> },
    { id: 'env' as TabType, label: 'Environment', icon: <Icon icon={Folder} size="xs" /> },
    { id: 'api-keys' as TabType, label: 'API Keys', icon: <Icon icon={Key} size="xs" /> },
  ];

  if (!project || !editedProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* Content with beautiful, flexible spacing that responds to overlay mode */}
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-8 md:py-12">
        <div className="w-full max-w-none relative">
          {/* Content container with overlay-aware styling */}
          <div className="relative z-10">
            {/* Tab Content */}
            {activeTab === 'general' && (
              <GeneralTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleFieldChange={handleFieldChange}
                handleGeneralChange={handleGeneralChange}
                renderTextField={renderTextField}
                renderArrayField={renderArrayField}
              />
            )}

            {activeTab === 'business' && (
              <BusinessOverviewTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleBusinessOverviewChange={handleBusinessOverviewChange}
                handleArrayFieldChange={handleArrayFieldChange}
                handleAddArrayItem={handleAddArrayItem}
                handleRemoveArrayItem={handleRemoveArrayItem}
                renderTextField={renderTextField}
                renderArrayField={renderArrayField}
              />
            )}

            {activeTab === 'brand' && (
              <BrandStoryTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleBrandStoryChange={handleBrandStoryChange}
                handleArrayFieldChange={handleArrayFieldChange}
                handleAddArrayItem={handleAddArrayItem}
                handleRemoveArrayItem={handleRemoveArrayItem}
                renderTextField={renderTextField}
                renderArrayField={renderArrayField}
              />
            )}

            {activeTab === 'prompting' && (
              <ImagePromptingTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleImagePromptingChange={handleImagePromptingChange}
                handleArrayFieldChange={handleArrayFieldChange}
                handleAddArrayItem={handleAddArrayItem}
                handleRemoveArrayItem={handleRemoveArrayItem}
                renderTextField={renderTextField}
                renderArrayField={renderArrayField}
              />
            )}

            {activeTab === 'characters' && (
              <CharactersTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                projectOptions={projectOptions || { characters: [] }}
                setProjectOptions={setProjectOptions}
              />
            )}

            {activeTab === 'scenes' && (
              <ScenesTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                projectOptions={projectOptions || { scenes: [] }}
                setProjectOptions={setProjectOptions}
              />
            )}

            {activeTab === 'loras' && (
              <LoRAsTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleLoRAChange={handleLoRAChange}
                renderTextField={renderTextField}
                renderArrayField={renderArrayField}
              />
            )}

            {activeTab === 'env' && (
              <EnvironmentVariablesTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleEnvVarChange={handleEnvVarChange}
                handleAddEnvVar={handleAddEnvVar}
                handleRemoveEnvVar={handleRemoveEnvVar}
                showValues={showValues}
                toggleValueVisibility={toggleValueVisibility}
              />
            )}

            {activeTab === 'api-keys' && (
              <ApiKeysTab
                isEditing={isEditing}
                editedProject={editedProject}
                project={project}
                handleEnvVarChange={handleEnvVarChange}
                handleAddEnvVar={handleAddEnvVar}
                handleRemoveEnvVar={handleRemoveEnvVar}
                showValues={showValues}
                toggleValueVisibility={toggleValueVisibility}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 