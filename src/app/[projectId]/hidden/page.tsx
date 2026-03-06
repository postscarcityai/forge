import { Hidden } from '@/components/Hidden/Hidden';
import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  
  // Map known project IDs to readable names
  const projectNames: Record<string, string> = {
    'default': 'Default Project',
  };
  
  const projectName = projectNames[projectId] || projectId.toUpperCase();
  const metaData = pageMetadata.hidden(projectName);
  
  return generatePageMetadata(metaData);
}

export default function ProjectHiddenPage() {
  // The projectId from params will be automatically handled by ProjectContext
  // which reads it from the URL and sets the current project
  return (
    <main className="min-h-screen bg-background">
      <Hidden />
    </main>
  );
}

export async function generateStaticParams() {
  return [
    { projectId: 'default' },
  ];
} 