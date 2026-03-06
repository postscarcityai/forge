import { BusinessOverview, BrandStory, ImagePrompting } from '@/contexts/ProjectContext';

/**
 * Available project settings sections that can be updated
 */
export enum ProjectSection {
  GENERAL = 'general',
  BUSINESS = 'business', 
  BRAND = 'brand',
  PROMPTING = 'prompting',
  LORAS = 'loras',
  ENV = 'env'
}

/**
 * General project settings interface
 */
export interface GeneralSettings {
  name?: string;
  description?: string;
  slug?: string;
  color?: string;
  status?: 'active' | 'archived' | 'completed';
  isEditable?: boolean;
  defaultImageOrientation?: 'portrait' | 'landscape' | 'square';
  imageCount?: number;
}

/**
 * LoRA configuration interface
 */
export interface LoRASettings {
  lora1?: {
    enabled?: boolean;
    name?: string;
    triggerWords?: string[];
    strength?: number;
    modelPath?: string;
  };
  lora2?: {
    enabled?: boolean;
    name?: string;
    triggerWords?: string[];
    strength?: number;
    modelPath?: string;
  };
}

/**
 * Environment variables interface
 */
export interface EnvironmentSettings {
  [key: string]: string;
}

/**
 * Type mapping for each project section
 */
export type ProjectSettingsData = {
  [ProjectSection.GENERAL]: GeneralSettings;
  [ProjectSection.BUSINESS]: BusinessOverview;
  [ProjectSection.BRAND]: BrandStory;
  [ProjectSection.PROMPTING]: ImagePrompting;
  [ProjectSection.LORAS]: LoRASettings;
  [ProjectSection.ENV]: EnvironmentSettings;
};

/**
 * API endpoint mapping for each section
 */
const SECTION_ENDPOINTS = {
  [ProjectSection.GENERAL]: 'general',
  [ProjectSection.BUSINESS]: 'business',
  [ProjectSection.BRAND]: 'brand', 
  [ProjectSection.PROMPTING]: 'prompting',
  [ProjectSection.LORAS]: 'loras',
  [ProjectSection.ENV]: 'env'
} as const;

/**
 * Request body key mapping for each section
 */
const SECTION_BODY_KEYS = {
  [ProjectSection.GENERAL]: 'general',
  [ProjectSection.BUSINESS]: 'businessOverview',
  [ProjectSection.BRAND]: 'brandStory',
  [ProjectSection.PROMPTING]: 'imagePrompting', 
  [ProjectSection.LORAS]: 'loras',
  [ProjectSection.ENV]: 'environmentVariables'
} as const;

/**
 * Validation functions for each section
 */
const validateGeneralSettings = (data: GeneralSettings): string[] => {
  const errors: string[] = [];
  
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Name must be a non-empty string');
    } else if (data.name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }
  }
  
  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string' || !data.slug.trim()) {
      errors.push('Slug must be a non-empty string');
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      errors.push('Slug must be lowercase letters, numbers, and hyphens only');
    } else if (data.slug.length > 50) {
      errors.push('Slug cannot exceed 50 characters');
    }
  }
  
  if (data.color !== undefined) {
    if (typeof data.color !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
      errors.push('Color must be a valid hex format like #FF5733');
    }
  }
  
  if (data.status !== undefined) {
    if (!['active', 'archived', 'completed'].includes(data.status)) {
      errors.push('Status must be active, archived, or completed');
    }
  }
  
  if (data.defaultImageOrientation !== undefined) {
    if (!['portrait', 'landscape', 'square'].includes(data.defaultImageOrientation)) {
      errors.push('Default image orientation must be portrait, landscape, or square');
    }
  }
  
  if (data.imageCount !== undefined) {
    if (typeof data.imageCount !== 'number' || data.imageCount < 0) {
      errors.push('Image count must be a non-negative number');
    }
  }
  
  return errors;
};

const validateBusinessOverview = (data: BusinessOverview): string[] => {
  const errors: string[] = [];
  
  if (data.coreValues && Array.isArray(data.coreValues) && data.coreValues.length > 15) {
    errors.push('Core values cannot exceed 15 items');
  }
  
  if (data.offerings && Array.isArray(data.offerings) && data.offerings.length > 20) {
    errors.push('Offerings cannot exceed 20 items');
  }
  
  if (data.keyDifferentiators && Array.isArray(data.keyDifferentiators) && data.keyDifferentiators.length > 10) {
    errors.push('Key differentiators cannot exceed 10 items');
  }
  
  if (data.contactInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactInfo.email)) {
    errors.push('Contact email must be a valid email format');
  }
  
  return errors;
};

const validateImagePrompting = (data: ImagePrompting): string[] => {
  const errors: string[] = [];
  
  // Array field limits validation
  const arrayFieldLimits = {
    surfaceTextures: 25,
    materialProperties: 25,
    visualEffects: 30,
    atmosphericEffects: 20,
    postProcessing: 25,
    videoTransitions: 15,
    artisticReferences: 20,
    cinematicReferences: 20
  };
  
  for (const [field, limit] of Object.entries(arrayFieldLimits)) {
    const value = data[field as keyof ImagePrompting];
    if (value && Array.isArray(value) && value.length > limit) {
      errors.push(`${field} cannot exceed ${limit} items`);
    }
  }
  
  // Format validations
  if (data.aspectRatio && typeof data.aspectRatio === 'string') {
    if (!/^\d+:\d+$|^(square|portrait|landscape)$/i.test(data.aspectRatio)) {
      errors.push('Aspect ratio must be format like "16:9" or "square", "portrait", "landscape"');
    }
  }
  
  if (data.resolution && typeof data.resolution === 'string') {
    if (!/^\d+x\d+$|^(HD|FHD|4K|8K)$/i.test(data.resolution)) {
      errors.push('Resolution must be format like "1920x1080" or "HD", "FHD", "4K", "8K"');
    }
  }
  
  if (data.focalLength && typeof data.focalLength === 'string') {
    if (!/^\d+mm$|^\d+-\d+mm$/i.test(data.focalLength)) {
      errors.push('Focal length must be format like "50mm" or "24-70mm"');
    }
  }
  
  if (data.masterPrompt && typeof data.masterPrompt === 'string' && data.masterPrompt.length > 2000) {
    errors.push('Master prompt cannot exceed 2000 characters');
  }
  
  return errors;
};

/**
 * Validation function mapping
 */
const SECTION_VALIDATORS = {
  [ProjectSection.GENERAL]: validateGeneralSettings,
  [ProjectSection.BUSINESS]: validateBusinessOverview,
  [ProjectSection.BRAND]: () => [], // No specific validation for brand story yet
  [ProjectSection.PROMPTING]: validateImagePrompting,
  [ProjectSection.LORAS]: () => [], // No specific validation for LoRAs yet  
  [ProjectSection.ENV]: () => [] // No specific validation for env vars yet
} as const;

/**
 * Update a specific project settings section
 */
export async function updateProjectSettings<T extends ProjectSection>(
  projectId: string,
  section: T,
  data: Partial<ProjectSettingsData[T]>,
  baseUrl: string = 'http://localhost:4900'
): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log(`🔧 Updating ${section} settings for project: ${projectId}`);
  
  try {
    // Validate the data
    const validator = SECTION_VALIDATORS[section];
    const validationErrors = validator(data as any);
    
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Build request body
    const bodyKey = SECTION_BODY_KEYS[section];
    const requestBody = {
      [bodyKey]: data
    };
    
    // Make API call
    const endpoint = SECTION_ENDPOINTS[section];
    const response = await fetch(`${baseUrl}/api/database/projects/${projectId}/${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.error}`);
    }
    
    console.log(`✅ ${section} settings updated successfully!`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to update ${section} settings:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current settings for a section
 */
export async function getProjectSettings<T extends ProjectSection>(
  projectId: string,
  section: T,
  baseUrl: string = 'http://localhost:4900'
): Promise<{ success: boolean; data?: ProjectSettingsData[T]; error?: string }> {
  console.log(`📖 Reading ${section} settings for project: ${projectId}`);
  
  try {
    const endpoint = SECTION_ENDPOINTS[section];
    const response = await fetch(`${baseUrl}/api/database/projects/${projectId}/${endpoint}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Failed to get settings: ${result.error}`);
    }
    
    console.log(`✅ ${section} settings retrieved successfully!`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to get ${section} settings:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk update multiple sections at once
 */
export async function updateMultipleProjectSettings(
  projectId: string,
  updates: {
    [K in ProjectSection]?: Partial<ProjectSettingsData[K]>;
  },
  baseUrl: string = 'http://localhost:4900'
): Promise<{
  success: boolean;
  results: { [K in ProjectSection]?: { success: boolean; data?: any; error?: string } };
}> {
  console.log(`🔧 Bulk updating settings for project: ${projectId}`);
  console.log(`📝 Sections to update: ${Object.keys(updates).join(', ')}`);
  
  const results: any = {};
  let overallSuccess = true;
  
  // Update each section sequentially
  for (const [section, data] of Object.entries(updates)) {
    if (data) {
      const result = await updateProjectSettings(
        projectId,
        section as ProjectSection,
        data,
        baseUrl
      );
      
      results[section] = result;
      
      if (!result.success) {
        overallSuccess = false;
        console.error(`❌ Failed to update ${section}:`, result.error);
      }
    }
  }
  
  console.log(`${overallSuccess ? '✅' : '⚠️'} Bulk update completed with ${overallSuccess ? 'success' : 'some failures'}`);
  
  return {
    success: overallSuccess,
    results
  };
} 