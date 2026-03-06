'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, X, Link } from './Icon';

interface LoRALibraryItem {
  id: string;
  name: string;
  description?: string;
  triggerWords?: string[];
  link?: string;
  tags?: string[];
}

interface LoRAReference {
  id: string;
  strength: number;
  enabled: boolean;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    slug: string;
    description: string;
    color: string;
    businessUrl?: string;
    defaultImageOrientation?: 'portrait' | 'landscape' | 'square';
    loraSettings?: {
      lora1?: LoRAReference;
      lora2?: LoRAReference;
    };
  }) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [defaultImageOrientation, setDefaultImageOrientation] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  
  // LoRA library and selection states
  const [availableLoRAs, setAvailableLoRAs] = useState<LoRALibraryItem[]>([]);
  const [loadingLoRAs, setLoadingLoRAs] = useState(true);
  
  // LoRA selection states - default both to enabled with proper default LoRAs
  const [lora1, setLora1] = useState<LoRAReference>({
    id: 'minimal-design',
    strength: 0.825,
    enabled: true
  });
  
  const [lora2, setLora2] = useState<LoRAReference>({
    id: 'cute-3d-cartoon', 
    strength: 0.65,
    enabled: true
  });

  // Load available LoRAs from the backend
  useEffect(() => {
    const loadLoRAs = async () => {
      try {
        setLoadingLoRAs(true);
        // Add cache busting parameter to force fresh data
        const response = await fetch(`/api/database/loras?_=${Date.now()}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          setAvailableLoRAs(result.data);
        } else {
          console.warn('Failed to load LoRAs:', result.error);
          setAvailableLoRAs([]);
        }
      } catch (error) {
        console.error('Error loading LoRAs:', error);
        setAvailableLoRAs([]);
      } finally {
        setLoadingLoRAs(false);
      }
    };

    if (isOpen) {
      loadLoRAs();
    }
  }, [isOpen]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isSlugManual && name) {
      const autoSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      setSlug(autoSlug);
    }
  }, [name, isSlugManual]);

  const validateSlug = (slugValue: string) => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugValue.length > 0 && slugRegex.test(slugValue);
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManual(true);
    // Clean the input as user types
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Only allow letters, numbers, hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    setSlug(cleanSlug);
  };

  const validateUrl = (url: string) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim() || !validateSlug(slug)) {
      return;
    }

    if (businessUrl && !validateUrl(businessUrl)) {
      return;
    }
    
    // Prepare LoRA settings using the new format
    const loraSettings: { lora1?: LoRAReference; lora2?: LoRAReference } = {};
    
    if (lora1.enabled && lora1.id) {
      loraSettings.lora1 = {
        id: lora1.id,
        strength: lora1.strength,
        enabled: lora1.enabled
      };
    }
    
    if (lora2.enabled && lora2.id) {
      loraSettings.lora2 = {
        id: lora2.id,
        strength: lora2.strength,
        enabled: lora2.enabled
      };
    }

    onCreateProject({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      businessUrl: businessUrl.trim() || undefined,
      color,
      defaultImageOrientation,
      loraSettings: Object.keys(loraSettings).length > 0 ? loraSettings : undefined
    });

    handleReset();
  };

  const handleReset = () => {
    setName('');
    setSlug('');
    setIsSlugManual(false);
    setDescription('');
    setBusinessUrl('');
    setColor('#6B7280');
    setDefaultImageOrientation('portrait');
    setLora1({
      id: 'minimal-design',
      strength: 0.825,
      enabled: true
    });
    setLora2({
      id: 'cute-3d-cartoon',
      strength: 0.65,
      enabled: true
    });
    onClose();
  };

  const handleClose = () => {
    handleReset();
  };

  const renderLoRASelector = (
    loraKey: 'lora1' | 'lora2',
    currentLora: LoRAReference,
    setLora: React.Dispatch<React.SetStateAction<LoRAReference>>,
    label: string
  ) => {
    const selectedLoRA = availableLoRAs.find(lora => lora.id === currentLora.id);
    
    return (
      <div className="p-4 bg-accent/30 rounded-lg border border-border space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLora.enabled}
              onChange={(e) => setLora(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-border"
            />
            <span className="text-xs text-muted-foreground">Enabled</span>
          </label>
        </div>
        
        {currentLora.enabled && (
          <>
            {/* LoRA Selection Dropdown */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Select LoRA
              </label>
              {loadingLoRAs ? (
                <div className="w-full px-3 py-2 border border-border rounded-md bg-background text-muted-foreground text-sm">
                  Loading LoRAs...
                </div>
              ) : (
                <select
                  value={currentLora.id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId === '') {
                      setLora(prev => ({ ...prev, id: '', enabled: false }));
                    } else {
                      setLora(prev => ({ ...prev, id: selectedId }));
                    }
                  }}

                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm"
                >
                  <option value="">Select a LoRA...</option>
                  {availableLoRAs.map((lora) => (
                    <option key={lora.id} value={lora.id}>
                      {lora.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* LoRA Details */}
            {selectedLoRA && (
              <div className="space-y-2">
                {selectedLoRA.description && (
                  <div className="text-xs text-muted-foreground bg-background rounded p-2 border border-border">
                    {selectedLoRA.description}
                  </div>
                )}
                
                {selectedLoRA.triggerWords && selectedLoRA.triggerWords.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Trigger Words
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {selectedLoRA.triggerWords.map((word, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-md border border-primary/20"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strength Slider */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Strength: {currentLora.strength.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={currentLora.strength}
                onChange={(e) => setLora(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.1</span>
                <span>1.0</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 modal-overlay z-[9999]"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background dark:bg-background border border-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Create New Project
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
            >
              <Icon icon={X} size="sm" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">

        {/* Form */}
        <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Basic Information
            </h3>
            
            {/* Project Name */}
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-foreground mb-1">
                Project Name*
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground bg-background text-foreground"
                placeholder="Enter project name..."
                required
              />
            </div>

            {/* Project Slug */}
            <div>
              <label htmlFor="project-slug" className="block text-sm font-medium text-foreground mb-1">
                Project Slug*
              </label>
              <input
                id="project-slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground bg-background text-foreground font-mono text-sm ${
                  slug && !validateSlug(slug) ? 'border-red-500' : 'border-border'
                }`}
                placeholder="auto-generated-from-name"
                required
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {slug ? (
                  <span>Project URL: <code className="bg-accent px-1 rounded">/{slug}</code></span>
                ) : (
                  <span>Will auto-generate from project name</span>
                )}
              </div>
              {slug && !validateSlug(slug) && (
                <div className="mt-1 text-xs text-red-600">
                  Only lowercase letters, numbers, and hyphens allowed
                </div>
              )}
            </div>

            {/* Project Description */}
            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground bg-background text-foreground"
                placeholder="Describe your project..."
              />
            </div>

            {/* Business URL */}
            <div>
              <label htmlFor="business-url" className="block text-sm font-medium text-foreground mb-1">
                Business URL
              </label>
              <div className="relative">
                <input
                  id="business-url"
                  type="url"
                  value={businessUrl}
                  onChange={(e) => setBusinessUrl(e.target.value)}
                  className={`w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground bg-background text-foreground ${
                    businessUrl && !validateUrl(businessUrl) ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="https://example.com"
                />
                <Icon icon={Link} size="xs" className="absolute left-2.5 top-3 text-muted-foreground" />
              </div>
              {businessUrl && !validateUrl(businessUrl) && (
                <div className="mt-1 text-xs text-red-600">
                  Please enter a valid URL (include https://)
                </div>
              )}
            </div>

            {/* Project Color */}
            <div>
              <label htmlFor="project-color" className="block text-sm font-medium text-foreground mb-1">
                Project Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="project-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-border rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground font-mono text-sm bg-background text-foreground"
                  placeholder="#6B7280"
                />
              </div>
            </div>

            {/* Default Image Orientation */}
            <div>
              <label htmlFor="image-orientation" className="block text-sm font-medium text-foreground mb-1">
                Default Image Orientation
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                All AI image generation calls will use this orientation unless overridden
              </p>
              <select
                id="image-orientation"
                value={defaultImageOrientation}
                onChange={(e) => setDefaultImageOrientation(e.target.value as 'portrait' | 'landscape' | 'square')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              >
                <option value="portrait">Portrait (16:9 vertical)</option>
                <option value="landscape">Landscape (16:9 horizontal)</option>
                <option value="square">Square (1:1)</option>
              </select>
            </div>
          </div>

          {/* LoRA Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              LoRA Configuration
            </h3>
            <p className="text-xs text-muted-foreground">
              LoRAs (Low-Rank Adaptations) enhance your AI image generation with specific styles and effects. Both default LoRAs are pre-selected for optimal results.
            </p>
            
            {/* LoRA 1 */}
            {renderLoRASelector('lora1', lora1, setLora1, 'LoRA 1')}

            {/* LoRA 2 */}
            {renderLoRASelector('lora2', lora2, setLora2, 'LoRA 2')}
          </div>

          </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-accent">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-accent hover:text-foreground transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-project-form"
              className="px-4 py-2 text-sm font-medium text-background bg-foreground rounded-md hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim() || !slug.trim() || !validateSlug(slug) || (businessUrl && !validateUrl(businessUrl))}
            >
              Create Project
            </button>
          </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 