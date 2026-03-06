import React from 'react';
import { Briefcase } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';
import { detectFieldType } from '@/config/formSchemas';

interface BusinessTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleBusinessOverviewChange: (field: string, value: unknown) => void;
  renderTextField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.JSX.Element;
  renderArrayField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.JSX.Element;
}

export const BusinessTab: React.FC<BusinessTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleBusinessOverviewChange,
  renderTextField,
  renderArrayField,
}) => {

  const renderFieldByType = (key: string, value: any, label?: string, placeholder?: string): React.JSX.Element => {
    const fieldType = detectFieldType(value);
    const fieldLabel = label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const fieldPlaceholder = placeholder || `Enter ${key.toLowerCase()}...`;

    switch (fieldType) {
      case 'array':
        return renderArrayField(fieldLabel, 'businessOverview', key, fieldPlaceholder);
      
      case 'textarea':
        return renderTextField(fieldLabel, 'businessOverview', key, fieldPlaceholder, true);
      
      case 'text':
        return renderTextField(fieldLabel, 'businessOverview', key, fieldPlaceholder, false);
      
      case 'object':
        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <Briefcase className="h-4 w-4" />
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

  // Get the business data from the project
  const businessData = editedProject?.businessOverview || {};

  // Define business section groupings for better organization
  const coreBusinessFields = ['businessDescription', 'missionStatement', 'businessPhilosophy'];
  const operationsFields = ['businessModel', 'revenue', 'growthPlans'];
  const communicationFields = ['contactInfo', 'website', 'socialMedia', 'phone', 'email'];
  const additionalFields = ['location', 'goals', 'audience', 'competitors'];

  const renderBusinessSection = (title: string, fields: string[], icon = Briefcase) => {
    const sectionData = fields.filter(field => businessData[field] !== undefined);
    if (sectionData.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <icon className="h-4 w-4" />
          {title}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {fields.map(field => {
            const value = businessData[field];
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
      
      {/* Core Business Information */}
      {renderBusinessSection('Core Business Information', coreBusinessFields)}

      {/* Business Operations */}
      {renderBusinessSection('Business Operations', operationsFields)}

      {/* Communication & Contact */}
      {renderBusinessSection('Communication & Contact', communicationFields)}

      {/* Additional Information */}
      {renderBusinessSection('Additional Information', additionalFields)}

      {/* Dynamic Fields - Auto-render any additional business fields */}
      {Object.entries(businessData).map(([key, value]) => {
        // Skip fields we've already rendered explicitly
        const explicitFields = [...coreBusinessFields, ...operationsFields, ...communicationFields, ...additionalFields];
        if (explicitFields.includes(key) || value === undefined || value === null) return null;

        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
              <Briefcase className="h-4 w-4" />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {renderFieldByType(key, value)}
            </div>
          </div>
        );
      })}

      {/* Auto-Discovery Section for completely new fields */}
      {Object.keys(businessData).length === 0 && (
        <div className="p-6 border border-dashed border-border rounded-lg text-center">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No business information configured yet. Start editing to add business details.
          </p>
        </div>
      )}
    </div>
  );
}; 