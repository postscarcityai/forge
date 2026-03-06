/**
 * Image Data Structure
 * 
 * This file defines the structure for image metadata that would typically
 * come from a database. In production, this would be replaced with actual
 * API calls to your backend.
 */

export interface ImageMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  projectId?: string; // Project association - defaults to 'default' if not specified
  fileSize?: number; // bytes
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    camera?: string;
    location?: string;
    [key: string]: unknown;
  };
  hidden?: boolean; // Whether the image is hidden
  timelineOrder?: number | null; // Position in timeline, null if not in timeline
}

/**
 * Mock image database - would be replaced with actual API calls
 * This represents what would come back from a database query
 */
export const mockImageDatabase: ImageMetadata[] = []; 