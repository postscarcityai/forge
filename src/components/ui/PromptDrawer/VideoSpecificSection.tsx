import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';

interface VideoSpecificSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  videoControls: {
    motionBlur: boolean;
    depthOfField: boolean;
    videoTransitions: boolean;
    frameRate: boolean;
  };
  onControlToggle: (control: string) => void;
  getVideoValue: (control: string) => string;
}

export const VideoSpecificSection: React.FC<VideoSpecificSectionProps> = ({
  isExpanded,
  onToggle,
  videoControls,
  onControlToggle,
  getVideoValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Video"
        title="Video-Specific Elements"
        wordBudget={25}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(videoControls).map(([control, enabled]) => {
              const value = getVideoValue(control);
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