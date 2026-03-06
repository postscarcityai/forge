import { ImageData } from '@/contexts/ImageContext';

/**
 * Extract the model name from image/video metadata
 */
export function extractModel(image: ImageData): string | null {
  if (!image.metadata) return null;

  // Try api_response.model_used first (most common)
  const apiResponse = image.metadata.api_response as Record<string, unknown> | undefined;
  if (apiResponse?.model_used && typeof apiResponse.model_used === 'string') {
    return apiResponse.model_used;
  }

  // Try metadata.model
  if (image.metadata.model && typeof image.metadata.model === 'string') {
    return image.metadata.model;
  }

  // Fallback to filename patterns for videos
  if (image.mediaType === 'video') {
    const filename = image.filename.toLowerCase();
    
    if (filename.includes('talking-heads')) return 'talking-heads';
    if (filename.includes('kling-elements')) return 'kling-video-elements';
    if (filename.includes('kling')) return 'kling-video';
    if (filename.includes('framepack') || filename.includes('ltx')) return 'framepack';
    if (filename.includes('luma') || filename.includes('dream')) return 'luma-dream';
    if (filename.includes('hailuo') || filename.includes('minimax')) return 'minimax-hailuo';
    if (filename.includes('pixverse')) return 'pixverse';
    if (filename.includes('pika')) return 'pika-scenes';
    if (filename.includes('wan') || filename.includes('flf2v')) return 'wan-flf2v';
    if (filename.includes('sora')) return 'sora-2';
  }

  // Fallback to filename patterns for images
  if (image.mediaType === 'image') {
    const filename = image.filename.toLowerCase();
    
    if (filename.includes('flux-lora') || filename.includes('fluxlora')) return 'flux-lora';
    if (filename.includes('flux-schnell') || filename.includes('fluxschnell')) return 'flux-schnell';
    if (filename.includes('flux-kontext') || filename.includes('kontext')) return 'flux-kontext';
    if (filename.includes('ideogram')) return 'ideogram-v2';
    if (filename.includes('aura')) return 'aura-sr';
  }

  return null;
}

/**
 * Extract video type from image/video metadata
 * Returns a simplified video type category
 */
export function extractVideoType(image: ImageData): string | null {
  if (image.mediaType !== 'video') return null;

  const model = extractModel(image);
  if (!model) {
    // Fallback to filename patterns
    const filename = image.filename.toLowerCase();
    if (filename.includes('talking-heads')) return 'talking-heads';
    if (filename.includes('kling')) return 'kling';
    if (filename.includes('framepack') || filename.includes('ltx')) return 'framepack';
    return 'other';
  }

  // Categorize by model
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('talking-heads')) return 'talking-heads';
  if (modelLower.includes('kling')) return 'kling';
  if (modelLower.includes('framepack') || modelLower.includes('ltx')) return 'framepack';
  if (modelLower.includes('luma') || modelLower.includes('dream')) return 'luma-dream';
  if (modelLower.includes('hailuo') || modelLower.includes('minimax')) return 'minimax';
  if (modelLower.includes('pixverse')) return 'pixverse';
  if (modelLower.includes('pika')) return 'pika';
  if (modelLower.includes('wan') || modelLower.includes('flf2v')) return 'wan';
  if (modelLower.includes('sora')) return 'sora';
  
  return 'other';
}

/**
 * Get a display-friendly name for a model
 */
export function getModelDisplayName(model: string | null): string {
  if (!model) return 'Unknown';
  
  const modelLower = model.toLowerCase();
  
  // Video models
  if (modelLower.includes('talking-heads')) return 'Talking Heads';
  if (modelLower.includes('kling-elements')) return 'Kling Elements';
  if (modelLower.includes('kling')) return 'Kling Video';
  if (modelLower.includes('framepack') || modelLower.includes('ltx')) return 'Framepack';
  if (modelLower.includes('luma') || modelLower.includes('dream')) return 'Luma Dream';
  if (modelLower.includes('hailuo') || modelLower.includes('minimax')) return 'MiniMax Hailuo';
  if (modelLower.includes('pixverse')) return 'PixVerse';
  if (modelLower.includes('pika')) return 'Pika Scenes';
  if (modelLower.includes('wan') || modelLower.includes('flf2v')) return 'WAN FLF2V';
  if (modelLower.includes('sora')) return 'Sora 2';
  
  // Image models
  if (modelLower.includes('flux-lora')) return 'Flux LoRA';
  if (modelLower.includes('flux-schnell')) return 'Flux Schnell';
  if (modelLower.includes('flux-kontext')) return 'Flux Kontext';
  if (modelLower.includes('ideogram')) return 'Ideogram';
  if (modelLower.includes('aura')) return 'Aura SR';
  
  // Return cleaned up model name
  return model.split('/').pop() || model;
}

/**
 * Get a display-friendly name for a video type
 */
export function getVideoTypeDisplayName(videoType: string | null): string {
  if (!videoType) return 'All Videos';
  
  const typeMap: Record<string, string> = {
    'talking-heads': 'Talking Heads',
    'kling': 'Kling',
    'framepack': 'Framepack',
    'luma-dream': 'Luma Dream',
    'minimax': 'MiniMax',
    'pixverse': 'PixVerse',
    'pika': 'Pika',
    'wan': 'WAN',
    'sora': 'Sora',
    'other': 'Other'
  };
  
  return typeMap[videoType] || videoType;
}

