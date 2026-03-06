/**
 * Timeline Configuration
 * 
 * Hard-coded timeline configuration that defines which images
 * should appear in the timeline and in what order.
 * This replaces localStorage for timeline state management.
 */

export interface TimelineConfig {
  timeline: string[]; // Array of image IDs that should be in timeline, in order
  featured: string[]; // Array of image IDs that should be featured/highlighted
}

/**
 * Default timeline configuration
 * Add image IDs here to have them appear in the timeline by default
 */
export const defaultTimelineConfig: TimelineConfig = {
  // Timeline order - add image IDs here in the order you want them to appear
  timeline: [
    // Example: 'img-1', 'img-2', etc.
    // Leave empty to start with empty timeline
  ],
  
  // Featured images - these get special treatment in the UI
  featured: [
    // Example: 'img-1'
    // Leave empty if no featured images
  ]
};

/**
 * Helper function to check if an image should be in timeline
 */
export const isInTimeline = (imageId: string): boolean => {
  return defaultTimelineConfig.timeline.includes(imageId);
};

/**
 * Helper function to check if an image is featured
 */
export const isFeatured = (imageId: string): boolean => {
  return defaultTimelineConfig.featured.includes(imageId);
};

/**
 * Helper function to get timeline order index
 */
export const getTimelineIndex = (imageId: string): number => {
  return defaultTimelineConfig.timeline.indexOf(imageId);
}; 