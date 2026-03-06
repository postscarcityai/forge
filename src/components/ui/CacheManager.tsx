'use client';

import React, { useState, useEffect } from 'react';
import { dbCache } from '@/lib/indexedDB';
import { Icon, Trash2, RotateCcw } from './Icon';

interface CacheManagerProps {
  className?: string;
}

interface CacheStats {
  imageCache: number;
  apiCache: number;
  totalSize: number;
  lastUpdated: Date;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ className }) => {
  const [stats, setStats] = useState<CacheStats>({
    imageCache: 0,
    apiCache: 0,
    totalSize: 0,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get cache sizes
      const cacheStats = await dbCache.getCacheStats();
      
      setStats({
        imageCache: cacheStats.images,
        apiCache: cacheStats.apiCalls,
        totalSize: cacheStats.totalSize,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Failed to load cache stats:', err);
      setError('Failed to load cache statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const clearImageCache = async () => {
    try {
      await dbCache.clearImageCache();
      await loadStats();
    } catch (err) {
      console.error('Failed to clear image cache:', err);
      setError('Failed to clear image cache');
    }
  };

  const clearApiCache = async () => {
    try {
      await dbCache.clearApiCache();
      await loadStats();
    } catch (err) {
      console.error('Failed to clear API cache:', err);
      setError('Failed to clear API cache');
    }
  };

  const clearAllCache = async () => {
    try {
      await dbCache.clearImageCache();
      await dbCache.clearApiCache();
      await loadStats();
    } catch (err) {
      console.error('Failed to clear all cache:', err);
      setError('Failed to clear all cache');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-accent border border-border rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-accent border border-border rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Cache Manager</h3>
        <button
          onClick={loadStats}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-background"
          title="Refresh stats"
        >
          <Icon icon={RotateCcw} size="sm" />
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-background rounded border p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.imageCache}</div>
          <div className="text-sm text-muted-foreground">Images</div>
        </div>
        <div className="bg-background rounded border p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.apiCache}</div>
          <div className="text-sm text-muted-foreground">API Calls</div>
        </div>
        <div className="bg-background rounded border p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.totalSize}</div>
          <div className="text-sm text-muted-foreground">Total Items</div>
        </div>
        <div className="bg-background rounded border p-3 text-center">
          <div className="text-xs text-muted-foreground">Last Updated</div>
          <div className="text-sm font-medium text-foreground">
            {stats.lastUpdated.toLocaleTimeString()}
      </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={clearImageCache}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-foreground rounded-md hover:bg-muted transition-colors text-sm"
        >
          <Icon icon={Trash2} size="xs" />
          Clear Images
        </button>
        
        <button
          onClick={clearApiCache}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-foreground rounded-md hover:bg-muted transition-colors text-sm"
        >
          <Icon icon={Trash2} size="xs" />
          Clear API
        </button>
        
        <button
          onClick={clearAllCache}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-foreground rounded-md hover:bg-muted transition-colors text-sm"
        >
          <Icon icon={Trash2} size="xs" />
          Clear All
        </button>
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        <p>Cache helps improve performance by storing frequently accessed data locally.</p>
        <p>Clear cache if you&apos;re experiencing issues or want to free up storage space.</p>
        <div className="mt-2">
          <span className="text-muted-foreground">Last updated: </span>
          <span className="font-mono">{stats.lastUpdated.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}; 