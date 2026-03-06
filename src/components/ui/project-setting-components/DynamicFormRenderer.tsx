import React from 'react';
import { BookOpen, MessageSquare, Palette, FileText, Clipboard } from 'lucide-react';

interface FieldConfig {
  type: 'text' | 'textarea' | 'array' | 'object';
  label: string;
  placeholder?: string;
  icon?: React.ReactNode;
  section?: string;
}

interface SchemaConfig {
  [key: string]: FieldConfig | SchemaConfig;
}

interface DynamicFormRendererProps {
  data: any;
  editedData: any;
  schema: SchemaConfig;
  isEditing: boolean;
  onChange: (field: string, value: unknown) => void;
  onArrayChange: (field: string, index: number, value: string) => void;
  onArrayAdd: (field: string) => void;
  onArrayRemove: (field: string, index: number) => void;
  renderTextField: (label: string, section: string, field: string, placeholder?: string, isTextarea?: boolean) => JSX.Element;
  renderArrayField: (label: string, section: string, field: string, placeholder?: string) => JSX.Element;
  sectionName: string;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  data,
  editedData,
  schema,
  isEditing,
  onChange,
  onArrayChange,
  onArrayAdd,
  onArrayRemove,
  renderTextField,
  renderArrayField,
  sectionName
}) => {
  
  const renderField = (key: string, config: FieldConfig | SchemaConfig, parentPath = ''): JSX.Element => {
    const fieldPath = parentPath ? `${parentPath}.${key}` : key;
    
    // If config has a 'type' property, it's a FieldConfig
    if ('type' in config) {
      const fieldConfig = config as FieldConfig;
      
      switch (fieldConfig.type) {
        case 'text':
          return renderTextField(
            fieldConfig.label,
            sectionName,
            fieldPath,
            fieldConfig.placeholder,
            false
          );
        
        case 'textarea':
          return renderTextField(
            fieldConfig.label,
            sectionName,
            fieldPath,
            fieldConfig.placeholder,
            true
          );
        
        case 'array':
          return renderArrayField(
            fieldConfig.label,
            sectionName,
            fieldPath,
            fieldConfig.placeholder
          );
        
        case 'object':
          // For objects, render the nested fields
          const nestedData = getNestedValue(data, fieldPath);
          if (!nestedData || typeof nestedData !== 'object') return <></>;
          
          return (
            <div key={fieldPath} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
                {fieldConfig.icon}
                {fieldConfig.label}
              </div>
              <div className="grid grid-cols-1 gap-4 pl-4">
                {Object.entries(nestedData).map(([nestedKey]) => {
                  const nestedConfig = getNestedConfig(schema, fieldPath, nestedKey);
                  if (nestedConfig) {
                    return renderField(nestedKey, nestedConfig, fieldPath);
                  }
                  return null;
                })}
              </div>
            </div>
          );
        
        default:
          return <></>;
      }
    }
    
    // Otherwise, it's a nested SchemaConfig - render as a section
    const schemaConfig = config as SchemaConfig;
    return (
      <div key={fieldPath} className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          {/* You could add section icons here */}
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(schemaConfig).map(([nestedKey, nestedConfig]) =>
            renderField(nestedKey, nestedConfig, fieldPath)
          )}
        </div>
      </div>
    );
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getNestedConfig = (schema: SchemaConfig, path: string, key: string): FieldConfig | SchemaConfig | null => {
    const pathParts = path.split('.');
    let current: any = schema;
    
    for (const part of pathParts) {
      current = current[part];
      if (!current) return null;
    }
    
    return current[key] || null;
  };

  return (
    <div className="space-y-6">
      {Object.entries(schema).map(([key, config]) =>
        renderField(key, config)
      )}
    </div>
  );
};

// Schema definitions can be moved to separate config files
export const brandStorySchema: SchemaConfig = {
  brandNarrative: {
    type: 'textarea',
    label: 'Brand Narrative',
    placeholder: 'Tell your brand story and origin...'
  },
  brandPersonality: {
    type: 'object',
    label: 'Brand Personality',
    icon: <BookOpen className="h-4 w-4" />
  },
  // Dynamic schema will automatically detect tone, voice, characteristics from data
  voiceAndTone: {
    type: 'textarea',
    label: 'Voice & Tone',
    placeholder: 'How your brand communicates and sounds...'
  },
  messagingPillars: {
    type: 'array',
    label: 'Messaging Pillars',
    placeholder: 'Core message or value proposition...'
  },
  visualIdentity: {
    type: 'object',
    label: 'Visual Identity',
    icon: <Palette className="h-4 w-4" />
  },
  contentThemes: {
    type: 'array',
    label: 'Content Themes',
    placeholder: 'Content topic or theme...'
  },
  storytellingApproach: {
    type: 'textarea',
    label: 'Storytelling Approach',
    placeholder: 'How you tell stories and connect with audience...'
  },
  brandGuidelines: {
    type: 'textarea',
    label: 'Brand Guidelines',
    placeholder: 'Implementation and usage guidelines...'
  },
  audienceConnection: {
    type: 'textarea',
    label: 'Audience Connection',
    placeholder: 'How you connect and engage with your audience...'
  }
};

export default DynamicFormRenderer; 