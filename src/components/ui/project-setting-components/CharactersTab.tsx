import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Star, Tag, User, Shirt, ChevronDown, ChevronRight } from 'lucide-react';
import { Project, ProjectOptions } from '@/contexts/ProjectContext';

interface CharactersTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  projectOptions: ProjectOptions;
  setProjectOptions: React.Dispatch<React.SetStateAction<ProjectOptions | null>>;
}

export const CharactersTab: React.FC<CharactersTabProps> = ({
  isEditing,
  editedProject,
  project,
  projectOptions,
  setProjectOptions,
}) => {
  const characters = projectOptions.characters || [];
  
  // State to track which characters are expanded
  const [expandedCharacters, setExpandedCharacters] = useState<Record<string, boolean>>({});

  const toggleCharacterExpanded = (characterId: string) => {
    setExpandedCharacters(prev => ({
      ...prev,
      [characterId]: !prev[characterId]
    }));
  };

  const addCharacter = () => {
    const newCharacterId = Date.now().toString();
    const newCharacter = {
      id: newCharacterId,
      name: '',
      profession: '',
      
      // Demographics
      age: '',
      gender: '',
      race: '',
      height: '',
      hair_color: '',
      eye_color: '',
      
      // Physical appearance
      physical_appearance: '',
      
      // Outfits - array of objects with name only
      outfits: [],
      default_outfit: '',
      
      // Character details
      background: '',
      case_details: '',
      scene_of_crime: '',
      
      // Notes and tags
      notes: '',
      tags: []
    };

    setProjectOptions(prev => ({
      ...prev!,
      characters: [...(prev?.characters || []), newCharacter]
    }));
    
    // Auto-expand new characters
    setExpandedCharacters(prev => ({
      ...prev,
      [newCharacterId]: true
    }));
  };

  const updateCharacter = (id: string, field: string, value: any) => {
    setProjectOptions(prev => ({
      ...prev!,
      characters: (prev?.characters || []).map(char =>
        char.id === id ? { ...char, [field]: value } : char
      )
    }));
  };

  const removeCharacter = async (id: string) => {
    try {
      // First check if this is an existing character (has a real ID) or a new one
      const character = characters.find(c => c.id === id);
      
      // New characters have IDs that start with the current timestamp (from addCharacter function)
      // Existing characters from the database have different ID formats
      const isNewCharacter = !character || id.toString().length === 13; // timestamp length
      
      if (!isNewCharacter) {
        // Delete from database if it's an existing character
        const response = await fetch(`/api/database/characters?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to delete character:', error);
          throw new Error(error.error || 'Failed to delete character');
        }

        console.log(`✅ Character ${character?.name} deleted from database`);
      } else {
        console.log(`⚡ Removing new character ${character?.name} from local state only`);
      }

      // Remove from local state
      setProjectOptions(prev => ({
        ...prev!,
        characters: (prev?.characters || []).filter(char => char.id !== id)
      }));

    } catch (error) {
      console.error('Error deleting character:', error);
      // Could add toast notification here for better UX
      alert(`Failed to delete character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addOutfit = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      const newOutfit = {
        name: `Outfit ${(character.outfits?.length || 0) + 1}`
      };
      updateCharacter(characterId, 'outfits', [...(character.outfits || []), newOutfit]);
    }
  };

  const updateOutfit = (characterId: string, index: number, field: string, value: string | boolean) => {
    const character = characters.find(c => c.id === characterId);
    if (character && character.outfits) {
      const newOutfits = [...character.outfits];
      newOutfits[index] = { ...newOutfits[index], [field]: value };
      updateCharacter(characterId, 'outfits', newOutfits);
    }
  };

  const removeOutfit = (characterId: string, index: number) => {
    const character = characters.find(c => c.id === characterId);
    if (character && character.outfits) {
      const newOutfits = character.outfits.filter((_, i) => i !== index);
      updateCharacter(characterId, 'outfits', newOutfits);
      
      // Reset default if it was the removed outfit
      if (character.default_outfit === character.outfits[index]?.name) {
        updateCharacter(characterId, 'default_outfit', '');
      }
    }
  };

  const addTag = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      updateCharacter(characterId, 'tags', [...(character.tags || []), '']);
    }
  };

  const updateTag = (characterId: string, index: number, value: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character && character.tags) {
      const newTags = [...character.tags];
      newTags[index] = value;
      updateCharacter(characterId, 'tags', newTags);
    }
  };

  const removeTag = (characterId: string, index: number) => {
    const character = characters.find(c => c.id === characterId);
    if (character && character.tags) {
      const newTags = character.tags.filter((_, i) => i !== index);
      updateCharacter(characterId, 'tags', newTags);
    }
  };

  const expandAll = () => {
    const allExpanded = characters.reduce((acc, char) => ({
      ...acc,
      [char.id]: true
    }), {});
    setExpandedCharacters(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCharacters({});
  };

  if (!isEditing && characters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No characters defined yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      {characters.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {characters.length} character{characters.length === 1 ? '' : 's'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Expand All
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={collapseAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}
      {characters.map((character) => {
        const isExpanded = expandedCharacters[character.id];
        
        return (
          <motion.div
            key={character.id}
            layout
            className="border border-solid border-border rounded-lg bg-background overflow-hidden"
          >
            {/* Collapsible Header */}
            <div className={`p-4 ${isExpanded ? 'bg-accent/20' : ''}`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleCharacterExpanded(character.id)}
                  className="flex items-center gap-3 text-left flex-1 hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {character.name || 'Unnamed Character'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {character.profession || 'No profession specified'}
                    </p>
                  </div>
                </button>
                {isEditing && (
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete "${character.name || 'this character'}"? This action cannot be undone.`)) {
                        await removeCharacter(character.id);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive ml-2"
                    title="Delete character"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-4">
                    {/* Character Identification */}
                    <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => updateCharacter(character.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                  placeholder="Character name"
                />
              ) : (
                <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                  {character.name || 'Not specified'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Profession
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={character.profession}
                  onChange={(e) => updateCharacter(character.id, 'profession', e.target.value)}
                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                  placeholder="Character profession"
                />
              ) : (
                <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                  {character.profession || 'Not specified'}
                </div>
              )}
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              Demographics
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { field: 'age', label: 'Age' },
                { field: 'gender', label: 'Gender' },
                { field: 'race', label: 'Race' }
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(character[field as keyof typeof character] as string) || ''}
                      onChange={(e) => updateCharacter(character.id, field, e.target.value)}
                      className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                      placeholder={field === 'age' ? '30' : `Character ${field}`}
                    />
                  ) : (
                    <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                      {(character[field as keyof typeof character] as string) || 'Not specified'}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { field: 'height', label: 'Height' },
                { field: 'hair_color', label: 'Hair Color' },
                { field: 'eye_color', label: 'Eye Color' }
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(character[field as keyof typeof character] as string) || ''}
                      onChange={(e) => updateCharacter(character.id, field, e.target.value)}
                      className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                      placeholder={field === 'height' ? '5"8"' : `Character ${field.replace('_', ' ')}`}
                    />
                  ) : (
                    <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                      {(character[field as keyof typeof character] as string) || 'Not specified'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Physical Appearance */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Physical Appearance
            </label>
            {isEditing ? (
              <textarea
                value={character.physical_appearance || ''}
                onChange={(e) => updateCharacter(character.id, 'physical_appearance', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
                placeholder="Detailed physical description..."
              />
            ) : (
              <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[76px]">
                {character.physical_appearance || 'No description provided'}
              </div>
            )}
          </div>

          {/* Outfits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1">
                <Shirt className="h-3 w-3" />
                Outfits
              </h4>
              {isEditing && (
                <button
                  onClick={() => addOutfit(character.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add Outfit
                </button>
              )}
            </div>
            
            {character.outfits && character.outfits.length > 0 ? (
              <div className="space-y-2">
                {character.outfits.map((outfit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={outfit.name || ''}
                          onChange={(e) => updateOutfit(character.id, index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                          placeholder="Outfit description"
                        />
                        <button
                          onClick={() => updateCharacter(character.id, 'default_outfit', outfit.name)}
                          className={`p-1 rounded ${
                            character.default_outfit === outfit.name
                              ? 'text-yellow-500'
                              : 'text-muted-foreground hover:text-yellow-500'
                          }`}
                          title="Set as default outfit"
                        >
                          <Star className={`h-4 w-4 ${character.default_outfit === outfit.name ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => removeOutfit(character.id, index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 p-3 bg-accent rounded-md text-foreground text-sm">
                          {outfit.name}
                        </div>
                        {character.default_outfit === outfit.name && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" title="Default outfit" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No outfits defined</div>
            )}
          </div>

          {/* Character Details */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { field: 'background', label: 'Background' },
              { field: 'case_details', label: 'Case Details' },
              { field: 'scene_of_crime', label: 'Scene of Crime' }
            ].map(({ field, label }) => (
              <div key={field} className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {label}
                </label>
                {isEditing ? (
                  <textarea
                    value={(character[field as keyof typeof character] as string) || ''}
                    onChange={(e) => updateCharacter(character.id, field, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
                    placeholder={`Character ${field.replace('_', ' ')}...`}
                  />
                ) : (
                  <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[76px]">
                    {(character[field as keyof typeof character] as string) || 'Not specified'}
                  </div>
                )}
              </div>
            ))}
            {/* Notes field without toggle since it's not used in prompts */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  value={(character.notes as string) || ''}
                  onChange={(e) => updateCharacter(character.id, 'notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
                  placeholder="Character notes..."
                />
              ) : (
                <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[76px]">
                  {(character.notes as string) || 'Not specified'}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
                <Tag className="h-4 w-4" />
                Tags
              </div>
              {isEditing && (
                <button
                  onClick={() => addTag(character.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add Tag
                </button>
              )}
            </div>
            
            {character.tags && character.tags.length > 0 ? (
              <div className="space-y-2">
                {character.tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={tag || ''}
                          onChange={(e) => updateTag(character.id, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                          placeholder="Tag"
                        />
                        <button
                          onClick={() => removeTag(character.id, index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="p-2 bg-accent rounded-md text-foreground text-sm">
                        {tag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No tags defined</div>
            )}
          </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {isEditing && (
        <button
          onClick={addCharacter}
          className="w-full py-3 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
        >
          + Add Character
        </button>
      )}
    </div>
  );
}; 