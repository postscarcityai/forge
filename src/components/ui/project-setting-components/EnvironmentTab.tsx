import React from 'react';
import { Layers } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';
import { detectFieldType } from '@/config/formSchemas';

interface EnvironmentTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleEnvironmentChange: (field: string, value: unknown) => void;
  renderTextField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.JSX.Element;
  renderArrayField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.JSX.Element;
}

export const EnvironmentTab: React.FC<EnvironmentTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleEnvironmentChange,
  renderTextField,
  renderArrayField,
}) => {

  const renderFieldByType = (key: string, value: any, label?: string, placeholder?: string): React.JSX.Element => {
    const fieldType = detectFieldType(value);
    const fieldLabel = label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const fieldPlaceholder = placeholder || `Enter ${key.toLowerCase()}...`;

    switch (fieldType) {
      case 'array':
        return renderArrayField(fieldLabel, 'imagePrompting', key, fieldPlaceholder);
      
      case 'textarea':
        return renderTextField(fieldLabel, 'imagePrompting', key, fieldPlaceholder, true);
      
      case 'text':
        return renderTextField(fieldLabel, 'imagePrompting', key, fieldPlaceholder, false);
      
      case 'object':
        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <Layers className="h-4 w-4" />
              {fieldLabel}
            </div>
            <div className="grid grid-cols-1 gap-4 pl-4">
              {Object.entries(value || {}).map(([nestedKey, nestedValue]) =>
                <div key={`${key}-${nestedKey}`}>
                  {renderFieldByType(`${key}.${nestedKey}`, nestedValue, undefined, `Enter ${nestedKey.toLowerCase()}...`)}
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return <></>;
    }
  };

  // Get the environment data from the project
  const environmentData = editedProject?.env || {};

  // Define environment section groupings for better organization
  const configFields = ['merged', 'project', 'user'];
  const systemFields = ['NODE_ENV', 'ENVIRONMENT', 'DEPLOYMENT'];
  const apiFields = ['API_URL', 'API_VERSION', 'API_KEY'];
  const databaseFields = ['DATABASE_URL', 'DB_HOST', 'DB_PORT'];
  const serviceFields = ['REDIS_URL', 'STORAGE_BUCKET', 'CDN_URL'];

  const renderEnvironmentSection = (title: string, fields: string[], icon = Layers, readOnly = false) => {
    const sectionData = fields.filter(field => environmentData[field] !== undefined);
    if (sectionData.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <icon className="h-4 w-4" />
          {title} {readOnly && <span className="text-xs text-muted-foreground">(Read-only)</span>}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {fields.map(field => {
            const value = environmentData[field];
            if (value === undefined) return null;
            
            if (readOnly) {
              return (
                <div key={field} className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <div className="p-3 bg-muted rounded-md text-foreground text-sm font-mono">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={field}>
                {renderFieldByType(field, value)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Status */}
      {renderEnvironmentSection('Configuration Status', configFields, Layers, true)}

      {/* System Environment */}
      {renderEnvironmentSection('System Environment', systemFields)}

      {/* API Configuration */}
      {renderEnvironmentSection('API Configuration', apiFields)}

      {/* Database Configuration */}
      {renderEnvironmentSection('Database Configuration', databaseFields)}

      {/* External Services */}
      {renderEnvironmentSection('External Services', serviceFields)}

      {/* Dynamic Fields - Auto-render any additional environment fields */}
      {Object.entries(environmentData).map(([key, value]) => {
        // Skip fields we've already rendered explicitly
        const explicitFields = [...configFields, ...systemFields, ...apiFields, ...databaseFields, ...serviceFields];
        if (explicitFields.includes(key) || value === undefined || value === null) return null;

        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <Layers className="h-4 w-4" />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {renderFieldByType(key, value)}
            </div>
          </div>
        );
      })}

      {/* Auto-Discovery Section for completely new fields */}
      {Object.keys(environmentData).length === 0 && (
        <div className="p-6 border border-dashed border-border rounded-lg text-center">
          <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No environment configuration found. This may be expected for some projects.
          </p>
        </div>
      )}
    </div>
  );
}; 