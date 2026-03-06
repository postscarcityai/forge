import { Completed } from '@/components/Completed/Completed';
import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata(pageMetadata.completed);

export default function CompletedPage() {
  return (
    <main className="min-h-screen bg-background">
      <Completed />
    </main>
  );
} 