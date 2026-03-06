import React from 'react';
import { 
  Palette, 
  Video, 
  Camera, 
  Lightbulb, 
  Rainbow, 
  Users, 
  Wrench, 
  Sparkles, 
  Settings,
  Target
} from 'lucide-react';
import { Project } from '@/contexts/ProjectContext';

interface ImagePromptingTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  handleImagePromptingChange: (field: string, value: unknown) => void;
  handleArrayFieldChange: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number, value: string) => void;
  handleAddArrayItem: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string) => void;
  handleRemoveArrayItem: (section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, index: number) => void;
  renderTextField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string, isTextarea?: boolean) => React.ReactElement;
  renderArrayField: (label: string, section: 'businessOverview' | 'brandStory' | 'imagePrompting', field: string, placeholder?: string) => React.ReactElement;
}

export const ImagePromptingTab: React.FC<ImagePromptingTabProps> = ({
  isEditing,
  editedProject,
  project,
  handleImagePromptingChange,
  handleArrayFieldChange,
  handleAddArrayItem,
  handleRemoveArrayItem,
  renderTextField,
  renderArrayField,
}) => {
  return (
    <div className="space-y-6">
      {/* Master Prompt (Foundation) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Target className="h-4 w-4" />
          Master Prompt (Foundation)
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Master Prompt', 'imagePrompting', 'masterPrompt', 'Complete master prompt for image generation...', true)}
        </div>
      </div>

      {/* Core Creative Direction */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Palette className="h-4 w-4" />
          Core Creative Direction
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Overall Style', 'imagePrompting', 'overallStyle', 'minimalist design, 3D style, photorealistic...')}
          {renderTextField('Aesthetic Direction', 'imagePrompting', 'aestheticDirection', 'professional & corporate, artistic, modern...')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Mood', 'imagePrompting', 'mood', 'professional, dramatic, serene, energetic...')}
        </div>
      </div>

      {/* Photography & Cinematography */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Camera className="h-4 w-4" />
          Photography & Cinematography
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Camera Angle', 'imagePrompting', 'cameraAngle', 'low angle, high angle, eye level...')}
          {renderTextField('Shot Type', 'imagePrompting', 'shotType', 'wide shot, close-up, medium shot...')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Lens Type', 'imagePrompting', 'lensType', 'wide angle, telephoto, macro...')}
          {renderTextField('Focal Length', 'imagePrompting', 'focalLength', '85mm, 24-70mm, 50mm...')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Camera Movement', 'imagePrompting', 'cameraMovement', 'static, panning, tracking...')}
        </div>
      </div>

      {/* Lighting Design */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Lightbulb className="h-4 w-4" />
          Lighting Design
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Lighting Style', 'imagePrompting', 'lightingStyle', 'dramatic lighting, natural light, studio lighting...')}
          {renderTextField('Light Direction', 'imagePrompting', 'lightDirection', 'directional, ambient, backlighting...')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Light Quality', 'imagePrompting', 'lightQuality', 'soft, hard, mixed, diffused...')}
          {renderTextField('Shadow Style', 'imagePrompting', 'shadowStyle', 'purposeful shadows, soft shadows, dramatic...')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Time of Day', 'imagePrompting', 'timeOfDay', 'golden hour, blue hour, midday, stylized lighting...')}
        </div>
      </div>

      {/* Color & Visual Treatment */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Rainbow className="h-4 w-4" />
          Color & Visual Treatment
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Color Palette', 'imagePrompting', 'colorPalette', 'brand colors, warm tones, monochromatic...')}
          {renderTextField('Color Temperature', 'imagePrompting', 'colorTemperature', 'cool blue-white, warm orange, neutral...')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Saturation', 'imagePrompting', 'saturation', 'enhanced color saturation, muted, vibrant...')}
          {renderTextField('Contrast', 'imagePrompting', 'contrast', 'higher contrast, low contrast, balanced...')}
        </div>
      </div>

      {/* Subject & Composition */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Users className="h-4 w-4" />
          Subject & Composition
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Subject Matter', 'imagePrompting', 'subjectMatter', 'Professional specialists, characters, objects...', true)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Composition', 'imagePrompting', 'composition', 'rule of thirds, symmetrical, diamond formation...')}
          {renderTextField('Framing', 'imagePrompting', 'framing', 'hero shots, close framing, wide framing...')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Perspective', 'imagePrompting', 'perspective', 'low angle hero shots, eye level, bird\'s eye...')}
        </div>
      </div>

      {/* Texture & Materials */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Wrench className="h-4 w-4" />
          Texture & Materials
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField('Surface Textures', 'imagePrompting', 'surfaceTextures', 'brushed aluminum, metallic, weathered...')}
          {renderArrayField('Material Properties', 'imagePrompting', 'materialProperties', 'metallic, weathered, industrial...')}
        </div>
      </div>

      {/* Visual Effects & Post-Processing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Sparkles className="h-4 w-4" />
          Visual Effects & Post-Processing
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField('Visual Effects', 'imagePrompting', 'visualEffects', 'volumetric particles, rim lighting, lens flare...')}
          {renderArrayField('Atmospheric Effects', 'imagePrompting', 'atmosphericEffects', 'dust particles, fog, industrial atmosphere...')}
          {renderArrayField('Post Processing', 'imagePrompting', 'postProcessing', 'color grading, depth of field, animated clarity...')}
        </div>
      </div>

      {/* Video-Specific Elements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Video className="h-4 w-4" />
          Video-Specific Elements
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Motion Blur', 'imagePrompting', 'motionBlur', 'natural motion blur, freeze frame...')}
          {renderTextField('Depth of Field', 'imagePrompting', 'depthOfField', 'shallow DOF, deep focus, storytelling focus...')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Frame Rate', 'imagePrompting', 'frameRate', '24fps, 60fps, high speed...')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField('Video Transitions', 'imagePrompting', 'videoTransitions', 'fade, cut, dissolve...')}
        </div>
      </div>

      {/* Style References */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Palette className="h-4 w-4" />
          Style References
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField('Artistic References', 'imagePrompting', 'artisticReferences', 'Pixar, Studio Ghibli, specific artists...')}
          {renderArrayField('Cinematic References', 'imagePrompting', 'cinematicReferences', 'Marvel cinematography, documentary style...')}
        </div>
      </div>

      {/* Technical Parameters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-tight border-b border-border pb-2">
          <Settings className="h-4 w-4" />
          Technical Parameters
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderTextField('Aspect Ratio', 'imagePrompting', 'aspectRatio', '16:9, 1:1, 3:4, portrait, landscape...')}
          {renderTextField('Resolution', 'imagePrompting', 'resolution', 'High Resolution, 4K, 8K, ultra detailed...')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTextField('Compression Level', 'imagePrompting', 'compressionLevel', 'lossless, high quality, web optimized...')}
        </div>
      </div>
    </div>
  );
}; 