// Import word budget constants and utilities
import { WORD_BUDGET, countWords, trimToWordCount } from './promptComponents';

// Import types only to avoid client-side database imports
type PromptComponents = {
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
};

export interface WordBudgetReport {
  totalWords: number;
  totalBudget: number;
  isCompliant: boolean;
  overageWords: number;
  components: ComponentBudgetReport[];
}

export interface ComponentBudgetReport {
  id: keyof PromptComponents;
  label: string;
  actualWords: number;
  budgetWords: number;
  isCompliant: boolean;
  overageWords: number;
  content: string;
  percentage: number;
}

/**
 * Analyze word budget constraints on all components (for guidance only - does not trim)
 */
export function enforceWordBudget(components: PromptComponents): PromptComponents {
  // Return components unchanged - word budget is for guidance/warnings only
  return components;
}

/**
 * Validate word count for a single component
 */
export function validateWordCount(component: string, maxWords: number): { 
  isValid: boolean; 
  actualWords: number; 
  overage: number 
} {
  const actualWords = countWords(component);
  const overage = Math.max(0, actualWords - maxWords);
  
  return {
    isValid: actualWords <= maxWords,
    actualWords,
    overage
  };
}

/**
 * Generate comprehensive word budget report
 */
export function generateWordBudgetReport(components: PromptComponents): WordBudgetReport {
  const componentLabels: Record<keyof PromptComponents, string> = {
    masterPrompt: 'Master Prompt Foundation',
    userInput: 'User Input Integration',
    characterDescription: 'Character Description',
    sceneFoundation: 'Scene Foundation',
    technicalPhotography: 'Technical Photography',
    visualStyleAesthetic: 'Visual Style & Aesthetic',
    atmosphericEnvironmental: 'Atmospheric & Environmental',
    supportingElements: 'Supporting Elements',
    postProcessingEffects: 'Post-Processing & Effects',
    triggerWords: 'LoRA Trigger Words'
  };

  const componentReports: ComponentBudgetReport[] = [];
  let totalWords = 0;
  let totalBudget = 0;
  let totalOverage = 0;

  // Generate report for each component
  (Object.keys(components) as Array<keyof PromptComponents>).forEach(componentId => {
    const content = components[componentId];
    const budgetWords = WORD_BUDGET[componentId];
    const actualWords = countWords(content);
    const overageWords = Math.max(0, actualWords - budgetWords);

    componentReports.push({
      id: componentId,
      label: componentLabels[componentId],
      actualWords,
      budgetWords,
      isCompliant: actualWords <= budgetWords,
      overageWords,
      content,
      percentage: (actualWords / budgetWords) * 100
    });

    totalWords += actualWords;
    totalBudget += budgetWords;
    totalOverage += overageWords;
  });

  return {
    totalWords,
    totalBudget,
    isCompliant: totalOverage === 0,
    overageWords: totalOverage,
    components: componentReports
  };
}

/**
 * Calculate percentage utilization for budget visualization
 */
export function calculateBudgetUtilization(components: PromptComponents): Record<keyof PromptComponents, number> {
  const utilization: Partial<Record<keyof PromptComponents, number>> = {};

  (Object.keys(components) as Array<keyof PromptComponents>).forEach(componentId => {
    const actualWords = countWords(components[componentId]);
    const budgetWords = WORD_BUDGET[componentId];
    utilization[componentId] = budgetWords > 0 ? (actualWords / budgetWords) * 100 : 0;
  });

  return utilization as Record<keyof PromptComponents, number>;
}

/**
 * Get budget compliance status for UI indicators
 */
export function getBudgetComplianceStatus(report: WordBudgetReport): {
  status: 'excellent' | 'good' | 'warning' | 'error';
  message: string;
  color: string;
} {
  const utilizationPercentage = (report.totalWords / report.totalBudget) * 100;

  if (report.isCompliant && utilizationPercentage >= 90) {
    return {
      status: 'excellent',
      message: 'Optimal word budget utilization',
      color: 'text-green-600'
    };
  } else if (report.isCompliant && utilizationPercentage >= 70) {
    return {
      status: 'good',
      message: 'Good word budget utilization',
      color: 'text-blue-600'
    };
  } else if (report.isCompliant) {
    return {
      status: 'warning',
      message: 'Under-utilizing word budget',
      color: 'text-yellow-600'
    };
  } else {
  return {
      status: 'error',
      message: `Exceeding budget by ${report.overageWords} words`,
      color: 'text-red-600'
    };
  }
}

/**
 * Suggest budget optimizations
 */
export function suggestBudgetOptimizations(report: WordBudgetReport): string[] {
  const suggestions: string[] = [];
  
  // Find components that are over budget
  const overBudgetComponents = report.components.filter(c => !c.isCompliant);
  const underUtilizedComponents = report.components.filter(c => c.percentage < 50);
  
  if (overBudgetComponents.length > 0) {
    suggestions.push(`Reduce content in: ${overBudgetComponents.map(c => c.label).join(', ')}`);
  }
  
  if (underUtilizedComponents.length > 0 && overBudgetComponents.length === 0) {
    suggestions.push(`Consider expanding: ${underUtilizedComponents.map(c => c.label).join(', ')}`);
  }
  
  if (report.totalWords < report.totalBudget * 0.7) {
    suggestions.push('Consider adding more descriptive content to fully utilize the 384-word budget');
  }
  
  return suggestions;
}

/**
 * Validate complete prompt against 384-word target
 */
export async function validatePromptLength(prompt: string): Promise<{
  isValid: boolean;
  actualWords: number;
  targetWords: number;
  overageWords: number;
}> {
  const { countWords } = await import('./promptComponents');
  const actualWords = countWords(prompt);
  const targetWords = 384;
  const overageWords = Math.max(0, actualWords - targetWords);
  const isValid = actualWords <= targetWords;

  return {
    isValid,
    actualWords,
    targetWords,
    overageWords
  };
}

/**
 * Log detailed word budget analysis to console
 */
export function logWordBudgetAnalysis(report: WordBudgetReport): void {
  console.group('📊 Word Budget Analysis');
  
  console.log(`📈 Total: ${report.totalWords}/${report.totalBudget} words (${report.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'})`);
  
  if (report.overageWords > 0) {
    console.warn(`⚠️ Overage: ${report.overageWords} words`);
  }

  console.group('📋 Component Breakdown:');
  
  report.components.forEach((componentReport) => {
    const status = componentReport.isCompliant ? '✅' : '❌';
    const utilization = `${componentReport.percentage}%`;
    console.log(`${status} ${componentReport.label}: ${componentReport.actualWords}/${componentReport.budgetWords} words (${utilization})`);
    
    if (!componentReport.isCompliant) {
      console.warn(`   ⚠️ Overage: ${componentReport.overageWords} words`);
    }
  });
  
  console.groupEnd();
  console.groupEnd();
}

/**
 * Generate word budget visualization for UI
 */
export function generateBudgetVisualization(report: WordBudgetReport): {
  overall: { percentage: number; status: 'success' | 'warning' | 'error' };
  components: Array<{
    name: string;
    percentage: number;
    status: 'success' | 'warning' | 'error';
    actualWords: number;
    budgetWords: number;
  }>;
} {
  const overallPercentage = Math.round((report.totalWords / report.totalBudget) * 100);
  const overallStatus = report.isCompliant ? 'success' : 'error';

  const components = report.components.map((componentReport) => {
    let status: 'success' | 'warning' | 'error' = 'success';
    
    if (!componentReport.isCompliant) {
      status = 'error';
    } else if (componentReport.percentage > 90) {
      status = 'warning';
    }

    return {
      name: componentReport.label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      percentage: componentReport.percentage,
      status,
      actualWords: componentReport.actualWords,
      budgetWords: componentReport.budgetWords
    };
  });

  return {
    overall: {
      percentage: overallPercentage,
      status: overallStatus
    },
    components
  };
}

/**
 * Analyze any prompt and estimate how it would map to our 9-component word budget system
 * This is for display in the UI to show word budget breakdown for existing prompts
 */
// Removed ProjectAnalysisData interface - no longer needed for keyword matching

// Removed getProjectAnalysisData - no longer needed since we're not parsing prompts with keywords

export async function analyzePromptWordBudget(
  prompt: string, 
  projectId: string = 'default',
  characterName?: string,
  sceneName?: string,
  userPrompt?: string
): Promise<{
  totalWords: number;
  compliance: boolean;
  components: Array<{
    name: string;
    content: string;
    actualWords: number;
    budget: number;
    utilizationPercentage: number;
  }>;
}> {
  const totalWords = countWords(prompt);
  const compliance = totalWords <= 392;

  // Only log if there are actual issues
  // console.log('📊 Word Budget Analysis (Warning Only - No Enforcement)');

  try {
    // Import the component building functions
    const { 
      buildMasterPromptComponent,
      buildUserInputComponent, 
      buildCharacterComponent,
      buildSceneComponent,
      buildTechnicalPhotographyComponent,
      buildVisualStyleComponent,
      buildTriggerWordsComponent,
      buildAtmosphericComponent,
      buildSupportingElementsComponent,
      buildPostProcessingComponent
    } = await import('@/utils/promptComponents');

    // Get project data
    const projectResponse = await fetch(`/api/database/projects?id=${projectId}`);
    const projectData = await projectResponse.json();
    
    if (!projectData.success || !projectData.data) {
      throw new Error('Could not load project data');
    }

    const project = {
      ...projectData.data,
      imagePrompting: projectData.data.settings?.imagePrompting || {},
      loras: projectData.data.settings?.loras || {}
    };

    // Get character data if available
    let character = null;
    if (characterName) {
      try {
        const characterResponse = await fetch(`/api/database/characters?projectId=${projectId}&name=${encodeURIComponent(characterName)}`);
        const characterData = await characterResponse.json();
        if (characterData.success && characterData.data) {
          character = characterData.data;
        }
      } catch (error) {
        console.warn('Could not load character data:', error);
      }
    }

    // Get scene data if available
    let scene = null;
    if (sceneName) {
      try {
        const scenesResponse = await fetch(`/api/database/scenes?projectId=${projectId}`);
        const scenesData = await scenesResponse.json();
        if (scenesData.success && Array.isArray(scenesData.data)) {
          scene = scenesData.data.find(s => s.name === sceneName);
        }
      } catch (error) {
        console.warn('Could not load scene data:', error);
      }
    }

    // Build the actual components using the same functions that create prompts
    const componentPromises = [
      {
        name: 'Master Prompt',
        content: buildMasterPromptComponent(project),
        budget: WORD_BUDGET.masterPrompt
      },
      {
        name: 'User Input',
        content: buildUserInputComponent(userPrompt || ''),
        budget: WORD_BUDGET.userInput
      },
      {
        name: 'Character Description',
        content: Promise.resolve(character ? buildCharacterComponent(character) : ''),
        budget: WORD_BUDGET.characterDescription
      },
      {
        name: 'Scene Foundation', 
        content: Promise.resolve(scene ? buildSceneComponent(scene) : ''),
        budget: WORD_BUDGET.sceneFoundation
      },
      {
        name: 'Technical Photography',
        content: buildTechnicalPhotographyComponent(project),
        budget: WORD_BUDGET.technicalPhotography
      },
      {
        name: 'Visual Style & Aesthetic',
        content: buildVisualStyleComponent(project),
        budget: WORD_BUDGET.visualStyleAesthetic
      },
      {
        name: 'LoRA Trigger Words',
        content: Promise.resolve(buildTriggerWordsComponent(project)),
        budget: WORD_BUDGET.triggerWords
      },
      {
        name: 'Atmospheric & Environmental',
        content: buildAtmosphericComponent(project, scene),
        budget: WORD_BUDGET.atmosphericEnvironmental
      },
      {
        name: 'Supporting Elements',
        content: buildSupportingElementsComponent(project),
        budget: WORD_BUDGET.supportingElements
      },
      {
        name: 'Post-Processing & Effects',
        content: buildPostProcessingComponent(project),
        budget: WORD_BUDGET.postProcessingEffects
      }
    ];

    // Await all promises and build the components array
    const components = await Promise.all(
      componentPromises.map(async comp => {
        const content = await comp.content;
        const safeContent = typeof content === 'string' ? content : String(content || '');
        return {
          ...comp,
          content: safeContent,
          actualWords: countWords(safeContent),
          utilizationPercentage: comp.budget > 0 ? Math.round((countWords(safeContent) / comp.budget) * 100) : 0
        };
      })
    );

    return {
      totalWords,
      compliance,
      components
    };

  } catch (error) {
    console.error('Error analyzing word budget:', error);
    
    // Fallback: show the budget structure without specific content
    const components = [
      { name: 'Master Prompt', content: 'Brand foundation and style', budget: WORD_BUDGET.masterPrompt },
      { name: 'User Input', content: 'Custom user request', budget: WORD_BUDGET.userInput },
      { name: 'Character Description', content: 'Character details', budget: WORD_BUDGET.characterDescription },
      { name: 'Scene Foundation', content: 'Scene and setting', budget: WORD_BUDGET.sceneFoundation },
      { name: 'Technical Photography', content: 'Camera and lighting', budget: WORD_BUDGET.technicalPhotography },
      { name: 'Visual Style & Aesthetic', content: 'Style and aesthetic', budget: WORD_BUDGET.visualStyleAesthetic },
      { name: 'Atmospheric & Environmental', content: 'Atmosphere and environment', budget: WORD_BUDGET.atmosphericEnvironmental },
      { name: 'Supporting Elements', content: 'Props and elements', budget: WORD_BUDGET.supportingElements },
      { name: 'Post-Processing & Effects', content: 'Effects and processing', budget: WORD_BUDGET.postProcessingEffects }
    ].map(comp => ({
      ...comp,
      actualWords: countWords(comp.content || ''),
      utilizationPercentage: comp.budget > 0 ? Math.round((countWords(comp.content || '') / comp.budget) * 100) : 0
    }));

    return {
      totalWords,
      compliance,
      components
    };
  }
}

// Removed all extraction functions - no longer parsing prompts with keyword matching
// Word budget breakdown now shows the actual component structure from database settings 