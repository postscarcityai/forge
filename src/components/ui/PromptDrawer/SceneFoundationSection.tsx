import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ParameterControl } from './ParameterControl';
import { Scene } from '@/contexts/ProjectContext';

interface SceneFoundationSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  selectedScene: Scene | null;
  scenes: Scene[];
  sceneControls: {
    setting: boolean;
    timeOfDay: boolean;
    lighting: boolean;
    mood: boolean;
    cameraAngle: boolean;
    atmosphere: boolean;
    props: boolean;
  };
  loading: boolean;
  onSceneSelection: (scene: Scene | null) => void;
  onSceneControlToggle: (control: string) => void;
  getSceneValue: (scene: Scene, control: string) => string;
}

export const SceneFoundationSection: React.FC<SceneFoundationSectionProps> = ({
  isExpanded,
  onToggle,
  selectedScene,
  scenes,
  sceneControls,
  loading,
  onSceneSelection,
  onSceneControlToggle,
  getSceneValue,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="MapPin"
        title="Scene Foundation"
        wordBudget={80}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Scene Selection */}
          <select
            value={selectedScene?.id || ''}
            onChange={(e) => {
              const scene = scenes.find(s => s.id === e.target.value);
              onSceneSelection(scene || null);
            }}
            className="w-full p-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading || scenes.length === 0}
          >
            <option value="">Select scene...</option>
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>

          {/* Scene Controls */}
          {selectedScene && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
              <div className="space-y-1">
                {Object.entries(sceneControls).map(([control, enabled]) => {
                  const value = getSceneValue(selectedScene, control);
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
                      onToggle={() => onSceneControlToggle(control)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 