import { Character, Scene, Project } from '@/contexts/ProjectContext';

export interface CharacterPromptOptions {
  character: Character;
  outfitIndex?: number; // Which outfit to use (default: character.defaultOutfit)
  scene?: string; // Custom scene description
  userPrompt?: string; // Additional user input to include
  includePhysicalDetails?: boolean; // Include detailed physical description
  includeProfession?: boolean; // Include profession/background info
  includeSceneOfCrime?: boolean; // Include the scene of crime details
}

/**
 * Generate a detailed character description for prompts
 */
export function generateCharacterDescription(options: CharacterPromptOptions): string {
  const { 
    character, 
    outfitIndex, 
    includePhysicalDetails = true, 
    includeProfession = true 
  } = options;

  const parts: string[] = [];

  // Basic demographics
  parts.push(`${character.age}-year-old ${character.gender.toLowerCase()}`);
  parts.push(`${character.race}`);
  parts.push(`${character.height}`);

  // Hair and eyes
  parts.push(`${character.hairColor.toLowerCase()} hair`);
  parts.push(`${character.eyeColor.toLowerCase()} eyes`);

  // Physical appearance
  if (includePhysicalDetails && character.physicalAppearance) {
    parts.push(character.physicalAppearance);
  }

  // Outfit
  const selectedOutfitIndex = outfitIndex ?? character.defaultOutfit ?? 0;
  if (character.outfits && character.outfits[selectedOutfitIndex]) {
    parts.push(`wearing ${character.outfits[selectedOutfitIndex].name}`);
  }

  // Profession context
  if (includeProfession && character.profession) {
    parts.push(`working as a ${character.profession}`);
  }

  return parts.join(', ');
}

/**
 * Generate a complete prompt incorporating character details
 */
export function generateCharacterPrompt(options: CharacterPromptOptions): string {
  const { 
    character, 
    scene, 
    userPrompt, 
    includeSceneOfCrime = false 
  } = options;

  const characterDesc = generateCharacterDescription(options);
  
  const promptParts: string[] = [];

  // User prompt first (if provided)
  if (userPrompt) {
    promptParts.push(userPrompt);
  }

  // Character description
  promptParts.push(characterDesc);

  // Scene context
  if (scene) {
    promptParts.push(scene);
  } else if (includeSceneOfCrime && character.sceneOfCrime) {
    promptParts.push(character.sceneOfCrime);
  }

  return promptParts.join(', ');
}

/**
 * Generate outfit-specific prompt for a character
 */
export function generateCharacterOutfitPrompt(
  character: Character, 
  outfitIndex: number, 
  scene?: string,
  userPrompt?: string
): string {
  return generateCharacterPrompt({
    character,
    outfitIndex,
    scene,
    userPrompt,
    includePhysicalDetails: true,
    includeProfession: false, // Skip profession for outfit-focused prompts
    includeSceneOfCrime: false
  });
}

/**
 * Generate crime scene prompt for a character
 */
export function generateCharacterCrimeScenePrompt(
  character: Character, 
  userPrompt?: string
): string {
  return generateCharacterPrompt({
    character,
    userPrompt,
    includePhysicalDetails: true,
    includeProfession: true,
    includeSceneOfCrime: true
  });
}

/**
 * Fetch character from database and generate prompt
 */
export async function generatePromptWithCharacter(
  characterName: string,
  projectId: string,
  options: Partial<CharacterPromptOptions> = {}
): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/characters?name=${encodeURIComponent(characterName)}&projectId=${projectId}`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch character ${characterName}`);
      return null;
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.error(`Character ${characterName} not found`);
      return null;
    }
    
    const character = result.data as Character;
    
    return generateCharacterPrompt({
      character,
      ...options
    });
  } catch (error) {
    console.error('Error generating prompt with character:', error);
    return null;
  }
}

/**
 * Helper to get character outfit options
 */
export function getCharacterOutfitOptions(character: Character): { index: number; description: string }[] {
  return character.outfits.map((outfit, index) => ({
    index,
    description: outfit.name
  }));
}

/**
 * Helper to get character details for UI display
 */
export function formatCharacterSummary(character: Character): string {
  return `${character.name} (${character.age}, ${character.gender}, ${character.profession || 'Unknown profession'}) - ${character.caseDetails || character.background}`;
}

// ===== NEW PROGRAMMATIC PROMPT GENERATION =====

/**
 * Get character outfit by index or default
 */
export function getCharacterOutfit(character: Character, outfitIndex?: number): string {
  const index = outfitIndex ?? character.defaultOutfit ?? 0;
  return character.outfits[index]?.name || character.outfits[0]?.name || '';
}

/**
 * Build a complete character prompt with outfit
 */
export function buildCharacterPrompt(character: Character, outfitIndex?: number): string {
  const outfit = getCharacterOutfit(character, outfitIndex);
  
  return `${character.physicalAppearance} ${outfit}`;
}

/**
 * Build scene prompt from scene data
 */
export function buildScenePrompt(scene: Scene): string {
  const parts = [
    scene.setting,
    `${scene.timeOfDay} lighting`,
    scene.lighting,
    `${scene.mood} mood`,
    `${scene.cameraAngle} camera angle`,
    scene.atmosphere
  ].filter(Boolean);
  
  if (scene.props && scene.props.length > 0) {
    parts.push(`props: ${scene.props.join(', ')}`);
  }
  
  return parts.join(', ');
}

interface StructuredPromptParams {
  userPrompt: string;
  characterName?: string;
  characterOutfit?: string | number;
  sceneName?: string;
  projectId: string;
}

// Import types for the new 9-component system
type PromptComponents = import('./promptComponents').PromptComponents;
type WordBudgetReport = import('./wordBudgetEnforcer').WordBudgetReport;

/**
 * @deprecated Use PromptService instead
 * Legacy function maintained for backward compatibility only
 * All new prompt building should use src/services/PromptService.ts
 */
export async function buildStructuredPrompt(params: StructuredPromptParams): Promise<{
  prompt: string;
  wordCount: number;
  components: PromptComponents;
  budgetReport: WordBudgetReport;
}> {
  console.warn('⚠️ buildStructuredPrompt is deprecated. Use PromptService instead.');
  
  // Redirect to new PromptService
  const { promptService } = await import('@/services/PromptService');
  
  const result = await promptService.buildPrompt({
    userPrompt: params.userPrompt,
    characterNames: params.characterName ? [params.characterName] : [],
    characterOutfits: params.characterOutfit !== undefined ? [params.characterOutfit] : [],
    sceneName: params.sceneName,
    projectId: params.projectId
  });
  
  return {
    prompt: result.prompt,
    wordCount: result.wordCount,
    components: result.components,
    budgetReport: result.budgetReport
  };
}

/**
 * Helper: Fetch project settings from database
 */
async function fetchProjectSettings(projectId: string): Promise<Project> {
  try {
    console.log(`🔍 Fetching project settings for: ${projectId}`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`);
    console.log(`📡 API response status: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`📊 API result success: ${result.success}, has data: ${!!result.data}`);
      
      if (result.success && result.data) {
        // The API returns the project with settings nested inside
        const project = result.data;
        const settings = project.settings || {};
        
        console.log(`🎯 ImagePrompting keys found: ${Object.keys(settings.imagePrompting || {}).length} keys`);
        console.log(`🎯 SurfaceTextures length: ${(settings.imagePrompting?.surfaceTextures || []).length}`);
        console.log(`🎯 First surfaceTexture: ${(settings.imagePrompting?.surfaceTextures || [])[0]}`);
        
        // Convert database format to Project interface
        const mappedProject = {
          id: project.id,
          name: project.name,
          slug: settings.slug || project.id,
          color: settings.color || '#6B7280',
          status: settings.status || 'active',
          description: project.description,
          businessOverview: settings.businessOverview,
          brandStory: settings.brandStory,
          imagePrompting: settings.imagePrompting,
          loras: settings.loras,
          imageCount: settings.imageCount || 0,
          lastActivity: settings.lastActivity ? new Date(settings.lastActivity) : new Date(),
          defaultImageOrientation: settings.defaultImageOrientation
        } as Project;
        
        console.log(`✅ Successfully mapped project with imagePrompting`);
        return mappedProject;
      }
    }
    console.log(`❌ API response not OK or invalid data, falling back to defaults`);
  } catch (error) {
    console.error('❌ Error fetching project settings:', error);
  }
  
  console.log(`⚠️ Using fallback project settings - this means API fetch failed!`);
  return {
    id: projectId,
    name: 'Default Project',
    slug: 'default',
    status: 'active',
    imagePrompting: {
      masterPrompt: 'cinematic photography dramatic lighting high quality professional composition visual storytelling',
      cameraAngle: 'eye-level perspective',
      shotType: 'medium close-up',
      lensType: '85mm portrait lens',
      focalLength: 'shallow depth of field',
      lightingStyle: 'dramatic directional lighting',
      lightDirection: 'key light 45-degree angle',
      lightQuality: 'soft diffused light',
      shadowStyle: 'natural shadow placement',
      overallStyle: 'professional cinematic quality',
      aestheticDirection: 'modern cinematic composition',
      mood: 'focused professional atmosphere',
      colorPalette: 'natural tones balanced palette',
      colorTemperature: 'neutral temperature balance',
      saturation: 'controlled saturation levels',
      artisticReferences: []
    }
  } as Project;
}

/**
 * Helper: Fetch character from database
 */
async function fetchCharacter(characterName: string, projectId: string): Promise<Character | null> {
  try {
    console.log(`🔍 Fetching character: "${characterName}" from project: "${projectId}"`);
    const { databaseService } = await import('@/services/databaseService');
    const character = await databaseService.getCharacterByName(characterName, projectId);
    
    if (character) {
      console.log(`✅ Character found: ${character.name}, Age: ${character.age}, Outfits: ${character.outfits?.length || 0}`);
      console.log(`📝 Physical: "${character.physicalAppearance?.substring(0, 50)}..."`);
      console.log(`👕 Outfit 0: "${character.outfits?.[0]?.name?.substring(0, 50)}..."`);
    } else {
      console.log(`❌ Character not found: "${characterName}"`);
    }
    
    return character;
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
}

/**
 * Helper: Fetch scene from database
 */
async function fetchScene(sceneName: string, projectId: string): Promise<Scene | null> {
  try {
    const { databaseService } = await import('@/services/databaseService');
    return await databaseService.getSceneByName(sceneName, projectId);
  } catch (error) {
    console.error('Error fetching scene:', error);
    return null;
  }
}

/**
 * Helper: Parse character outfit parameter
 */
function parseCharacterOutfit(characterOutfit: string | number | undefined, character: Character): number | undefined {
  if (typeof characterOutfit === 'number') {
    return characterOutfit;
  }
  
  if (typeof characterOutfit === 'string' && character.outfits) {
    const outfitIndex = character.outfits.findIndex(outfit => 
      outfit.name.toLowerCase().includes(characterOutfit.toLowerCase())
    );
    return outfitIndex >= 0 ? outfitIndex : undefined;
  }
  
  return undefined;
}



// ===== DATABASE-DRIVEN HELPER FUNCTIONS =====

/**
 * Get all available characters for a project from database
 */
export async function getAvailableCharacters(projectId: string): Promise<{ name: string; id: string; profession?: string }[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/characters?projectId=${projectId}`);
    if (!response.ok) return [];
    
    const result = await response.json();
    if (!result.success || !result.data) return [];
    
    const characters = Array.isArray(result.data) ? result.data : [result.data];
    return characters.map((char: any) => ({
      name: char.name,
      id: char.id,
      profession: char.profession
    }));
  } catch (error) {
    console.error('Error fetching available characters:', error);
    return [];
  }
}

/**
 * Get all available scenes for a project from database
 */
export async function getAvailableScenes(projectId: string): Promise<{ name: string; id: string; setting: string }[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/scenes?projectId=${projectId}`);
    if (!response.ok) return [];
    
    const result = await response.json();
    if (!Array.isArray(result)) return [];
    
    return result.map((scene: any) => ({
      name: scene.name,
      id: scene.id,
      setting: scene.setting
    }));
  } catch (error) {
    console.error('Error fetching available scenes:', error);
    return [];
  }
}

/**
 * Get all available outfits for a specific character
 */
export async function getAvailableCharacterOutfits(characterName: string, projectId: string): Promise<{ index: number; description: string; isDefault: boolean }[]> {
  try {
    const { databaseService } = await import('@/services/databaseService');
    const character = await databaseService.getCharacterByName(characterName, projectId);
    
    if (!character) return [];
    
    return character.outfits.map((outfit, index) => ({
      index,
      description: outfit.name,
      isDefault: index === (character.defaultOutfit ?? 0)
    }));
  } catch (error) {
    console.error('Error fetching character outfits:', error);
    return [];
  }
}

/**
 * Generate a random character + outfit + scene combination from database
 */
export async function generateRandomCombination(projectId: string): Promise<{
  character: string;
  outfit: number;
  scene: string;
} | null> {
  try {
    const [characters, scenes] = await Promise.all([
      getAvailableCharacters(projectId),
      getAvailableScenes(projectId)
    ]);
    
    if (characters.length === 0 || scenes.length === 0) return null;
    
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
    
    const outfits = await getAvailableCharacterOutfits(randomCharacter.name, projectId);
    const randomOutfit = outfits.length > 0 ? Math.floor(Math.random() * outfits.length) : 0;
    
    return {
      character: randomCharacter.name,
      outfit: randomOutfit,
      scene: randomScene.name
    };
  } catch (error) {
    console.error('Error generating random combination:', error);
    return null;
  }
}

/**
 * Get formatted summary of all available options for a project
 */
export async function getProjectGenerationOptions(projectId: string): Promise<{
  characters: any[];
  scenes: { name: string; setting: string }[];
  totalCombinations: number;
}> {
  try {
    // Get full character data directly from database API
    const charactersResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/characters?projectId=${projectId}`);
    let characters: any[] = [];
    
    if (charactersResponse.ok) {
      const charactersResult = await charactersResponse.json();
      if (charactersResult.success && charactersResult.data) {
        characters = Array.isArray(charactersResult.data) ? charactersResult.data : [charactersResult.data];
        // Add outfitCount to each character
        characters = characters.map(char => ({
          ...char,
          outfitCount: char.outfits ? char.outfits.length : 0
        }));
      }
    }
    
    // Get scene data
    const scenes = await getAvailableScenes(projectId);
    
    const totalOutfits = characters.reduce((sum, char) => sum + (char.outfitCount || 0), 0);
    const totalCombinations = totalOutfits * scenes.length;
    
    return {
      characters,
      scenes: scenes.map(scene => ({ name: scene.name, setting: scene.setting })),
      totalCombinations
    };
  } catch (error) {
    console.error('Error getting project options:', error);
    return { characters: [], scenes: [], totalCombinations: 0 };
  }
}

// ===== NEW PROGRAMMATIC PROMPT GENERATION ===== 