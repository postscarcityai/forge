import { Project, LoRAConfig } from '@/contexts/ProjectContext';

/**
 * API LoRA format for batch generation
 */
export interface APILoRA {
  path: string;
  scale: number;
}

/**
 * Convert project LoRA configuration to API format
 * Only includes enabled LoRAs with valid paths
 */
export function projectLoRAsToAPIFormat(project: Project): APILoRA[] {
  const loras: APILoRA[] = [];
  
  if (!project.loras) {
    return loras;
  }

  // Add LoRA 1 if enabled and has path
  if (project.loras.lora1?.enabled && project.loras.lora1.path?.trim()) {
    loras.push({
      path: project.loras.lora1.path.trim(),
      scale: project.loras.lora1.scale || 0.5
    });
  }

  // Add LoRA 2 if enabled and has path
  if (project.loras.lora2?.enabled && project.loras.lora2.path?.trim()) {
    loras.push({
      path: project.loras.lora2.path.trim(),
      scale: project.loras.lora2.scale || 0.5
    });
  }

  return loras;
}

/**
 * Create default LoRA configuration for new projects
 */
export function createDefaultLoRAConfig(): LoRAConfig {
  return {
    lora1: {
      id: 'minimal-design',
      name: 'Minimal Design',
      path: 'https://matres.nyc3.cdn.digitaloceanspaces.com/flux_s_MinimalDesign.safetensors',
      scale: 0.8, // Use new default strength
      enabled: true,
      triggerWords: ['minimal design', 'clean', 'simple', 'geometric', 'modern']
    },
    lora2: {
      id: 'cute-3d-cartoon',
      name: 'Cute 3D Cartoon',
      path: 'https://matres.nyc3.cdn.digitaloceanspaces.com/Cute_3d_Cartoon_Flux.safetensors',
      scale: 0.8, // Use new default strength
      enabled: true,
      triggerWords: ['3d cartoon', 'cute', 'stylized', 'animated', 'pixar style']
    }
  };
}

/**
 * Get LoRAs summary for logging/display
 */
export function getLoRAsSummary(loras: APILoRA[]): string {
  if (loras.length === 0) return 'No LoRAs configured';
  
  return loras.map(lora => {
    const filename = lora.path.split('/').pop() || 'unknown';
    return `${filename} (${lora.scale.toFixed(3)})`;
  }).join(', ');
} 