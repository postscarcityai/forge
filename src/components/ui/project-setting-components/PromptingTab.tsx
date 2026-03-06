import React from 'react';
import { Wand2 } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';
import { detectFieldType } from '@/config/formSchemas';

interface PromptingTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleImagePromptingChange: (field: string, value: unknown) => void;
  renderTextField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.JSX.Element;
  renderArrayField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.JSX.Element;
}

export const PromptingTab: React.FC<PromptingTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleImagePromptingChange,
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
              <Wand2 className="h-4 w-4" />
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

  // Get the image prompting data from the project
  const promptingData = editedProject?.imagePrompting || {};

  // Define prompting section groupings for better organization
  const corePromptFields = ['globalPrompt', 'globalNegativePrompt', 'basePrompt'];
  const styleFields = ['artStyle', 'mood', 'vibe', 'perspective', 'lightingSetup'];
  const technicalFields = ['modelPreferences', 'resolution', 'seed', 'steps', 'guidance'];
  const brandingFields = ['brandElements', 'visualGuidelines', 'colorPalette'];
  const contextFields = ['environmentDescription', 'sceneDescription', 'setting'];
  const qualityFields = ['qualityTags', 'photographyTerms', 'composition'];

  const renderPromptingSection = (title: string, fields: string[], icon = Wand2) => {
    const sectionData = fields.filter(field => promptingData[field] !== undefined);
    if (sectionData.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <icon className="h-4 w-4" />
          {title}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {fields.map(field => {
            const value = promptingData[field];
            if (value === undefined) return null;
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
      
      {/* Core Prompting */}
      {renderPromptingSection('Core Prompting', corePromptFields)}

      {/* Style & Aesthetics */}
      {renderPromptingSection('Style & Aesthetics', styleFields)}

      {/* Technical Settings */}
      {renderPromptingSection('Technical Settings', technicalFields)}

      {/* Brand Integration */}
      {renderPromptingSection('Brand Integration', brandingFields)}

      {/* Context & Environment */}
      {renderPromptingSection('Context & Environment', contextFields)}

      {/* Quality & Composition */}
      {renderPromptingSection('Quality & Composition', qualityFields)}

      {/* Dynamic Fields - Auto-render any additional prompting fields */}
      {Object.entries(promptingData).map(([key, value]) => {
        // Skip fields we've already rendered explicitly
        const explicitFields = [
          ...corePromptFields, 
          ...styleFields, 
          ...technicalFields, 
          ...brandingFields, 
          ...contextFields, 
          ...qualityFields
        ];
        if (explicitFields.includes(key) || value === undefined || value === null) return null;

        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <Wand2 className="h-4 w-4" />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {renderFieldByType(key, value)}
            </div>
          </div>
        );
      })}

      {/* Auto-Discovery Section for completely new fields */}
      {Object.keys(promptingData).length === 0 && (
        <div className="p-6 border border-dashed border-border rounded-lg text-center">
          <Wand2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No image prompting configuration found. Start editing to add AI prompting settings.
          </p>
        </div>
      )}
    </div>
  );
}; 