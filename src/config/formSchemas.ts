import { BookOpen, MessageSquare, Palette, FileText, Clipboard, Building2, Camera, User, MapPin, Layers, Folder } from 'lucide-react';

export interface FieldConfig {
  type: 'text' | 'textarea' | 'array' | 'object' | 'auto';
  label: string;
  placeholder?: string;
  icon?: any;
  section?: string;
  gridCols?: number;
}

export interface SchemaConfig {
  [key: string]: FieldConfig | SchemaConfig;
}

// Auto-detection for objects - will render based on actual data structure
export const brandStorySchema: SchemaConfig = {
  sections: {
    foundation: {
      title: 'Brand Foundation',
      icon: BookOpen,
      fields: {
        brandNarrative: {
          type: 'textarea',
          label: 'Brand Narrative',
          placeholder: 'Tell your brand story and origin...'
        },
        brandPersonality: {
          type: 'auto', // Auto-detect structure from data
          label: 'Brand Personality'
        }
      }
    },
    communication: {
      title: 'Communication & Voice',
      icon: MessageSquare,
      fields: {
        voiceAndTone: {
          type: 'textarea',
          label: 'Voice & Tone',
          placeholder: 'How your brand communicates and sounds...'
        },
        messagingPillars: {
          type: 'array',
          label: 'Messaging Pillars',
          placeholder: 'Core message or value proposition...'
        }
      }
    },
    visual: {
      title: 'Visual Identity',
      icon: Palette,
      fields: {
        visualIdentity: {
          type: 'auto', // Auto-detect nested structure
          label: 'Visual Identity'
        }
      }
    },
    content: {
      title: 'Content & Storytelling',
      icon: FileText,
      fields: {
        contentThemes: {
          type: 'array',
          label: 'Content Themes',
          placeholder: 'Content topic or theme...'
        },
        storytellingApproach: {
          type: 'textarea',
          label: 'Storytelling Approach',
          placeholder: 'How you tell stories and connect with audience...'
        }
      }
    },
    implementation: {
      title: 'Brand Implementation',
      icon: Clipboard,
      fields: {
        brandGuidelines: {
          type: 'textarea',
          label: 'Brand Guidelines',
          placeholder: 'Implementation and usage guidelines...'
        },
        audienceConnection: {
          type: 'textarea',
          label: 'Audience Connection',
          placeholder: 'How you connect and engage with your audience...'
        }
      }
    }
  }
};

export const businessOverviewSchema: SchemaConfig = {
  sections: {
    overview: {
      title: 'Company Overview',
      icon: Building2,
      fields: {
        companyDescription: {
          type: 'textarea',
          label: 'Company Description',
          placeholder: 'Describe your company...'
        },
        missionStatement: {
          type: 'textarea',
          label: 'Mission Statement',
          placeholder: 'Your company mission...'
        }
      }
    },
    values: {
      title: 'Values & Offerings',
      icon: Clipboard,
      fields: {
        coreValues: {
          type: 'array',
          label: 'Core Values',
          placeholder: 'Core value or principle...'
        },
        offerings: {
          type: 'array',
          label: 'Offerings',
          placeholder: 'Product or service offering...'
        }
      }
    },
    market: {
      title: 'Market Position',
      icon: Building2,
      fields: {
        targetAudience: {
          type: 'array',
          label: 'Target Audience',
          placeholder: 'Target customer segment...'
        },
        keyDifferentiators: {
          type: 'array',
          label: 'Key Differentiators',
          placeholder: 'What makes you unique...'
        }
      }
    },
    contact: {
      title: 'Contact Information',
      icon: Building2,
      fields: {
        contactInfo: {
          type: 'auto', // Auto-detect nested structure
          label: 'Contact Information'
        }
      }
    }
  }
};

export const imagePromptingSchema: SchemaConfig = {
  sections: {
    style: {
      title: 'Visual Style',
      icon: Camera,
      fields: {
        masterPrompt: {
          type: 'textarea',
          label: 'Master Prompt',
          placeholder: 'Overall image generation prompt...'
        },
        overallStyle: {
          type: 'text',
          label: 'Overall Style',
          placeholder: 'Visual style description...'
        }
      }
    },
    technical: {
      title: 'Technical Parameters',
      icon: Camera,
      fields: {
        technicalParameters: {
          type: 'auto',
          label: 'Technical Parameters'
        }
      }
    }
  }
};

// Type detection utilities
export const detectFieldType = (value: any): 'text' | 'textarea' | 'array' | 'object' => {
  if (Array.isArray(value)) return 'array';
  if (value && typeof value === 'object') return 'object';
  if (typeof value === 'string' && value.length > 100) return 'textarea';
  return 'text';
};

export const generateDynamicSchema = (data: any, sectionName: string): SchemaConfig => {
  const schema: SchemaConfig = {};
  
  Object.entries(data || {}).forEach(([key, value]) => {
    schema[key] = {
      type: detectFieldType(value),
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      placeholder: `Enter ${key.toLowerCase()}...`
    };
  });
  
  return schema;
}; 