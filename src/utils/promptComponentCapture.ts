/**
 * Universal Prompt Component Capture & Validation
 * 
 * This utility ensures that EVERY image generation captures complete prompt components
 * and provides flexible display regardless of generation method, enabled components, or future changes.
 */

import { Project, Character, Scene } from '@/contexts/ProjectContext';
import { 
  buildMasterPromptComponent,
  buildUserInputComponent,
  buildCharacterComponent,
  buildSceneComponent,
  buildTechnicalPhotographyComponent,
  buildVisualStyleComponent,
  buildAtmosphericComponent,
  buildSupportingElementsComponent,
  buildPostProcessingComponent,
  buildTriggerWordsComponent,
  countWords
} from '@/utils/promptComponents';

export interface CapturedPromptComponents {
  // Core metadata
  captureTimestamp: string;
  captureMethod: 'prompt-drawer' | 'api-direct' | 'batch-generate' | 'legacy-fallback';
  generationMethod: string;
  
  // Component data with metadata
  components: {
    masterPrompt: ComponentData;
    userInput: ComponentData;
    characterDescription: ComponentData;
    sceneFoundation: ComponentData;
    technicalPhotography: ComponentData;
    visualStyleAesthetic: ComponentData;
    atmosphericEnvironmental: ComponentData;
    supportingElements: ComponentData;
    postProcessingEffects: ComponentData;
    triggerWords: ComponentData;
  };
  
  // Generation context
  context: {
    projectId: string;
    projectName: string;
    charactersUsed: string[];
    sceneUsed?: string;
    enabledComponents: string[];
    componentOrder: string[];
  };
  
  // Final assembly
  finalPrompt: string;
  totalWords: number;
}

export interface ComponentData {
  content: string;
  wordCount: number;
  enabled: boolean;
  source: 'generated' | 'user-input' | 'database' | 'fallback' | 'empty';
  order: number;
}

/**
 * Universal function to capture prompt components from any generation context
 */
export async function capturePromptComponents(params: {
  // Generation context
  method: 'prompt-drawer' | 'api-direct' | 'batch-generate';
  generationRoute: string;
  
  // Core data
  project: Project | any; // Allow any to handle different data structures
  userPrompt: string;
  characters?: Character[] | any[];
  scene?: Scene | any;
  
  // Controls (optional)
  enabledComponents?: string[];
  componentOrder?: string[];
  characterControls?: any[];
  sceneControls?: any;
  technicalControls?: any;
  styleControls?: any;
  atmosphericControls?: any;
  supportingControls?: any;
  
  // Final result
  finalPrompt: string;
  triggerWords?: string[];
}): Promise<CapturedPromptComponents> {
  
  const timestamp = new Date().toISOString();
  
  // Normalize project structure to handle different API data formats
  const normalizedProject = normalizeProjectStructure(params.project);
  
  console.log('🔍 Capturing prompt components:', {
    method: params.method,
    route: params.generationRoute,
    projectId: normalizedProject.id,
    hasImagePrompting: !!normalizedProject.imagePrompting,
    imagePromptingKeys: normalizedProject.imagePrompting ? Object.keys(normalizedProject.imagePrompting) : []
  });
  
  // Build all components with error handling
  const components = await buildAllComponentsSafely({
    project: normalizedProject,
    userPrompt: params.userPrompt,
    characters: params.characters || [],
    scene: params.scene,
    triggerWords: params.triggerWords,
    enabledComponents: params.enabledComponents,
    characterControls: params.characterControls,
    sceneControls: params.sceneControls,
    technicalControls: params.technicalControls,
    styleControls: params.styleControls,
    atmosphericControls: params.atmosphericControls,
    supportingControls: params.supportingControls
  });
  
  // Determine component order (default or custom)
  const componentOrder = params.componentOrder || [
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
  ];
  
  // Set order in component data
  componentOrder.forEach((componentKey, index) => {
    if (components[componentKey as keyof typeof components]) {
      components[componentKey as keyof typeof components].order = index;
    }
  });
  
  const result: CapturedPromptComponents = {
    captureTimestamp: timestamp,
    captureMethod: params.method,
    generationMethod: params.generationRoute,
    components,
    context: {
      projectId: normalizedProject.id || 'unknown',
      projectName: normalizedProject.name || 'Unknown Project',
      charactersUsed: (params.characters || []).map(c => c?.name || 'Unknown').filter(name => name !== 'Unknown'),
      sceneUsed: params.scene?.name,
      enabledComponents: params.enabledComponents || Object.keys(components),
      componentOrder
    },
    finalPrompt: params.finalPrompt,
    totalWords: countWords(params.finalPrompt)
  };
  
  // Log component summary
  console.log('📊 Component capture summary:', {
    totalComponents: Object.keys(components).length,
    enabledComponents: Object.values(components).filter(c => c.enabled).length,
    totalWords: result.totalWords,
    componentsWithContent: Object.entries(components).filter(([_, c]) => c.content.trim().length > 0).map(([key, c]) => `${key}:${c.wordCount}w`).join(', ')
  });
  
  return result;
}

/**
 * Normalize project structure to handle different API data formats
 */
function normalizeProjectStructure(project: any): Project {
  if (!project) {
    throw new Error('Project data is required for prompt component capture');
  }
  
  // If project already has imagePrompting at root level, use as-is
  if (project.imagePrompting) {
    return project as Project;
  }
  
  // If project has settings.imagePrompting, restructure it
  if (project.settings?.imagePrompting) {
    return {
      ...project,
      imagePrompting: project.settings.imagePrompting,
      loras: project.settings.loras || {}
    } as Project;
  }
  
  // Fallback: create empty structure
  console.warn('⚠️ Project missing imagePrompting data, using empty structure');
  return {
    ...project,
    imagePrompting: {},
    loras: {}
  } as Project;
}

/**
 * Build all components with comprehensive error handling
 */
async function buildAllComponentsSafely(params: {
  project: Project;
  userPrompt: string;
  characters: any[];
  scene?: any;
  triggerWords?: string[];
  enabledComponents?: string[];
  characterControls?: any[];
  sceneControls?: any;
  technicalControls?: any;
  styleControls?: any;
  atmosphericControls?: any;
  supportingControls?: any;
}): Promise<CapturedPromptComponents['components']> {
  
  const enabled = params.enabledComponents || [];
  const isEnabled = (component: string) => enabled.length === 0 || enabled.includes(component);
  
  // Build components with individual error handling
  const components = {
    masterPrompt: await buildComponentSafely(
      'masterPrompt',
      () => buildMasterPromptComponent(params.project),
      isEnabled('masterPrompt')
    ),
    
    userInput: await buildComponentSafely(
      'userInput',
      () => buildUserInputComponent(params.userPrompt),
      isEnabled('userInput')
    ),
    
    characterDescription: await buildComponentSafely(
      'characterDescription',
      () => buildCharacterDescriptions(params.characters, params.characterControls),
      isEnabled('characterDescription')
    ),
    
    sceneFoundation: await buildComponentSafely(
      'sceneFoundation',
      () => params.scene ? buildSceneComponent(params.scene) : '',
      isEnabled('sceneFoundation')
    ),
    
    technicalPhotography: await buildComponentSafely(
      'technicalPhotography',
      () => buildTechnicalPhotographyComponent(params.project),
      isEnabled('technicalPhotography')
    ),
    
    visualStyleAesthetic: await buildComponentSafely(
      'visualStyleAesthetic',
      () => buildVisualStyleComponent(params.project),
      isEnabled('visualStyleAesthetic')
    ),
    
    atmosphericEnvironmental: await buildComponentSafely(
      'atmosphericEnvironmental',
      () => buildAtmosphericComponent(params.project, params.scene),
      isEnabled('atmosphericEnvironmental')
    ),
    
    supportingElements: await buildComponentSafely(
      'supportingElements',
      () => buildSupportingElementsComponent(params.project),
      isEnabled('supportingElements')
    ),
    
    postProcessingEffects: await buildComponentSafely(
      'postProcessingEffects',
      () => buildPostProcessingComponent(params.project),
      isEnabled('postProcessingEffects')
    ),
    
    triggerWords: await buildComponentSafely(
      'triggerWords',
      () => buildTriggerWordsComponent(params.project, params.triggerWords),
      isEnabled('triggerWords')
    )
  };
  
  return components;
}

/**
 * Build individual component with error handling and metadata
 */
async function buildComponentSafely(
  componentName: string,
  builder: () => string | Promise<string>,
  enabled: boolean
): Promise<ComponentData> {
  try {
    const content = await builder();
    const safeContent = typeof content === 'string' ? content.trim() : '';
    
    return {
      content: safeContent,
      wordCount: countWords(safeContent),
      enabled,
      source: safeContent ? 'generated' : 'empty',
      order: 0 // Will be set later
    };
  } catch (error) {
    console.error(`❌ Error building ${componentName}:`, error);
    
    return {
      content: '',
      wordCount: 0,
      enabled,
      source: 'fallback',
      order: 0
    };
  }
}

/**
 * Build character descriptions with error handling
 */
function buildCharacterDescriptions(characters: any[], characterControls?: any[]): string {
  if (!characters || characters.length === 0) {
    return '';
  }
  
  try {
    const descriptions = characters.map((character, index) => {
      if (!character) return '';
      
      // Use specific controls if provided, otherwise use default
      const controls = characterControls?.[index];
      if (controls) {
        // TODO: Implement controlled character building
        return buildCharacterComponent(character);
      } else {
        return buildCharacterComponent(character);
      }
    }).filter(desc => desc.trim().length > 0);
    
    return descriptions.join('; ');
  } catch (error) {
    console.error('❌ Error building character descriptions:', error);
    return '';
  }
} 