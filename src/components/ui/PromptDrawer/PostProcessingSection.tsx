import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface PostProcessingSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  postProcessingControls: {
    visualEffects: boolean;
    postProcessing: boolean;
  };
  onControlToggle: (control: string) => void;
  getPostProcessingValue: (control: string) => string;
}

export const PostProcessingSection: React.FC<PostProcessingSectionProps> = ({
  isExpanded,
  onToggle,
  postProcessingControls,
  onControlToggle,
  getPostProcessingValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Sliders"
        title="Post-Processing & Effects"
        wordBudget={12}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(postProcessingControls).map(([control, enabled]) => {
              const value = getPostProcessingValue(control);
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