import { Gallery } from '@/components/Gallery/Gallery';
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
  const metaData = pageMetadata.gallery(projectName);
  
  return generatePageMetadata(metaData);
}

export default function ProjectPage() {
  // The projectId will be automatically handled by ProjectContext
  // which will read it from the URL and set the current project
  return (
    <main className="min-h-screen bg-background">
      <Gallery />
    </main>
  );
}

// This generates static params for known projects at build time
export async function generateStaticParams() {
  // Return the known project IDs
  return [
    { projectId: 'default' },
  ];
} 