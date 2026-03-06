import React from 'react';
import { SectionHeader } from './SectionHeader';
import { CharacterSelector } from './CharacterSelector';
import { Character } from '@/contexts/ProjectContext';

interface CharactersSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  selectedCharacters: {
    character: Character | null;
    outfitIndex: number;
    enabled: boolean;
  }[];
  characters: Character[];
  characterControls: Array<{
    age: boolean;
    gender: boolean;
    race: boolean;
    height: boolean;
    hairColor: boolean;
    eyeColor: boolean;
    physicalAppearance: boolean;
    profession: boolean;
    outfit: boolean;
  }>;
  loading: boolean;
  onCharacterSelection: (characterIndex: number, character: Character | null) => void;
  onOutfitChange: (characterIndex: number, outfitIndex: number) => void;
  onEnabledToggle: (characterIndex: number) => void;
  onControlToggle: (characterIndex: number, control: string) => void;
  getCharacterValue: (character: Character, control: string, outfitIndex: number) => string;
  unsavedOutfitChanges: Set<string>;
  isSavingOutfits: boolean;
  onSaveOutfits: (characterIds?: string[]) => Promise<{ success: boolean; errors: string[] } | undefined>;
}

export const CharactersSection: React.FC<CharactersSectionProps> = ({
  isExpanded,
  onToggle,
  selectedCharacters,
  characters,
  characterControls,
  loading,
  onCharacterSelection,
  onOutfitChange,
  onEnabledToggle,
  onControlToggle,
  getCharacterValue,
  unsavedOutfitChanges,
  isSavingOutfits,
  onSaveOutfits,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg">
      <SectionHeader
        icon="Users"
        title="Character Description"
        wordBudget={120}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4">
          {selectedCharacters.map((selectedChar, characterIndex) => (
            <CharacterSelector
              key={characterIndex}
              index={characterIndex}
              selectedCharacter={selectedChar}
              characters={characters}
              characterControls={characterControls[characterIndex]}
              loading={loading}
              onCharacterSelection={onCharacterSelection}
              onOutfitChange={onOutfitChange}
              onEnabledToggle={onEnabledToggle}
              onControlToggle={onControlToggle}
              getCharacterValue={getCharacterValue}
              hasUnsavedChanges={selectedChar.character ? unsavedOutfitChanges.has(selectedChar.character.id) : false}
              onSaveOutfit={async (characterId: string) => await onSaveOutfits([characterId])}
              isSaving={isSavingOutfits}
            />
          ))}
          
          {/* Save Controls */}
          {unsavedOutfitChanges.size > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-solid border-warning-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {unsavedOutfitChanges.size} outfit change{unsavedOutfitChanges.size > 1 ? 's' : ''} unsaved
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSaveOutfits()}
                    disabled={isSavingOutfits}
                    className="px-3 py-1 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
                  >
                    {isSavingOutfits ? 'Saving...' : 'Save All'}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                Character outfit changes will be saved to the database and persist across sessions.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 