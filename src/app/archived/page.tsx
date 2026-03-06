import { Archived } from '@/components/Archived/Archived';
import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata(pageMetadata.archived);

export default function ArchivedPage() {
  return (
    <main className="min-h-screen bg-background">
      <Archived />
    </main>
  );
} 