'use client';

import React, { useState, useEffect } from 'react';

interface LabeledPromptBreakdownProps {
  prompt: string;
  projectId?: string;
  characterName?: string;
  sceneName?: string;
  userPrompt?: string;
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
}

interface AnalysisResult {
  totalWords: number;
  compliance: boolean;
  components: Array<{
    name: string;
    content: string;
    actualWords: number;
    budget: number;
    utilizationPercentage: number;
  }>;
}

export const LabeledPromptBreakdown: React.FC<LabeledPromptBreakdownProps> = ({ 
  prompt, 
  projectId, 
  characterName, 
  sceneName, 
  userPrompt,
  promptComponents 
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzePrompt = async () => {
      try {
        setIsLoading(true);
        
        // If we have prompt components from metadata, use them directly
        if (promptComponents) {
          const componentOrder = [
            { key: 'masterPrompt', name: 'MASTER PROMPT' },
            { key: 'userInput', name: 'USER INPUT' },
            { key: 'characterDescription', name: 'CHARACTER DESCRIPTION' },
            { key: 'sceneFoundation', name: 'SCENE FOUNDATION' },
            { key: 'technicalPhotography', name: 'TECHNICAL PHOTOGRAPHY' },
            { key: 'visualStyleAesthetic', name: 'VISUAL STYLE & AESTHETIC' },
            { key: 'atmosphericEnvironmental', name: 'ATMOSPHERIC & ENVIRONMENTAL' },
            { key: 'supportingElements', name: 'SUPPORTING ELEMENTS' },
            { key: 'postProcessingEffects', name: 'POST-PROCESSING & EFFECTS' },
            { key: 'triggerWords', name: 'TRIGGER WORDS' }
          ];
          
          const components = componentOrder.map(({ key, name }) => {
            const content = promptComponents[key as keyof typeof promptComponents] || '';
            const words = content.trim().split(/\s+/).filter(w => w.length > 0);
            return {
              name,
              content,
              actualWords: content.trim() ? words.length : 0,
              budget: 0, // We don't have budget info from saved components
              utilizationPercentage: 0
            };
          });
          
          const totalWords = components.reduce((sum, c) => sum + c.actualWords, 0);
          
          setAnalysis({
            totalWords,
            compliance: totalWords <= 392,
            components
          });
        } else {
          // Fall back to analyzing the prompt string
          const { analyzePromptWordBudget } = await import('@/utils/wordBudgetEnforcer');
          const result = await analyzePromptWordBudget(prompt, projectId, characterName, sceneName, userPrompt);
          setAnalysis(result);
        }
      } catch (error) {
        console.error('Error analyzing prompt word budget:', error);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (prompt || promptComponents) {
      analyzePrompt();
    }
  }, [prompt, projectId, characterName, sceneName, userPrompt, promptComponents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-muted-foreground">Analyzing prompt components...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to analyze prompt components.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-accent/5 rounded-lg border border-solid border-border">
      {analysis.components.map((component, index: number) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
              [{component.name.toUpperCase()}]
            </span>
            <span className="text-xs text-muted-foreground">
              {component.actualWords} words
            </span>
          </div>
          <div className="text-sm text-foreground leading-relaxed pl-2 border-l-2 border-primary/20">
            {component.content.trim() || <span className="italic text-muted-foreground">No content generated for this component</span>}
          </div>
        </div>
      ))}
    </div>
  );
}; 