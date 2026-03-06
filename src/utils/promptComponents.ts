import { Project, Character, Scene } from '@/contexts/ProjectContext';
// Database service import removed to avoid client-side better-sqlite3 import

// Removed prompt defaults cache and fallback logic

// Word Budget Constants (416 words total - 10 components)
export const WORD_BUDGET = {
  masterPrompt: 60,            // 15.3% - Master Prompt Foundation
  userInput: 40,               // 10.2% - User Input Integration (increased from 16)
  characterDescription: 80,     // 20.4% - Character Description
  sceneFoundation: 64,         // 16.3% - Scene Foundation
  technicalPhotography: 48,    // 12.2% - Technical Photography
  visualStyleAesthetic: 48,    // 12.2% - Visual Style & Aesthetic
  atmosphericEnvironmental: 32, // 8.2% - Atmospheric & Environmental
  supportingElements: 24,      // 6.1% - Supporting Elements
  postProcessingEffects: 12,   // 3.1% - Post-Processing & Effects
  triggerWords: 8              // 2.0% - LoRA Trigger Words
} as const;

export interface PromptComponents {
  masterPrompt: string;            // 60 words
  userInput: string;              // 40 words  
  characterDescription: string;    // 80 words
  sceneFoundation: string;        // 64 words
  technicalPhotography: string;   // 48 words
  visualStyleAesthetic: string;   // 48 words
  atmosphericEnvironmental: string; // 32 words
  supportingElements: string;     // 24 words
  postProcessingEffects: string;  // 12 words
  triggerWords: string;           // 8 words
}

export interface PromptComponentToggle {
  id: keyof PromptComponents;
  label: string;
  description: string;
  wordBudget: number;
  enabled: boolean;
}

/**
 * Build Master Prompt Component (60 words)
 * Foundation prompt from project settings
 */
export function buildMasterPromptComponent(project: Project): string {
  const masterPrompt = project.imagePrompting?.masterPrompt;
  
  if (masterPrompt?.trim()) {
    return masterPrompt.trim();
  }
  
  return '';
}

/**
 * Build User Input Component (16 words)
 * User's custom phrase, validated and trimmed
 */
export function buildUserInputComponent(userPrompt: string): string {
  if (!userPrompt?.trim()) {
    return '';
  }
  
  return userPrompt.trim();
}

/**
 * Build Character Component (80 words)
 * Character details including physical appearance and outfit
 */
export function buildCharacterComponent(character: Character, outfitIndex?: number): string {
  const parts: string[] = [];
  
  // Basic demographics (15 words) - with null/undefined safety
  const demographicParts: string[] = [];
  
  // Add age if available
  if (character.age) {
    demographicParts.push(`${character.age} year old`);
  }
  
  // Add gender if available
  if (character.gender?.trim()) {
    demographicParts.push(character.gender.toLowerCase());
  }
  
  // Add race if available
  if (character.race?.trim()) {
    demographicParts.push(character.race.toLowerCase());
  }
  
  // Add height if available
  if (character.height?.trim()) {
    demographicParts.push(character.height);
  }
  
  // Add hair color if available
  if (character.hairColor?.trim()) {
    demographicParts.push(`${character.hairColor.toLowerCase()} hair`);
  }
  
  // Add eye color if available
  if (character.eyeColor?.trim()) {
    demographicParts.push(`${character.eyeColor.toLowerCase()} eyes`);
  }
  
  // Only add demographics if we have some data
  if (demographicParts.length > 0) {
    const demographics = demographicParts.join(' ');
    parts.push(demographics);
  }
  
  // Physical appearance
  if (character.physicalAppearance?.trim()) {
    parts.push(character.physicalAppearance.trim());
  }
  
  // Outfit details
  if (character.outfits && character.outfits.length > 0) {
    const targetOutfitIndex = outfitIndex ?? character.defaultOutfit ?? 0;
    const outfit = character.outfits[targetOutfitIndex];
    if (outfit?.name?.trim()) {
      parts.push(`wearing ${outfit.name.trim()}`);
    }
  }
  
  // Professional context
  if (character.profession?.trim()) {
    parts.push(character.profession.trim());
  }
  
  // Return empty string if no character data available
  if (parts.length === 0) {
    return '';
  }
  
  const fullDescription = parts.join(', ');
  return fullDescription;
}

/**
 * Build Scene Component (64 words)
 * Scene foundation including setting, lighting, and mood
 */
export function buildSceneComponent(scene: Scene): string {
  if (!scene) {
    return '';
  }

  const parts: string[] = [];
  
  // Setting foundation
  if (scene.setting?.trim()) {
    parts.push(scene.setting.trim());
  }
  
  // Lighting and mood (20 words) - with null/undefined safety
  const lightingMoodParts: string[] = [];
  
  if (scene.lighting?.trim()) {
    lightingMoodParts.push(scene.lighting);
  }
  
  if (scene.mood?.trim()) {
    lightingMoodParts.push(`${scene.mood} atmosphere`);
  }
  
  if (scene.timeOfDay?.trim()) {
    lightingMoodParts.push(scene.timeOfDay);
  }
  
  if (lightingMoodParts.length > 0) {
    const lightingMood = lightingMoodParts.join(' ');
    parts.push(lightingMood);
  }
  
  // Camera angle
  if (scene.cameraAngle?.trim()) {
    parts.push(scene.cameraAngle.trim());
  }
  
  // Props and atmosphere
  if (scene.props && scene.props.length > 0) {
    const validProps = scene.props.filter(prop => prop?.trim());
    if (validProps.length > 0) {
      const props = validProps.join(' ');
      parts.push(`props: ${props}`);
    }
  }
  
  // Return empty string if no scene data available
  if (parts.length === 0) {
    return '';
  }
  
  const fullScene = parts.join(', ');
  return fullScene;
}

/**
 * Build Technical Photography Component (48 words)
 * Camera settings, lens type, and lighting technical specs
 */
export function buildTechnicalPhotographyComponent(project: Project): string {
  const imaging = project.imagePrompting;
  const parts: string[] = [];
  
  // Camera and lens
  const cameraSpecsParts: string[] = [];
  if (imaging?.cameraAngle?.trim()) cameraSpecsParts.push(imaging.cameraAngle);
  if (imaging?.shotType?.trim()) cameraSpecsParts.push(imaging.shotType);
  if (imaging?.lensType?.trim()) cameraSpecsParts.push(imaging.lensType);
  if (imaging?.focalLength?.trim()) cameraSpecsParts.push(imaging.focalLength);
  
  if (cameraSpecsParts.length > 0) {
    parts.push(cameraSpecsParts.join(' '));
  }
  
  // Lighting technical
  const lightingSpecsParts: string[] = [];
  if (imaging?.lightingStyle?.trim()) lightingSpecsParts.push(imaging.lightingStyle);
  if (imaging?.lightDirection?.trim()) lightingSpecsParts.push(imaging.lightDirection);
  if (imaging?.lightQuality?.trim()) lightingSpecsParts.push(imaging.lightQuality);
  if (imaging?.shadowStyle?.trim()) lightingSpecsParts.push(imaging.shadowStyle);
  
  if (lightingSpecsParts.length > 0) {
    parts.push(lightingSpecsParts.join(' '));
  }
  
  const fullTechnical = parts.join(', ');
  return fullTechnical;
}

/**
 * Build Visual Style & Aesthetic Component (48 words)
 * Overall style, color palette, and artistic references
 */
export function buildVisualStyleComponent(project: Project): string {
  const imaging = project.imagePrompting;
  const parts: string[] = [];
  
  // Style direction
  const styleDirectionParts: string[] = [];
  if (imaging?.overallStyle?.trim()) styleDirectionParts.push(imaging.overallStyle);
  if (imaging?.aestheticDirection?.trim()) styleDirectionParts.push(imaging.aestheticDirection);
  if (imaging?.mood?.trim()) styleDirectionParts.push(`${imaging.mood} atmosphere`);
  
  if (styleDirectionParts.length > 0) {
    parts.push(styleDirectionParts.join(' '));
  }
  
  // Color treatment
  const colorTreatmentParts: string[] = [];
  if (imaging?.colorPalette?.trim()) colorTreatmentParts.push(imaging.colorPalette);
  if (imaging?.colorTemperature?.trim()) colorTreatmentParts.push(imaging.colorTemperature);
  if (imaging?.saturation?.trim()) colorTreatmentParts.push(imaging.saturation);
  
  if (colorTreatmentParts.length > 0) {
    parts.push(colorTreatmentParts.join(' '));
  }
  
  // Artistic references - handle both string and array types
  if (imaging?.artisticReferences) {
    const artisticReferences = imaging.artisticReferences as string[] | string;
    if (Array.isArray(artisticReferences) && artisticReferences.length > 0) {
      const references = artisticReferences.join(' ');
      parts.push(`${references} inspired aesthetic`);
    } else if (typeof artisticReferences === 'string' && artisticReferences.trim()) {
      parts.push(`${artisticReferences.trim()} inspired aesthetic`);
    }
  }
  
  const fullStyle = parts.join(', ');
  return fullStyle;
}

/**
 * Build Atmospheric & Environmental Component (32 words)
 * Weather, time of day, and environmental atmosphere
 */
export function buildAtmosphericComponent(project: Project, scene?: Scene): string {
  const imaging = project.imagePrompting;
  const parts: string[] = [];
  
  // Time and lighting atmosphere
  let timeAtmosphere = '';
  if (scene?.timeOfDay?.trim()) {
    timeAtmosphere = scene.timeOfDay;
  } else if (imaging?.timeOfDay?.trim()) {
    timeAtmosphere = imaging.timeOfDay;
  }
  
  if (timeAtmosphere) {
    parts.push(`${timeAtmosphere} atmospheric lighting conditions`);
  }
  
  // Environmental effects - handle both string and array types
  if (imaging?.atmosphericEffects) {
    const atmosphericEffects = imaging.atmosphericEffects as string[] | string;
    if (Array.isArray(atmosphericEffects) && atmosphericEffects.length > 0) {
      const effects = atmosphericEffects.join(' ');
      parts.push(effects);
    } else if (typeof atmosphericEffects === 'string' && atmosphericEffects.trim()) {
      parts.push(atmosphericEffects.trim());
    }
  } else if (scene?.atmosphere?.trim()) {
    parts.push(scene.atmosphere.trim());
  }
  
  const fullAtmospheric = parts.join(', ');
  return fullAtmospheric;
}

/**
 * Build Supporting Elements Component (24 words)
 * Props, textures, materials, and background elements
 */
export function buildSupportingElementsComponent(project: Project): string {
  const imaging = project.imagePrompting;
  const parts: string[] = [];
  
  // Surface textures
  if (imaging?.surfaceTextures && imaging.surfaceTextures.length > 0) {
    const textures = Array.isArray(imaging.surfaceTextures) 
      ? imaging.surfaceTextures.join(' ')
      : imaging.surfaceTextures;
    parts.push(textures);
  }
  
  // Material properties
  if (imaging?.materialProperties && imaging.materialProperties.length > 0) {
    const materials = Array.isArray(imaging.materialProperties)
      ? imaging.materialProperties.join(' ')
      : imaging.materialProperties;
    parts.push(materials);
  }
  
  const fullSupporting = parts.join(', ');
  return fullSupporting;
}

/**
 * Build Post-Processing & Effects Component (12 words)
 * Final visual effects and post-processing treatments
 */
export function buildPostProcessingComponent(project: Project): string {
  const imaging = project.imagePrompting;
  const parts: string[] = [];
  
  // Visual effects
  if (imaging?.visualEffects && imaging.visualEffects.length > 0) {
    const effects = Array.isArray(imaging.visualEffects)
      ? imaging.visualEffects.join(' ')
      : imaging.visualEffects;
    parts.push(effects);
  }
  
  // Post-processing
  if (imaging?.postProcessing && imaging.postProcessing.length > 0) {
    const processing = Array.isArray(imaging.postProcessing)
      ? imaging.postProcessing.join(' ')
      : imaging.postProcessing;
    parts.push(processing);
  }
  
  const fullPostProcessing = parts.join(', ');
  return fullPostProcessing;
}

/**
 * Build Trigger Words Component (8 words)
 * LoRA trigger words for style enhancement
 */
export function buildTriggerWordsComponent(project: Project, triggerWords?: string[]): string {
  // If trigger words are provided directly, use them (from centralized context)
  if (triggerWords && triggerWords.length > 0) {
    const allTriggerWords = triggerWords.join(' ');
    return allTriggerWords;
  }
  
  // Fallback: extract from project LoRA config (legacy support)
  const loraConfig = project.loras;
  const fallbackTriggerWords: string[] = [];
  
  if (loraConfig) {
    // Extract trigger words from LoRA1 (legacy)
    if (loraConfig.lora1?.enabled && loraConfig.lora1.triggerWords) {
      fallbackTriggerWords.push(...loraConfig.lora1.triggerWords);
    }
    
    // Extract trigger words from LoRA2 (legacy)
    if (loraConfig.lora2?.enabled && loraConfig.lora2.triggerWords) {
      fallbackTriggerWords.push(...loraConfig.lora2.triggerWords);
    }
  }
  
  if (fallbackTriggerWords.length === 0) {
    return '';
  }
  
  // Join trigger words
  const allTriggerWords = fallbackTriggerWords.join(' ');
  return allTriggerWords;
}

/**
 * Assemble all components into final prompt (no word limit enforced)
 */
export async function assemblePrompt(
  masterPrompt: string,
  userInput: string,
  characterDescription: string,
  sceneFoundation: string,
  technicalPhotography: string,
  visualStyleAesthetic: string,
  atmosphericEnvironmental: string,
  supportingElements: string,
  postProcessingEffects: string,
  triggerWords: Promise<string>
): Promise<{ prompt: string; components: PromptComponents }> {
  
  // Await the one remaining async component
  const resolvedComponents: PromptComponents = {
    masterPrompt,
    userInput,
    characterDescription,
    sceneFoundation,
    technicalPhotography,
    visualStyleAesthetic,
    atmosphericEnvironmental,
    supportingElements,
    postProcessingEffects,
    triggerWords: await triggerWords
  };

  const orderedComponents = [
    resolvedComponents.masterPrompt,
    resolvedComponents.userInput,
    resolvedComponents.characterDescription,
    resolvedComponents.sceneFoundation,
    resolvedComponents.technicalPhotography,
    resolvedComponents.visualStyleAesthetic,
    resolvedComponents.atmosphericEnvironmental,
    resolvedComponents.supportingElements,
    resolvedComponents.postProcessingEffects,
    resolvedComponents.triggerWords
  ].filter(component => component && typeof component === 'string' && component.trim().length > 0);
  
  return {
    prompt: orderedComponents.join(', '),
    components: resolvedComponents
  };
}

/**
 * Get default component toggles for prompt builder
 */
export function getDefaultComponentToggles(): PromptComponentToggle[] {
  return [
    {
      id: 'masterPrompt',
      label: 'Master Prompt Foundation',
      description: 'Core brand and project foundation prompt',
      wordBudget: WORD_BUDGET.masterPrompt,
      enabled: true
    },
    {
      id: 'userInput',
      label: 'User Input Integration',
      description: 'Custom user phrase and direction',
      wordBudget: WORD_BUDGET.userInput,
      enabled: true
    },
    {
      id: 'characterDescription',
      label: 'Character Description',
      description: 'Physical appearance, demographics, and outfit',
      wordBudget: WORD_BUDGET.characterDescription,
      enabled: true
    },
    {
      id: 'sceneFoundation',
      label: 'Scene Foundation',
      description: 'Setting, lighting, mood, and environment',
      wordBudget: WORD_BUDGET.sceneFoundation,
      enabled: true
    },
    {
      id: 'technicalPhotography',
      label: 'Technical Photography',
      description: 'Camera settings, lens type, and lighting specs',
      wordBudget: WORD_BUDGET.technicalPhotography,
      enabled: true
    },
    {
      id: 'visualStyleAesthetic',
      label: 'Visual Style & Aesthetic',
      description: 'Overall style, color palette, artistic references',
      wordBudget: WORD_BUDGET.visualStyleAesthetic,
      enabled: true
    },
    {
      id: 'atmosphericEnvironmental',
      label: 'Atmospheric & Environmental',
      description: 'Weather, time of day, environmental atmosphere',
      wordBudget: WORD_BUDGET.atmosphericEnvironmental,
      enabled: true
    },
    {
      id: 'supportingElements',
      label: 'Supporting Elements',
      description: 'Props, textures, materials, background elements',
      wordBudget: WORD_BUDGET.supportingElements,
      enabled: true
    },
    {
      id: 'postProcessingEffects',
      label: 'Post-Processing & Effects',
      description: 'Final visual effects and post-processing',
      wordBudget: WORD_BUDGET.postProcessingEffects,
      enabled: true
    },
    {
      id: 'triggerWords',
      label: 'LoRA Trigger Words',
      description: 'LoRA trigger words for style enhancement',
      wordBudget: WORD_BUDGET.triggerWords,
      enabled: true
    }
  ];
}

/**
 * Utility: Count words in a string
 */
export function countWords(text: string | undefined | null): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Utility: Trim text to specified word count
 */
export function trimToWordCount(text: string | undefined | null, maxWords: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text.trim();
  }
  return words.slice(0, maxWords).join(' ');
} 