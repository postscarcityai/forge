import React from 'react';
import { Character } from '@/contexts/ProjectContext';
import { ParameterControl } from './ParameterControl';

interface CharacterSelectorProps {
  index: number;
  selectedCharacter: {
    character: Character | null;
    outfitIndex: number;
    enabled: boolean;
  };
  characters: Character[];
  characterControls: {
    age: boolean;
    gender: boolean;
    race: boolean;
    height: boolean;
    hairColor: boolean;
    eyeColor: boolean;
    physicalAppearance: boolean;
    profession: boolean;
    outfit: boolean;
  };
  loading: boolean;
  onCharacterSelection: (characterIndex: number, character: Character | null) => void;
  onOutfitChange: (characterIndex: number, outfitIndex: number) => void;
  onEnabledToggle: (characterIndex: number) => void;
  onControlToggle: (characterIndex: number, control: string) => void;
  getCharacterValue: (character: Character, control: string, outfitIndex: number) => string;
  hasUnsavedChanges?: boolean;
  onSaveOutfit?: (characterId: string) => Promise<void>;
  isSaving?: boolean;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  index,
  selectedCharacter,
  characters,
  characterControls,
  loading,
  onCharacterSelection,
  onOutfitChange,
  onEnabledToggle,
  onControlToggle,
  getCharacterValue,
  hasUnsavedChanges = false,
  onSaveOutfit,
  isSaving = false,
}) => {
  return (
    <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Character {index + 1}
        </h4>
        <div className="flex items-center space-x-3">
          <span className={`text-xs font-medium ${selectedCharacter.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
            {selectedCharacter.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={() => onEnabledToggle(index)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              selectedCharacter.enabled ? 'bg-primary' : 'bg-input'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm ${
                selectedCharacter.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Character Selection */}
      <select
        value={selectedCharacter.character?.id || ''}
        onChange={(e) => {
          const character = characters.find(c => c.id === e.target.value);
          onCharacterSelection(index, character || null);
        }}
        className="w-full p-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        disabled={loading || characters.length === 0 || !selectedCharacter.enabled}
      >
        <option value="">Select character...</option>
        {characters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </select>

      {/* Outfit Selection */}
      {selectedCharacter.character && selectedCharacter.character.outfits && selectedCharacter.character.outfits.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <select
              value={selectedCharacter.outfitIndex}
              onChange={(e) => onOutfitChange(index, Number(e.target.value))}
              className={`w-full p-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                hasUnsavedChanges 
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                  : 'border-border'
              }`}
              disabled={!selectedCharacter.enabled}
            >
              {selectedCharacter.character.outfits.map((outfit, outfitIndex) => (
                <option key={outfitIndex} value={outfitIndex}>
                  {outfit.name}
                </option>
              ))}
            </select>
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          {/* Individual Save Button */}
          {hasUnsavedChanges && onSaveOutfit && selectedCharacter.character && (
            <button
              onClick={() => onSaveOutfit(selectedCharacter.character!.id)}
              disabled={isSaving}
              className="w-full px-3 py-1.5 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
            >
              {isSaving ? 'Saving...' : 'Save Outfit'}
            </button>
          )}
        </div>
      )}

      {/* Character Parameter Controls - Always Visible */}
      {selectedCharacter.character && selectedCharacter.enabled && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Parameter Controls</h5>
          <div className="space-y-1">
            {Object.entries(characterControls).map(([control, enabled]) => {
              const value = getCharacterValue(selectedCharacter.character!, control, selectedCharacter.outfitIndex);
              // Only render the control if there's a value set
              const safeValue = typeof value === 'string' ? value : String(value || '');
              if (!safeValue || safeValue.trim() === '') {
                return null;
              }
              return (
                <ParameterControl
                  key={control}
                  label={control.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  value={safeValue}
                  enabled={enabled}
                  onToggle={() => onControlToggle(index, control)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 