import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface SupportingElementsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  supportingControls: {
    surfaceTextures: boolean;
    materialProperties: boolean;
  };
  onControlToggle: (control: string) => void;
  getSupportingValue: (control: string) => string;
}

export const SupportingElementsSection: React.FC<SupportingElementsSectionProps> = ({
  isExpanded,
  onToggle,
  supportingControls,
  onControlToggle,
  getSupportingValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Layers"
        title="Supporting Elements"
        wordBudget={24}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(supportingControls).map(([control, enabled]) => {
              const value = getSupportingValue(control);
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