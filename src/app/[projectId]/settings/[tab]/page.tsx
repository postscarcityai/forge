import React from 'react';
import { notFound } from 'next/navigation';
import { ProjectSettingsPage } from '@/components/ui/ProjectSettingsPage';
import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import type { Metadata } from 'next';

// Valid settings tabs
const VALID_TABS = ['general', 'business', 'brand', 'prompting', 'characters', 'scenes', 'loras', 'env', 'api-keys'] as const;
type SettingsTab = typeof VALID_TABS[number];

interface Props {
  params: Promise<{ projectId: string; tab: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId, tab } = await params;
  
  // Validate tab parameter for metadata generation
  if (!VALID_TABS.includes(tab as SettingsTab)) {
    return generatePageMetadata({
      title: 'Page Not Found',
      description: 'The requested settings page could not be found.',
      noIndex: true,
    });
  }
  
  // Map known project IDs to readable names
  const projectNames: Record<string, string> = {
    'default': 'Default Project',
  };
  
  const projectName = projectNames[projectId] || projectId.toUpperCase();
  
  // Create tab-specific titles
  const tabTitles: Record<SettingsTab, string> = {
    'general': 'General Settings',
    'business': 'Business Settings',
    'brand': 'Brand Settings',
    'prompting': 'Prompting Settings',
    'characters': 'Character Management',
    'scenes': 'Scene Management',
    'loras': 'LoRA Management',
    'env': 'Environment Settings',
    'api-keys': 'API Key Management',
  };
  
  const tabTitle = tabTitles[tab as SettingsTab];
  const metaData = {
    ...pageMetadata.settings(projectName),
    title: `${tabTitle} - ${projectName}`,
    description: `Configure ${tabTitle.toLowerCase()} for the ${projectName} project.`,
    canonical: `/${projectId}/settings/${tab}`,
  };
  
  return generatePageMetadata(metaData);
}

export default async function SettingsTabPage({ params }: Props) {
  const { projectId, tab } = await params;

  // Validate tab parameter
  if (!VALID_TABS.includes(tab as SettingsTab)) {
    notFound();
  }

  return (
    <ProjectSettingsPage 
      projectId={projectId} 
      activeTab={tab as SettingsTab}
    />
  );
} 