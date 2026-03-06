'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectContext } from '@/contexts/ProjectContext';

export default function StylesPage() {
  const router = useRouter();
  const { currentProject } = useProjectContext();

  useEffect(() => {
    // Redirect to the current project's styles route
    router.replace(`/${currentProject.id}/styles`);
  }, [currentProject.id, router]);

  // Show loading while redirecting
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Loading styles...</p>
      </div>
    </main>
  );
} 