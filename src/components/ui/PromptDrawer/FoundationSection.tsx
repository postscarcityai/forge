import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface FoundationSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  foundationControls: {
    foundationPrompt: boolean;
    promptingStrategy: boolean;
    sceneTemplates: boolean;
  };
  onControlToggle: (control: string) => void;
  getFoundationValue: (control: string) => string;
}

export const FoundationSection: React.FC<FoundationSectionProps> = ({
  isExpanded,
  onToggle,
  foundationControls,
  onControlToggle,
  getFoundationValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Target"
        title="Foundation & Strategy"
        wordBudget={60}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(foundationControls).map(([control, enabled]) => {
              const value = getFoundationValue(control);
              // Only render the control if there's a value set
              const safeValue = typeof value === 'string' ? value : String(value || '');
              if (!safeValue || safeValue.trim() === '') {
                return null;
              }
              return (
                <ParameterControl
                  key={control}
                  label={control.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  value={safeValue}
                  enabled={enabled}
                  onToggle={() => onControlToggle(control)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 