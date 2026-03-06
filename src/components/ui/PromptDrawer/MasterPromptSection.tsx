import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface MasterPromptSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  masterPrompt: string;
  masterPromptEnabled: boolean;
  onMasterPromptToggle: () => void;
}

export const MasterPromptSection: React.FC<MasterPromptSectionProps> = ({
  isExpanded,
  onToggle,
  masterPrompt,
  masterPromptEnabled,
  onMasterPromptToggle,
}) => {
  const wordCount = masterPrompt ? masterPrompt.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Target"
        title="Master Prompt Foundation"
        wordBudget={wordCount}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <ParameterControl
            label="Master Prompt"
            value={masterPrompt || 'No master prompt configured'}
            enabled={masterPromptEnabled}
            onToggle={onMasterPromptToggle}
          />
        </div>
      )}
    </div>
  );
}; 