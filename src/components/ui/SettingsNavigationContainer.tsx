'use client';

import React from 'react';
import { SettingsNavigation } from '@/components/ui/SettingsNavigation';
import { Project } from '@/contexts/ProjectContext';

type TabType = 'general' | 'business' | 'brand' | 'prompting' | 'characters' | 'scenes' | 'loras' | 'env' | 'api-keys';

interface SettingsNavigationContainerProps {
  project: Project;
  projectId: string;
  activeTab: TabType;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export const SettingsNavigationContainer: React.FC<SettingsNavigationContainerProps> = (props) => {
  return (
    <div className="sticky top-0 z-50 bg-background w-full">
      {/* Settings Navigation */}
      <SettingsNavigation {...props} />
    </div>
  );
}; 