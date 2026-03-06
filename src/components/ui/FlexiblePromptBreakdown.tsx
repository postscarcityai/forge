'use client';

import React from 'react';
import { CapturedPromptComponents, ComponentData } from '@/utils/promptComponentCapture';

interface FlexiblePromptBreakdownProps {
  // New format - captured components
  capturedComponents?: CapturedPromptComponents;
  
  // Legacy format - individual components
  promptComponents?: {
    masterPrompt?: string;
    userInput?: string;
    characterDescription?: string;
    sceneFoundation?: string;
    technicalPhotography?: string;
    visualStyleAesthetic?: string;
    atmosphericEnvironmental?: string;
    supportingElements?: string;
    postProcessingEffects?: string;
    triggerWords?: string;
  };
  
  // Fallback - just prompt text
  prompt?: string;
  
  // Display options
  showEmptyComponents?: boolean;
  showMetadata?: boolean;
  customOrder?: string[];
}

interface DisplayComponent {
  key: string;
  name: string;
  content: string;
  wordCount: number;
  enabled: boolean;
  source: string;
  order: number;
}

export const FlexiblePromptBreakdown: React.FC<FlexiblePromptBreakdownProps> = ({ 
  capturedComponents,
  promptComponents, 
  prompt,
  showEmptyComponents = false,
  showMetadata = false,
  customOrder
}) => {
  
  // Convert any input format to standardized display format
  const displayComponents = React.useMemo(() => {
    if (capturedComponents) {
      // New format - captured components
      return convertCapturedComponents(capturedComponents, customOrder);
    } else if (promptComponents) {
      // Legacy format - convert to display format
      return convertLegacyComponents(promptComponents, customOrder);
    } else if (prompt) {
      // Fallback - show just the prompt text
      return convertPromptText(prompt);
    } else {
      return [];
    }
  }, [capturedComponents, promptComponents, prompt, customOrder]);
  
  // Filter components based on display options
  const visibleComponents = displayComponents.filter(comp => {
    if (!showEmptyComponents && comp.wordCount === 0) {
      return false;
    }
    return true;
  });
  
  // Sort components by order
  const sortedComponents = [...visibleComponents].sort((a, b) => a.order - b.order);
  
  if (sortedComponents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-accent/5 rounded-lg border">
        No prompt components available to display.
      </div>
    );
  }
  
  return (
    <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-accent/5 rounded-lg border">
      {/* Metadata section */}
      {showMetadata && capturedComponents && (
        <div className="mb-4 p-3 bg-accent/10 rounded-lg border-l-4 border-primary">
          <div className="text-xs font-bold text-primary mb-2">GENERATION METADATA</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Method: {capturedComponents.captureMethod} via {capturedComponents.generationMethod}</div>
            <div>Generated: {new Date(capturedComponents.captureTimestamp).toLocaleString()}</div>
            <div>Project: {capturedComponents.context.projectName}</div>
            <div>Total Words: {capturedComponents.totalWords}</div>
            <div>Components: {capturedComponents.context.enabledComponents.length} enabled</div>
            {capturedComponents.context.charactersUsed.length > 0 && (
              <div>Characters: {capturedComponents.context.charactersUsed.join(', ')}</div>
            )}
            {capturedComponents.context.sceneUsed && (
              <div>Scene: {capturedComponents.context.sceneUsed}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Component breakdown */}
      {sortedComponents.map((component, index: number) => (
        <div key={component.key} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              component.enabled 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground bg-muted/50'
            }`}>
              [{component.name.toUpperCase()}]
            </span>
            <span className={`text-xs ${
              component.wordCount > 0 
                ? 'text-foreground' 
                : 'text-muted-foreground'
            }`}>
              {component.wordCount} words
            </span>
            {component.source !== 'generated' && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                {component.source}
              </span>
            )}
            {!component.enabled && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                disabled
              </span>
            )}
          </div>
          <div className={`text-sm leading-relaxed pl-2 border-l-2 ${
            component.enabled 
              ? 'border-primary/20 text-foreground' 
              : 'border-muted/20 text-muted-foreground'
          }`}>
            {component.content.trim() || (
              <span className="italic text-muted-foreground">
                No content generated for this component
              </span>
            )}
          </div>
        </div>
      ))}
      
      {/* Final prompt if available */}
      {capturedComponents && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-xs font-bold text-primary mb-2">FINAL ASSEMBLED PROMPT</div>
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded max-h-20 overflow-y-auto">
            {capturedComponents.finalPrompt}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Convert captured components to display format
 */
function convertCapturedComponents(
  captured: CapturedPromptComponents, 
  customOrder?: string[]
): DisplayComponent[] {
  const componentNames = {
    masterPrompt: 'Master Prompt',
    userInput: 'User Input',
    characterDescription: 'Character Description',
    sceneFoundation: 'Scene Foundation',
    technicalPhotography: 'Technical Photography',
    visualStyleAesthetic: 'Visual Style & Aesthetic',
    atmosphericEnvironmental: 'Atmospheric & Environmental',
    supportingElements: 'Supporting Elements',
    postProcessingEffects: 'Post-Processing & Effects',
    triggerWords: 'Trigger Words'
  };
  
  return Object.entries(captured.components).map(([key, data]) => ({
    key,
    name: componentNames[key as keyof typeof componentNames] || key,
    content: data.content,
    wordCount: data.wordCount,
    enabled: data.enabled,
    source: data.source,
    order: customOrder ? customOrder.indexOf(key) : data.order
  }));
}

/**
 * Convert legacy components to display format
 */
function convertLegacyComponents(
  legacy: Record<string, string | undefined>, 
  customOrder?: string[]
): DisplayComponent[] {
  const componentNames = {
    masterPrompt: 'Master Prompt',
    userInput: 'User Input',
    characterDescription: 'Character Description',
    sceneFoundation: 'Scene Foundation',
    technicalPhotography: 'Technical Photography',
    visualStyleAesthetic: 'Visual Style & Aesthetic',
    atmosphericEnvironmental: 'Atmospheric & Environmental',
    supportingElements: 'Supporting Elements',
    postProcessingEffects: 'Post-Processing & Effects',
    triggerWords: 'Trigger Words'
  };
  
  const defaultOrder = [
    'masterPrompt', 'userInput', 'characterDescription', 'sceneFoundation',
    'technicalPhotography', 'visualStyleAesthetic', 'atmosphericEnvironmental',
    'supportingElements', 'postProcessingEffects', 'triggerWords'
  ];
  
  return Object.entries(legacy).map(([key, content], index) => {
    const safeContent = content || '';
    const words = safeContent.trim().split(/\s+/).filter(w => w.length > 0);
    
    return {
      key,
      name: componentNames[key as keyof typeof componentNames] || key,
      content: safeContent,
      wordCount: safeContent.trim() ? words.length : 0,
      enabled: true, // Assume enabled for legacy data
      source: safeContent ? 'database' : 'empty',
      order: customOrder ? customOrder.indexOf(key) : defaultOrder.indexOf(key)
    };
  });
}

/**
 * Convert plain prompt text to display format
 */
function convertPromptText(prompt: string): DisplayComponent[] {
  const words = prompt.trim().split(/\s+/).filter(w => w.length > 0);
  
  return [{
    key: 'fullPrompt',
    name: 'Full Prompt',
    content: prompt,
    wordCount: words.length,
    enabled: true,
    source: 'user-input',
    order: 0
  }];
} 