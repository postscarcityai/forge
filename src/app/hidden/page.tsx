import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata(pageMetadata.hidden());

export default function HiddenPage() {
  // Redirect to default project's hidden route
  redirect('/default/hidden');
} 