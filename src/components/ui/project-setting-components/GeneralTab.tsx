import React from 'react';
import { Settings, Info } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';
import { 
  ASPECT_RATIO_OPTIONS, 
  getAspectRatioLabel,
  AspectRatioOption 
} from '@/config/aspectRatios';

interface GeneralTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleFieldChange?: (field: keyof Project, value: unknown) => void;
  handleGeneralChange?: (field: string, value: unknown) => void;
  renderTextField?: (label: string, section: 'general' | 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.JSX.Element;
  renderArrayField?: (label: string, section: 'general' | 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.JSX.Element;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleFieldChange,
  handleGeneralChange,
  renderTextField,
  renderArrayField,
}) => {

  const handleChange = handleGeneralChange || handleFieldChange;

  // Debug logging
  console.log('GeneralTab Debug:', {
    editedProject: editedProject,
    project: project,
    isEditing,
    hasHandlers: !!handleChange
  });

  // Group aspect ratios by category for the dropdown
  const portraitRatios = ASPECT_RATIO_OPTIONS.filter(opt => opt.category === 'portrait');
  const landscapeRatios = ASPECT_RATIO_OPTIONS.filter(opt => opt.category === 'landscape');
  const squareRatios = ASPECT_RATIO_OPTIONS.filter(opt => opt.category === 'square');
  const specialRatios = ASPECT_RATIO_OPTIONS.filter(opt => opt.category === 'special');

  const renderAspectRatioOption = (opt: AspectRatioOption) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}{opt.note ? ` - ${opt.note}` : ''}
    </option>
  );

  const renderField = (
    key: string, 
    value: any, 
    label: string, 
    isReadOnly = false,
    fieldType: 'text' | 'select' | 'number' | 'date' = 'text'
  ) => {
    return (
      <div key={key} className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {isEditing && !isReadOnly ? (
          fieldType === 'select' && key === 'defaultImageOrientation' ? (
            <select
              value={value || '9:16'}
              onChange={(e) => handleChange?.(key as any, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
            >
              <optgroup label="📱 Portrait">
                {portraitRatios.map(renderAspectRatioOption)}
              </optgroup>
              <optgroup label="🖥️ Landscape">
                {landscapeRatios.map(renderAspectRatioOption)}
              </optgroup>
              <optgroup label="⬜ Square">
                {squareRatios.map(renderAspectRatioOption)}
              </optgroup>
              <optgroup label="⭐ Special Formats">
                {specialRatios.map(renderAspectRatioOption)}
              </optgroup>
            </select>
          ) : fieldType === 'select' && key === 'status' ? (
            <select
              value={value || 'active'}
              onChange={(e) => handleChange?.(key as any, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          ) : fieldType === 'select' && key === 'isEditable' ? (
            <select
              value={value ? 'true' : 'false'}
              onChange={(e) => handleChange?.(key as any, e.target.value === 'true')}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange?.(key as any, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          )
        ) : (
          <div className="p-3 bg-accent rounded-md text-foreground text-sm">
            {key === 'defaultImageOrientation' ? (
              getAspectRatioLabel(value || '9:16')
            ) : key === 'isEditable' ? (
              value ? 'Yes' : 'No'
            ) : key === 'status' ? (
              (value || 'active').charAt(0).toUpperCase() + (value || 'active').slice(1)
            ) : fieldType === 'date' && value ? (
              new Date(value).toLocaleString()
            ) : (
              value || 'Not specified'
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Primary Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Settings className="h-4 w-4" />
          Project Information
        </div>
        <div className="space-y-4">
          {renderField('name', editedProject?.name, 'Name')}
          {renderField('description', editedProject?.description, 'Description')}
          {renderField('slug', editedProject?.slug, 'Slug')}
          {renderField('color', editedProject?.color, 'Color')}
          {renderField('status', editedProject?.status, 'Status', false, 'select')}
        </div>
      </div>
      
      {/* Project Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Settings className="h-4 w-4" />
          Project Settings
        </div>
        <div className="space-y-4">
          {renderField('defaultImageOrientation', editedProject?.defaultImageOrientation, 'Default Image Orientation (Aspect Ratio)', false, 'select')}
          {renderField('isEditable', editedProject?.isEditable, 'Is Editable', false, 'select')}
          {renderField('imageCount', editedProject?.imageCount, 'Image Count', true, 'number')}
        </div>
      </div>
      
      {/* System Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Info className="h-4 w-4" />
          System Information
        </div>
        <div className="space-y-4">
          {renderField('id', editedProject?.id || project?.id, 'ID', true)}
          {renderField('lastActivity', editedProject?.lastActivity, 'Last Activity', true, 'date')}
          {renderField('created_at', (editedProject as any)?.created_at || (project as any)?.created_at, 'Created At', true, 'date')}
          {renderField('updated_at', (editedProject as any)?.updated_at || (project as any)?.updated_at, 'Updated At', true, 'date')}
        </div>
      </div>
    </div>
  );
}; 