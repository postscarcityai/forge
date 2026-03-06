import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Eye, EyeOff, Edit, Check, Trash2, Key, Copy, RefreshCw } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';
import { Icon } from '../Icon';

interface ApiKeysTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleEnvVarChange: (key: string, value: string) => void;
  handleAddEnvVar: () => void;
  handleRemoveEnvVar: (key: string) => void;
  showValues: Record<string, boolean>;
  toggleValueVisibility: (key: string) => void;
}

interface ApiKeyData {
  merged: Record<string, string>;
  project: Record<string, string>;
  user: Record<string, string>;
}

interface ApiKeyRowProps {
  keyName: string;
  value: string;
  source: 'user' | 'project';
  projectName?: string;
  onUpdate?: (key: string, value: string) => void;
  onDelete?: (key: string) => void;
  onCopy?: (value: string) => void;
  isUpdating: boolean;
  showValue: boolean;
  onToggleVisibility: (key: string) => void;
  isEditing: boolean;
}

// Common API key patterns for validation and suggestions
const API_KEY_PATTERNS = {
  'OPENAI_API_KEY': { pattern: /^sk-[A-Za-z0-9]{48,}$/, description: 'OpenAI API Key (starts with sk-)' },
  'ANTHROPIC_API_KEY': { pattern: /^sk-ant-[A-Za-z0-9_-]{95,}$/, description: 'Anthropic API Key (starts with sk-ant-)' },
  'FLUX_API_KEY': { pattern: /^[A-Za-z0-9_-]{32,}$/, description: 'Flux API Key' },
  'KLING_API_KEY': { pattern: /^[A-Za-z0-9_-]{32,}$/, description: 'Kling API Key' },
  'REPLICATE_API_TOKEN': { pattern: /^r8_[A-Za-z0-9]{40}$/, description: 'Replicate API Token (starts with r8_)' },
  'HUGGINGFACE_API_TOKEN': { pattern: /^hf_[A-Za-z0-9]{37}$/, description: 'Hugging Face API Token (starts with hf_)' },
};

const ApiKeyRow: React.FC<ApiKeyRowProps> = ({ 
  keyName, 
  value, 
  source, 
  projectName,
  onUpdate, 
  onDelete,
  onCopy,
  isUpdating,
  showValue,
  onToggleVisibility,
  isEditing
}) => {
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(keyName, editValue);
    }
    setIsEditingRow(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditingRow(false);
  };

  const handleDelete = () => {
    if (confirm(`🔐 Whoa there! Are you sure you want to delete the API key "${keyName}"? This might break some integrations that depend on it!`)) {
      if (onDelete) {
        onDelete(keyName);
      }
    }
  };

  const handleCopy = async () => {
    if (onCopy) {
      onCopy(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Get validation info for this key
  const validationInfo = API_KEY_PATTERNS[keyName as keyof typeof API_KEY_PATTERNS];
  const isValidKey = validationInfo ? validationInfo.pattern.test(value) : true;

  const canEdit = isEditing && source === 'project' && onUpdate;
  const canDelete = isEditing && source === 'project' && onDelete;

  return (
    <div className={`
      p-4 bg-background border rounded-lg transition-all
      ${!isValidKey ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/20' : 'border-border'}
    `}>
      {/* Header with key info */}
      <div className="flex items-center gap-3 mb-3">
        <Icon icon={Key} size="sm" className="text-blue-500" />
        
        {/* Source pill */}
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
          ${source === 'user' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }
        `}>
          {source === 'user' ? 'user' : (projectName || 'project')}
        </div>

        <h4 className="text-sm font-mono font-medium text-foreground flex-1">
          {keyName}
        </h4>

        {/* Validation status */}
        {validationInfo && !isValidKey && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            Invalid format
          </div>
        )}
      </div>

      {/* Key description if available */}
      {validationInfo && (
        <div className="text-xs text-muted-foreground mb-3">
          Expected: {validationInfo.description}
        </div>
      )}
      
      {/* Value section */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          API Key Value
        </label>
        
        {isEditingRow && canEdit ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded text-sm bg-background text-foreground font-mono"
              autoFocus
              placeholder="Enter your API key..."
            />
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-3 py-2 text-xs bg-foreground text-background rounded hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              title="Save changes"
            >
              <Icon icon={Check} size="xs" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="px-3 py-2 text-xs bg-accent text-foreground rounded hover:bg-muted transition-colors"
              title="Cancel changes"
            >
              <Icon icon={X} size="xs" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-accent/50 rounded text-sm font-mono text-foreground break-all">
              {showValue ? value : '•'.repeat(Math.min(value.length, 32))}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleVisibility(keyName)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title={showValue ? 'Hide API key' : 'Show API key'}
              >
                <Icon icon={showValue ? EyeOff : Eye} size="xs" />
              </button>
              
              {showValue && (
                <button
                  onClick={handleCopy}
                  className={`
                    p-2 transition-colors
                    ${copySuccess 
                      ? 'text-green-500' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                  title={copySuccess ? 'Copied!' : 'Copy API key'}
                >
                  <Icon icon={copySuccess ? Check : Copy} size="xs" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons for editing */}
      {(canEdit || canDelete) && (
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
          {canEdit && !isEditingRow && (
            <button
              onClick={() => setIsEditingRow(true)}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors flex items-center gap-1"
            >
              <Icon icon={Edit} size="xs" />
              Edit
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-accent rounded transition-colors flex items-center gap-1"
            >
              <Icon icon={Trash2} size="xs" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const ApiKeysTab: React.FC<ApiKeysTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleEnvVarChange,
  handleAddEnvVar,
  handleRemoveEnvVar,
  showValues,
  toggleValueVisibility,
}) => {
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [selectedKeyType, setSelectedKeyType] = useState('');

  // Load API keys from both user and project sources
  useEffect(() => {
    loadApiKeys();
  }, [project.id]);

  const loadApiKeys = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/database/projects/${project.id}/env`);
      const data = await response.json();

      if (data.success) {
        setApiKeyData(data.data);
      } else {
        setError(data.error || 'Failed to load API keys');
      }
    } catch (err) {
      console.error('Error loading API keys:', err);
      setError('🔑 Oops! Looks like our key vault got locked. Try refreshing the page!');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectApiKey = async (key: string, value: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const updatedProjectKeys = {
        ...(apiKeyData?.project || {}),
        [key]: value
      };

      const response = await fetch(`/api/database/projects/${project.id}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVars: updatedProjectKeys }),
      });

      const data = await response.json();

      if (data.success) {
        setApiKeyData(data.data);
        handleEnvVarChange(key, value);
      } else {
        setError(data.error || '🔐 Hmm, our key manager is being a bit stubborn. Try again?');
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('🔑 Something went wrong while saving your key. Maybe it got stage fright?');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProjectApiKey = async (key: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/database/projects/${project.id}/env?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys();
        handleRemoveEnvVar(key);
      } else {
        setError(data.error || '🔐 The key refused to leave! Try coaxing it out again.');
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('🔑 Failed to delete the key. It might be hiding somewhere!');
    } finally {
      setIsSaving(false);
    }
  };

  const addProjectApiKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setError('🔑 Both key name and value are required. No empty keys allowed!');
      return;
    }

    // Validate key format
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(newKeyName)) {
      setError('🔐 API key names should follow the SCREAMING_SNAKE_CASE convention!');
      return;
    }

    await updateProjectApiKey(newKeyName, newKeyValue);
    
    if (!error) {
      setNewKeyName('');
      setNewKeyValue('');
      setSelectedKeyType('');
    }
  };

  const handleCopyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleKeyTypeSelect = (keyType: string) => {
    setSelectedKeyType(keyType);
    setNewKeyName(keyType);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm text-muted-foreground">🔑 Unlocking your key vault...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-solid border-destructive-border rounded-lg text-red-800 dark:bg-red-950/20 dark:text-red-200">
        <Icon icon={X} size="sm" />
        <div className="flex-1">
          <span className="text-sm font-medium">Error</span>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            loadApiKeys();
          }}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          title="Retry"
        >
          <Icon icon={RefreshCw} size="xs" />
        </button>
      </div>
    );
  }

  // Filter only API key-like environment variables
  const isApiKey = (key: string) => 
    key.includes('API_KEY') || 
    key.includes('API_TOKEN') || 
    key.includes('SECRET') ||
    key.includes('TOKEN') ||
    Object.keys(API_KEY_PATTERNS).includes(key);

  const allApiKeys: Array<{key: string, value: string, source: 'user' | 'project'}> = [];

  // Add user API keys
  if (apiKeyData?.user) {
    Object.entries(apiKeyData.user)
      .filter(([key]) => isApiKey(key))
      .forEach(([key, value]) => {
        // Only show user keys that aren't overridden by project keys
        if (!apiKeyData.project?.[key]) {
          allApiKeys.push({ key, value, source: 'user' });
        }
      });
  }

  // Add project API keys
  if (apiKeyData?.project) {
    Object.entries(apiKeyData.project)
      .filter(([key]) => isApiKey(key))
      .forEach(([key, value]) => {
        allApiKeys.push({ key, value, source: 'project' });
      });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon icon={Key} size="lg" className="text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">API Keys & Tokens</h3>
            <p className="text-sm text-muted-foreground">Manage your project's API keys and access tokens</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-solid border-info-border rounded-lg dark:bg-blue-950/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                user
              </div>
              <span className="text-sm font-medium">User-level keys</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Keys set at the user level. Available across all projects.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {project.name || 'project'}
              </div>
              <span className="text-sm font-medium">Project-level keys</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Keys specific to this project. Override user-level keys.
            </p>
          </div>
        </div>
      </div>

      {/* Add New API Key */}
      {isEditing && (
        <div className="space-y-6 p-6 bg-accent/30 border border-border rounded-lg">
          <h4 className="text-base font-medium text-foreground flex items-center gap-2">
            <Icon icon={Plus} size="sm" />
            Add New API Key
          </h4>
          
          {/* Quick select for common API keys */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Popular API Keys</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(API_KEY_PATTERNS).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleKeyTypeSelect(key)}
                  className={`
                    p-3 text-left border rounded-lg transition-all text-sm
                    ${selectedKeyType === key 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                      : 'border-border hover:border-blue-300 bg-background'
                    }
                  `}
                >
                  <div className="font-medium text-foreground">{key.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{info.description.split(' (')[0]}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Manual input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                placeholder="MY_API_KEY"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-background text-foreground font-mono"
              />
              <p className="text-xs text-muted-foreground">Use UPPER_SNAKE_CASE format</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key Value</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Enter your API key here..."
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-background text-foreground"
                />
                <button
                  onClick={addProjectApiKey}
                  disabled={isSaving || !newKeyName.trim() || !newKeyValue.trim()}
                  className="px-4 py-2 text-sm font-medium text-background bg-foreground border border-transparent rounded-md hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                >
                  <Icon icon={Plus} size="xs" />
                  Add Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-foreground">Your API Keys</h4>
        
        {allApiKeys.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Icon icon={Key} size="xl" className="mx-auto mb-4 text-muted-foreground/50" />
            <h5 className="text-lg font-medium text-foreground mb-2">No API Keys Found</h5>
            <p className="text-sm text-muted-foreground mb-4">
              🔑 Looks like your key collection is empty! Add your first API key to unlock integrations.
            </p>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Use the form above to add your first API key
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {allApiKeys.map(({ key, value, source }) => (
              <ApiKeyRow
                key={`${source}-${key}`}
                keyName={key}
                value={value}
                source={source}
                projectName={project.name}
                onUpdate={source === 'project' ? updateProjectApiKey : undefined}
                onDelete={source === 'project' ? deleteProjectApiKey : undefined}
                onCopy={handleCopyKey}
                isUpdating={isSaving}
                showValue={showValues[key] || false}
                onToggleVisibility={toggleValueVisibility}
                isEditing={isEditing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 bg-accent/20 border border-border rounded-lg">
        <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          💡 Security Tips
        </h5>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Keep your API keys secure and never share them publicly</li>
          <li>• Rotate your keys regularly for better security</li>
          <li>• Project keys override user keys with the same name</li>
          <li>• Use specific key names to avoid conflicts (e.g., OPENAI_API_KEY vs API_KEY)</li>
          <li>• Test your keys after adding them to ensure they work correctly</li>
        </ul>
      </div>
    </div>
  );
}; 