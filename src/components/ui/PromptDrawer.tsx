'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, X, Eye, EyeOff, Zap, Check, AlertCircle, Download, Upload } from '@/components/ui/Icon';
import { useProjectContext, Character, Scene } from '@/contexts/ProjectContext';
import { dbCache } from '@/lib/indexedDB';

// Import all the new modular components
import {
  PromptPreview,
  MasterPromptSection,
  CustomPromptSection,
  CharactersSection,
  SceneFoundationSection,
  TechnicalPhotographySection,
  VisualStyleSection,
  AtmosphericSection,
  SupportingElementsSection,
  PostProcessingSection,
  VideoSpecificSection,
  LoraSection
} from './PromptDrawer/index';
import { FoundationSection } from './PromptDrawer/FoundationSection';

interface PromptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export const PromptDrawer: React.FC<PromptDrawerProps> = ({
  isOpen,
  onClose,
  isMobile = false,
}) => {
  const { 
    currentProject, 
    characters: allCharacters, 
    scenes: allScenes, 
    isLoadingProjectData,
    getCharactersByProject,
    getScenesByProject,
    getProjectLoRATriggerWords,
    refreshProjectData
  } = useProjectContext();
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [totalWords, setTotalWords] = useState(0);
  const [promptComponents, setPromptComponents] = useState<{
    masterPrompt: string;
    userInput: string;
    characterDescription: string;
    sceneFoundation: string;
    technicalPhotography: string;
    visualStyleAesthetic: string;
    atmosphericEnvironmental: string;
    supportingElements: string;
    postProcessingEffects: string;
    triggerWords: string;
  } | null>(null);
  const [userInput, setUserInput] = useState('');
  // Use centralized data from ProjectContext
  const characters = currentProject ? getCharactersByProject(currentProject.id) : [];
  const scenes = currentProject ? getScenesByProject(currentProject.id) : [];
  const loading = isLoadingProjectData;
  const [showPromptPreview, setShowPromptPreview] = useState(true);
  
  // Image generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Dropdown states
  const [expandedSections, setExpandedSections] = useState({
    masterPrompt: false,
    foundation: false,
    userInput: true,    // Expand userInput by default so users can enter text
    characters: false,
    scene: false,
    technical: true,
    style: true,
    atmospheric: false,
    supporting: false,
    postProcessing: false,
    videoSpecific: false,
    triggerWords: false
  });
  
  // Multiple character selection (up to 3)
  const [selectedCharacters, setSelectedCharacters] = useState<{
    character: Character | null;
    outfitIndex: number;
    enabled: boolean;
  }[]>([
    { character: null, outfitIndex: 0, enabled: true },
    { character: null, outfitIndex: 0, enabled: false },
    { character: null, outfitIndex: 0, enabled: false }
  ]);
  
  // Track unsaved outfit changes
  const [unsavedOutfitChanges, setUnsavedOutfitChanges] = useState<Set<string>>(new Set());
  const [isSavingOutfits, setIsSavingOutfits] = useState(false);
  
  // Single scene selection
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  
  // Granular parameter controls for each character and scene
  const [characterControls, setCharacterControls] = useState<Array<{
    age: boolean;
    gender: boolean;
    race: boolean;
    height: boolean;
    hairColor: boolean;
    eyeColor: boolean;
    physicalAppearance: boolean;
    profession: boolean;
    outfit: boolean;
  }>>([
    { age: true, gender: true, race: true, height: true, hairColor: true, eyeColor: true, physicalAppearance: true, profession: true, outfit: true },
    { age: true, gender: true, race: true, height: true, hairColor: true, eyeColor: true, physicalAppearance: true, profession: true, outfit: true },
    { age: true, gender: true, race: true, height: true, hairColor: true, eyeColor: true, physicalAppearance: true, profession: true, outfit: true }
  ]);

  const [sceneControls, setSceneControls] = useState({
    setting: true,
    timeOfDay: true,
    lighting: true,
    mood: true,
    cameraAngle: true,
    atmosphere: true,
    props: true
  });

  const [technicalControls, setTechnicalControls] = useState({
    cameraAngle: true,
    shotType: true,
    lensType: true,
    focalLength: true,
    lightingStyle: true,
    lightDirection: true,
    lightQuality: true,
    shadowStyle: true,
    technicalQualityBooster: true,  // Added from database
    aspectRatio: true,              // Added from database
    resolution: true                // Added from database
  });

  const [styleControls, setStyleControls] = useState({
    overallStyle: true,
    colorPalette: true,
    artisticReferences: true,
    aestheticDirection: true,
    mood: true,
    colorTemperature: true,
    saturation: true,
    visualStyleInjector: true,      // Added from database
    characterModifiers: true        // Added from database
  });

  const [atmosphericControls, setAtmosphericControls] = useState({
    atmosphericEffects: true,
    timeOfDay: true,
    environment: true               // Added from database
  });

  const [supportingControls, setSupportingControls] = useState({
    surfaceTextures: true,
    materialProperties: true
  });

  const [postProcessingControls, setPostProcessingControls] = useState({
    visualEffects: true,
    postProcessing: true
  });

  const [videoControls, setVideoControls] = useState({
    motionBlur: true,
    depthOfField: true,
    videoTransitions: true,
    frameRate: true                 // Added from database
  });

  const [foundationControls, setFoundationControls] = useState({
    foundationPrompt: true,         // Added from database
    promptingStrategy: true,        // Added from database
    sceneTemplates: true           // Added from database
  });

  const [loraControls, setLoraControls] = useState<Record<string, boolean>>({});

  // NEW: Video-specific controls - REMOVED (not connected to prompt building)
  // const [videoControls, setVideoControls] = useState({
  //   motionBlur: true, depthOfField: true, videoTransitions: true, frameRate: true
  // });

  // NEW: Subject & composition controls
  // const [subjectControls, setSubjectControls] = useState({
  //   subjectMatter: true
  // });

  // Master prompt state
  const [masterPromptEnabled, setMasterPromptEnabled] = useState(true);
  
  // User input state
  const [userInputEnabled, setUserInputEnabled] = useState(true);

  // Settings initialization tracking
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings when project changes
  useEffect(() => {
    if (!currentProject?.id) {
      setSettingsLoaded(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const savedSettings = await dbCache.loadPromptDrawerSettings(currentProject.id);
        
        if (savedSettings) {
          // Restore other settings
          const defaultUserInput = savedSettings.userInput || currentProject.imagePrompting?.subjectMatter || '';
          setUserInput(defaultUserInput);
          
          // Properly merge saved expandedSections with defaults
          const defaultExpanded = {
            masterPrompt: false,
            userInput: true,     // Expand userInput by default so users can enter text
            characters: false,
            scene: false,
            technical: true,
            style: true,
            atmospheric: false,
            supporting: false,
            postProcessing: false,
            videoSpecific: false,
            triggerWords: false
          };
          setExpandedSections({ ...defaultExpanded, ...savedSettings.expandedSections });

          // Properly merge saved controls with defaults
          const defaultCharacterControls = [
            { name: true, age: true, gender: true, race: true, height: true, hairColor: true, eyeColor: true, physicalAppearance: true, profession: true, outfit: true },
            { name: true, age: true, gender: true, race: true, height: true, hairColor: true, eyeColor: true, physicalAppearance: true, profession: true, outfit: true },
            { name: true, age: true, gender: true, race: true, height: true, hairColor: true, eyeColor: true, physicalAppearance: true, profession: true, outfit: true }
          ];
          if (savedSettings.characterControls && Array.isArray(savedSettings.characterControls)) {
            const mergedCharacterControls = defaultCharacterControls.map((defaultControl, index) => ({
              ...defaultControl,
              ...(savedSettings.characterControls[index] || {})
            }));
            setCharacterControls(mergedCharacterControls);
          } else {
            setCharacterControls(defaultCharacterControls);
          }

          const defaultSceneControls = { setting: true, timeOfDay: true, lighting: true, mood: true, cameraAngle: true, atmosphere: true, props: true };
          setSceneControls({ ...defaultSceneControls, ...savedSettings.sceneControls });

          const defaultTechnicalControls = { cameraAngle: true, shotType: true, lensType: true, focalLength: true, lightingStyle: true, lightDirection: true, lightQuality: true, shadowStyle: true, technicalQualityBooster: true, aspectRatio: true, resolution: true };
          setTechnicalControls({ ...defaultTechnicalControls, ...savedSettings.technicalControls });

          const defaultStyleControls = { overallStyle: true, colorPalette: true, artisticReferences: true, aestheticDirection: true, mood: true, colorTemperature: true, saturation: true, visualStyleInjector: true, characterModifiers: true };
          setStyleControls({ ...defaultStyleControls, ...savedSettings.styleControls });

          const defaultAtmosphericControls = { atmosphericEffects: true, timeOfDay: true, environment: true };
          setAtmosphericControls({ ...defaultAtmosphericControls, ...savedSettings.atmosphericControls });

          const defaultSupportingControls = { surfaceTextures: true, materialProperties: true };
          setSupportingControls({ ...defaultSupportingControls, ...savedSettings.supportingControls });

          const defaultPostProcessingControls = { visualEffects: true, postProcessing: true };
          setPostProcessingControls({ ...defaultPostProcessingControls, ...savedSettings.postProcessingControls });

          const defaultVideoControls = { motionBlur: true, depthOfField: true, videoTransitions: true, frameRate: true };
          setVideoControls({ ...defaultVideoControls, ...savedSettings.videoControls });

          const defaultFoundationControls = { foundationPrompt: true, promptingStrategy: true, sceneTemplates: true };
          setFoundationControls({ ...defaultFoundationControls, ...savedSettings.foundationControls });

          const defaultLoraControls = {};
          setLoraControls({ ...defaultLoraControls, ...savedSettings.loraControls });

          setMasterPromptEnabled(savedSettings.masterPromptEnabled ?? true);
          setUserInputEnabled(savedSettings.userInputEnabled ?? true);

          setShowPromptPreview(savedSettings.showPromptPreview ?? true);
        } else {
          // Initialize with defaults
          const defaultUserInput = currentProject.imagePrompting?.subjectMatter || '';
          console.log('📝 Initializing user input:', {
            projectSubjectMatter: currentProject.imagePrompting?.subjectMatter,
            finalUserInput: defaultUserInput,
            isEmpty: !defaultUserInput.trim()
          });
          setUserInput(defaultUserInput);
          console.log('📝 Initialized default prompt drawer settings for project:', currentProject.id);
        }
      } catch (error) {
        console.warn('Failed to load prompt drawer settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [currentProject?.id]);

  // Initialize LoRA controls based on current project trigger words
  useEffect(() => {
    if (!currentProject?.loras) {
      setLoraControls({});
      return;
    }

    const newLoraControls: Record<string, boolean> = {};
    
    // Add LoRA 1 trigger words
    if (currentProject.loras.lora1?.enabled && currentProject.loras.lora1.triggerWords) {
      currentProject.loras.lora1.triggerWords.forEach((triggerWord) => {
        newLoraControls[`lora1_${triggerWord}`] = true;
      });
    }
    
    // Add LoRA 2 trigger words
    if (currentProject.loras.lora2?.enabled && currentProject.loras.lora2.triggerWords) {
      currentProject.loras.lora2.triggerWords.forEach((triggerWord) => {
        newLoraControls[`lora2_${triggerWord}`] = true;
      });
    }

    setLoraControls(newLoraControls);
  }, [currentProject?.loras]);

  // Memoize selectedCharacters to prevent infinite re-renders
  const selectedCharactersStable = useMemo(() => {
    return selectedCharacters.map(sc => ({
      characterId: sc.character?.id || null,
      outfitIndex: sc.outfitIndex,
      enabled: sc.enabled
    }));
  }, [selectedCharacters.map(sc => `${sc.character?.id}-${sc.outfitIndex}-${sc.enabled}`).join(',')]);

  // Save settings when they change (but only after initial load)
  useEffect(() => {
    if (!currentProject?.id || !settingsLoaded) return;

    const saveSettings = async () => {
      try {
        const settings = {
          userInput,
          selectedCharacters: selectedCharactersStable,
          selectedSceneId: selectedScene?.id || null,
          expandedSections,
          characterControls,
          sceneControls,
          technicalControls,
          styleControls,
          atmosphericControls,
          supportingControls,
          postProcessingControls,
          videoControls,
          foundationControls,
          loraControls,
          masterPromptEnabled,
          userInputEnabled,
          showPromptPreview
        };

        await dbCache.savePromptDrawerSettings(currentProject.id, settings);
      } catch (error) {
        console.warn('Failed to save prompt drawer settings:', error);
      }
    };

    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(saveSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [
    currentProject?.id,
    settingsLoaded,
    userInput,
    selectedCharactersStable,
    selectedScene?.id,
    expandedSections,
    characterControls,
    sceneControls,
    technicalControls,
    styleControls,
    atmosphericControls,
    supportingControls,
    postProcessingControls,
    videoControls,
    foundationControls,
    loraControls,
    masterPromptEnabled,
    userInputEnabled,
    showPromptPreview
  ]);

  // Auto-select first character and scene when project data loads
  useEffect(() => {
    if (!currentProject?.id || characters.length === 0 || settingsLoaded) {
      // Don't auto-select if settings are already loaded (prevents conflicts with restoration)
      if (!currentProject?.id || characters.length === 0) {
        setSelectedCharacters([
          { character: null, outfitIndex: 0, enabled: true },
          { character: null, outfitIndex: 0, enabled: false },
          { character: null, outfitIndex: 0, enabled: false }
        ]);
        setSelectedScene(null);
      }
      return;
    }

    // Auto-select first character and scene if no saved settings exist
    if (characters.length > 0 && !selectedCharacters[0].character) {
      setSelectedCharacters([
        { character: characters[0], outfitIndex: characters[0].defaultOutfit || 0, enabled: true },
        { character: null, outfitIndex: 0, enabled: false },
        { character: null, outfitIndex: 0, enabled: false }
      ]);
    }
    
    if (scenes.length > 0 && !selectedScene) {
      setSelectedScene(scenes[0]);
    }
  }, [currentProject?.id, characters.length, scenes.length, settingsLoaded]); // Added settingsLoaded to prevent conflicts

  // Restore character and scene selections after both settings and data are loaded
  useEffect(() => {
    if (!currentProject?.id || !settingsLoaded || characters.length === 0) {
      return;
    }

    const restoreSelections = async () => {
      try {
        const savedSettings = await dbCache.loadPromptDrawerSettings(currentProject.id);
        
        if (savedSettings) {
          // Restore selected characters from saved settings
          if (savedSettings.selectedCharacters) {
            const restoredCharacters = savedSettings.selectedCharacters.map(saved => {
              const character = saved.characterId ? characters.find(c => c.id === saved.characterId) : null;
              return {
                character: character || null,
                outfitIndex: character ? (saved.outfitIndex ?? character.defaultOutfit ?? 0) : 0,
                enabled: saved.enabled || false
              };
            });
            setSelectedCharacters(restoredCharacters);
          }

          // Restore selected scene from saved settings
          if (savedSettings.selectedSceneId && scenes.length > 0) {
            const savedScene = scenes.find(s => s.id === savedSettings.selectedSceneId);
            if (savedScene) {
              setSelectedScene(savedScene);
            }
          }
        } else {
          // If no saved settings exist, trigger auto-selection
          if (characters.length > 0) {
            setSelectedCharacters([
              { character: characters[0], outfitIndex: characters[0].defaultOutfit || 0, enabled: true },
              { character: null, outfitIndex: 0, enabled: false },
              { character: null, outfitIndex: 0, enabled: false }
            ]);
          }
          if (scenes.length > 0) {
            setSelectedScene(scenes[0]);
          }
        }
      } catch (error) {
        console.warn('Failed to restore character/scene selections:', error);
        // Fallback to auto-selection on error
        if (characters.length > 0) {
          setSelectedCharacters([
            { character: characters[0], outfitIndex: characters[0].defaultOutfit || 0, enabled: true },
            { character: null, outfitIndex: 0, enabled: false },
            { character: null, outfitIndex: 0, enabled: false }
          ]);
        }
        if (scenes.length > 0) {
          setSelectedScene(scenes[0]);
        }
      }
    };

    restoreSelections();
  }, [currentProject?.id, settingsLoaded, characters.length, scenes.length]); // Fixed: Use length instead of arrays

  // Build controlled character component
  const buildControlledCharacterComponent = useCallback((character: Character, outfitIndex: number, controlIndex: number): string => {
    const controls = characterControls[controlIndex];
    const parts: string[] = [];
    
    // Character name (if enabled)
    if (controls.name && character.name && character.name.trim()) {
      parts.push(character.name);
    }
    
    // Build demographics based on parameter controls
    const demographicParts: string[] = [];
    if (controls.age && character.age) demographicParts.push(`${character.age} year old`);
    if (controls.gender && character.gender && character.gender.trim()) demographicParts.push(character.gender.toLowerCase());
    if (controls.race && character.race && character.race.trim()) demographicParts.push(character.race.toLowerCase());
    if (controls.height && character.height && character.height.trim()) demographicParts.push(character.height);
    if (controls.hairColor && character.hairColor && character.hairColor.trim()) demographicParts.push(`${character.hairColor.toLowerCase()} hair`);
    if (controls.eyeColor && character.eyeColor && character.eyeColor.trim()) demographicParts.push(`${character.eyeColor.toLowerCase()} eyes`);
    
    if (demographicParts.length > 0) {
      parts.push(demographicParts.join(' '));
    }
    
    // Physical appearance
    if (controls.physicalAppearance && character.physicalAppearance && character.physicalAppearance.trim()) {
      parts.push(character.physicalAppearance);
    }
    
    // Outfit details
    if (controls.outfit && character.outfits && character.outfits[outfitIndex] && character.outfits[outfitIndex].name && character.outfits[outfitIndex].name.trim()) {
      parts.push(`wearing ${character.outfits[outfitIndex].name}`);
    }
    
    // Professional context
    if (controls.profession && character.profession && character.profession.trim()) {
      parts.push(character.profession);
    }
    
    return parts.filter(part => part.trim()).join(', ');
  }, [characterControls]);

  // Build controlled scene component
  const buildControlledSceneComponent = useCallback((scene: Scene): string => {
    const parts: string[] = [];
    
    if (sceneControls.setting && scene.setting && scene.setting.trim()) parts.push(scene.setting);
    
    const lightingMoodParts: string[] = [];
    if (sceneControls.lighting && scene.lighting && scene.lighting.trim()) lightingMoodParts.push(scene.lighting);
    if (sceneControls.mood && scene.mood && scene.mood.trim()) lightingMoodParts.push(`${scene.mood} atmosphere`);
    if (sceneControls.timeOfDay && scene.timeOfDay && scene.timeOfDay.trim()) lightingMoodParts.push(scene.timeOfDay);
    
    if (lightingMoodParts.length > 0) {
      parts.push(lightingMoodParts.filter(part => part.trim()).join(' '));
    }
    
    if (sceneControls.cameraAngle && scene.cameraAngle && scene.cameraAngle.trim()) parts.push(scene.cameraAngle);
    if (sceneControls.props && scene.props && scene.props.length > 0) {
      const validProps = scene.props.filter(prop => prop && prop.trim());
      if (validProps.length > 0) {
        parts.push(`props: ${validProps.slice(0, 3).join(' ')}`);
      }
    }
    if (sceneControls.atmosphere && scene.atmosphere && scene.atmosphere.trim()) parts.push(scene.atmosphere);
    
    return parts.filter(part => part.trim()).join(', ');
  }, [sceneControls]);

  // Memoize the prompt generation request to prevent unnecessary re-generations
  const promptRequest = useMemo(() => {
    if (!currentProject?.id) {
      return null;
    }
    
    // Get trigger words from centralized context
    const triggerWords = getProjectLoRATriggerWords(currentProject);
    
    // Get enabled characters as actual objects
    const enabledCharacters = selectedCharacters
      .filter(sc => sc.enabled && sc.character)
      .map(sc => sc.character!);
    
    const request = {
      userPrompt: userInput,
      project: currentProject,
      characters: enabledCharacters,
      scene: selectedScene || undefined,
      characterOutfits: selectedCharacters
        .filter(sc => sc.enabled && sc.character)
        .map(sc => sc.outfitIndex),
      characterControls: selectedCharacters
        .filter(sc => sc.enabled && sc.character)
        .map((sc, index) => {
          // Find the original index in selectedCharacters to get the correct controls
          const originalIndex = selectedCharacters.findIndex(original => original === sc);
          return characterControls[originalIndex];
        }),
      sceneControls: sceneControls,
      technicalControls: technicalControls,
      styleControls: styleControls,
      atmosphericControls: atmosphericControls,
      supportingControls: supportingControls,
      postProcessingControls: postProcessingControls,
      triggerWords: triggerWords.filter(word => {
        // Check if this trigger word is enabled in loraControls
        const lora1Key = `lora1_${word}`;
        const lora2Key = `lora2_${word}`;
        return loraControls[lora1Key] !== false && loraControls[lora2Key] !== false;
      }),
      includeMasterPrompt: masterPromptEnabled,
      includeUserInput: userInputEnabled
    };
    
    return request;
  }, [
    currentProject,
    userInput,
    selectedCharactersStable,
    selectedScene,
    masterPromptEnabled,
    userInputEnabled,
    characterControls,
    sceneControls,
    technicalControls,
    styleControls,
    atmosphericControls,
    supportingControls,
    postProcessingControls,
    loraControls,
    getProjectLoRATriggerWords
  ]);

  // Generate prompt when the request changes (debounced)
  useEffect(() => {
    if (!promptRequest) {
      setGeneratedPrompt('');
      setTotalWords(0);
      setPromptComponents({
        masterPrompt: '',
        userInput: '',
        characterDescription: '',
        sceneFoundation: '',
        technicalPhotography: '',
        visualStyleAesthetic: '',
        atmosphericEnvironmental: '',
        supportingElements: '',
        postProcessingEffects: '',
        triggerWords: ''
      });
      return;
    }

    const generatePrompt = async () => {
      try {
        // Import PromptService
        const { promptService } = await import('@/services/PromptService');
        
        // Use PromptService to build the prompt (async)
        const result = await promptService.buildPrompt(promptRequest);

        // Set the results in state
        setGeneratedPrompt(result.prompt);
        setTotalWords(result.wordCount);
        setPromptComponents(result.components);
      } catch (error) {
        console.error('❌ PromptDrawer - Error generating prompt with PromptService:', error);
        setGeneratedPrompt('Error generating prompt: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setTotalWords(0);
        setPromptComponents({
          masterPrompt: '',
          userInput: '',
          characterDescription: '',
          sceneFoundation: '',
          technicalPhotography: '',
          visualStyleAesthetic: '',
          atmosphericEnvironmental: '',
          supportingElements: '',
          postProcessingEffects: '',
          triggerWords: ''
        });
      }
    };

    // Debounce prompt generation to prevent excessive API calls
    const timeoutId = setTimeout(generatePrompt, 300);
    return () => clearTimeout(timeoutId);
  }, [promptRequest]);

  const getComplianceColor = (totalWords: number) => {
    const maxWords = 392; // Could be made configurable per project in future
    if (totalWords <= maxWords) return 'text-green-600 dark:text-green-400';
    if (totalWords <= maxWords + 28) return 'text-yellow-600 dark:text-yellow-400'; // ~7% tolerance
    return 'text-red-600 dark:text-red-400';
  };

  const updateCharacterSelection = (characterIndex: number, character: Character | null) => {
    setSelectedCharacters(prev => {
      const updated = [...prev];
      updated[characterIndex] = { 
        ...updated[characterIndex], 
        character, 
        outfitIndex: character ? (character.defaultOutfit || 0) : 0,
        enabled: character !== null 
      };
      return updated;
    });
  };

  // Save character outfit changes to database
  const saveCharacterOutfits = async (characterIds?: string[]) => {
    if (!currentProject?.id) return;
    
    setIsSavingOutfits(true);
    const errors: string[] = [];
    
    try {
      // Determine which characters to save
      const charactersToSave = characterIds 
        ? selectedCharacters.filter(sc => sc.character && characterIds.includes(sc.character.id))
        : selectedCharacters.filter(sc => sc.character && unsavedOutfitChanges.has(sc.character.id));
      
      for (const selectedChar of charactersToSave) {
        if (!selectedChar.character) continue;
        
        try {
          // Update the character's defaultOutfit to match the selected outfit index
          const updatedCharacter = {
            ...selectedChar.character,
            defaultOutfit: selectedChar.outfitIndex,
            updatedAt: new Date().toISOString()
          };
          
          const response = await fetch(`/api/database/characters?id=${selectedChar.character.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defaultOutfit: selectedChar.outfitIndex })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save character outfit');
          }
          
                                console.log(`✅ Saved outfit change for ${selectedChar.character.name}: outfit ${selectedChar.outfitIndex}`);
          
           // Update the character's defaultOutfit in the selectedCharacters state immediately
           setSelectedCharacters(prev => prev.map(sc => {
             if (sc.character && sc.character.id === selectedChar.character.id) {
               return {
                 ...sc,
                 character: {
                   ...sc.character,
                   defaultOutfit: selectedChar.outfitIndex
                 }
               };
             }
             return sc;
           }));
          
         } catch (error) {
           console.error(`❌ Error saving outfit for ${selectedChar.character.name}:`, error);
           errors.push(`${selectedChar.character.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
         }
       }
       
       // Clear unsaved changes for successfully saved characters
       if (errors.length === 0) {
         setUnsavedOutfitChanges(new Set());
         console.log('✅ All character outfit changes saved successfully');
       } else {
        console.warn('⚠️ Some outfit changes failed to save:', errors);
        // Only clear unsaved changes for characters that didn't have errors
        const failedCharacterNames = errors.map(e => e.split(':')[0]);
        setUnsavedOutfitChanges(prev => {
          const newSet = new Set(prev);
          charactersToSave.forEach(sc => {
            if (sc.character && !failedCharacterNames.includes(sc.character.name)) {
              newSet.delete(sc.character.id);
            }
          });
          return newSet;
        });
      }
      
      return { success: errors.length === 0, errors };
      
    } catch (error) {
      console.error('❌ Error saving character outfits:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    } finally {
      setIsSavingOutfits(false);
    }
  };

  const updateCharacterOutfit = (characterIndex: number, outfitIndex: number) => {
    setSelectedCharacters(prev => {
      const updated = [...prev];
      updated[characterIndex] = { ...updated[characterIndex], outfitIndex };
      
      // Track as unsaved change
      if (updated[characterIndex].character) {
        setUnsavedOutfitChanges(prev => new Set(prev).add(updated[characterIndex].character!.id));
      }
      
      return updated;
    });
  };

  const toggleCharacterEnabled = (characterIndex: number) => {
    setSelectedCharacters(prev => {
      const updated = [...prev];
      updated[characterIndex] = { ...updated[characterIndex], enabled: !updated[characterIndex].enabled };
      return updated;
    });
  };

  const toggleSceneControl = (control: string) => {
    setSceneControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleTechnicalControl = (control: string) => {
    setTechnicalControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleStyleControl = (control: string) => {
    setStyleControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleAtmosphericControl = (control: string) => {
    setAtmosphericControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleSupportingControl = (control: string) => {
    setSupportingControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const togglePostProcessingControl = (control: string) => {
    setPostProcessingControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleVideoControl = (control: string) => {
    setVideoControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleFoundationControl = (control: string) => {
    setFoundationControls(prev => ({
      ...prev,
      [control]: !prev[control as keyof typeof prev]
    }));
  };

  const toggleLoraControl = (control: string) => {
    setLoraControls(prev => ({
      ...prev,
      [control]: !prev[control]
    }));
  };

  const toggleMasterPrompt = () => {
    setMasterPromptEnabled(prev => !prev);
  };

  const toggleUserInput = () => {
    setUserInputEnabled(prev => !prev);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCharacterControl = (characterIndex: number, control: string) => {
    setCharacterControls(prev => {
      const updated = [...prev];
      updated[characterIndex] = {
        ...updated[characterIndex],
        [control]: !updated[characterIndex][control as keyof typeof updated[typeof characterIndex]]
      };
      return updated;
    });
  };

  // Get display value for scene parameters
  const getSceneValue = (scene: Scene, control: string) => {
    switch (control) {
      case 'setting': return scene.setting || '';
      case 'timeOfDay': return scene.timeOfDay || '';
      case 'lighting': return scene.lighting || '';
      case 'mood': return scene.mood ? `${scene.mood} atmosphere` : '';
      case 'cameraAngle': return scene.cameraAngle || '';
      case 'atmosphere': return scene.atmosphere || '';
      case 'props': return scene.props?.length ? `props: ${scene.props.slice(0, 3).join(', ')}` : '';
      default: return '';
    }
  };

  // Get display value for technical parameters
  const getTechnicalValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'cameraAngle': return String(imaging.cameraAngle || '');
      case 'shotType': return String(imaging.shotType || '');
      case 'lensType': return String(imaging.lensType || '');
      case 'focalLength': return String(imaging.focalLength || '');
      case 'lightingStyle': return String(imaging.lightingStyle || '');
      case 'lightDirection': return String(imaging.lightDirection || '');
      case 'lightQuality': return String(imaging.lightQuality || '');
      case 'shadowStyle': return String(imaging.shadowStyle || '');
      case 'technicalQualityBooster': return String(imaging.technicalQualityBooster || '');
      case 'aspectRatio': return String(imaging.aspectRatio || '');
      case 'resolution': return String(imaging.resolution || '');
      default: return '';
    }
  };

  // Get display value for style parameters
  const getStyleValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'overallStyle': return String(imaging.overallStyle || '');
      case 'colorPalette': return String(imaging.colorPalette || '');
      case 'artisticReferences': return Array.isArray(imaging.artisticReferences) ? imaging.artisticReferences.join(', ') : String(imaging.artisticReferences || '');
      case 'aestheticDirection': return String(imaging.aestheticDirection || '');
      case 'mood': return String(imaging.mood || '');
      case 'colorTemperature': return String(imaging.colorTemperature || '');
      case 'saturation': return String(imaging.saturation || '');
      case 'visualStyleInjector': return String(imaging.visualStyleInjector || '');
      case 'characterModifiers': {
        if (!imaging.characterModifiers) return '';
        if (typeof imaging.characterModifiers === 'string') return imaging.characterModifiers;
        if (Array.isArray(imaging.characterModifiers)) return imaging.characterModifiers.join(', ');
        if (typeof imaging.characterModifiers === 'object') {
          return Object.entries(imaging.characterModifiers).map(([key, value]) => `${key}: ${value}`).join('; ');
        }
        return '';
      }
      default: return '';
    }
  };

  const getAtmosphericValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'atmosphericEffects': return Array.isArray(imaging.atmosphericEffects) ? imaging.atmosphericEffects.join(', ') : String(imaging.atmosphericEffects || '');
      case 'timeOfDay': return String(imaging.timeOfDay || '');
      case 'environment': return String(imaging.environment || '');
      default: return '';
    }
  };

  const getSupportingValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'surfaceTextures': return Array.isArray(imaging.surfaceTextures) ? imaging.surfaceTextures.join(', ') : String(imaging.surfaceTextures || '');
      case 'materialProperties': return Array.isArray(imaging.materialProperties) ? imaging.materialProperties.join(', ') : String(imaging.materialProperties || '');
      default: return '';
    }
  };

  const getPostProcessingValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'visualEffects': return Array.isArray(imaging.visualEffects) ? imaging.visualEffects.join(', ') : String(imaging.visualEffects || '');
      case 'postProcessing': return Array.isArray(imaging.postProcessing) ? imaging.postProcessing.join(', ') : String(imaging.postProcessing || '');
      default: return '';
    }
  };

  const getVideoValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'motionBlur': return String(imaging.motionBlur || '');
      case 'depthOfField': return String(imaging.depthOfField || '');
      case 'videoTransitions': return String(imaging.videoTransitions || '');
      case 'frameRate': return String(imaging.frameRate || '');
      default: return '';
    }
  };

  const getFoundationValue = (control: string) => {
    if (!currentProject?.imagePrompting) return '';
    const imaging = currentProject.imagePrompting;
    switch (control) {
      case 'foundationPrompt': return String(imaging.foundationPrompt || '');
      case 'promptingStrategy': {
        if (!imaging.promptingStrategy) return '';
        if (typeof imaging.promptingStrategy === 'string') return imaging.promptingStrategy;
        if (typeof imaging.promptingStrategy === 'object') {
          return Object.entries(imaging.promptingStrategy).map(([key, value]) => {
            if (typeof value === 'object') return `${key}: [Complex Object]`;
            return `${key}: ${String(value).substring(0, 30)}...`;
          }).join('; ');
        }
        return '';
      }
      case 'sceneTemplates': {
        if (!imaging.sceneTemplates) return '';
        if (typeof imaging.sceneTemplates === 'string') return imaging.sceneTemplates;
        if (typeof imaging.sceneTemplates === 'object') {
          return Object.entries(imaging.sceneTemplates).map(([key, value]) => `${key}: ${String(value).substring(0, 50)}...`).join('; ');
        }
        return '';
      }
      default: return '';
    }
  };

  const getLoraValue = (control: string) => {
    if (!currentProject?.loras) return '';
    
    if (control.startsWith('lora1_')) {
      const triggerWord = control.replace('lora1_', '');
      return triggerWord;
    }
    
    if (control.startsWith('lora2_')) {
      const triggerWord = control.replace('lora2_', '');
      return triggerWord;
    }
    
    return '';
  };

  // JSON Export/Import functions
  const exportConfiguration = async () => {
    try {
      // Get the complete generation call configuration
      const exportData = {
        projectId: currentProject?.id,
        timestamp: new Date().toISOString(),
        version: '1.0',
        
        // Prompt configuration
        promptConfiguration: {
          userInput,
          selectedCharacters: selectedCharacters.map(sc => ({
            characterId: sc.character?.id || null,
            characterName: sc.character?.name || null,
            outfitIndex: sc.outfitIndex,
            enabled: sc.enabled
          })),
          selectedScene: selectedScene ? {
            id: selectedScene.id,
            name: selectedScene.name
          } : null,
          expandedSections,
          characterControls,
          sceneControls,
          technicalControls,
          styleControls,
          atmosphericControls,
          supportingControls,
          showPromptPreview
        },
        
        // Generated prompt data
        generatedPrompt,
        promptComponents,
        totalWords,
        
        // Project context
        projectData: currentProject ? {
          id: currentProject.id,
          name: currentProject.name,
          imagePrompting: currentProject.imagePrompting,
          loras: currentProject.loras
        } : null,
        
        // Available data for reference
        availableCharacters: characters.map(c => ({ id: c.id, name: c.name })),
        availableScenes: scenes.map(s => ({ id: s.id, name: s.name }))
      };

      // Create and download JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-config-${currentProject?.id || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Configuration exported successfully');
    } catch (error) {
      console.error('❌ Failed to export configuration:', error);
    }
  };

  const importConfiguration = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate the import data structure
        if (!importData.promptConfiguration) {
          throw new Error('Invalid configuration file: missing promptConfiguration');
        }
        
        const config = importData.promptConfiguration;
        
        if (config.userInput !== undefined) {
          setUserInput(config.userInput);
        }
        
        if (config.expandedSections) {
          setExpandedSections(prev => ({ ...prev, ...config.expandedSections }));
        }
        
        // Apply control states
        if (config.characterControls) {
          setCharacterControls(config.characterControls);
        }
        if (config.sceneControls) {
          setSceneControls(config.sceneControls);
        }
        if (config.technicalControls) {
          setTechnicalControls(config.technicalControls);
        }
        if (config.styleControls) {
          setStyleControls(config.styleControls);
        }
        if (config.atmosphericControls) {
          setAtmosphericControls(config.atmosphericControls);
        }
        if (config.supportingControls) {
          setSupportingControls(config.supportingControls);
        }
        
        if (config.showPromptPreview !== undefined) {
          setShowPromptPreview(config.showPromptPreview);
        }
        
        // Try to restore character and scene selections if they exist in current project
        if (config.selectedCharacters && Array.isArray(config.selectedCharacters)) {
          const restoredSelections = config.selectedCharacters.map((saved: any) => {
            const character = characters.find(c => c.id === saved.characterId || c.name === saved.characterName);
            return {
              character: character || null,
              outfitIndex: saved.outfitIndex || 0,
              enabled: saved.enabled ?? true
            };
          });
          setSelectedCharacters(restoredSelections);
        }
        
        if (config.selectedScene) {
          const scene = scenes.find(s => s.id === config.selectedScene.id || s.name === config.selectedScene.name);
          setSelectedScene(scene || null);
        }
        
        console.log('✅ Configuration imported successfully from:', importData.projectId);
        console.log('📅 Export timestamp:', importData.timestamp);
        
        // Regenerate prompt with new settings
        setTimeout(() => {
          // The prompt will be regenerated automatically by the useEffect dependencies
          console.log('📝 Prompt will regenerate automatically with new settings');
        }, 100);
        
      } catch (error) {
        console.error('❌ Failed to import configuration:', error);
        alert('Failed to import configuration. Please check that the file is a valid prompt configuration export.');
      }
    };
    
    input.click();
  };

  const handleGenerateImage = async () => {
          console.log('🚀 PROMPT DRAWER: Starting image generation...', {
        hasProject: !!currentProject?.id,
        projectId: currentProject?.id,
        promptLength: generatedPrompt?.length || 0,
        promptTrimmedLength: generatedPrompt?.trim()?.length || 0,
        totalWords,
        promptPreview: generatedPrompt?.substring(0, 150) + '...',
        availableCharacters: characters?.length || 0,
        availableScenes: scenes?.length || 0,
        selectedCharacters: selectedCharacters.map(sc => ({ 
          name: sc.character?.name || 'None', 
          enabled: sc.enabled 
        })),
        selectedScene: selectedScene?.name || 'None'
      });

    if (!currentProject?.id || !generatedPrompt.trim()) {
      const errorMsg = !currentProject?.id ? 'No project selected' : 'No prompt available to generate image';
      console.error('❌ PROMPT DRAWER: Cannot generate image:', errorMsg);
      setGenerationError(errorMsg);
      setGenerationStatus('error');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('idle');
    setGenerationError(null);

    try {
      // Collect enabled character IDs and scene ID
      const enabledCharacterIds = selectedCharacters
        .filter(sc => sc.enabled && sc.character)
        .map(sc => sc.character!.id);
      
      const enabledSceneId = selectedScene ? selectedScene.id : null;

      console.log('🔍 PROMPT DRAWER: Character and scene data collection:', {
        selectedCharactersRaw: selectedCharacters.map((sc, index) => ({
          index,
          characterName: sc.character?.name || 'None',
          characterId: sc.character?.id || 'None',
          enabled: sc.enabled,
          outfitIndex: sc.outfitIndex
        })),
        enabledCharacterIds,
        enabledCharacterNames: enabledCharacterIds.map(id => {
          const char = characters.find(c => c.id === id);
          return char?.name || 'Unknown';
        }),
        selectedSceneName: selectedScene?.name || 'None',
        selectedSceneId: selectedScene?.id || 'None',
        enabledSceneId,
        totalAvailableCharacters: characters.length,
        totalAvailableScenes: scenes.length
      });

      // Build the image request object
      const imageRequest: any = {
        concept: 'Structured Prompt Generation',
        prompt: generatedPrompt.trim() || userInput.trim() || 'Generated image',
        user_prompt: userInput.trim(), // Send the original user input separately
        prompt_components: promptComponents, // Send the already-generated components
        filename: `prompt-builder-${Date.now()}`,
        // Add character and scene IDs
        character_ids: enabledCharacterIds,
        // Add character controls and outfits
        character_controls: selectedCharacters
          .filter(sc => sc.enabled && sc.character)
          .map((sc, index) => {
            // Find the original index in selectedCharacters to get the correct controls
            const originalIndex = selectedCharacters.findIndex(original => original === sc);
            return characterControls[originalIndex];
          }),
        character_outfits: selectedCharacters
          .filter(sc => sc.enabled && sc.character)
          .map(sc => sc.outfitIndex),
        // Add all control states for proper prompt generation
        scene_controls: sceneControls,
        technical_controls: technicalControls,
        style_controls: styleControls,
        atmospheric_controls: atmosphericControls,
        supporting_controls: supportingControls,
        post_processing_controls: postProcessingControls,
        lora_controls: loraControls,
        // Add master toggles
        include_master_prompt: masterPromptEnabled,
        include_user_input: userInputEnabled
      };

      // Only add scene_id if a scene is actually selected
      if (enabledSceneId) {
        imageRequest.scene_id = enabledSceneId;
      }

      const requestBody = {
        images: [imageRequest],
        save_to_disk: true,
        project_id: currentProject.id
      };

      console.log('🎨 PROMPT DRAWER: Sending request to API...', {
        concept: requestBody.images[0].concept,
        promptLength: requestBody.images[0].prompt.length,
        promptPreview: requestBody.images[0].prompt.substring(0, 100) + '...',
        characterIds: enabledCharacterIds,
        characterNames: enabledCharacterIds.map(id => {
          const char = characters.find(c => c.id === id);
          return char?.name || 'Unknown';
        }),
        sceneId: enabledSceneId,
        sceneName: selectedScene?.name || 'None',
        projectId: currentProject.id,
        hasCharacterControls: !!imageRequest.character_controls,
        hasSceneControls: !!imageRequest.scene_controls
      });
      
      const response = await fetch('/api/nano-banana/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.successful > 0) {
        console.log('✅ Image generated successfully:', result);
        setGenerationStatus('success');
        
        // Reset success status after a few seconds
        setTimeout(() => {
          setGenerationStatus('idle');
        }, 3000);
      } else {
        throw new Error(result.results?.[0]?.error || 'Image generation failed');
      }

    } catch (error) {
      console.error('❌ Image generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
      setGenerationStatus('error');
      
      // Reset error status after a few seconds
      setTimeout(() => {
        setGenerationStatus('idle');
        setGenerationError(null);
      }, 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get display value for character parameters
  const getCharacterValue = (character: Character, control: string, outfitIndex: number) => {
    switch (control) {
      case 'name': return character.name || '';
      case 'age': return character.age ? `${character.age} year old` : '';
      case 'gender': return character.gender || '';
      case 'race': return character.race || '';
      case 'height': return character.height || '';
      case 'hairColor': return character.hairColor ? `${character.hairColor} hair` : '';
      case 'eyeColor': return character.eyeColor ? `${character.eyeColor} eyes` : '';
      case 'physicalAppearance': return character.physicalAppearance || '';
      case 'profession': return character.profession || '';
      case 'outfit': return character.outfits?.[outfitIndex]?.name ? `wearing ${character.outfits[outfitIndex].name}` : '';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed top-0 right-0 h-full bg-background border-l border-border shadow-2xl z-50 flex flex-col ${
            isMobile ? 'w-full' : 'w-96'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 h-[41px] border-b border-border">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-foreground">Prompt Builder</h2>
              <button
                onClick={() => setShowPromptPreview(!showPromptPreview)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Toggle prompt preview"
              >
                <Icon icon={showPromptPreview ? Eye : EyeOff} size="xs" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {/* JSON Export/Import Controls */}
              <button
                onClick={exportConfiguration}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Export configuration as JSON"
                disabled={!currentProject?.id}
              >
                <Icon icon={Download} size="xs" />
              </button>
              <button
                onClick={importConfiguration}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Import configuration from JSON"
              >
                <Icon icon={Upload} size="xs" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Icon icon={X} size="sm" />
              </button>
            </div>
          </div>

          {/* Prompt Preview - Always on top when visible */}
          {showPromptPreview && (
            <div className="border-b border-border bg-background/95 backdrop-blur-sm">
              <div className="p-4 space-y-4">
                <PromptPreview
                  generatedPrompt={generatedPrompt}
                  totalWords={totalWords}
                  getComplianceColor={getComplianceColor}
                  promptComponents={promptComponents}
                />
                {/* Generate Button */}
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !generatedPrompt.trim() || !currentProject?.id}
                  className={`
                    w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${isGenerating 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-not-allowed' 
                      : generationStatus === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : generationStatus === 'error'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>Generating...</span>
                    </>
                  ) : generationStatus === 'success' ? (
                    <>
                      <Icon icon={Check} size="sm" />
                      <span>Image Generated!</span>
                    </>
                  ) : generationStatus === 'error' ? (
                    <>
                      <Icon icon={AlertCircle} size="sm" />
                      <span>Generation Failed</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={Zap} size="sm" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
                
                {/* Error Message */}
                {generationError && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-solid border-destructive-border">
                    {generationError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-4">
              {/* 1. Master Prompt Component */}
              <MasterPromptSection
                isExpanded={expandedSections.masterPrompt}
                onToggle={() => toggleSection('masterPrompt')}
                masterPrompt={currentProject?.imagePrompting?.masterPrompt || ''}
                masterPromptEnabled={masterPromptEnabled}
                onMasterPromptToggle={toggleMasterPrompt}
              />

              {/* 2. Foundation & Strategy */}
              <FoundationSection
                isExpanded={expandedSections.foundation}
                onToggle={() => toggleSection('foundation')}
                foundationControls={foundationControls}
                onControlToggle={toggleFoundationControl}
                getFoundationValue={getFoundationValue}
              />

              {/* 3. User Input */}
              <CustomPromptSection
                isExpanded={expandedSections.userInput}
                onToggle={() => toggleSection('userInput')}
                userInput={userInput}
                onUserInputChange={setUserInput}
                userInputEnabled={userInputEnabled}
                onUserInputToggle={toggleUserInput}
              />

              {/* 4. Character Description (up to 3) */}
              <CharactersSection
                isExpanded={expandedSections.characters}
                onToggle={() => toggleSection('characters')}
                selectedCharacters={selectedCharacters}
                characters={characters}
                characterControls={characterControls}
                loading={loading}
                onCharacterSelection={updateCharacterSelection}
                onOutfitChange={updateCharacterOutfit}
                onEnabledToggle={toggleCharacterEnabled}
                onControlToggle={toggleCharacterControl}
                getCharacterValue={getCharacterValue}
                unsavedOutfitChanges={unsavedOutfitChanges}
                isSavingOutfits={isSavingOutfits}
                onSaveOutfits={saveCharacterOutfits}
              />

              {/* 5. Scene Foundation */}
              <SceneFoundationSection
                isExpanded={expandedSections.scene}
                onToggle={() => toggleSection('scene')}
                selectedScene={selectedScene}
                scenes={scenes}
                sceneControls={sceneControls}
                loading={loading}
                onSceneSelection={setSelectedScene}
                onSceneControlToggle={toggleSceneControl}
                getSceneValue={getSceneValue}
              />

              {/* 6. Technical Photography */}
              <TechnicalPhotographySection
                isExpanded={expandedSections.technical}
                onToggle={() => toggleSection('technical')}
                technicalControls={technicalControls}
                onControlToggle={toggleTechnicalControl}
                getTechnicalValue={getTechnicalValue}
              />

              {/* 7. Visual Style & Aesthetic */}
              <VisualStyleSection
                isExpanded={expandedSections.style}
                onToggle={() => toggleSection('style')}
                styleControls={styleControls}
                onControlToggle={toggleStyleControl}
                getStyleValue={getStyleValue}
              />

              {/* 8. Atmospheric & Environmental */}
              <AtmosphericSection
                isExpanded={expandedSections.atmospheric}
                onToggle={() => toggleSection('atmospheric')}
                atmosphericControls={atmosphericControls}
                onControlToggle={toggleAtmosphericControl}
                getAtmosphericValue={getAtmosphericValue}
              />

              {/* 9. Supporting Elements */}
              <SupportingElementsSection
                isExpanded={expandedSections.supporting}
                onToggle={() => toggleSection('supporting')}
                supportingControls={supportingControls}
                onControlToggle={toggleSupportingControl}
                getSupportingValue={getSupportingValue}
              />

              {/* 10. Post-Processing & Effects */}
              <PostProcessingSection
                isExpanded={expandedSections.postProcessing}
                onToggle={() => toggleSection('postProcessing')}
                postProcessingControls={postProcessingControls}
                onControlToggle={togglePostProcessingControl}
                getPostProcessingValue={getPostProcessingValue}
              />

              {/* 11. Video-Specific Elements */}
              <VideoSpecificSection
                isExpanded={expandedSections.videoSpecific}
                onToggle={() => toggleSection('videoSpecific')}
                videoControls={videoControls}
                onControlToggle={toggleVideoControl}
                getVideoValue={getVideoValue}
              />

              {/* 12. LoRA Trigger Words */}
              <LoraSection
                isExpanded={expandedSections.triggerWords}
                onToggle={() => toggleSection('triggerWords')}
                loraControls={loraControls}
                onControlToggle={toggleLoraControl}
              />
            </div>
          </div>

          {/* Generate Image Button */}
          <div className="border-t border-border p-4 bg-background/95 backdrop-blur-sm">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !generatedPrompt.trim() || !currentProject?.id}
              className={`
                w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${isGenerating 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-not-allowed' 
                  : generationStatus === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : generationStatus === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Generating...</span>
                </>
              ) : generationStatus === 'success' ? (
                <>
                  <Icon icon={Check} size="sm" />
                  <span>Image Generated!</span>
                </>
              ) : generationStatus === 'error' ? (
                <>
                  <Icon icon={AlertCircle} size="sm" />
                  <span>Generation Failed</span>
                </>
              ) : (
                <>
                  <Icon icon={Zap} size="sm" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
            
            {/* Error Message */}
            {generationError && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-solid border-destructive-border">
                {generationError}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 