import { useEffect, useRef, useCallback } from 'react'
import { useImageContext } from '@/contexts/ImageContext'

interface FileWatcherOptions {
  pollInterval?: number // Polling interval in milliseconds (default: 2000)
  enabled?: boolean // Whether to enable the watcher (default: true)
  onNewImages?: (count: number) => void // Callback when new images are detected
  onNewVideos?: (count: number) => void // Callback when new videos are detected
  onNewMedia?: (imageCount: number, videoCount: number) => void // Callback when any new media is detected
}

/**
 * Hook for watching the images and videos folders and automatically updating the gallery
 * when new media is detected
 */
export const useFileWatcher = (options: FileWatcherOptions = {}) => {
  const {
    pollInterval = 2000, // 2 seconds
    enabled = true,
    onNewImages,
    onNewVideos,
    onNewMedia
  } = options

  // Removed addGeneratedImages to prevent state conflicts
  const lastCheckRef = useRef<number>(Date.now())
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { forceReloadImages } = useImageContext()

  /**
   * Check for new media (images and videos) by looking at the file system
   */
  const checkForNewMedia = useCallback(async (): Promise<{ hasNewMedia: boolean; imageCount: number; videoCount: number }> => {
    try {
      // Use delta sync - only get media since last check
      const lastSyncISO = new Date(lastCheckRef.current).toISOString()
      
      // Check for new images and videos in parallel
      const [imageResponse, videoResponse] = await Promise.all([
        fetch(`/api/images/sync?lastSync=${encodeURIComponent(lastSyncISO)}`),
        fetch(`/api/videos/sync?lastSync=${encodeURIComponent(lastSyncISO)}`)
      ])

      const [imageData, videoData] = await Promise.all([
        imageResponse.json(),
        videoResponse.json()
      ])

      const newImageCount = (imageData.success && imageData.newImages) ? imageData.newImages.length : 0
      const newVideoCount = (videoData.success && videoData.newVideos) ? videoData.newVideos.length : 0
      const totalNewMedia = newImageCount + newVideoCount

      if (totalNewMedia > 0) {
        // Update last check time BEFORE processing to avoid race conditions
        lastCheckRef.current = Date.now()
        
        // Ensure database is up to date for videos so Gallery (which reads from DB) can show them
        // Images are already handled by their own DB sync route; videos need explicit DB sync
        try {
          await fetch('/api/database/sync/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceSync: true })
          })
        } catch (e) {
          console.warn('📁 File watcher: video DB sync failed (will still reload gallery)', e)
        }

        // Trigger a reload from database so new items appear without manual refresh
        try {
          forceReloadImages()
        } catch (e) {
          console.warn('📁 File watcher: failed to force reload images', e)
        }
        
        // Call specific callbacks if provided
        if (newImageCount > 0 && onNewImages) {
          onNewImages(newImageCount)
        }
        if (newVideoCount > 0 && onNewVideos) {
          onNewVideos(newVideoCount)
        }
        if (onNewMedia) {
          onNewMedia(newImageCount, newVideoCount)
        }

        console.log(`📁 File watcher detected ${newImageCount} new images and ${newVideoCount} new videos (synced to DB and reloaded)`)        
          
        return { hasNewMedia: true, imageCount: newImageCount, videoCount: newVideoCount }
      }

      return { hasNewMedia: false, imageCount: 0, videoCount: 0 }
    } catch (error) {
      console.error('Error checking for new media:', error)
      return { hasNewMedia: false, imageCount: 0, videoCount: 0 }
    }
  }, [onNewImages, onNewVideos, onNewMedia])

  /**
   * Start watching for new files
   */
  const startWatching = useCallback(() => {
    if (!enabled) return

    const watch = async () => {
      await checkForNewMedia()
      pollTimeoutRef.current = setTimeout(watch, pollInterval)
    }

    // Start watching
    watch()
  }, [enabled, pollInterval, checkForNewMedia])

  /**
   * Stop watching for new files
   */
  const stopWatching = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }

  /**
   * Manual trigger to check for new media
   */
  const triggerCheck = async () => {
    return await checkForNewMedia()
  }

  // Auto-start watching when component mounts
  useEffect(() => {
    if (enabled) {
      // Start watching after a longer delay to avoid conflicts with initial load
      const initialDelay = setTimeout(startWatching, 10000) // Wait 10 seconds to avoid conflicts
      
      return () => {
        clearTimeout(initialDelay)
        stopWatching()
      }
    }
  }, [enabled, pollInterval, startWatching])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [])

  return {
    triggerCheck,
    startWatching,
    stopWatching,
    isWatching: pollTimeoutRef.current !== null
  }
} 