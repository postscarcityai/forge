import React from 'react';
import { BookOpen, MessageSquare, Palette, FileText, Clipboard } from 'lucide-react';
import { Project, BrandStory } from '@/contexts/ProjectContext';
import { brandStorySchema, generateDynamicSchema, detectFieldType } from '@/config/formSchemas';

interface BrandStoryTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleBrandStoryChange: (field: string, value: unknown) => void;
  handleArrayFieldChange: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number, value: string) => void;
  handleAddArrayItem: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string) => void;
  handleRemoveArrayItem: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number) => void;
  renderTextField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.JSX.Element;
  renderArrayField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.JSX.Element;
}

export const BrandStoryTab: React.FC<BrandStoryTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleBrandStoryChange,
  handleArrayFieldChange,
  handleAddArrayItem,
  handleRemoveArrayItem,
  renderTextField,
  renderArrayField,
}) => {

  const renderFieldByType = (key: string, value: any, label?: string, placeholder?: string): React.JSX.Element => {
    const fieldType = detectFieldType(value);
    const fieldLabel = label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const fieldPlaceholder = placeholder || `Enter ${key.toLowerCase()}...`;

    switch (fieldType) {
      case 'array':
        // Check if array contains objects (like messagingPillars)
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          return (
            <div key={key} className="space-y-4">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{fieldLabel}</label>
              <div className="p-3 bg-accent rounded-md space-y-3">
                {value.map((item: any, index: number) => (
                  <div key={index} className="text-foreground text-sm">
                    {typeof item === 'object' && item !== null ? (
                      <div className="space-y-1">
                        {Object.entries(item).map(([objKey, objValue]) => (
                          <div key={objKey} className="flex items-start gap-2">
                            <span className="text-muted-foreground font-medium min-w-fit">{objKey}:</span>
                            <span>{String(objValue)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{String(item)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          // Regular string array
          return renderArrayField(fieldLabel, 'brandStory', key, fieldPlaceholder);
        }
      
      case 'textarea':
        return renderTextField(fieldLabel, 'brandStory', key, fieldPlaceholder, true);
      
      case 'text':
        return renderTextField(fieldLabel, 'brandStory', key, fieldPlaceholder, false);
      
      case 'object':
        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <BookOpen className="h-4 w-4" />
              {fieldLabel}
            </div>
            <div className="grid grid-cols-1 gap-4 pl-4">
              {Object.entries(value || {}).map(([nestedKey, nestedValue]) => (
                <div key={`${key}-${nestedKey}`}>
                  {renderFieldByType(`${key}.${nestedKey}`, nestedValue, undefined, `Enter ${nestedKey.toLowerCase()}...`)}
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return <></>;
    }
  };

  const brandStoryData = editedProject?.brandStory || {};

  return (
    <div className="space-y-6">
      
      {/* Brand Foundation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <BookOpen className="h-4 w-4" />
          Brand Foundation
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Brand Narrative', 'brandStory', 'brandNarrative', 'Tell your brand story and origin...', true)}
          {renderFieldByType('brandPersonality', brandStoryData.brandPersonality, 'Brand Personality')}
        </div>
      </div>

      {/* Communication & Voice */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <MessageSquare className="h-4 w-4" />
          Communication & Voice
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Voice & Tone', 'brandStory', 'voiceAndTone', 'How your brand communicates and sounds...', true)}
          {renderFieldByType('messagingPillars', brandStoryData.messagingPillars, 'Messaging Pillars')}
        </div>
      </div>

      {/* Visual Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Palette className="h-4 w-4" />
          Visual Identity
        </div>
        <div className="space-y-4">
          {renderFieldByType('visualIdentity', brandStoryData.visualIdentity, 'Visual Identity')}
        </div>
      </div>

      {/* Content & Storytelling */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <FileText className="h-4 w-4" />
          Content & Storytelling
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField('Content Themes', 'brandStory', 'contentThemes', 'Content topic or theme...')}
          {renderTextField('Storytelling Approach', 'brandStory', 'storytellingApproach', 'How you tell stories and connect with audience...', true)}
        </div>
      </div>

      {/* Brand Implementation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Clipboard className="h-4 w-4" />
          Brand Implementation
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Brand Guidelines', 'brandStory', 'brandGuidelines', 'Implementation and usage guidelines...', true)}
          {renderTextField('Audience Connection', 'brandStory', 'audienceConnection', 'How you connect and engage with your audience...', true)}
        </div>
      </div>

      {/* Dynamic Fields - Auto-render any additional fields not explicitly handled above */}
      {Object.entries(brandStoryData).map(([key, value]) => {
        // Skip fields we've already rendered explicitly
        const explicitFields = ['brandNarrative', 'brandPersonality', 'voiceAndTone', 'messagingPillars', 'visualIdentity', 'contentThemes', 'storytellingApproach', 'brandGuidelines', 'audienceConnection'];
        if (explicitFields.includes(key)) return null;

        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <FileText className="h-4 w-4" />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {renderFieldByType(key, value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 