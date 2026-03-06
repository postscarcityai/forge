'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Icon, X, Copy, Calendar, Info, Check, ChevronDown, ChevronRight, User, MapPin } from '@/components/ui/Icon';
import { ImageData } from '@/contexts/ImageContext';
import { WordBudgetBreakdown } from '@/components/ui/WordBudgetBreakdown';
import { LabeledPromptBreakdown } from '@/components/ui/LabeledPromptBreakdown';
import { FlexiblePromptBreakdown } from '@/components/ui/FlexiblePromptBreakdown';
import { Character, Scene } from '@/contexts/ProjectContext';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageData | null;
}

// Helper function to fetch character by ID
const fetchCharacterById = async (characterId: string, projectId: string): Promise<Character | null> => {
  try {
    const response = await fetch(`/api/database/characters?id=${characterId}&projectId=${projectId}`);
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
};

// Helper function to fetch scene by ID
const fetchSceneById = async (sceneId: string, projectId: string): Promise<Scene | null> => {
  try {
    const response = await fetch(`/api/database/scenes?id=${sceneId}&projectId=${projectId}`);
    const data = await response.json();
    // The scenes API returns the scene directly, not wrapped in success/data
    if (data && data.id) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching scene:', error);
    return null;
  }
};

// Component to display character information
const CharacterInfo: React.FC<{ character: Character }> = ({ character }) => (
  <div className="bg-accent/30 rounded-lg p-3 space-y-2">
    <div className="flex items-center gap-2">
      <Icon icon={User} size="sm" className="text-blue-600" />
      <span className="font-medium text-foreground">{character.name}</span>
    </div>
    <div className="text-sm text-muted-foreground space-y-1">
      <div>Age: {character.age} • Gender: {character.gender} • Race: {character.race}</div>
      <div>Height: {character.height} • Hair: {character.hairColor} • Eyes: {character.eyeColor}</div>
      {character.profession && <div>Profession: {character.profession}</div>}
      {character.physicalAppearance && (
        <div className="mt-2 text-xs italic">{character.physicalAppearance}</div>
      )}
      {character.outfits && character.outfits.length > 0 && (
        <div className="mt-2">
          <span className="font-medium">Outfits:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {character.outfits.map((outfit, index) => (
              <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                {outfit.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// Component to display scene information  
const SceneInfo: React.FC<{ scene: Scene }> = ({ scene }) => (
  <div className="bg-accent/30 rounded-lg p-3 space-y-2">
    <div className="flex items-center gap-2">
      <Icon icon={MapPin} size="sm" className="text-green-600" />
      <span className="font-medium text-foreground">{scene.name}</span>
    </div>
    <div className="text-sm text-muted-foreground space-y-1">
      {scene.setting && <div>Setting: {scene.setting}</div>}
      {scene.timeOfDay && <div>Time: {scene.timeOfDay}</div>}
      {scene.lighting && <div>Lighting: {scene.lighting}</div>}
      {scene.mood && <div>Mood: {scene.mood}</div>}
      {scene.cameraAngle && <div>Camera: {scene.cameraAngle}</div>}
      {scene.atmosphere && <div>Atmosphere: {scene.atmosphere}</div>}
      {scene.props && scene.props.length > 0 && (
        <div>
          <span className="font-medium">Props:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {scene.props.map((prop, index) => (
              <span key={index} className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                {prop}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// Component to display characters and scene section
const CharactersAndSceneSection: React.FC<{ 
  characterIds: string[]; 
  sceneId: string | null; 
  projectId: string; 
}> = ({ characterIds, sceneId, projectId }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch characters
        if (characterIds && characterIds.length > 0) {
          const characterPromises = characterIds.map(id => fetchCharacterById(id, projectId));
          const fetchedCharacters = await Promise.all(characterPromises);
          setCharacters(fetchedCharacters.filter((char): char is Character => char !== null));
        }

        // Fetch scene
        if (sceneId) {
          const fetchedScene = await fetchSceneById(sceneId, projectId);
          setScene(fetchedScene);
        }
      } catch (error) {
        console.error('Error fetching characters and scene:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [characterIds, sceneId, projectId]);

  if (loading) {
    return (
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-4">
          Characters & Scene
        </h3>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (characters.length === 0 && !scene) {
    return null;
  }

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-4">
        Characters & Scene
      </h3>
      <div className="space-y-4">
        {characters.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Characters ({characters.length})
            </h4>
            <div className="space-y-3">
              {characters.map((character) => (
                <CharacterInfo key={character.id} character={character} />
              ))}
            </div>
          </div>
        )}
        
        {scene && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Scene</h4>
            <SceneInfo scene={scene} />
          </div>
        )}
      </div>
    </div>
  );
};

const InfoField: React.FC<{
  label: string;
  value: string | number | undefined;
  icon?: LucideIcon;
}> = ({ label, value, icon: IconComponent }) => {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2">
        {IconComponent && <Icon icon={IconComponent} size="xs" className="text-muted-foreground" />}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm text-foreground font-mono">{value}</span>
    </div>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-accent/30 hover:bg-accent/50 transition-colors duration-200 rounded-t-lg"
      >
        <span className="font-medium text-foreground">{title}</span>
        {isOpen ? <Icon icon={ChevronDown} size="sm" /> : <Icon icon={ChevronRight} size="sm" />}
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-4 border-t border-border"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

const TagPill: React.FC<{ tag: string; index: number }> = ({ tag, index }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.02 }}
    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
  >
    {tag}
  </motion.span>
);

const CopyButtonPill: React.FC<{
  label: string;
  value: string;
  variant?: 'default' | 'blue';
}> = ({ label, value, variant = 'default' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const baseClasses = "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors";
  const variantClasses = variant === 'blue' 
    ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
    : "bg-accent/50 border-border text-foreground hover:bg-accent";

  return (
    <button
      onClick={handleCopy}
      className={`${baseClasses} ${variantClasses}`}
      title={`Copy ${label}`}
    >
      {copied ? <Icon icon={Check} size="xs" className="text-green-600" /> : <Icon icon={Copy} size="xs" />}
      {copied ? 'Copied!' : label}
    </button>
  );
};

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, image }) => {
  if (!image) return null;

  const imageUrl = image.mediaType === 'video' 
    ? (() => {
        const videoRelativePath = (image.metadata?.relativePath as string) || '';
        return videoRelativePath 
          ? `/videos/${videoRelativePath}/${image.filename}` 
          : `/videos/clips/${image.filename}`;
      })()
    : `/images/${image.filename}`;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return undefined;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const metadata = image.metadata || {};

  // Get the prompt to display (prefer final prompt, fall back to original user input)
  const promptToShow = (metadata.prompt as string) || (metadata.original_prompt as string);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="pointer-events-auto">
        <Modal isOpen={isOpen} onClose={onClose} size="full">
          <div className="flex h-[98vh] bg-background">
        {/* Left Side - Image */}
        <div className="flex-1 bg-accent/20 relative min-w-0 overflow-hidden">
          {image.mediaType === 'video' ? (
            <video
              src={imageUrl}
              className="absolute inset-0 w-full h-full object-contain shadow-xl"
              controls
              autoPlay
              loop
              muted
            />
          ) : (
            <div className="absolute inset-0">
              <Image
                src={imageUrl}
                alt={image.title}
                fill
                className="object-contain shadow-xl"
                sizes="(max-width: 768px) 100vw, 70vw"
                priority
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                }}
              />
            </div>
          )}
        </div>

        {/* Right Side - Details */}
        <div className="w-[520px] bg-background border-l border-border flex flex-col flex-shrink-0">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors bg-background shadow-sm border border-border"
            >
              <Icon icon={X} size="sm" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Title */}
            <div>
              <h1 className="text-xl font-semibold text-foreground">{image.title}</h1>
            </div>

            {/* Always Visible Copy Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <CopyButtonPill 
                label="Copy Path" 
                value={imageUrl}
                variant="default"
              />
              {((metadata.fal_image_url && typeof metadata.fal_image_url === 'string') || (metadata.fal_video_url && typeof metadata.fal_video_url === 'string')) ? (
                <CopyButtonPill 
                  label="Copy Fal URL" 
                  value={(metadata.fal_video_url as string) || (metadata.fal_image_url as string)}
                  variant="blue"
                />
              ) : null}
            </div>

            {/* Prompt Section with Labels - Open by Default */}
            {promptToShow ? (
              <CollapsibleSection title="Prompt Breakdown" defaultOpen={true}>
                <FlexiblePromptBreakdown 
                  capturedComponents={metadata.capturedComponents as any}
                  promptComponents={metadata.prompt_components as any}
                  prompt={promptToShow as string}
                  showEmptyComponents={true}
                  showMetadata={false}
                />
              </CollapsibleSection>
            ) : null}

            {/* Word Budget Breakdown - Only show if we have a prompt */}
            {promptToShow ? (
              <CollapsibleSection title="Word Budget Breakdown" defaultOpen={false}>
                <WordBudgetBreakdown 
                  prompt={promptToShow as string} 
                  projectId={image.projectId}
                  characterName={metadata.character_name as string}
                  sceneName={metadata.scene_name as string}
                  userPrompt={metadata.user_prompt as string}
                />
              </CollapsibleSection>
            ) : null}

            {/* Characters & Scene */}
            {(metadata.character_ids && Array.isArray(metadata.character_ids) && metadata.character_ids.length > 0) || metadata.scene_id ? (
              <CharactersAndSceneSection 
                characterIds={(metadata.character_ids as string[]) || []} 
                sceneId={(metadata.scene_id as string) || null} 
                projectId={image.projectId}
              />
            ) : null}
            
            {/* Model & Technical Settings */}
            <CollapsibleSection title="Model & Settings">
              <div className="space-y-1">
                <InfoField label="Model" value={metadata.model as string} />
                <InfoField label="Image Size" value={metadata.image_size as string} />
                {metadata.num_inference_steps && typeof metadata.num_inference_steps === 'number' ? (
                  <InfoField label="Inference Steps" value={metadata.num_inference_steps} />
                ) : null}
                <InfoField label="Guidance Scale" value={metadata.guidance_scale as number} />
                <InfoField label="Seed" value={metadata.seed as number} />
                {metadata.inference_time && typeof metadata.inference_time === 'number' ? (
                  <InfoField label="Generation Time" value={`${metadata.inference_time}s`} />
                ) : null}
              </div>
            </CollapsibleSection>

            {/* LoRAs */}
            {metadata.loras && Array.isArray(metadata.loras) && metadata.loras.length > 0 ? (
              <CollapsibleSection title="LoRAs Applied">
                <div className="space-y-3">
                  {(metadata.loras as Array<{path: string; scale: number}>).map((lora, index) => (
                    <div key={index} className="bg-accent/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          LoRA {index + 1}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          Scale: {lora.scale}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground break-all">
                        {lora.path}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            ) : null}

            {/* File Information */}
            <CollapsibleSection title="File Information">
              <div className="space-y-1">
                <InfoField label="ID" value={image.id} icon={Info} />
                <InfoField label="Filename" value={image.filename} />
                <InfoField label="Created" value={formatDate(image.createdAt)} icon={Calendar} />
                <InfoField label="Project" value={image.projectId} />
                {metadata.fileSize && typeof metadata.fileSize === 'number' ? (
                  <InfoField label="File Size" value={formatFileSize(metadata.fileSize)} />
                ) : null}
                {metadata.dimensions && typeof metadata.dimensions === 'object' && 'width' in metadata.dimensions && 'height' in metadata.dimensions ? (
                  <InfoField 
                    label="Dimensions" 
                    value={`${(metadata.dimensions as { width: number; height: number }).width} × ${(metadata.dimensions as { width: number; height: number }).height}`} 
                  />
                ) : null}
              </div>
            </CollapsibleSection>

            {/* Advanced Metadata */}
            {Object.keys(metadata).length > 0 ? (
              <CollapsibleSection title="Advanced Metadata">
                <div className="space-y-1">
                  {Object.entries(metadata)
                    .filter(([key]) => ![
                      'prompt', 'original_prompt', 'concept', 'model', 'image_size', 
                      'num_inference_steps', 'guidance_scale', 'seed', 'inference_time',
                      'loras', 'fileSize', 'dimensions', 'fal_image_url', 'source_image_url',
                      'aspect_ratio', 'api_response', 'character_ids', 'scene_id'
                    ].includes(key))
                    .map(([key, value]) => {
                      if (value === null || value === undefined || value === '') return null;
                      
                      let displayValue = String(value);
                      
                      if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                      } else if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      }

                      return (
                        <InfoField
                          key={key}
                          label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          value={displayValue}
                        />
                      );
                    })}
                </div>
              </CollapsibleSection>
            ) : null}

            {/* Tags */}
            {image.tags && image.tags.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag, index) => (
                    <TagPill key={tag} tag={tag} index={index} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}; 