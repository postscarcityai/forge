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
  PromptComponents
} from '@/utils/promptComponents';

import { enforceWordBudget, generateWordBudgetReport } from '@/utils/wordBudgetEnforcer';
import type { Project, Character, Scene } from '@/contexts/ProjectContext';

export interface PromptBuildRequest {
  // User input
  userPrompt: string;
  
  // Direct data (no more IDs - pass actual objects)
  project: Project;
  characters: Character[];
  scene?: Scene;
  characterOutfits?: (string | number)[];
  
  // Character controls for granular parameter control
  characterControls?: Array<{
    name?: boolean;
    age: boolean;
    gender: boolean;
    race: boolean;
    height: boolean;
    hairColor: boolean;
    eyeColor: boolean;
    physicalAppearance: boolean;
    profession: boolean;
    outfit: boolean;
  }>;
  
  // Scene controls for granular parameter control
  sceneControls?: {
    setting: boolean;
    timeOfDay: boolean;
    lighting: boolean;
    mood: boolean;
    cameraAngle: boolean;
    atmosphere: boolean;
    props: boolean;
  };
  
  // Technical photography controls
  technicalControls?: {
    cameraAngle: boolean;
    shotType: boolean;
    lensType: boolean;
    focalLength: boolean;
    lightingStyle: boolean;
    lightDirection: boolean;
    lightQuality: boolean;
    shadowStyle: boolean;
  };
  
  // Visual style controls
  styleControls?: {
    overallStyle: boolean;
    colorPalette: boolean;
    artisticReferences: boolean;
    aestheticDirection: boolean;
    mood: boolean;
    colorTemperature: boolean;
    saturation: boolean;
  };
  
  // Atmospheric controls
  atmosphericControls?: {
    atmosphericEffects: boolean;
    timeOfDay: boolean;
  };
  
    // Supporting elements controls
  supportingControls?: {
    surfaceTextures: boolean;
    materialProperties: boolean;
  };

  // Post-processing controls
  postProcessingControls?: {
    visualEffects: boolean;
    postProcessing: boolean;
  };

  // Component toggles
  includeMasterPrompt?: boolean;
  includeUserInput?: boolean;
  includePostProcessing?: boolean;
  
  // LoRA trigger words (from centralized context)
  triggerWords?: string[];
}

export interface PromptBuildResult {
  prompt: string;
  wordCount: number;
  components: PromptComponents;
  budgetReport: any;
  metadata: {
    charactersUsed: string[];
    sceneUsed?: string;
    projectId: string;
    generatedAt: Date;
  };
}

export class PromptService {
  /**
   * Build a complete structured prompt (now purely functional - no API calls)
   */
  async buildPrompt(request: PromptBuildRequest): Promise<PromptBuildResult> {
    const startTime = Date.now();
    
    // Validate required inputs
    if (!request.project) {
      throw new Error('Project is required for prompt generation');
    }
    
    try {

      
      // Build character descriptions
      const characterDescriptions = this.buildCharacterDescriptions(request.characters || [], request);
      
      // Build scene description
      const sceneDescription = request.scene ? this.buildSceneDescription(request.scene, request) : '';
      
      // Build all components
      const components = this.buildComponents({
        project: request.project,
        userPrompt: request.userPrompt,
        characterDescriptions,
        sceneDescription,
        includeMasterPrompt: request.includeMasterPrompt ?? true,
        includeUserInput: request.includeUserInput ?? true,
        triggerWords: request.triggerWords,
        technicalControls: request.technicalControls,
        styleControls: request.styleControls,
        atmosphericControls: request.atmosphericControls,
        supportingControls: request.supportingControls,
        postProcessingControls: request.postProcessingControls
      });

      // Enforce word budget
      const enforcedComponents = enforceWordBudget(components);
      
      // Assemble final prompt (now synchronous)
      const result = this.assemblePromptSync(
        enforcedComponents.masterPrompt,
        enforcedComponents.userInput,
        enforcedComponents.characterDescription,
        enforcedComponents.sceneFoundation,
        enforcedComponents.technicalPhotography,
        enforcedComponents.visualStyleAesthetic,
        enforcedComponents.atmosphericEnvironmental,
        enforcedComponents.supportingElements,
        enforcedComponents.postProcessingEffects,
        enforcedComponents.triggerWords
      );

      // Generate report
      const budgetReport = generateWordBudgetReport(enforcedComponents);
      
        const buildTime = Date.now() - startTime;

      const promptResult = {
        prompt: result.prompt,
        wordCount: budgetReport.totalWords,
        components: result.components,
        budgetReport,
        metadata: {
          charactersUsed: request.characters?.map(c => c?.name || 'Unknown') || [],
          sceneUsed: request.scene?.name,
          projectId: request.project?.id || 'unknown',
          generatedAt: new Date()
        }
      };
      
      // NEW: Also capture components for future-proof metadata
      try {
        const { capturePromptComponents } = await import('@/utils/promptComponentCapture');
        const capturedComponents = await capturePromptComponents({
          method: 'prompt-drawer',
          generationRoute: 'PromptService.buildPrompt',
          project: request.project,
          userPrompt: request.userPrompt,
          characters: request.characters || [],
          scene: request.scene,
          characterControls: request.characterControls,
          sceneControls: request.sceneControls,
          finalPrompt: result.prompt,
          triggerWords: request.triggerWords
        });
        
        // Add captured components to result
        (promptResult as any).capturedComponents = capturedComponents;
        console.log('✅ PromptService: Captured complete prompt components');
      } catch (captureError) {
        console.error('⚠️ PromptService: Failed to capture prompt components (continuing anyway):', captureError);
      }
      
      return promptResult;

    } catch (error) {
      console.error('❌ PromptService build failed:', error);
      throw error;
    }
  }

  /**
   * Build components with conditional inclusion
   */
  private buildComponents(params: {
    project: Project;
    userPrompt: string;
    characterDescriptions: string;
    sceneDescription: string;
    includeMasterPrompt?: boolean;
    includeUserInput?: boolean;
    includePostProcessing?: boolean;
    triggerWords?: string[];
    technicalControls?: {
      cameraAngle: boolean;
      shotType: boolean;
      lensType: boolean;
      focalLength: boolean;
      lightingStyle: boolean;
      lightDirection: boolean;
      lightQuality: boolean;
      shadowStyle: boolean;
    };
    styleControls?: {
      overallStyle: boolean;
      colorPalette: boolean;
      artisticReferences: boolean;
      aestheticDirection: boolean;
      mood: boolean;
      colorTemperature: boolean;
      saturation: boolean;
    };
    atmosphericControls?: {
      atmosphericEffects: boolean;
      timeOfDay: boolean;
    };
    supportingControls?: {
      surfaceTextures: boolean;
      materialProperties: boolean;
    };
    postProcessingControls?: {
      visualEffects: boolean;
      postProcessing: boolean;
    };
  }): PromptComponents {
    const { project, userPrompt, characterDescriptions, sceneDescription, includeMasterPrompt = true, includeUserInput = true, triggerWords } = params;
    
    const triggerWordsComponent = buildTriggerWordsComponent(project, triggerWords);

    const masterPromptResult = includeMasterPrompt ? buildMasterPromptComponent(project) : '';
    console.log('🔍 PromptService masterPrompt debug:', {
      includeMasterPrompt,
      projectId: project?.id,
      hasImagePrompting: !!project?.imagePrompting,
      masterPromptConfigured: project?.imagePrompting?.masterPrompt,
      masterPromptResult: masterPromptResult,
      masterPromptLength: masterPromptResult?.length || 0
    });
    
    const components = {
      masterPrompt: masterPromptResult,
      userInput: includeUserInput ? buildUserInputComponent(userPrompt) : '',
      characterDescription: characterDescriptions,
      sceneFoundation: sceneDescription,
      technicalPhotography: params.technicalControls ? 
        this.buildControlledTechnicalComponent(project, params.technicalControls) : 
        buildTechnicalPhotographyComponent(project),
      visualStyleAesthetic: params.styleControls ? 
        this.buildControlledStyleComponent(project, params.styleControls) : 
        buildVisualStyleComponent(project),
      atmosphericEnvironmental: params.atmosphericControls ? 
        this.buildControlledAtmosphericComponent(project, params.atmosphericControls) : 
        buildAtmosphericComponent(project),
      supportingElements: params.supportingControls ? 
        this.buildControlledSupportingComponent(project, params.supportingControls) : 
        buildSupportingElementsComponent(project),
      postProcessingEffects: params.postProcessingControls ? 
        this.buildControlledPostProcessingComponent(project, params.postProcessingControls) : 
        buildPostProcessingComponent(project),
      triggerWords: triggerWordsComponent
    };

    return components;
  }

  /**
   * Synchronous prompt assembly (no more async operations)
   */
  private assemblePromptSync(
    masterPrompt: string,
    userInput: string,
    characterDescription: string,
    sceneFoundation: string,
    technicalPhotography: string,
    visualStyleAesthetic: string,
    atmosphericEnvironmental: string,
    supportingElements: string,
    postProcessingEffects: string,
    triggerWords: string
  ): { prompt: string; components: PromptComponents } {
    const components: PromptComponents = {
      masterPrompt,
      userInput,
      characterDescription,
      sceneFoundation,
      technicalPhotography,
      visualStyleAesthetic,
      atmosphericEnvironmental,
      supportingElements,
      postProcessingEffects,
      triggerWords
    };

    // Assemble the final prompt
    const promptParts = [
      masterPrompt,
      userInput,
      characterDescription,
      sceneFoundation,
      technicalPhotography,
      visualStyleAesthetic,
      atmosphericEnvironmental,
      supportingElements,
      postProcessingEffects,
      triggerWords
    ].filter(part => part && part.trim().length > 0);

    const prompt = promptParts.join(', ');

    return { prompt, components };
  }

  /**
   * Build character descriptions from multiple characters with granular controls
   */
  private buildCharacterDescriptions(characters: Character[], request: PromptBuildRequest): string {
    const descriptions = characters
      .map((character, index) => {
        const outfitIndex = request.characterOutfits?.[index];
        const parsedOutfitIndex = typeof outfitIndex === 'number' ? outfitIndex : 
                                  typeof outfitIndex === 'string' ? parseInt(outfitIndex) : 
                                  character.defaultOutfit ?? 0;
        
        try {
          // Use controlled character building if controls are provided
          if (request.characterControls && request.characterControls[index]) {
            return this.buildControlledCharacterComponent(character, parsedOutfitIndex, request.characterControls[index]);
          } else {
            // Fallback to basic character component
          const result = buildCharacterComponent(character, parsedOutfitIndex);
          return result;
          }
        } catch (error) {
          console.error(`❌ Error building character ${character?.name || index}:`, error);
          return '';
        }
      })
      .filter(desc => desc.trim().length > 0);

    const finalDescription = descriptions.join('; ');
    
    return finalDescription;
  }

  /**
   * Build controlled character component with granular parameter control
   */
  private buildControlledCharacterComponent(character: Character, outfitIndex: number, controls: {
    name?: boolean;
    age: boolean;
    gender: boolean;
    race: boolean;
    height: boolean;
    hairColor: boolean;
    eyeColor: boolean;
    physicalAppearance: boolean;
    profession: boolean;
    outfit: boolean;
  }): string {
    const parts: string[] = [];
    
    // Character name (if enabled)
    if (controls.name && character.name && character.name.trim()) {
      parts.push(character.name);
    }
    
    // Build demographics based on parameter controls
    const demographicParts: string[] = [];
    if (controls.age && character.age) demographicParts.push(`${character.age} year old`);
    if (controls.gender && character.gender && character.gender.trim()) demographicParts.push(character.gender.toLowerCase());
    if (controls.race && character.race && character.race.trim()) demographicParts.push(character.race.toLowerCase());
    if (controls.height && character.height && character.height.trim()) demographicParts.push(character.height);
    if (controls.hairColor && character.hairColor && character.hairColor.trim()) demographicParts.push(`${character.hairColor.toLowerCase()} hair`);
    if (controls.eyeColor && character.eyeColor && character.eyeColor.trim()) demographicParts.push(`${character.eyeColor.toLowerCase()} eyes`);
    
    if (demographicParts.length > 0) {
      parts.push(demographicParts.join(' '));
    }
    
    // Physical appearance
    if (controls.physicalAppearance && character.physicalAppearance && character.physicalAppearance.trim()) {
      parts.push(character.physicalAppearance);
    }
    
    // Outfit details
    if (controls.outfit && character.outfits && character.outfits[outfitIndex] && character.outfits[outfitIndex].name && character.outfits[outfitIndex].name.trim()) {
      parts.push(`wearing ${character.outfits[outfitIndex].name}`);
    }
    
    // Professional context
    if (controls.profession && character.profession && character.profession.trim()) {
      parts.push(character.profession);
    }
    
    return parts.filter(part => part.trim()).join(', ');
  }

  /**
   * Build scene description with granular controls
   */
  private buildSceneDescription(scene: Scene, request: PromptBuildRequest): string {
    // Use controlled scene building if controls are provided
    if (request.sceneControls) {
      return this.buildControlledSceneComponent(scene, request.sceneControls);
    } else {
      // Fallback to basic scene component
      return buildSceneComponent(scene);
    }
  }

  /**
   * Build controlled scene component with granular parameter control
   */
  private buildControlledSceneComponent(scene: Scene, controls: {
    setting: boolean;
    timeOfDay: boolean;
    lighting: boolean;
    mood: boolean;
    cameraAngle: boolean;
    atmosphere: boolean;
    props: boolean;
  }): string {
    const parts: string[] = [];
    
    if (controls.setting && scene.setting && scene.setting.trim()) parts.push(scene.setting);
    
    const lightingMoodParts: string[] = [];
    if (controls.lighting && scene.lighting && scene.lighting.trim()) lightingMoodParts.push(scene.lighting);
    if (controls.mood && scene.mood && scene.mood.trim()) lightingMoodParts.push(`${scene.mood} atmosphere`);
    if (controls.timeOfDay && scene.timeOfDay && scene.timeOfDay.trim()) lightingMoodParts.push(scene.timeOfDay);
    
    if (lightingMoodParts.length > 0) {
      parts.push(lightingMoodParts.filter(part => part.trim()).join(' '));
    }
    
    if (controls.cameraAngle && scene.cameraAngle && scene.cameraAngle.trim()) parts.push(scene.cameraAngle);
    if (controls.props && scene.props && scene.props.length > 0) {
      const validProps = scene.props.filter((prop: string) => prop && prop.trim());
      if (validProps.length > 0) {
        parts.push(`props: ${validProps.slice(0, 3).join(' ')}`);
      }
    }
    if (controls.atmosphere && scene.atmosphere && scene.atmosphere.trim()) parts.push(scene.atmosphere);
    
    return parts.filter(part => part.trim()).join(', ');
  }

  /**
   * Build controlled technical photography component with granular parameter control
   */
  private buildControlledTechnicalComponent(project: Project, controls: {
    cameraAngle: boolean;
    shotType: boolean;
    lensType: boolean;
    focalLength: boolean;
    lightingStyle: boolean;
    lightDirection: boolean;
    lightQuality: boolean;
    shadowStyle: boolean;
  }): string {
    const imaging = project.imagePrompting;
    const parts: string[] = [];
    
    // Camera and lens specs
    const cameraSpecsParts: string[] = [];
    if (controls.cameraAngle && imaging?.cameraAngle?.trim()) cameraSpecsParts.push(imaging.cameraAngle);
    if (controls.shotType && imaging?.shotType?.trim()) cameraSpecsParts.push(imaging.shotType);
    if (controls.lensType && imaging?.lensType?.trim()) cameraSpecsParts.push(imaging.lensType);
    if (controls.focalLength && imaging?.focalLength?.trim()) cameraSpecsParts.push(imaging.focalLength);
    
    if (cameraSpecsParts.length > 0) {
      parts.push(cameraSpecsParts.join(' '));
    }
    
    // Lighting technical specs
    const lightingSpecsParts: string[] = [];
    if (controls.lightingStyle && imaging?.lightingStyle?.trim()) lightingSpecsParts.push(imaging.lightingStyle);
    if (controls.lightDirection && imaging?.lightDirection?.trim()) lightingSpecsParts.push(imaging.lightDirection);
    if (controls.lightQuality && imaging?.lightQuality?.trim()) lightingSpecsParts.push(imaging.lightQuality);
    if (controls.shadowStyle && imaging?.shadowStyle?.trim()) lightingSpecsParts.push(imaging.shadowStyle);
    
    if (lightingSpecsParts.length > 0) {
      parts.push(lightingSpecsParts.join(' '));
    }
    
    return parts.filter(part => part.trim()).join(', ');
  }

  /**
   * Build controlled visual style component with granular parameter control
   */
  private buildControlledStyleComponent(project: Project, controls: {
    overallStyle: boolean;
    colorPalette: boolean;
    artisticReferences: boolean;
    aestheticDirection: boolean;
    mood: boolean;
    colorTemperature: boolean;
    saturation: boolean;
  }): string {
    const imaging = project.imagePrompting;
    const parts: string[] = [];
    
    // Style direction
    const styleDirectionParts: string[] = [];
    if (controls.overallStyle && imaging?.overallStyle?.trim()) styleDirectionParts.push(imaging.overallStyle);
    if (controls.aestheticDirection && imaging?.aestheticDirection?.trim()) styleDirectionParts.push(imaging.aestheticDirection);
    if (controls.mood && imaging?.mood?.trim()) styleDirectionParts.push(`${imaging.mood} atmosphere`);
    
    if (styleDirectionParts.length > 0) {
      parts.push(styleDirectionParts.join(' '));
    }
    
    // Color treatment
    const colorTreatmentParts: string[] = [];
    if (controls.colorPalette && imaging?.colorPalette?.trim()) colorTreatmentParts.push(imaging.colorPalette);
    if (controls.colorTemperature && imaging?.colorTemperature?.trim()) colorTreatmentParts.push(imaging.colorTemperature);
    if (controls.saturation && imaging?.saturation?.trim()) colorTreatmentParts.push(imaging.saturation);
    
    if (colorTreatmentParts.length > 0) {
      parts.push(colorTreatmentParts.join(' '));
    }
    
    // Artistic references - handle both string and array types
    if (controls.artisticReferences && imaging?.artisticReferences) {
      const artisticReferences = imaging.artisticReferences as string[] | string;
      if (Array.isArray(artisticReferences) && artisticReferences.length > 0) {
        const references = artisticReferences.slice(0, 2).join(' ');
        parts.push(`${references} inspired aesthetic`);
      } else if (typeof artisticReferences === 'string' && artisticReferences.trim()) {
        parts.push(`${artisticReferences.trim()} inspired aesthetic`);
      }
    }
    
    return parts.filter(part => part.trim()).join(', ');
  }

  /**
   * Build controlled atmospheric component with granular parameter control
   */
  private buildControlledAtmosphericComponent(project: Project, controls: {
    atmosphericEffects: boolean;
    timeOfDay: boolean;
  }): string {
    const imaging = project.imagePrompting;
    const parts: string[] = [];
    
    // Time and lighting atmosphere
    if (controls.timeOfDay && imaging?.timeOfDay?.trim()) {
      parts.push(`${imaging.timeOfDay} atmospheric lighting conditions`);
    }
    
    // Environmental effects - handle both string and array types
    if (controls.atmosphericEffects && imaging?.atmosphericEffects) {
      const atmosphericEffects = imaging.atmosphericEffects as string[] | string;
      if (Array.isArray(atmosphericEffects) && atmosphericEffects.length > 0) {
        const effects = atmosphericEffects.slice(0, 2).join(' ');
        parts.push(effects);
      } else if (typeof atmosphericEffects === 'string' && atmosphericEffects.trim()) {
        parts.push(atmosphericEffects.trim());
      }
    }
    
    return parts.filter(part => part.trim()).join(', ');
  }

  /**
   * Build controlled supporting elements component with granular parameter control
   */
  private buildControlledSupportingComponent(project: Project, controls: {
    surfaceTextures: boolean;
    materialProperties: boolean;
  }): string {
    const imaging = project.imagePrompting;
    const parts: string[] = [];
    
    // Surface textures - handle both string and array types
    if (controls.surfaceTextures && imaging?.surfaceTextures) {
      const surfaceTextures = imaging.surfaceTextures as string[] | string;
      if (Array.isArray(surfaceTextures) && surfaceTextures.length > 0) {
        const textures = surfaceTextures.slice(0, 2).join(' ');
        parts.push(textures);
      } else if (typeof surfaceTextures === 'string' && surfaceTextures.trim()) {
        parts.push(surfaceTextures.trim());
      }
    }
    
    // Material properties - handle both string and array types
    if (controls.materialProperties && imaging?.materialProperties) {
      const materialProperties = imaging.materialProperties as string[] | string;
      if (Array.isArray(materialProperties) && materialProperties.length > 0) {
        const materials = materialProperties.slice(0, 2).join(' ');
        parts.push(materials);
      } else if (typeof materialProperties === 'string' && materialProperties.trim()) {
        parts.push(materialProperties.trim());
      }
    }
    
    return parts.filter(part => part.trim()).join(', ');
  }

  /**
   * Build controlled post-processing component with granular parameter control
   */
  private buildControlledPostProcessingComponent(project: Project, controls: {
    visualEffects: boolean;
    postProcessing: boolean;
  }): string {
    // Only include post-processing effects if any controls are enabled
    const enabledControls = Object.values(controls).some(enabled => enabled);
    if (!enabledControls) {
      console.log('🎛️ PostProcessing: All controls disabled, returning empty string');
      return ''; // Return empty string if all controls are disabled
    }
    
    const imaging = project.imagePrompting;
    const parts: string[] = [];
    
    // Map controls to actual content filtering
    const visualEffectsControls = ['visualEffects'];
    const postProcessingControls = ['postProcessing'];
    
    const hasVisualEffectsEnabled = visualEffectsControls.some(control => controls[control as keyof typeof controls]);
    const hasPostProcessingEnabled = postProcessingControls.some(control => controls[control as keyof typeof controls]);
    
    console.log('🎛️ PostProcessing Controls Debug:', {
      allControls: controls,
      visualEffectsEnabled: hasVisualEffectsEnabled,
      postProcessingEnabled: hasPostProcessingEnabled,
      visualEffectsData: imaging?.visualEffects,
      postProcessingData: imaging?.postProcessing
    });
    
    // Include visual effects if related controls are enabled - handle both string and array types
    if (hasVisualEffectsEnabled && imaging?.visualEffects) {
      const visualEffects = imaging.visualEffects as string[] | string;
      if (Array.isArray(visualEffects) && visualEffects.length > 0) {
        const effects = visualEffects.join(' ');
        console.log('🎛️ Including visual effects:', effects);
        parts.push(effects);
      } else if (typeof visualEffects === 'string' && visualEffects.trim()) {
        console.log('🎛️ Including visual effects (string):', visualEffects);
        parts.push(visualEffects.trim());
      }
    }
    
    // Include post-processing if related controls are enabled - handle both string and array types
    if (hasPostProcessingEnabled && imaging?.postProcessing) {
      const postProcessing = imaging.postProcessing as string[] | string;
      if (Array.isArray(postProcessing) && postProcessing.length > 0) {
        const processing = postProcessing.join(' ');
        console.log('🎛️ Including post-processing:', processing);
        parts.push(processing);
      } else if (typeof postProcessing === 'string' && postProcessing.trim()) {
        console.log('🎛️ Including post-processing (string):', postProcessing);
        parts.push(postProcessing.trim());
      }
    }
    
    const result = parts.join(', ');
    console.log('🎛️ PostProcessing final result:', result);
    return result;
  }
}

// Create and export a singleton instance
export const promptService = new PromptService(); 