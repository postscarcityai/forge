'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Icon, ChevronLeft, Edit, Check, AlertCircle, Settings, Building2, Palette, Camera, Layers, Folder, User, MapPin } from '@/components/ui/Icon';
import { Project } from '@/contexts/ProjectContext';

export type TabType = 'general' | 'business' | 'brand' | 'prompting' | 'characters' | 'scenes' | 'loras' | 'env';

interface SettingsNavigationProps {
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

export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
  project,
  projectId,
  activeTab,
  isEditing,
  isSaving,
  error,
  onEdit,
  onCancel,
  onSave,
}) => {
  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: <Icon icon={Settings} size="xs" /> },
    { id: 'business' as TabType, label: 'Business', icon: <Icon icon={Building2} size="xs" /> },
    { id: 'brand' as TabType, label: 'Brand', icon: <Icon icon={Palette} size="xs" /> },
    { id: 'prompting' as TabType, label: 'Prompting', icon: <Icon icon={Camera} size="xs" /> },
    { id: 'characters' as TabType, label: 'Characters', icon: <Icon icon={User} size="xs" /> },
    { id: 'scenes' as TabType, label: 'Scenes', icon: <Icon icon={MapPin} size="xs" /> },
    { id: 'loras' as TabType, label: 'LoRAs', icon: <Icon icon={Layers} size="xs" /> },
    { id: 'env' as TabType, label: 'Environment', icon: <Icon icon={Folder} size="xs" /> },
  ];

  return (
    <div className="z-40 bg-background border-b border-border w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <Link
            href={`/${projectId}`}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
            title="Back to project"
          >
            <Icon icon={ChevronLeft} size="sm" />
          </Link>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link 
              href={`/${projectId}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {project.name}
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground font-medium">Settings</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground capitalize">{activeTab}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                disabled={isSaving}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-3 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
                {!isSaving && <Icon icon={Check} size="xs" />}
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              disabled={project.isEditable === false}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2",
                project.isEditable === false
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={
                project.isEditable === false 
                  ? "Project is read-only and cannot be edited" 
                  : "Edit project"
              }
            >
              <Icon icon={Edit} size="xs" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-accent px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/${projectId}/settings/${tab.id}`}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 tracking-tight whitespace-nowrap',
              activeTab === tab.id
                ? 'border-foreground text-foreground bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-accent border-b border-border text-foreground mx-6"
        >
          <Icon icon={AlertCircle} size="sm" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
}; 