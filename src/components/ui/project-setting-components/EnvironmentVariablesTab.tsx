import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Eye, EyeOff, Edit, Check, Trash2 } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';
import { Icon } from '../Icon';

interface EnvironmentVariablesTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleEnvVarChange: (key: string, value: string) => void;
  handleAddEnvVar: () => void;
  handleRemoveEnvVar: (key: string) => void;
  showValues: Record<string, boolean>;
  toggleValueVisibility: (key: string) => void;
}

interface EnvVarData {
  merged: Record<string, string>;
  project: Record<string, string>;
  user: Record<string, string>;
}

interface EnvVarRowProps {
  envKey: string;
  value: string;
  source: 'user' | 'project';
  projectName?: string;
  onUpdate?: (key: string, value: string) => void;
  onDelete?: (key: string) => void;
  isUpdating: boolean;
  showValue: boolean;
  onToggleVisibility: (key: string) => void;
  isEditing: boolean;
}

const EnvVarRow: React.FC<EnvVarRowProps> = ({ 
  envKey, 
  value, 
  source, 
  projectName,
  onUpdate, 
  onDelete, 
  isUpdating,
  showValue,
  onToggleVisibility,
  isEditing
}) => {
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(envKey, editValue);
    }
    setIsEditingRow(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditingRow(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the environment variable "${envKey}"?`)) {
      if (onDelete) {
        onDelete(envKey);
      }
    }
  };

  const canEdit = isEditing && source === 'project' && onUpdate;
  const canDelete = isEditing && source === 'project' && onDelete;

  return (
    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
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
          {isEditingRow && canEdit ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-2 py-2 border border-border rounded text-sm bg-background text-foreground"
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
                {showValue ? value : '•'.repeat(Math.min(value.length, 20))}
              </div>
              <button
                onClick={() => onToggleVisibility(envKey)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title={showValue ? 'Hide value' : 'Show value'}
              >
                <Icon icon={showValue ? EyeOff : Eye} size="xs" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      {canEdit && (
        <div className="flex items-start gap-1 flex-shrink-0">
          {!isEditingRow && (
            <button
              onClick={() => setIsEditingRow(true)}
              disabled={isUpdating}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              title="Edit value"
            >
              <Icon icon={Edit} size="xs" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-accent rounded transition-colors"
              title="Delete variable"
            >
              <Icon icon={Trash2} size="xs" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const EnvironmentVariablesTab: React.FC<EnvironmentVariablesTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleEnvVarChange,
  handleAddEnvVar,
  handleRemoveEnvVar,
  showValues,
  toggleValueVisibility,
}) => {
  const [envData, setEnvData] = useState<EnvVarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // Load environment variables from both user and project sources
  useEffect(() => {
    loadEnvironmentVariables();
  }, [project.id]);

  const loadEnvironmentVariables = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/database/projects/${project.id}/env`);
      const data = await response.json();

      if (data.success) {
        setEnvData(data.data);
      } else {
        setError(data.error || 'Failed to load environment variables');
      }
    } catch (err) {
      console.error('Error loading environment variables:', err);
      setError('Failed to load environment variables');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectEnvVar = async (key: string, value: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const updatedProjectEnvVars = {
        ...(envData?.project || {}),
        [key]: value
      };

      const response = await fetch(`/api/database/projects/${project.id}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVars: updatedProjectEnvVars }),
      });

      const data = await response.json();

      if (data.success) {
        setEnvData(data.data);
        // Also update local project state
        handleEnvVarChange(key, value);
      } else {
        setError(data.error || 'Failed to save environment variable');
      }
    } catch (err) {
      console.error('Error saving environment variable:', err);
      setError('Failed to save environment variable');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProjectEnvVar = async (key: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/database/projects/${project.id}/env?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadEnvironmentVariables(); // Reload to get updated data
        // Also update local project state
        handleRemoveEnvVar(key);
      } else {
        setError(data.error || 'Failed to delete environment variable');
      }
    } catch (err) {
      console.error('Error deleting environment variable:', err);
      setError('Failed to delete environment variable');
    } finally {
      setIsSaving(false);
    }
  };

  const addProjectEnvVar = async () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) {
      setError('Both key and value are required');
      return;
    }

    // Validate key format
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(newEnvKey)) {
      setError('Environment variable names should only contain letters, numbers, and underscores, and cannot start with a number');
      return;
    }

    await updateProjectEnvVar(newEnvKey, newEnvValue);
    
    if (!error) {
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading environment variables...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-accent border border-border rounded-md text-foreground">
        <Icon icon={X} size="sm" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const allEnvVars: Array<{key: string, value: string, source: 'user' | 'project'}> = [];

  // Add user environment variables
  if (envData?.user) {
    Object.entries(envData.user).forEach(([key, value]) => {
      // Only show user vars that aren't overridden by project vars
      if (!envData.project?.[key]) {
        allEnvVars.push({ key, value, source: 'user' });
      }
    });
  }

  // Add project environment variables
  if (envData?.project) {
    Object.entries(envData.project).forEach(([key, value]) => {
      allEnvVars.push({ key, value, source: 'project' });
    });
  }

  return (
    <div className="space-y-6">
      {/* Environment Variables Header */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          Environment Variables
        </h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>Environment variables are shown with colored pills to indicate their source:</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                user
              </div>
              <span>User-level variables</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {project.name || 'project'}
              </div>
              <span>Project-level variables (override user variables)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Project Environment Variable */}
      {isEditing && (
        <div className="space-y-4 p-4 bg-accent/30 border border-border rounded-lg">
          <h4 className="text-sm font-medium text-foreground">Add New Project Variable</h4>
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
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground font-mono"
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
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                />
                <button
                  onClick={addProjectEnvVar}
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
      )}

      {/* Environment Variables List */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">Current Variables</h4>
        
        {allEnvVars.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon icon={X} size="lg" className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No environment variables configured</p>
            <p className="text-xs mt-1">Add your first project variable above to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allEnvVars.map(({ key, value, source }) => (
              <EnvVarRow
                key={`${source}-${key}`}
                envKey={key}
                value={value}
                source={source}
                projectName={project.name}
                onUpdate={source === 'project' ? updateProjectEnvVar : undefined}
                onDelete={source === 'project' ? deleteProjectEnvVar : undefined}
                isUpdating={isSaving}
                showValue={showValues[key] || false}
                onToggleVisibility={toggleValueVisibility}
                isEditing={isEditing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-3 bg-accent/20 border border-border rounded-md">
        <p className="font-medium mb-1">💡 Tips:</p>
        <ul className="space-y-1 ml-2">
          <li>• Project variables override user variables with the same name</li>
          <li>• User variables can be managed in User Settings</li>
          <li>• Use UPPER_CASE naming convention for environment variables</li>
          <li>• Restart your development server after making changes</li>
        </ul>
      </div>
    </div>
  );
}; 