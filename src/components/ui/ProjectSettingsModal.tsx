'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, X, Edit, Check, AlertCircle, Settings, Building2, Palette, Camera, Layers, Folder, User, MapPin } from './Icon';
import { cn } from '@/lib/utils';
import { Project, BusinessOverview, BrandStory, ImagePrompting, useProjectContext } from '@/contexts/ProjectContext';

import {
  GeneralTab,
  BusinessTab,
  BusinessOverviewTab,
  BrandStoryTab,
  ImagePromptingTab,
  PromptingTab,
  CharactersTab,
  ScenesTab,
  LoRAsTab,
  EnvironmentTab,
  EnvironmentVariablesTab
} from './project-setting-components';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

type TabType = 'general' | 'business' | 'brand' | 'prompting' | 'characters' | 'scenes' | 'loras' | 'env';
type TabStatus = 'pristine' | 'modified' | 'saving' | 'saved' | 'error';

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>(project);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProject } = useProjectContext();

  // Tab-specific status tracking
  const [tabStatus, setTabStatus] = useState<Record<TabType, TabStatus>>({
    general: 'pristine',
    business: 'pristine',
    brand: 'pristine',
    prompting: 'pristine',
    characters: 'pristine',
    scenes: 'pristine',
    loras: 'pristine',
    env: 'pristine'
  });

  // Tab-specific error tracking
  const [tabErrors, setTabErrors] = useState<Record<TabType, string | null>>({
    general: null,
    business: null,
    brand: null,
    prompting: null,
    characters: null,
    scenes: null,
    loras: null,
    env: null
  });

  // Project options state for Characters and Scenes tabs
  const [projectOptions, setProjectOptions] = useState<any>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Environment variables visibility state
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});



  // Reset form when project changes or when modal opens
  useEffect(() => {
    setEditedProject(project);
    setIsEditing(false);
    setError(null);
    // Reset tab status
    setTabStatus({
      general: 'pristine',
      business: 'pristine',
      brand: 'pristine',
      prompting: 'pristine',
      characters: 'pristine',
      scenes: 'pristine',
      loras: 'pristine',
      env: 'pristine'
    });
    setTabErrors({
      general: null,
      business: null,
      brand: null,
      prompting: null,
      characters: null,
      scenes: null,
      loras: null,
      env: null
    });
    if (isOpen) {
      setActiveTab('general');
      loadProjectOptions();
    }
  }, [project, isOpen]);

  const loadProjectOptions = async () => {
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

  const handleEdit = () => {
    // Check if project is editable
    if (project.isEditable === false) {
      setError('This project is marked as read-only and cannot be edited.');
      return;
    }
    
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProject(project);
    setError(null);
    // Reset tab status
    setTabStatus({
      general: 'pristine',
      business: 'pristine',
      brand: 'pristine',
      prompting: 'pristine',
      characters: 'pristine',
      scenes: 'pristine',
      loras: 'pristine',
      env: 'pristine'
    });
    setTabErrors({
      general: null,
      business: null,
      brand: null,
      prompting: null,
      characters: null,
      scenes: null,
      loras: null,
      env: null
    });
  };

  // Tab-specific save functions
  const saveTab = async (tabId: TabType) => {
    // Check if project is editable before saving
    if (project.isEditable === false) {
      throw new Error('This project is marked as read-only and cannot be edited');
    }

    setTabStatus(prev => ({ ...prev, [tabId]: 'saving' }));
    setTabErrors(prev => ({ ...prev, [tabId]: null }));

    try {
      const endpoints = {
        general: `/api/database/projects/${project.id}/general`,
        business: `/api/database/projects/${project.id}/business`,
        brand: `/api/database/projects/${project.id}/brand`,
        prompting: `/api/database/projects/${project.id}/prompting`,
        loras: `/api/database/projects/${project.id}/loras`,
        characters: null, // Handled by existing character components
        scenes: null, // Handled by existing scene components
        env: `/api/database/projects/${project.id}/env`
      };

      const endpoint = endpoints[tabId];
      if (!endpoint) {
        // For characters/scenes, just mark as saved since they handle their own saving
        setTabStatus(prev => ({ ...prev, [tabId]: 'saved' }));
        return;
      }

      // Prepare data based on tab
      let requestData: any = {};
      
      switch (tabId) {
        case 'general':
          requestData = {
            name: editedProject.name?.trim(),
            description: editedProject.description?.trim(),
            slug: editedProject.slug?.trim(),
            color: editedProject.color,
            status: editedProject.status,
            isEditable: editedProject.isEditable,
            defaultImageOrientation: editedProject.defaultImageOrientation,
            imageCount: editedProject.imageCount
          };
          break;
        case 'business':
          requestData = {
            businessOverview: editedProject.businessOverview
          };
          break;
        case 'brand':
          requestData = {
            brandStory: editedProject.brandStory
          };
          break;
        case 'prompting':
          requestData = {
            imagePrompting: editedProject.imagePrompting
          };
          break;
        case 'loras':
          requestData = {
            loraSettings: editedProject.loras
          };
          break;
        case 'env':
          requestData = {
            envVars: editedProject.environment_variables
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || `Failed to save ${tabId} settings`);
      }

      // Update project in context with the saved data
      const updatedFields: Partial<Project> = {};
      
      if (tabId === 'general') {
        Object.assign(updatedFields, {
          name: result.data.name,
          description: result.data.description,
          slug: result.data.slug,
          color: result.data.color,
          status: result.data.status,
          isEditable: result.data.isEditable,
          defaultImageOrientation: result.data.defaultImageOrientation,
          imageCount: result.data.imageCount
        });
      } else if (tabId === 'business') {
        updatedFields.businessOverview = result.data;
      } else if (tabId === 'brand') {
        updatedFields.brandStory = result.data;
      } else if (tabId === 'prompting') {
        updatedFields.imagePrompting = result.data;
      } else if (tabId === 'loras') {
        updatedFields.loras = result.data;
      } else if (tabId === 'env') {
        updatedFields.environment_variables = result.data.merged;
      }

      updateProject(project.id, updatedFields);
      
      setTabStatus(prev => ({ ...prev, [tabId]: 'saved' }));
      console.log(`✅ ${tabId} settings saved successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to save ${tabId} settings`;
      setTabErrors(prev => ({ ...prev, [tabId]: errorMessage }));
      setTabStatus(prev => ({ ...prev, [tabId]: 'error' }));
      console.error(`❌ Failed to save ${tabId} settings:`, error);
      throw error; // Re-throw so calling code can handle it
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save all modified tabs
      const modifiedTabs = Object.entries(tabStatus)
        .filter(([_, status]) => status === 'modified')
        .map(([tabId, _]) => tabId as TabType);

      if (modifiedTabs.length === 0) {
        // If no tabs are modified, save the current active tab
        modifiedTabs.push(activeTab);
      }

      const savePromises = modifiedTabs.map(tabId => saveTab(tabId));
      await Promise.all(savePromises);

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  // Mark tab as modified when data changes
  const markTabAsModified = (tabId: TabType) => {
    setTabStatus(prev => ({ ...prev, [tabId]: 'modified' }));
  };

  // Handle tab changes with auto-save of current tab
  const handleTabChange = async (newTab: TabType) => {
    const currentTabStatus = tabStatus[activeTab];
    
    // Auto-save current tab if it has modifications
    if (currentTabStatus === 'modified' && isEditing) {
      try {
        await saveTab(activeTab);
      } catch (error) {
        // Error is already handled in saveTab, just continue to new tab
      }
    }
    
    setActiveTab(newTab);
  };

  // Individual tab save handlers
  const handleTabSave = async (tabId: TabType) => {
    try {
      await saveTab(tabId);
    } catch (error) {
      // Error is already set in tabErrors by saveTab
    }
  };

  const handleFieldChange = (field: keyof Project, value: unknown) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value,
    }));
    markTabAsModified('general'); // General tab fields
  };

  const handleGeneralChange = (field: string, value: unknown) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value,
    }));
    markTabAsModified('general'); // General tab fields
  };

  const handleBusinessOverviewChange = (field: string, value: string | string[]) => {
    setEditedProject(prev => {
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
    markTabAsModified('business');
  };

  const handleBrandStoryChange = (field: string, value: string | string[]) => {
    setEditedProject(prev => {
      const brandStory = { ...prev.brandStory };
      
      // Handle nested object properties (e.g., visualIdentity.primaryColors)
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
    markTabAsModified('brand');
  };

  const handleImagePromptingChange = (field: string, value: string | string[] | boolean) => {
    setEditedProject(prev => ({
      ...prev,
      imagePrompting: {
        ...prev.imagePrompting,
        [field]: value,
      },
    }));
    markTabAsModified('prompting');
  };

  const handleLoRAChange = (field: 'lora1' | 'lora2', value: any) => {
    setEditedProject(prev => ({
      ...prev,
      loras: {
        ...prev.loras,
        [field]: value
      }
    }));
    markTabAsModified('loras');
  };

  const handleArrayFieldChange = (
    section: 'businessOverview' | 'brandStory' | 'imagePrompting',
    field: string,
    index: number,
    value: string
  ) => {
    setEditedProject(prev => {
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
    
    // Mark appropriate tab as modified
    if (section === 'businessOverview') markTabAsModified('business');
    else if (section === 'brandStory') markTabAsModified('brand');
    else if (section === 'imagePrompting') markTabAsModified('prompting');
  };

  const handleAddArrayItem = (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string) => {
    setEditedProject(prev => {
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
    
    // Mark appropriate tab as modified
    if (section === 'businessOverview') markTabAsModified('business');
    else if (section === 'brandStory') markTabAsModified('brand');
    else if (section === 'imagePrompting') markTabAsModified('prompting');
  };

  const handleRemoveArrayItem = (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number) => {
    setEditedProject(prev => {
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
    
    // Mark appropriate tab as modified
    if (section === 'businessOverview') markTabAsModified('business');
    else if (section === 'brandStory') markTabAsModified('brand');
    else if (section === 'imagePrompting') markTabAsModified('prompting');
  };

  // Environment variable handlers
  const handleEnvVarChange = (key: string, value: string) => {
    setEditedProject(prev => ({
      ...prev,
      environment_variables: {
        ...prev.environment_variables,
        [key]: value
      }
    }));
    markTabAsModified('env');
  };

  const handleAddEnvVar = () => {
    const newKey = `NEW_VAR_${Date.now()}`;
    handleEnvVarChange(newKey, '');
  };

  const handleRemoveEnvVar = (key: string) => {
    setEditedProject(prev => {
      const newEnvVars = { ...prev.environment_variables };
      delete newEnvVars[key];
      return {
        ...prev,
        environment_variables: newEnvVars
      };
    });
    markTabAsModified('env');
  };

  const toggleValueVisibility = (key: string) => {
    setShowValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Render helper functions for Business/Brand/Prompting tabs
  const renderTextField = (
    label: string,
    section: 'businessOverview' | 'brandStory' | 'imagePrompting',
    field: string,
    placeholder: string = '',
    isTextarea: boolean = false
  ) => {
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
      value = (editedSectionData as Record<string, string>)[field] || '';
      readOnlyValue = (projectSectionData as Record<string, string>)[field] || '';
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
                  handleImagePromptingChange(field as keyof ImagePrompting, e.target.value);
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
                  handleImagePromptingChange(field as keyof ImagePrompting, e.target.value);
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

  // Render image prompting field (simplified without toggle)
  const renderImagePromptingFieldWithToggle = (
    label: string,
    field: string,
    placeholder: string = '',
    isTextarea: boolean = false
  ) => {
    return renderTextField(label, 'imagePrompting', field, placeholder, isTextarea);
  };

  // Render image prompting array field (simplified without toggle)
  const renderImagePromptingArrayFieldWithToggle = (
    label: string,
    field: string,
    placeholder: string = 'Add item...'
  ) => {
    return renderArrayField(label, 'imagePrompting', field, placeholder);
  };

  const renderArrayField = (
    label: string,
    section: 'businessOverview' | 'brandStory' | 'imagePrompting',
    field: string,
    placeholder: string = 'Add item...'
  ) => {
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
      items = (editedSectionData as Record<string, string[]>)[field] || [];
      readOnlyItems = (projectSectionData as Record<string, string[]>)[field] || [];
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
                  <X className="h-4 w-4" />
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
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 modal-overlay z-[9999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="bg-background dark:bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Project Settings
                </h2>
                <div className="flex items-center gap-1">
                  {!isEditing && !isSaving && (
                    <button
                      onClick={handleEdit}
                      disabled={project.isEditable === false}
                      className={cn(
                        "p-2 rounded-md transition-colors duration-200",
                        project.isEditable === false
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                      title={
                        project.isEditable === false 
                          ? "Project is read-only and cannot be edited" 
                          : "Edit project"
                      }
                    >
                      <Icon icon={Edit} size="sm" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <Icon icon={X} size="sm" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-accent px-6">
                {tabs.map((tab) => {
                  const status = tabStatus[tab.id];
                  const hasError = tabErrors[tab.id];
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 tracking-tight relative',
                        activeTab === tab.id
                          ? 'border-foreground text-foreground bg-background'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                      title={hasError || undefined}
                    >
                      {tab.icon}
                      {tab.label}
                      
                      {/* Status indicator */}
                      {status === 'modified' && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" 
                             title="Unsaved changes" />
                      )}
                      {status === 'saving' && (
                        <div className="w-3 h-3 border border-foreground/30 border-t-foreground rounded-full animate-spin" 
                             title="Saving..." />
                      )}
                      {status === 'saved' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" 
                             title="Saved" />
                      )}
                      {status === 'error' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" 
                             title={`Error: ${hasError}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Global Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-accent border border-border rounded-md text-foreground mb-4"
                  >
                    <Icon icon={AlertCircle} size="sm" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {/* Tab-specific Error Message */}
                {tabErrors[activeTab] && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon={AlertCircle} size="sm" />
                      <span className="text-sm">{tabErrors[activeTab]}</span>
                    </div>
                    <button
                      onClick={() => handleTabSave(activeTab)}
                      disabled={tabStatus[activeTab] === 'saving'}
                      className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}

                {/* Tab Save Status & Action */}
                {isEditing && (tabStatus[activeTab] === 'modified' || tabStatus[activeTab] === 'saving') && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      <span className="text-sm">
                        {tabStatus[activeTab] === 'saving' ? 'Saving changes...' : 'You have unsaved changes in this tab'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleTabSave(activeTab)}
                      disabled={tabStatus[activeTab] === 'saving'}
                      className="px-3 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {tabStatus[activeTab] === 'saving' ? (
                        <>
                          <div className="w-3 h-3 border border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Icon icon={Check} size="xs" />
                          Save Tab
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

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
                  <BusinessTab
                    isEditing={isEditing}
                    editedProject={editedProject}
                    project={project}
                    handleBusinessOverviewChange={handleBusinessOverviewChange}
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
                    renderTextField={(label, section, field, placeholder, isTextarea) => 
                      renderImagePromptingFieldWithToggle(label, field, placeholder, isTextarea)
                    }
                    renderArrayField={(label, section, field, placeholder) => 
                      renderImagePromptingArrayFieldWithToggle(label, field, placeholder)
                    }
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
              </div>

              {/* Footer */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-accent"
                >
                  {/* Modified tabs summary */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {(() => {
                      const modifiedTabs = Object.entries(tabStatus)
                        .filter(([_, status]) => status === 'modified')
                        .map(([tabId, _]) => tabs.find(t => t.id === tabId)?.label)
                        .filter(Boolean);
                      
                      const savingTabs = Object.entries(tabStatus)
                        .filter(([_, status]) => status === 'saving')
                        .map(([tabId, _]) => tabs.find(t => t.id === tabId)?.label)
                        .filter(Boolean);

                      if (savingTabs.length > 0) {
                        return (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                            Saving {savingTabs.join(', ')}...
                          </span>
                        );
                      }

                      if (modifiedTabs.length > 0) {
                        return (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            {modifiedTabs.length} tab{modifiedTabs.length > 1 ? 's' : ''} modified: {modifiedTabs.join(', ')}
                          </span>
                        );
                      }

                      return <span>All changes saved</span>;
                    })()}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-background bg-foreground border border-transparent rounded-md hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Icon icon={Check} size="sm" />
                          Save All Changes
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 