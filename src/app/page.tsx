import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata(pageMetadata.home);

export default function HomePage() {
  // Server-side redirect to the default project
  redirect('/default');
}


