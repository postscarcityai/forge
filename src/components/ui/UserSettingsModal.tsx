'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, X, Edit, Check, AlertCircle, Settings, Folder, Plus, Trash2, Eye, EyeOff, Layers, Lightbulb } from './Icon';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { TriggerWordPill } from './TriggerWordPill';

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

interface LoRAItem {
  id: string;
  name: string;
  description?: string;
  triggerWords?: string[];
  safetensorsLink?: string;
  civitaiLink?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser?: (updates: Partial<User>) => void;
}

type TabType = 'general' | 'loras' | 'env';

// Environment Variable Row Component
interface EnvVarRowProps {
  envKey: string;
  value: string;
  onUpdate: (key: string, value: string) => void;
  onDelete: (key: string) => void;
  isUpdating: boolean;
}

const EnvVarRow: React.FC<EnvVarRowProps> = ({ envKey, value, onUpdate, onDelete, isUpdating }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isVisible, setIsVisible] = useState(false);

  const handleSave = () => {
    onUpdate(envKey, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the environment variable "${envKey}"?`)) {
      onDelete(envKey);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-background border border-solid border-border rounded-lg">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Key */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Key
          </label>
          <div className="p-2 bg-accent/50 rounded text-sm font-mono text-foreground">
            {envKey}
          </div>
        </div>
        
        {/* Value */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Value
          </label>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-2 py-2 border border-solid border-border rounded text-sm bg-background text-foreground"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="px-2 py-1 text-xs bg-foreground text-background rounded hover:bg-foreground/90 disabled:opacity-50"
              >
                <Icon icon={Check} size="xs" />
              </button>
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-muted"
              >
                <Icon icon={X} size="xs" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-accent/50 rounded text-sm font-mono text-foreground break-all">
                {isVisible ? value : '•'.repeat(Math.min(value.length, 20))}
              </div>
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title={isVisible ? 'Hide value' : 'Show value'}
              >
                <Icon icon={isVisible ? EyeOff : Eye} size="xs" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-start gap-1 flex-shrink-0">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            disabled={isUpdating}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
            title="Edit value"
          >
            <Icon icon={Edit} size="xs" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isUpdating}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-accent rounded transition-colors"
          title="Delete variable"
        >
          <Icon icon={Trash2} size="xs" />
        </button>
      </div>
    </div>
  );
};

// LoRA Card Component
interface LoRACardProps {
  lora: LoRAItem;
  onUpdate: (id: string, updates: Partial<LoRAItem>) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}

const LoRACard: React.FC<LoRACardProps> = ({ lora, onUpdate, onDelete, isSaving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLora, setEditedLora] = useState<LoRAItem>(lora);
  const [triggerWordsInput, setTriggerWordsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Update local state when lora prop changes
  useEffect(() => {
    setEditedLora(lora);
  }, [lora]);

  const handleFieldChange = (field: keyof LoRAItem, value: any) => {
    setEditedLora(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedLora(lora);
  };

  const handleSave = async () => {
    await onUpdate(lora.id, editedLora);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedLora(lora);
    setTriggerWordsInput('');
    setTagsInput('');
    setIsEditing(false);
  };

  return (
    <div className="p-4 border border-solid border-border rounded-lg bg-background">
      <div className="space-y-4">
        {/* ID and Name Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ID */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              ID
            </label>
            <div className="p-3 bg-accent rounded-md text-foreground text-sm font-mono">
              {lora.id}
              {isEditing && (
                <span className="ml-2 text-xs text-muted-foreground">(ID cannot be changed)</span>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedLora.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                placeholder="My Custom LoRA"
              />
            ) : (
              <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                {lora.name}
              </div>
            )}
          </div>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Safetensors Link
          </label>
          {isEditing ? (
            <input
              type="url"
              value={editedLora.safetensorsLink || ''}
              onChange={(e) => handleFieldChange('safetensorsLink', e.target.value)}
              className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              placeholder="https://example.com/path/to/lora/file.safetensors"
            />
          ) : (
            <div className="p-3 bg-accent rounded-md text-foreground text-sm">
              {lora.safetensorsLink ? (
                <a 
                  href={lora.safetensorsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {lora.safetensorsLink}
                </a>
              ) : (
                <span className="text-muted-foreground italic">No safetensors link provided</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Civit AI Link
          </label>
          {isEditing ? (
            <input
              type="url"
              value={editedLora.civitaiLink || ''}
              onChange={(e) => handleFieldChange('civitaiLink', e.target.value)}
              className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              placeholder="https://civitai.com/models/..."
            />
          ) : (
            <div className="p-3 bg-accent rounded-md text-foreground text-sm">
              {lora.civitaiLink ? (
                <a 
                  href={lora.civitaiLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {lora.civitaiLink}
                </a>
              ) : (
                <span className="text-muted-foreground italic">No Civit AI link provided</span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={editedLora.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground resize-none"
              placeholder="Describe what this LoRA does..."
            />
          ) : (
            <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[2.5rem]">
              {lora.description || <span className="text-muted-foreground italic">No description provided</span>}
            </div>
          )}
        </div>

        {/* Trigger Words */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Trigger Words
          </label>
          {isEditing ? (
            <div className="space-y-2">
              {/* Pills Display */}
              {editedLora.triggerWords && editedLora.triggerWords.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 bg-muted/30 border border-solid border-border rounded-md min-h-[2.5rem]">
                  {editedLora.triggerWords.map((word, index) => (
                    <TriggerWordPill
                      key={`${word}-${index}`}
                      word={word}
                      type="default"
                      removable={true}
                      onRemove={(wordToRemove) => {
                        handleFieldChange('triggerWords', editedLora.triggerWords?.filter(w => w !== wordToRemove) || []);
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Input Field */}
              <input
                type="text"
                value={triggerWordsInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setTriggerWordsInput(value);
                  
                  // Check if user typed comma
                  if (value.includes(',')) {
                    const parts = value.split(',');
                    const wordsToAdd = parts.slice(0, -1).map(word => word.trim()).filter(word => word.length > 0);
                    const remaining = parts[parts.length - 1];
                    
                    if (wordsToAdd.length > 0) {
                      handleFieldChange('triggerWords', [...(editedLora.triggerWords || []), ...wordsToAdd]);
                    }
                    setTriggerWordsInput(remaining);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = triggerWordsInput.trim();
                    if (value) {
                      handleFieldChange('triggerWords', [...(editedLora.triggerWords || []), value]);
                      setTriggerWordsInput('');
                    }
                  }
                }}
                placeholder="Type trigger words and press comma or enter to add"
                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              />
              
              <div className="text-xs text-muted-foreground">
                Type words and press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">comma</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">enter</kbd> to add them as pills.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-accent rounded-md min-h-[2.5rem]">
              {lora.triggerWords && lora.triggerWords.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {lora.triggerWords.map((word, index) => (
                    <TriggerWordPill
                      key={index}
                      word={word}
                      type="default"
                      removable={false}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic text-sm">No trigger words provided</span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tags
          </label>
          {isEditing ? (
            <div className="space-y-2">
              {/* Pills Display */}
              {editedLora.tags && editedLora.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 bg-muted/30 border border-solid border-border rounded-md min-h-[2.5rem]">
                  {editedLora.tags.map((tag, index) => (
                    <TriggerWordPill
                      key={`${tag}-${index}`}
                      word={tag}
                      type="positive"
                      removable={true}
                      onRemove={(tagToRemove) => {
                        handleFieldChange('tags', editedLora.tags?.filter(t => t !== tagToRemove) || []);
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Input Field */}
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setTagsInput(value);
                  
                  // Check if user typed comma
                  if (value.includes(',')) {
                    const parts = value.split(',');
                    const tagsToAdd = parts.slice(0, -1).map(tag => tag.trim()).filter(tag => tag.length > 0);
                    const remaining = parts[parts.length - 1];
                    
                    if (tagsToAdd.length > 0) {
                      handleFieldChange('tags', [...(editedLora.tags || []), ...tagsToAdd]);
                    }
                    setTagsInput(remaining);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = tagsInput.trim();
                    if (value) {
                      handleFieldChange('tags', [...(editedLora.tags || []), value]);
                      setTagsInput('');
                    }
                  }
                }}
                placeholder="Type tags and press comma or enter to add"
                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              />
              
              <div className="text-xs text-muted-foreground">
                Type tags and press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">comma</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">enter</kbd> to add them as pills.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-accent rounded-md min-h-[2.5rem]">
              {lora.tags && lora.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {lora.tags.map((tag, index) => (
                    <TriggerWordPill
                      key={index}
                      word={tag}
                      type="positive"
                      removable={false}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic text-sm">No tags provided</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {lora.createdAt && (
              <span>Created: {new Date(lora.createdAt).toLocaleDateString()}</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-solid border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-background bg-foreground border border-transparent rounded-md hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                disabled={isSaving}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                title="Edit LoRA"
              >
                <Icon icon={Edit} size="xs" />
              </button>
              <button
                onClick={() => onDelete(lora.id)}
                disabled={isSaving}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-accent rounded transition-colors"
                title="Delete LoRA"
              >
                <Icon icon={Trash2} size="xs" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Environment variables state
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // LoRA management state
  const [loras, setLoras] = useState<LoRAItem[]>([]);
  const [isLoadingLoras, setIsLoadingLoras] = useState(false);
  const [isAddingLora, setIsAddingLora] = useState(false);
  const [newLora, setNewLora] = useState<Partial<LoRAItem>>({
    id: '',
    name: '',
    description: '',
    triggerWords: [],
    safetensorsLink: '',
    civitaiLink: '',
    tags: []
  });

  // Input field states for pills
  const [newLoraTriggerInput, setNewLoraTriggerInput] = useState('');
  const [newLoraTagsInput, setNewLoraTagsInput] = useState('');

  // Reset form when user changes
  useEffect(() => {
    setEditedUser(user);
    setIsEditing(false);
    setError(null);
    setActiveTab('general');
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Basic validation
      if (!editedUser.name.trim()) {
        throw new Error('Name is required');
      }

      if (!editedUser.email.trim()) {
        throw new Error('Email is required');
      }

      // Update user if callback provided
      if (onUpdateUser) {
        onUpdateUser(editedUser);
      }

      // TODO: Save to database
      console.log('User settings saved:', editedUser);

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof User, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Load environment variables when env tab is opened
  useEffect(() => {
    if (activeTab === 'env' && isOpen) {
      loadEnvVars();
    }
  }, [activeTab, isOpen]);

  const loadEnvVars = async () => {
    setIsLoadingEnv(true);
    setError(null);
    
    try {
      const response = await fetch('/api/database/settings/env');
      const data = await response.json();
      
      if (data.success) {
        setEnvVars(data.data || {});
      } else {
        setError(data.error || 'Failed to load environment variables');
      }
    } catch (err) {
      setError('Failed to load environment variables');
      console.error('Error loading env vars:', err);
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const saveEnvVars = async (updatedEnvVars: Record<string, string>) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/database/settings/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envVars: updatedEnvVars
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEnvVars(updatedEnvVars);
      } else {
        setError(data.error || 'Failed to save environment variables');
      }
    } catch (err) {
      setError('Failed to save environment variables');
      console.error('Error saving env vars:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addEnvVar = async () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) {
      setError('Both key and value are required');
      return;
    }

    // Validate key format
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(newEnvKey)) {
      setError('Environment variable names should only contain letters, numbers, and underscores, and cannot start with a number');
      return;
    }

    const updatedEnvVars = {
      ...envVars,
      [newEnvKey]: newEnvValue
    };

    await saveEnvVars(updatedEnvVars);
    
    if (!error) {
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const updateEnvVar = async (key: string, value: string) => {
    const updatedEnvVars = {
      ...envVars,
      [key]: value
    };

    await saveEnvVars(updatedEnvVars);
  };

  const deleteEnvVar = async (key: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/database/settings/env?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedEnvVars = { ...envVars };
        delete updatedEnvVars[key];
        setEnvVars(updatedEnvVars);
      } else {
        setError(data.error || 'Failed to delete environment variable');
      }
    } catch (err) {
      setError('Failed to delete environment variable');
      console.error('Error deleting env var:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // LoRA management functions
  const loadLoras = async () => {
    setIsLoadingLoras(true);
    setError(null);
    
    try {
      const response = await fetch('/api/database/loras');
      const data = await response.json();
      
      if (data.success) {
        setLoras(data.data || []);
      } else {
        setError(data.error || 'Failed to load LoRAs');
      }
    } catch (err) {
      setError('Failed to load LoRAs');
      console.error('Error loading LoRAs:', err);
    } finally {
      setIsLoadingLoras(false);
    }
  };

  const addLora = () => {
    setIsAddingLora(true);
    setNewLora({
      id: '',
      name: '',
      description: '',
      triggerWords: [],
      safetensorsLink: '',
      civitaiLink: '',
      tags: []
    });
  };

  const saveNewLora = async () => {
    if (!newLora.id?.trim() || !newLora.name?.trim()) {
      setError('LoRA ID and Name are required');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/database/loras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newLora.id.trim(),
          name: newLora.name.trim(),
          description: newLora.description?.trim() || '',
          triggerWords: newLora.triggerWords || [],
          safetensorsLink: newLora.safetensorsLink?.trim() || '',
          civitaiLink: newLora.civitaiLink?.trim() || '',
          tags: newLora.tags || []
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLoras(); // Reload the list
        setIsAddingLora(false); // Close the form
        setNewLora({
          id: '',
          name: '',
          description: '',
          triggerWords: [],
          safetensorsLink: '',
          civitaiLink: '',
          tags: []
        });
      } else {
        setError(data.error || 'Failed to add LoRA');
      }
    } catch (err) {
      setError('Failed to add LoRA');
      console.error('Error adding LoRA:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelNewLora = () => {
    setIsAddingLora(false);
    setNewLora({
      id: '',
      name: '',
      description: '',
      triggerWords: [],
      link: '',
      tags: []
    });
    setNewLoraTriggerInput('');
    setNewLoraTagsInput('');
    setError(null);
  };

  const updateLora = async (id: string, updates: Partial<LoRAItem>) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/database/loras?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLoras(); // Reload the list
      } else {
        setError(data.error || 'Failed to update LoRA');
      }
    } catch (err) {
      setError('Failed to update LoRA');
      console.error('Error updating LoRA:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLora = async (id: string) => {
    if (!confirm('Are you sure you want to delete this LoRA? This action cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/database/loras?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLoras(); // Reload the list
      } else {
        setError(data.error || 'Failed to delete LoRA');
      }
    } catch (err) {
      setError('Failed to delete LoRA');
      console.error('Error deleting LoRA:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Load LoRAs when tab becomes active
  useEffect(() => {
    if (activeTab === 'loras' && isOpen) {
      loadLoras();
    }
  }, [activeTab, isOpen]);

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: <Icon icon={Settings} size="xs" /> },
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
            className="fixed inset-0 modal-overlay z-[9999]"
            onClick={onClose}
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
            <div className="bg-background dark:bg-background border border-solid border-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  User Settings
                </h2>
                <div className="flex items-center gap-1">
                  {!isEditing && !isSaving && (
                    <button
                      onClick={handleEdit}
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                      title="Edit settings"
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
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium border-b transition-colors duration-200 flex items-center gap-2 tracking-tight',
                      activeTab === tab.id
                        ? 'border-foreground text-foreground bg-background'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-accent border border-solid border-border rounded-md text-foreground mb-4"
                  >
                    <Icon icon={AlertCircle} size="sm" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {/* General Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
                        Personal Information
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedUser.name}
                              onChange={(e) => handleFieldChange('name', e.target.value)}
                              className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                              placeholder="Your full name"
                            />
                          ) : (
                            <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                              {user.name}
                            </div>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Email
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editedUser.email}
                              onChange={(e) => handleFieldChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                              placeholder="your.email@example.com"
                            />
                          ) : (
                            <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
                        Preferences
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Theme */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Theme
                          </label>
                          <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                            className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                          >
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>


                      </div>
                    </div>


                  </div>
                )}

                {/* LoRA Management Tab */}
                {activeTab === 'loras' && (
                  <div className="space-y-6">
                    {/* LoRA Management Header */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
                        LoRA Library Management
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Manage your global LoRA library. These LoRAs can be referenced in any project.
                      </p>
                    </div>

                    {/* Loading State */}
                    {isLoadingLoras && (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading LoRAs...</span>
                      </div>
                    )}

                    {/* LoRA List */}
                    {!isLoadingLoras && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">LoRA Library ({loras.length})</h4>
                          {!isAddingLora && (
                            <button
                              onClick={addLora}
                              disabled={isSaving}
                              className="px-3 py-1.5 text-xs font-medium text-background bg-foreground border border-transparent rounded-md hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                            >
                              <Icon icon={Plus} size="xs" />
                              Add New LoRA
                            </button>
                          )}
                        </div>

                        {/* Add New LoRA Form */}
                        {isAddingLora && (
                          <div className="space-y-4 p-4 bg-accent/30 border border-solid border-border rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-foreground">Add New LoRA</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={cancelNewLora}
                                  disabled={isSaving}
                                  className="px-2 py-1 text-xs font-medium text-muted-foreground bg-background border border-solid border-border rounded hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveNewLora}
                                  disabled={isSaving || !newLora.id?.trim() || !newLora.name?.trim()}
                                  className="px-2 py-1 text-xs font-medium text-background bg-foreground border border-transparent rounded hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
                                >
                                  {isSaving ? (
                                    <>
                                      <div className="w-3 h-3 border border-background/30 border-t-background rounded-full animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Icon icon={Check} size="xs" />
                                      Save
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* ID Field */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  ID *
                                </label>
                                <input
                                  type="text"
                                  value={newLora.id || ''}
                                  onChange={(e) => setNewLora(prev => ({ ...prev, id: e.target.value }))}
                                  placeholder="dramatic-lighting"
                                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground font-mono"
                                />
                              </div>

                              {/* Name Field */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  value={newLora.name || ''}
                                  onChange={(e) => setNewLora(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Dramatic Lighting LoRA"
                                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                                />
                              </div>

                              {/* Safetensors Link Field */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Safetensors Link
                                </label>
                                <input
                                  type="url"
                                  value={newLora.safetensorsLink || ''}
                                  onChange={(e) => setNewLora(prev => ({ ...prev, safetensorsLink: e.target.value }))}
                                  placeholder="https://example.com/path/to/lora/file.safetensors"
                                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                                />
                              </div>

                              {/* Civit AI Link Field */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Civit AI Link
                                </label>
                                <input
                                  type="url"
                                  value={newLora.civitaiLink || ''}
                                  onChange={(e) => setNewLora(prev => ({ ...prev, civitaiLink: e.target.value }))}
                                  placeholder="https://civitai.com/models/..."
                                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                                />
                              </div>

                              {/* Tags Field */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Tags
                                </label>
                                
                                {/* Pills Display */}
                                {newLora.tags && newLora.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 p-2 bg-muted/30 border border-solid border-border rounded-md min-h-[2.5rem]">
                                    {newLora.tags.map((tag, index) => (
                                      <TriggerWordPill
                                        key={`${tag}-${index}`}
                                        word={tag}
                                        type="positive"
                                        removable={true}
                                        onRemove={(tagToRemove) => {
                                          setNewLora(prev => ({
                                            ...prev,
                                            tags: prev.tags?.filter(t => t !== tagToRemove) || []
                                          }));
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                                
                                {/* Input Field */}
                                <input
                                  type="text"
                                  value={newLoraTagsInput}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setNewLoraTagsInput(value);
                                    
                                    // Check if user typed comma
                                    if (value.includes(',')) {
                                      const parts = value.split(',');
                                      const tagsToAdd = parts.slice(0, -1).map(tag => tag.trim()).filter(tag => tag.length > 0);
                                      const remaining = parts[parts.length - 1];
                                      
                                      if (tagsToAdd.length > 0) {
                                        setNewLora(prev => ({
                                          ...prev,
                                          tags: [...(prev.tags || []), ...tagsToAdd]
                                        }));
                                      }
                                      setNewLoraTagsInput(remaining);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                      e.preventDefault();
                                      const value = newLoraTagsInput.trim();
                                      if (value) {
                                        setNewLora(prev => ({
                                          ...prev,
                                          tags: [...(prev.tags || []), value]
                                        }));
                                        setNewLoraTagsInput('');
                                      }
                                    }
                                  }}
                                  placeholder="Type tags and press comma or enter to add"
                                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                                />
                                
                                <div className="text-xs text-muted-foreground">
                                  Type tags and press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">comma</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">enter</kbd> to add them as pills.
                                </div>
                              </div>
                            </div>

                            {/* Description Field */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Description
                              </label>
                              <textarea
                                value={newLora.description || ''}
                                onChange={(e) => setNewLora(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="A LoRA for creating dramatic lighting effects..."
                                rows={3}
                                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground resize-none"
                              />
                            </div>

                            {/* Trigger Words Field */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Trigger Words
                              </label>
                              
                              {/* Pills Display */}
                              {newLora.triggerWords && newLora.triggerWords.length > 0 && (
                                <div className="flex flex-wrap gap-1 p-2 bg-muted/30 border border-solid border-border rounded-md min-h-[2.5rem]">
                                  {newLora.triggerWords.map((word, index) => (
                                    <TriggerWordPill
                                      key={`${word}-${index}`}
                                      word={word}
                                      type="default"
                                      removable={true}
                                      onRemove={(wordToRemove) => {
                                        setNewLora(prev => ({
                                          ...prev,
                                          triggerWords: prev.triggerWords?.filter(w => w !== wordToRemove) || []
                                        }));
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Input Field */}
                              <input
                                type="text"
                                value={newLoraTriggerInput}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setNewLoraTriggerInput(value);
                                  
                                  // Check if user typed comma
                                  if (value.includes(',')) {
                                    const parts = value.split(',');
                                    const wordsToAdd = parts.slice(0, -1).map(word => word.trim()).filter(word => word.length > 0);
                                    const remaining = parts[parts.length - 1];
                                    
                                    if (wordsToAdd.length > 0) {
                                      setNewLora(prev => ({
                                        ...prev,
                                        triggerWords: [...(prev.triggerWords || []), ...wordsToAdd]
                                      }));
                                    }
                                    setNewLoraTriggerInput(remaining);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const value = newLoraTriggerInput.trim();
                                    if (value) {
                                      setNewLora(prev => ({
                                        ...prev,
                                        triggerWords: [...(prev.triggerWords || []), value]
                                      }));
                                      setNewLoraTriggerInput('');
                                    }
                                  }
                                }}
                                placeholder="Type trigger words and press comma or enter to add"
                                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                              />
                              
                              <div className="text-xs text-muted-foreground">
                                Type words and press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">comma</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">enter</kbd> to add them as pills. You can also paste comma-separated values.
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {loras.length === 0 && !isAddingLora ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon icon={Layers} size="lg" className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No LoRAs in your library</p>
                            <p className="text-xs mt-1">Click "Add New LoRA" to get started</p>
                          </div>
                        ) : loras.length > 0 ? (
                          <div className="space-y-3">
                            {loras.map((lora) => (
                              <LoRACard
                                key={lora.id}
                                lora={lora}
                                onUpdate={updateLora}
                                onDelete={deleteLora}
                                isSaving={isSaving}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Info */}
                    <div className="text-xs text-muted-foreground p-3 bg-accent/20 border border-solid border-border rounded-md">
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Icon icon={Lightbulb} size="xs" />
                        LoRA Management Tips:
                      </p>
                      <ul className="space-y-1 ml-2">
                        <li>• Use descriptive IDs (e.g., "dramatic-lighting", "character-style")</li>
                        <li>• Add trigger words to help with prompt generation</li>
                        <li>• Include links for easy model file management</li>
                        <li>• Use tags to categorize LoRAs (style, character, realistic, anime)</li>
                        <li>• Click the edit icon to modify any LoRA's properties</li>
                        <li>• LoRAs are referenced by projects, not stored in projects</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Environment Variables Tab */}
                {activeTab === 'env' && (
                  <div className="space-y-6">
                    {/* Environment Variables Header */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
                        Environment Variables
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Manage your local environment variables. These will be saved to both the database and your local .env.local file.
                      </p>
                    </div>

                    {/* Add New Environment Variable */}
                    <div className="space-y-4 p-4 bg-accent/30 border border-solid border-border rounded-lg">
                      <h4 className="text-sm font-medium text-foreground">Add New Variable</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Key
                          </label>
                          <input
                            type="text"
                            value={newEnvKey}
                            onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                            placeholder="API_KEY"
                            className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Value
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newEnvValue}
                              onChange={(e) => setNewEnvValue(e.target.value)}
                              placeholder="your-api-key-here"
                              className="flex-1 px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                            />
                            <button
                              onClick={addEnvVar}
                              disabled={isSaving || !newEnvKey.trim() || !newEnvValue.trim()}
                              className="px-3 py-2 text-sm font-medium text-background bg-foreground border border-transparent rounded-md hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
                            >
                              <Icon icon={Plus} size="xs" />
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loading State */}
                    {isLoadingEnv && (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading environment variables...</span>
                      </div>
                    )}

                    {/* Environment Variables List */}
                    {!isLoadingEnv && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">Current Variables</h4>
                        
                        {Object.keys(envVars).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon icon={Folder} size="lg" className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No environment variables configured</p>
                            <p className="text-xs mt-1">Add your first variable above to get started</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(envVars).map(([key, value]) => (
                              <EnvVarRow
                                key={key}
                                envKey={key}
                                value={value}
                                onUpdate={updateEnvVar}
                                onDelete={deleteEnvVar}
                                isUpdating={isSaving}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="text-xs text-muted-foreground p-3 bg-accent/20 border border-solid border-border rounded-md">
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Icon icon={Lightbulb} size="xs" />
                        Tips:
                      </p>
                      <ul className="space-y-1 ml-2">
                        <li>• Variables are automatically synced to your local .env.local file</li>
                        <li>• Use UPPER_CASE naming convention for environment variables</li>
                        <li>• Restart your development server after making changes</li>
                        <li>• Never commit sensitive data to version control</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-accent"
                >
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-solid border-border rounded-md hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                        Save Changes
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 