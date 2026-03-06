import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';

interface LoRALibraryItem {
  id: string;
  name: string;
  description?: string;
  triggerWords?: string[];
}

interface LoRAsTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleLoRAChange: (field: 'lora1' | 'lora2', value: any) => void;
  renderTextField?: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.JSX.Element;
  renderArrayField?: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.JSX.Element;
}

export const LoRAsTab: React.FC<LoRAsTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleLoRAChange,
  renderTextField,
  renderArrayField,
}) => {
  const [availableLoRAs, setAvailableLoRAs] = useState<LoRALibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available LoRAs from the library
  useEffect(() => {
    const loadLoRAs = async () => {
      try {
        const response = await fetch('/api/database/loras');
        const result = await response.json();
        if (result.success) {
          setAvailableLoRAs(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load LoRAs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLoRAs();
  }, []);

  const renderLoRASelector = (loraKey: 'lora1' | 'lora2', label: string) => {
    const currentLora = editedProject?.loras?.[loraKey];
    const selectedLoRA = availableLoRAs.find(lora => lora.id === currentLora?.id);
    
    return (
      <div className="space-y-4 p-4 border border-border rounded-lg">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Layers className="h-4 w-4" />
          {label}
        </div>
        
        <div className="space-y-4">
          {/* LoRA Selection Dropdown */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select LoRA
            </label>
            {isEditing ? (
              <select
                value={currentLora?.id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId === '') {
                    // Clear the LoRA
                    handleLoRAChange(loraKey, null);
                  } else {
                    const selectedLoRA = availableLoRAs.find(lora => lora.id === selectedId);
                    if (selectedLoRA) {
                      handleLoRAChange(loraKey, {
                        id: selectedLoRA.id,
                        name: selectedLoRA.name,
                        scale: currentLora?.scale || 0.8,
                        enabled: true
                      });
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">No LoRA selected</option>
                {availableLoRAs.map((lora) => (
                  <option key={lora.id} value={lora.id}>
                    {lora.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 border border-border rounded-md bg-muted text-foreground">
                {selectedLoRA?.name || 'No LoRA selected'}
              </div>
            )}
          </div>

          {/* LoRA Description */}
          {selectedLoRA?.description && (
            <div className="text-sm text-muted-foreground p-3 bg-accent/30 rounded-md">
              {selectedLoRA.description}
            </div>
          )}

                     {/* Trigger Words - Show in both editing and read-only modes */}
           {currentLora && (selectedLoRA?.triggerWords || currentLora.triggerWords) && (
             <div>
               <label className="block text-sm font-medium text-foreground mb-2">
                 Trigger Words
               </label>
               <div className="flex flex-wrap gap-1">
                 {(selectedLoRA?.triggerWords || currentLora.triggerWords || []).map((word, index) => (
                   <span
                     key={index}
                     className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-md border border-primary/20"
                   >
                     {word}
                   </span>
                 ))}
               </div>
             </div>
           )}

          {/* Strength Slider - Only show when editing and LoRA is selected */}
          {isEditing && currentLora && (
                  <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Strength: {(currentLora.scale || 0.8).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                value={currentLora.scale || 0.8}
                      onChange={(e) => {
                  const newScale = parseFloat(e.target.value);
                  handleLoRAChange(loraKey, {
                          ...currentLora,
                    scale: newScale
                  });
                      }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.0</span>
                <span>1.0</span>
                <span>2.0</span>
                    </div>
                  </div>
          )}

          {/* Read-only strength display when not editing */}
          {!isEditing && currentLora && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Strength
                    </label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted text-foreground">
                {(currentLora.scale || 0.8).toFixed(1)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading LoRAs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-foreground">LoRA Configuration</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Select up to 2 LoRAs from your library to enhance image generation with specific styles and effects.
        </p>
      </div>
      
      {/* LoRA 1 */}
      {renderLoRASelector('lora1', 'LoRA Slot 1')}

      {/* LoRA 2 */}
      {renderLoRASelector('lora2', 'LoRA Slot 2')}

      {/* Info Panel */}
      <div className="p-4 bg-accent/30 border border-border rounded-lg">
        <h4 className="text-sm font-medium text-foreground mb-2">LoRA Usage Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Strength 0.5-1.0:</strong> Subtle style influence</li>
          <li>• <strong>Strength 1.0-1.5:</strong> Balanced style application</li>
          <li>• <strong>Strength 1.5-2.0:</strong> Strong style dominance</li>
          <li>• Use trigger words in your prompts for best results</li>
        </ul>
          </div>
    </div>
  );
}; 