'use client';

import React, { useState, useEffect } from 'react';

interface WordBudgetBreakdownProps {
  prompt: string;
  projectId?: string;
  characterName?: string;
  sceneName?: string;
  userPrompt?: string;
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

export const WordBudgetBreakdown: React.FC<WordBudgetBreakdownProps> = ({ prompt, projectId, characterName, sceneName, userPrompt }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzePrompt = async () => {
      try {
        setIsLoading(true);
        const { analyzePromptWordBudget } = await import('@/utils/wordBudgetEnforcer');
        const result = await analyzePromptWordBudget(prompt, projectId, characterName, sceneName, userPrompt);
        setAnalysis(result);
      } catch (error) {
        console.error('Error analyzing prompt word budget:', error);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (prompt) {
      analyzePrompt();
    }
  }, [prompt, projectId, characterName, sceneName, userPrompt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-muted-foreground">Analyzing word budget...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to analyze word budget for this prompt.
      </div>
    );
  }

  const totalWords = analysis.totalWords;
  const isCompliant = totalWords <= 384;

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isCompliant ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            {totalWords}/384 words
          </span>
        </div>
        <div className={`text-sm font-medium ${isCompliant ? 'text-green-600' : 'text-red-600'}`}>
          {isCompliant ? '✅ COMPLIANT' : '❌ OVER BUDGET'}
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Component Analysis</h4>
        <div className="grid gap-2">
          {analysis.components?.map((component, index: number) => {
            const usagePercent = Math.round((component.actualWords / component.budget) * 100);
            const isOverBudget = component.actualWords > component.budget;
            
            return (
              <div key={index} className="flex items-center justify-between p-2 bg-accent/10 rounded border">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{component.name}</span>
                    <span className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {component.actualWords}/{component.budget}w
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-accent/30 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isOverBudget ? 'bg-red-500' : usagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {usagePercent}% utilization
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 