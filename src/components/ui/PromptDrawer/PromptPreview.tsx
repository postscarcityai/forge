import React from 'react';
import { Icon, Info } from '@/components/ui/Icon';

interface PromptPreviewProps {
  generatedPrompt: string;
  totalWords: number;
  getComplianceColor: (totalWords: number) => string;
  promptComponents?: {
    masterPrompt: string;
    userInput: string;
    characterDescription: string;
    sceneFoundation: string;
    technicalPhotography: string;
    visualStyleAesthetic: string;
    atmosphericEnvironmental: string;
    supportingElements: string;
    postProcessingEffects: string;
    triggerWords: string;
  } | null;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({
  generatedPrompt,
  totalWords,
  getComplianceColor,
  promptComponents,
}) => {
  const componentLabels = {
    masterPrompt: 'MASTER PROMPT',
    userInput: 'USER INPUT',
    characterDescription: 'CHARACTER DESCRIPTION',
    sceneFoundation: 'SCENE FOUNDATION',
    technicalPhotography: 'TECHNICAL PHOTOGRAPHY',
    visualStyleAesthetic: 'VISUAL STYLE & AESTHETIC',
    atmosphericEnvironmental: 'ATMOSPHERIC & ENVIRONMENTAL',
    supportingElements: 'SUPPORTING ELEMENTS',
    postProcessingEffects: 'POST-PROCESSING & EFFECTS',
    triggerWords: 'LORA TRIGGER WORDS',
  };
  return (
    <div className="bg-accent/30 border border-border rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Generated Prompt</h3>
          <div className="flex items-center space-x-1">
            <span className={`text-xs font-medium ${getComplianceColor(totalWords)}`}>
              {totalWords}/392
            </span>
            <div className="group relative">
              <Icon 
                icon={Info} 
                size="xs" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-help" 
              />
              <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-48 p-2 text-xs text-foreground bg-popover border border-border rounded-lg shadow-lg z-50">
                512 tokens is the optimal prompt length
                <div className="absolute top-full right-2 border-4 border-transparent border-t-border"></div>
                <div className="absolute top-full right-2 mt-[-1px] border-4 border-transparent border-t-popover"></div>
              </div>
            </div>
          </div>
        </div>
        {promptComponents ? (
          <div className="w-full h-80 overflow-y-auto p-4 text-sm bg-muted border border-border rounded-lg">
            {/* Display components in final prompt order */}
            {[
              'masterPrompt',
              'userInput', 
              'characterDescription',
              'sceneFoundation',
              'technicalPhotography',
              'visualStyleAesthetic',
              'atmosphericEnvironmental',
              'supportingElements',
              'postProcessingEffects',
              'triggerWords'
            ].map((key) => {
              const content = promptComponents[key as keyof typeof promptComponents];
              const hasContent = content && content.trim();
              const wordCount = hasContent ? content.trim().split(/\s+/).length : 0;
              
              // Always show master prompt and user input (they have toggles)
              // Show other components only if they have content
              if (!hasContent && key !== 'masterPrompt' && key !== 'userInput') {
                return null;
              }
              
              return (
                <div key={key} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      hasContent 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground bg-muted/20'
                    }`}>
                      [{componentLabels[key as keyof typeof componentLabels]}]
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {wordCount} words
                    </span>
                    {!hasContent && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                        {key === 'masterPrompt' || key === 'userInput' ? 'disabled' : 'empty'}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm leading-relaxed pl-2 border-l-2 font-mono ${
                    hasContent 
                      ? 'text-foreground border-primary/20' 
                      : 'text-muted-foreground border-muted/20'
                  }`}>
                    {hasContent ? content.trim() : (
                      <span className="italic">
                        {key === 'masterPrompt' 
                          ? 'Master prompt disabled or not configured' 
                          : key === 'userInput'
                          ? 'User input disabled'
                          : 'No content generated for this component'
                        }
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <textarea
            value={generatedPrompt}
            readOnly
            className="w-full h-80 p-4 text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none font-mono leading-relaxed"
            placeholder="Generated prompt will appear here..."
          />
        )}
      </div>
    </div>
  );
}; 