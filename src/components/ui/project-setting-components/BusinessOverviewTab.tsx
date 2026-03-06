import React from 'react';
import { Project, BusinessOverview } from '@/contexts/ProjectContext';

interface BusinessOverviewTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleBusinessOverviewChange: (field: string, value: unknown) => void;
  handleArrayFieldChange: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number, value: string) => void;
  handleAddArrayItem: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string) => void;
  handleRemoveArrayItem: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number) => void;
  renderTextField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => JSX.Element;
  renderArrayField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => JSX.Element;
}

export const BusinessOverviewTab: React.FC<BusinessOverviewTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleBusinessOverviewChange,
  handleArrayFieldChange,
  handleAddArrayItem,
  handleRemoveArrayItem,
  renderTextField,
  renderArrayField,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {renderTextField('Company Description', 'businessOverview', 'companyDescription', 'Brief overview of your company...', true)}
        
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Mission Statement', 'businessOverview', 'missionStatement', 'What your company aims to achieve...', true)}
          {renderTextField('Vision Statement', 'businessOverview', 'visionStatement', 'Where you see your company going...', true)}
        </div>

        {renderArrayField('Core Values', 'businessOverview', 'coreValues', 'Enter a core value...')}
        
        {renderTextField('Target Audience', 'businessOverview', 'targetAudience', 'Who your primary customers are...', true)}
        
        {renderArrayField('Offerings', 'businessOverview', 'offerings', 'Product, service, or content type...')}
        
        {renderArrayField('Key Differentiators', 'businessOverview', 'keyDifferentiators', 'What sets you apart...')}
        
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Industry Context', 'businessOverview', 'industryContext', 'Industry background and positioning...', true)}
          {renderTextField('Geographic Scope', 'businessOverview', 'geographicScope', 'Where you operate or serve...')}
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
            📞 Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {renderTextField('Phone', 'businessOverview', 'contactInfo.phone', '(555) 123-4567')}
            {renderTextField('Email', 'businessOverview', 'contactInfo.email', 'contact@company.com')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderTextField('Website', 'businessOverview', 'contactInfo.website', 'https://company.com')}
            {renderTextField('Additional Offices', 'businessOverview', 'contactInfo.additionalOffices', 'NY • CA • TX')}
          </div>
          {renderTextField('Address', 'businessOverview', 'contactInfo.address', 'Full business address...', true)}
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
            📊 Key Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {renderTextField('Experience', 'businessOverview', 'keyMetrics.experience', '25+ years')}
            {renderTextField('Clients Served', 'businessOverview', 'keyMetrics.clientsDefended', 'Hundreds of clients nationwide')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderTextField('Financial Impact', 'businessOverview', 'keyMetrics.restitutionReturned', 'Millions in restitution returned')}
            {renderTextField('Case Successes', 'businessOverview', 'keyMetrics.caseSuccesses', 'Notable case outcomes...', true)}
          </div>
        </div>

        {/* Professional Memberships */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
            🏆 Professional Memberships
          </h3>
          {renderArrayField('Professional Organizations', 'businessOverview', 'professionalMemberships', 'Professional organization or bar association...')}
        </div>
      </div>
    </div>
  );
}; 