import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface AtmosphericSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  atmosphericControls: {
    atmosphericEffects: boolean;
    timeOfDay: boolean;
    environment: boolean;
  };
  onControlToggle: (control: string) => void;
  getAtmosphericValue: (control: string) => string;
}

export const AtmosphericSection: React.FC<AtmosphericSectionProps> = ({
  isExpanded,
  onToggle,
  atmosphericControls,
  onControlToggle,
  getAtmosphericValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Cloud"
        title="Atmospheric & Environmental"
        wordBudget={32}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(atmosphericControls).map(([control, enabled]) => {
              const value = getAtmosphericValue(control);
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