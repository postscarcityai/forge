import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface VisualStyleSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  styleControls: {
    overallStyle: boolean;
    colorPalette: boolean;
    artisticReferences: boolean;
    aestheticDirection: boolean;
    mood: boolean;
    colorTemperature: boolean;
    saturation: boolean;
    visualStyleInjector: boolean;
    characterModifiers: boolean;
  };
  onControlToggle: (control: string) => void;
  getStyleValue: (control: string) => string;
}

export const VisualStyleSection: React.FC<VisualStyleSectionProps> = ({
  isExpanded,
  onToggle,
  styleControls,
  onControlToggle,
  getStyleValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Palette"
        title="Visual Style & Aesthetic"
        wordBudget={48}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(styleControls).map(([control, enabled]) => {
              const value = getStyleValue(control);
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