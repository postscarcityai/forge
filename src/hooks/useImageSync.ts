import { useEffect, useCallback, useRef } from 'react'
import { useImageContext } from '@/contexts/ImageContext'

interface ImageSyncOptions {
  pollInterval?: number // Polling interval in milliseconds (default: 5000)
  autoSync?: boolean // Whether to automatically sync (default: true)
  onNewImages?: (count: number) => void // Callback when new images are found
}

interface ImageData {
  id: string;
  title: string;
  description?: string;
  index: number;
  type: 'timeline' | 'gallery';
  createdAt: number;
  filename: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Hook for automatically syncing generated images into the timeline
 */
export const useImageSync = (options: ImageSyncOptions = {}) => {
  const {
    pollInterval = 5000, // 5 seconds
    autoSync = true,
    onNewImages
  } = options

  const { addGeneratedImages } = useImageContext()
  const lastSyncRef = useRef<string | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Check for new images and sync them
   */
  const syncImages = useCallback(async (): Promise<{ count: number; images: ImageData[] }> => {
    try {
      const url = new URL('/api/images/sync', window.location.origin)
      if (lastSyncRef.current) {
        url.searchParams.set('lastSync', lastSyncRef.current)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success && data.newImages && data.newImages.length > 0) {
        // Add new images to the timeline
        addGeneratedImages(data.newImages)
        
        // Update last sync time
        lastSyncRef.current = data.lastChecked
        
        // Call callback if provided
        if (onNewImages) {
          onNewImages(data.count)
        }

        console.log(`🎨 Synced ${data.count} new images to timeline`)
        
        return { count: data.count, images: data.newImages }
      }

      return { count: 0, images: [] }
    } catch (error) {
      console.error('Error syncing images:', error)
      return { count: 0, images: [] }
    }
  }, [addGeneratedImages, onNewImages])

  /**
   * Start polling for new images
   */
  const startPolling = useCallback(() => {
    if (!autoSync) return

    const poll = async () => {
      await syncImages()
      pollTimeoutRef.current = setTimeout(poll, pollInterval)
    }

    // Start polling
    poll()
  }, [autoSync, syncImages, pollInterval])

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }, [])

  /**
   * Manual sync trigger
   */
  const triggerSync = useCallback(async () => {
    return await syncImages()
  }, [syncImages])

  // Auto-start polling when component mounts
  useEffect(() => {
    if (autoSync) {
      // Initial sync
      syncImages()
      // Start polling after a short delay
      const initialDelay = setTimeout(startPolling, 1000)
      
      return () => {
        clearTimeout(initialDelay)
        stopPolling()
      }
    }
  }, [autoSync, startPolling, stopPolling, syncImages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    triggerSync,
    startPolling,
    stopPolling,
    isPolling: pollTimeoutRef.current !== null
  }
} 