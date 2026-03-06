import React from 'react';
import { SectionHeader } from './SectionHeader';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Switch } from '@/components/ui/switch';

interface LoraSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  loraControls?: Record<string, boolean>;
  onControlToggle?: (control: string) => void;
}

export const LoraSection: React.FC<LoraSectionProps> = ({
  isExpanded,
  onToggle,
  loraControls = {},
  onControlToggle,
}) => {
  const { currentProject, getProjectLoRATriggerWords } = useProjectContext();
  
  // Get actual trigger words from the project's LoRA configuration
  const triggerWords = currentProject ? getProjectLoRATriggerWords(currentProject) : [];
  
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Zap"
        title="LoRA Trigger Words"
        wordBudget={30}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3">
          {triggerWords.length > 0 ? (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">Trigger Words</h5>
              <div className="space-y-2">
                {triggerWords.map((word, index) => {
                  // Create control keys for both LoRA 1 and LoRA 2 (following existing pattern)
                  const lora1Key = `lora1_${word}`;
                  const lora2Key = `lora2_${word}`;
                  
                  // Check if this trigger word is enabled (either lora1 or lora2 variant)
                  const isEnabled = loraControls[lora1Key] !== false && loraControls[lora2Key] !== false;
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                      <span className="font-mono text-sm text-foreground">{word}</span>
                      <Switch
                        checked={isEnabled}
                        onChange={() => {
                          if (onControlToggle) {
                            // Toggle both lora1 and lora2 variants to maintain consistency
                            onControlToggle(lora1Key);
                            onControlToggle(lora2Key);
                          }
                        }}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Toggle trigger words on/off to control which LoRA terms are included in your prompt.
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-3">
              No LoRA models configured for this project.
              <br />
              Configure LoRAs in project settings to see trigger words here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 