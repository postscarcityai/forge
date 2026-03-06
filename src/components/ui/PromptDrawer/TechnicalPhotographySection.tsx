import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface TechnicalPhotographySectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  technicalControls: {
    cameraAngle: boolean;
    shotType: boolean;
    lensType: boolean;
    focalLength: boolean;
    lightingStyle: boolean;
    lightDirection: boolean;
    lightQuality: boolean;
    shadowStyle: boolean;
    technicalQualityBooster: boolean;
    aspectRatio: boolean;
    resolution: boolean;
  };
  onControlToggle: (control: string) => void;
  getTechnicalValue: (control: string) => string;
}

export const TechnicalPhotographySection: React.FC<TechnicalPhotographySectionProps> = ({
  isExpanded,
  onToggle,
  technicalControls,
  onControlToggle,
  getTechnicalValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Camera"
        title="Technical Photography"
        wordBudget={48}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(technicalControls).map(([control, enabled]) => {
              const value = getTechnicalValue(control);
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