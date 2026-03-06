/**
 * Aspect Ratio Configuration for Image Generation
 * 
 * This file defines all available aspect ratios, their display names,
 * API mappings, and whether they require special handling.
 */

export interface AspectRatioOption {
  // The value stored in the database and used internally
  value: string;
  // What the user sees in the UI
  label: string;
  // The value sent to the FAL API (Nano Banana Pro supported: auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16)
  apiValue: string;
  // Category for grouping in UI
  category: 'portrait' | 'landscape' | 'square' | 'special';
  // Whether this ratio is locked/premium (shown with lock icon)
  locked?: boolean;
  // Approximate decimal ratio (width/height) for reference
  ratio: number;
  // Optional description or note
  note?: string;
}

/**
 * All available aspect ratios
 * Organized by category: Portrait (tall), Landscape (wide), Square, Special
 */
export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  // === PORTRAIT (Tall) ===
  {
    value: '1:3',
    label: '1:3',
    apiValue: '9:16', // Closest API-supported tall ratio
    category: 'portrait',
    ratio: 0.333,
  },
  {
    value: '1:2',
    label: '1:2',
    apiValue: '9:16', // Closest API-supported tall ratio
    category: 'portrait',
    ratio: 0.5,
  },
  {
    value: '9:16',
    label: '9:16',
    apiValue: '9:16',
    category: 'portrait',
    ratio: 0.5625,
  },
  {
    value: '10:16',
    label: '10:16',
    apiValue: '9:16', // Closest API-supported ratio
    category: 'portrait',
    ratio: 0.625,
  },
  {
    value: '2:3',
    label: '2:3',
    apiValue: '2:3',
    category: 'portrait',
    ratio: 0.667,
  },
  {
    value: '3:4',
    label: '3:4',
    apiValue: '3:4',
    category: 'portrait',
    ratio: 0.75,
  },
  {
    value: '4:5',
    label: '4:5',
    apiValue: '4:5',
    category: 'portrait',
    ratio: 0.8,
  },

  // === LANDSCAPE (Wide) ===
  {
    value: '3:1',
    label: '3:1',
    apiValue: '21:9', // Closest API-supported wide ratio
    category: 'landscape',
    ratio: 3.0,
  },
  {
    value: '2:1',
    label: '2:1',
    apiValue: '21:9', // Closest API-supported wide ratio
    category: 'landscape',
    ratio: 2.0,
  },
  {
    value: '16:9',
    label: '16:9',
    apiValue: '16:9',
    category: 'landscape',
    ratio: 1.778,
  },
  {
    value: '16:10',
    label: '16:10',
    apiValue: '16:9', // Closest API-supported ratio
    category: 'landscape',
    ratio: 1.6,
  },
  {
    value: '3:2',
    label: '3:2',
    apiValue: '3:2',
    category: 'landscape',
    ratio: 1.5,
  },
  {
    value: '4:3',
    label: '4:3',
    apiValue: '4:3',
    category: 'landscape',
    ratio: 1.333,
  },
  {
    value: '5:4',
    label: '5:4',
    apiValue: '5:4',
    category: 'landscape',
    ratio: 1.25,
  },

  // === SQUARE ===
  {
    value: '1:1',
    label: '1:1 (Square)',
    apiValue: '1:1',
    category: 'square',
    ratio: 1.0,
  },

  // === SPECIAL FORMATS ===
  {
    value: '11:17',
    label: '11×17 Print',
    apiValue: '2:3', // 11:17 = 0.647, closest to 2:3 (0.667) - only ~3% wider, minimal cropping needed
    category: 'special',
    ratio: 0.647,
    note: 'Tabloid/Poster (11×17")',
  },
  {
    value: '21:9',
    label: '21:9 (Ultrawide)',
    apiValue: '21:9',
    category: 'landscape',
    ratio: 2.333,
  },
  {
    value: 'custom',
    label: 'Custom',
    apiValue: 'auto', // Let API decide
    category: 'special',
    ratio: 1.0,
  },
];

/**
 * Get all aspect ratios for a specific category
 */
export const getAspectRatiosByCategory = (category: AspectRatioOption['category']): AspectRatioOption[] => {
  return ASPECT_RATIO_OPTIONS.filter(opt => opt.category === category);
};

/**
 * Get aspect ratio option by value
 */
export const getAspectRatioByValue = (value: string): AspectRatioOption | undefined => {
  return ASPECT_RATIO_OPTIONS.find(opt => opt.value === value);
};

/**
 * Convert a stored aspect ratio value to the API-compatible value
 */
export const toApiAspectRatio = (value: string): string => {
  const option = getAspectRatioByValue(value);
  if (option) {
    return option.apiValue;
  }
  
  // Handle legacy values (portrait/landscape/square)
  switch (value) {
    case 'portrait':
      return '9:16';
    case 'landscape':
      return '16:9';
    case 'square':
      return '1:1';
    default:
      // If it's already an API value, return as-is
      const validApiValues = ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'];
      if (validApiValues.includes(value)) {
        return value;
      }
      return '9:16'; // Default fallback
  }
};

/**
 * Get display label for an aspect ratio value
 */
export const getAspectRatioLabel = (value: string): string => {
  const option = getAspectRatioByValue(value);
  if (option) {
    return option.label;
  }
  
  // Handle legacy values
  switch (value) {
    case 'portrait':
      return 'Portrait (9:16)';
    case 'landscape':
      return 'Landscape (16:9)';
    case 'square':
      return 'Square (1:1)';
    default:
      return value;
  }
};

/**
 * All valid aspect ratio values (for type safety)
 */
export type AspectRatioValue = 
  | '1:3' | '1:2' | '9:16' | '10:16' | '2:3' | '3:4' | '4:5'  // Portrait
  | '3:1' | '2:1' | '16:9' | '16:10' | '3:2' | '4:3' | '5:4' | '21:9' // Landscape
  | '1:1'  // Square
  | '11:17' | 'custom'  // Special
  | 'portrait' | 'landscape' | 'square';  // Legacy values

/**
 * Portrait aspect ratios (for quick access)
 */
export const PORTRAIT_RATIOS = ASPECT_RATIO_OPTIONS.filter(opt => opt.category === 'portrait');

/**
 * Landscape aspect ratios (for quick access)
 */
export const LANDSCAPE_RATIOS = ASPECT_RATIO_OPTIONS.filter(opt => opt.category === 'landscape');

/**
 * Default aspect ratio
 */
export const DEFAULT_ASPECT_RATIO: AspectRatioValue = '9:16';
