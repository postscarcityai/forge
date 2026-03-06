import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface CustomPromptSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  userInput: string;
  onUserInputChange: (value: string) => void;
  userInputEnabled: boolean;
  onUserInputToggle: () => void;
}

export const CustomPromptSection: React.FC<CustomPromptSectionProps> = ({
  isExpanded,
  onToggle,
  userInput,
  onUserInputChange,
  userInputEnabled,
  onUserInputToggle,
}) => {
  const wordCount = userInput ? userInput.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Edit"
        title="Custom Prompt"
        wordBudget={wordCount}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            className="w-full p-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your custom prompt..."
          />
          {userInput && (
            <ParameterControl
              label="Include Custom Prompt"
              value={userInput}
              enabled={userInputEnabled}
              onToggle={onUserInputToggle}
            />
          )}
        </div>
      )}
    </div>
  );
}; 