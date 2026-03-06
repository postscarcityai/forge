'use client';

import React from 'react';
import { useImageContext } from '@/contexts/ImageContext';

export const DebugInfo: React.FC = () => {
  const [isClient, setIsClient] = React.useState(false);
  
  // Handle hydration
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render during SSR or in production
  if (!isClient || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <DebugInfoContent />;
};

const DebugInfoContent: React.FC = () => {
  const { state, isLoading, error } = useImageContext();

  return (
    <div className="fixed top-4 left-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <h3 className="text-sm font-bold mb-2">🔍 Debug Info</h3>
      <div className="text-xs space-y-1">
        <p>Loading: {isLoading ? '✅' : '❌'}</p>
        <p>Error: {error || '❌'}</p>
        <p>Gallery Count: {state.gallery.length}</p>
        <p>Timeline Count: {state.timeline.length}</p>
        <p>Images Count: {Object.keys(state.images).length}</p>
        <p>Gallery IDs: [{state.gallery.join(', ')}]</p>
        <p>Image Keys: [{Object.keys(state.images).join(', ')}]</p>
        <details>
          <summary className="cursor-pointer">Raw State</summary>
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(state, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}; 