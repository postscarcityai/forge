import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Video, Palette, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { Project, ProjectOptions } from '@/contexts/ProjectContext';

interface ScenesTabProps {
  isEditing: boolean;
  editedProject: Project;
  project: Project;
  projectOptions: ProjectOptions;
  setProjectOptions: React.Dispatch<React.SetStateAction<ProjectOptions | null>>;
}

export const ScenesTab: React.FC<ScenesTabProps> = ({
  isEditing,
  editedProject,
  project,
  projectOptions,
  setProjectOptions,
}) => {
  const scenes = projectOptions.scenes || [];
  
  // State for tracking which scenes are expanded
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({});

  const toggleSceneExpanded = (sceneId: string) => {
    setExpandedScenes(prev => ({
      ...prev,
      [sceneId]: !prev[sceneId]
    }));
  };

  const expandAll = () => {
    const allExpanded = scenes.reduce((acc, scene) => ({
      ...acc,
      [scene.id]: true
    }), {});
    setExpandedScenes(allExpanded);
  };

  const collapseAll = () => {
    setExpandedScenes({});
  };

  const addScene = () => {
    const newScene = {
      id: Date.now().toString(),
      name: '',
      
      // Scene details
      setting: '',
      description: '',
      
      // Technical specifications
      time_of_day: '',
      lighting: '',
      mood: '',
      camera_angle: '',
      atmosphere: '',
      
      // Props
      props: [],
      
      // Tags and notes
      tags: [],
      notes: ''
    };

    setProjectOptions(prev => ({
      ...prev!,
      scenes: [...(prev?.scenes || []), newScene]
    }));
  };

  const updateScene = (id: string, field: string, value: any) => {
    setProjectOptions(prev => ({
      ...prev!,
      scenes: (prev?.scenes || []).map(scene =>
        scene.id === id ? { ...scene, [field]: value } : scene
      )
    }));
  };

  const removeScene = (id: string) => {
    setProjectOptions(prev => ({
      ...prev!,
      scenes: (prev?.scenes || []).filter(scene => scene.id !== id)
    }));
  };

  const addProp = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      updateScene(sceneId, 'props', [...(scene.props || []), '']);
    }
  };

  const updateProp = (sceneId: string, index: number, value: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.props) {
      const newProps = [...scene.props];
      newProps[index] = value;
      updateScene(sceneId, 'props', newProps);
    }
  };

  const removeProp = (sceneId: string, index: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.props) {
      const newProps = scene.props.filter((_, i) => i !== index);
      updateScene(sceneId, 'props', newProps);
    }
  };

  const addTag = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      updateScene(sceneId, 'tags', [...(scene.tags || []), '']);
    }
  };

  const updateTag = (sceneId: string, index: number, value: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.tags) {
      const newTags = [...scene.tags];
      newTags[index] = value;
      updateScene(sceneId, 'tags', newTags);
    }
  };

  const removeTag = (sceneId: string, index: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.tags) {
      const newTags = scene.tags.filter((_, i) => i !== index);
      updateScene(sceneId, 'tags', newTags);
    }
  };

  if (!isEditing && scenes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No scenes defined yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      {scenes.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Expand All
            </button>
            <span className="text-xs text-muted-foreground">•</span>
            <button
              onClick={collapseAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}

      {scenes.map((scene) => {
        const isExpanded = expandedScenes[scene.id];
        
        return (
          <motion.div
            key={scene.id}
            layout
            className="border border-solid border-border rounded-lg bg-background overflow-hidden"
          >
            {/* Collapsible Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleSceneExpanded(scene.id)}
                  className="flex items-center gap-3 text-left flex-1 hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {scene.name || 'Unnamed Scene'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">Setting:</span>
                        {scene.setting || 'No setting specified'}
                      </span>
                    </p>
                  </div>
                </button>
                {isEditing && (
                  <button
                    onClick={() => removeScene(scene.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-accent/50 transition-colors"
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
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 border-t border-border">

          {/* Scene Identification */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scene Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={scene.name}
                onChange={(e) => updateScene(scene.id, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                placeholder="Scene name"
              />
            ) : (
              <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                {scene.name || 'Not specified'}
              </div>
            )}
          </div>

          {/* Scene Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Setting
              </label>
              {isEditing ? (
                <textarea
                  value={scene.setting}
                  onChange={(e) => updateScene(scene.id, 'setting', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
                  placeholder="Where the scene takes place..."
                />
              ) : (
                <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[76px]">
                  {scene.setting || 'Not specified'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={scene.description}
                  onChange={(e) => updateScene(scene.id, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
                  placeholder="Detailed scene description..."
                />
              ) : (
                <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[76px]">
                  {scene.description || 'Not specified'}
                </div>
              )}
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
              <Video className="h-4 w-4" />
              Technical Specifications
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: 'time_of_day', label: 'Time of Day' },
                { field: 'lighting', label: 'Lighting' },
                { field: 'mood', label: 'Mood' },
                { field: 'camera_angle', label: 'Camera Angle' },
                { field: 'atmosphere', label: 'Atmosphere' }
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={scene[field as keyof typeof scene] as string}
                      onChange={(e) => updateScene(scene.id, field, e.target.value)}
                      className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                      placeholder={`Scene ${label.toLowerCase()}...`}
                    />
                  ) : (
                    <div className="p-3 bg-accent rounded-md text-foreground text-sm">
                      {(scene[field as keyof typeof scene] as string) || 'Not specified'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Props */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
                <Palette className="h-4 w-4" />
                Props
              </div>
              {isEditing && (
                <button
                  onClick={() => addProp(scene.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add Prop
                </button>
              )}
            </div>
            
            {scene.props && scene.props.length > 0 ? (
              <div className="space-y-2">
                {scene.props.map((prop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={prop}
                          onChange={(e) => updateProp(scene.id, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                          placeholder="Prop description"
                        />
                        <button
                          onClick={() => removeProp(scene.id, index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 p-3 bg-accent rounded-md text-foreground text-sm">
                        {prop}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No props defined</div>
            )}
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
                  onClick={() => addTag(scene.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add Tag
                </button>
              )}
            </div>
            
            {scene.tags && scene.tags.length > 0 ? (
              <div className="space-y-2">
                {scene.tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => updateTag(scene.id, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground text-sm bg-background text-foreground"
                          placeholder="Tag"
                        />
                        <button
                          onClick={() => removeTag(scene.id, index)}
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

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </label>
            {isEditing ? (
              <textarea
                value={scene.notes}
                onChange={(e) => updateScene(scene.id, 'notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-solid border-border rounded-md focus:outline-none focus:ring-1 focus:ring-muted-foreground focus:border-muted-foreground resize-none text-sm bg-background text-foreground"
                placeholder="Additional notes..."
              />
            ) : (
              <div className="p-3 bg-accent rounded-md text-foreground text-sm min-h-[76px]">
                {scene.notes || 'No notes provided'}
              </div>
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
          onClick={addScene}
          className="w-full py-3 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
        >
          + Add Scene
        </button>
      )}
    </div>
  );
}; 