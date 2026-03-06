/**
 * IndexedDB Cache for Forge App
 * Provides client-side caching for images, metadata, and API responses
 */

import { ImageMetadata } from '@/data/images';
import { VideoMetadata } from '@/services/videoService';
import { TimelineConfig } from '@/data/timeline';
import { Project } from '@/contexts/ProjectContext';

// Database configuration
const DB_NAME = 'Forge_Cache';
const DB_VERSION = 1;

// Store names
const STORES = {
  IMAGES: 'images',
  VIDEOS: 'videos',
  API_CACHE: 'api_cache',
  SETTINGS: 'settings'
} as const;

// Cache entry types
interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expires?: number;
}

interface ImageCacheEntry extends CacheEntry<ImageMetadata> {
  fileModified?: number;
  fileSize?: number;
}

interface VideoCacheEntry extends CacheEntry<VideoMetadata> {
  fileModified?: number;
  fileSize?: number;
}

interface ApiCacheEntry extends CacheEntry {
  endpoint: string;
  params?: string;
}

// Prompt drawer settings interface
interface PromptDrawerSettings {
  userInput: string;
  selectedCharacters: Array<{
    characterId: string | null;
    outfitIndex: number;
    enabled: boolean;
  }>;
  selectedSceneId: string | null;
  expandedSections: Record<string, boolean>;
  characterControls: Array<Record<string, boolean>>;
  sceneControls: Record<string, boolean>;
  technicalControls: Record<string, boolean>;
  styleControls: Record<string, boolean>;
  atmosphericControls: Record<string, boolean>;
  supportingControls: Record<string, boolean>;
  postProcessingControls: Record<string, boolean>;
  loraControls: Record<string, boolean>;
  masterPromptEnabled: boolean;
  userInputEnabled: boolean;
  showPromptPreview: boolean;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initDB();
    }
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    // Check if we're on the client side
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not available');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB connected successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Images store
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          const imageStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'key' });
          imageStore.createIndex('timestamp', 'timestamp');
          imageStore.createIndex('id', 'data.id', { unique: true });
        }

        // Videos store
        if (!db.objectStoreNames.contains(STORES.VIDEOS)) {
          const videoStore = db.createObjectStore(STORES.VIDEOS, { keyPath: 'key' });
          videoStore.createIndex('timestamp', 'timestamp');
          videoStore.createIndex('id', 'data.id', { unique: true });
        }

        // API cache store
        if (!db.objectStoreNames.contains(STORES.API_CACHE)) {
          const apiStore = db.createObjectStore(STORES.API_CACHE, { keyPath: 'key' });
          apiStore.createIndex('endpoint', 'endpoint');
          apiStore.createIndex('timestamp', 'timestamp');
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        console.log('🔧 IndexedDB schema created/updated');
      };
    });

    return this.dbPromise;
  }

  /**
   * Get database connection
   */
  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB not available on server side');
    }
    if (this.db) {
      return this.db;
    }
    return this.initDB();
  }

  /**
   * Generic method to get data from a store
   */
  private async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && (!result.expires || result.expires > Date.now())) {
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB get failed:', error);
      return null;
    }
  }

  /**
   * Generic method to set data in a store
   */
  private async set<T>(storeName: string, key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        expires: ttl ? Date.now() + ttl : undefined
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.warn('IndexedDB set failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('IndexedDB set failed:', error);
      return false;
    }
  }

  /**
   * Get all entries from a store
   */
  private async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const results = request.result
            .filter((entry: CacheEntry<T>) => !entry.expires || entry.expires > Date.now())
            .map((entry: CacheEntry<T>) => entry.data);
          resolve(results);
        };
        
        request.onerror = () => {
          console.warn('IndexedDB getAll failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('IndexedDB getAll failed:', error);
      return [];
    }
  }

  /**
   * Clear expired entries from all stores
   */
  async clearExpired(): Promise<void> {
    try {
      const db = await this.getDB();
      const stores = [STORES.IMAGES, STORES.VIDEOS, STORES.API_CACHE];
      
      for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        
        const request = index.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const entry = cursor.value as CacheEntry;
            if (entry.expires && entry.expires <= Date.now()) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      }
    } catch (error) {
      console.warn('Failed to clear expired entries:', error);
    }
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /**
   * Cache image metadata
   */
  async cacheImage(image: ImageMetadata, ttl = 24 * 60 * 60 * 1000): Promise<boolean> {
    return this.set(STORES.IMAGES, image.id, image, ttl);
  }

  /**
   * Get cached image metadata
   */
  async getCachedImage(id: string): Promise<ImageMetadata | null> {
    return this.get<ImageMetadata>(STORES.IMAGES, id);
  }

  /**
   * Cache multiple images
   */
  async cacheImages(images: ImageMetadata[], ttl = 24 * 60 * 60 * 1000): Promise<number> {
    let cached = 0;
    for (const image of images) {
      if (await this.cacheImage(image, ttl)) {
        cached++;
      }
    }
    return cached;
  }

  /**
   * Get all cached images
   */
  async getAllCachedImages(): Promise<ImageMetadata[]> {
    return this.getAll<ImageMetadata>(STORES.IMAGES);
  }

  /**
   * Cache video metadata
   */
  async cacheVideo(video: VideoMetadata, ttl = 24 * 60 * 60 * 1000): Promise<boolean> {
    return this.set(STORES.VIDEOS, video.id, video, ttl);
  }

  /**
   * Get cached video metadata
   */
  async getCachedVideo(id: string): Promise<VideoMetadata | null> {
    return this.get<VideoMetadata>(STORES.VIDEOS, id);
  }

  /**
   * Cache multiple videos
   */
  async cacheVideos(videos: VideoMetadata[], ttl = 24 * 60 * 60 * 1000): Promise<number> {
    let cached = 0;
    for (const video of videos) {
      if (await this.cacheVideo(video, ttl)) {
        cached++;
      }
    }
    return cached;
  }

  /**
   * Get all cached videos
   */
  async getAllCachedVideos(): Promise<VideoMetadata[]> {
    return this.getAll<VideoMetadata>(STORES.VIDEOS);
  }

  /**
   * Cache API response
   */
  async cacheApiResponse(endpoint: string, params: string, data: unknown, ttl = 5 * 60 * 1000): Promise<boolean> {
    const key = `${endpoint}:${params}`;
    const entry: ApiCacheEntry = {
      key,
      endpoint,
      params,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    };
    
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.API_CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.API_CACHE);
      
      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.warn('API cache failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('API cache failed:', error);
      return false;
    }
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint: string, params: string): Promise<unknown | null> {
    const key = `${endpoint}:${params}`;
    return this.get(STORES.API_CACHE, key);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    images: number;
    videos: number;
    apiCalls: number;
    totalSize: number;
  }> {
    try {
      const [images, videos, apiCalls] = await Promise.all([
        this.getAllCachedImages(),
        this.getAllCachedVideos(),
        this.getAll(STORES.API_CACHE)
      ]);

      return {
        images: images.length,
        videos: videos.length,
        apiCalls: apiCalls.length,
        totalSize: images.length + videos.length + apiCalls.length
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { images: 0, videos: 0, apiCalls: 0, totalSize: 0 };
    }
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const stores = [STORES.IMAGES, STORES.VIDEOS, STORES.API_CACHE];
      
      for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      console.log('🧹 Cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear just API cache
   */
  async clearApiCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.API_CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.API_CACHE);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log('🧹 API cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear API cache:', error);
    }
  }

  /**
   * Clear just image cache
   */
  async clearImageCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.IMAGES], 'readwrite');
      const store = transaction.objectStore(STORES.IMAGES);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log('🧹 Image cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  // =============================================================================
  // TIMELINE PERSISTENCE METHODS
  // =============================================================================

  /**
   * Save timeline configuration
   */
  async saveTimelineConfig(config: TimelineConfig): Promise<boolean> {
    try {
      const success = await this.set(STORES.SETTINGS, 'timeline_config', config);
      return success;
    } catch (error) {
      console.warn('Failed to save timeline config:', error);
      return false;
    }
  }

  /**
   * Load timeline configuration
   */
  async loadTimelineConfig(): Promise<TimelineConfig | null> {
    try {
      const config = await this.get<TimelineConfig>(STORES.SETTINGS, 'timeline_config');
      return config;
    } catch (error) {
      console.warn('Failed to load timeline config:', error);
      return null;
    }
  }

  /**
   * Save timeline order only (quick update)
   */
  async saveTimelineOrder(timelineIds: string[]): Promise<boolean> {
    try {
      // Get existing config or create new one
      const existingConfig = await this.loadTimelineConfig() || { timeline: [], featured: [] };
      const updatedConfig: TimelineConfig = {
        ...existingConfig,
        timeline: timelineIds
      };
      
      const success = await this.saveTimelineConfig(updatedConfig);
      return success;
    } catch (error) {
      console.warn('Failed to save timeline order:', error);
      return false;
    }
  }

  /**
   * Save featured images
   */
  async saveFeaturedImages(featuredIds: string[]): Promise<boolean> {
    try {
      // Get existing config or create new one
      const existingConfig = await this.loadTimelineConfig() || { timeline: [], featured: [] };
      const updatedConfig: TimelineConfig = {
        ...existingConfig,
        featured: featuredIds
      };
      
      const success = await this.saveTimelineConfig(updatedConfig);
      return success;
    } catch (error) {
      console.warn('Failed to save featured images:', error);
      return false;
    }
  }

  // =============================================================================
  // UI STATE PERSISTENCE METHODS
  // =============================================================================

  /**
   * Save timeline visibility state
   */
  async saveTimelineVisibility(isOpen: boolean): Promise<boolean> {
    try {
      const success = await this.set(STORES.SETTINGS, 'timeline_visibility', { isOpen });
      return success;
    } catch (error) {
      console.warn('Failed to save timeline visibility:', error);
      return false;
    }
  }

  /**
   * Load timeline visibility state
   */
  async loadTimelineVisibility(): Promise<boolean> {
    try {
      const result = await this.get<{ isOpen: boolean }>(STORES.SETTINGS, 'timeline_visibility');
      return result?.isOpen ?? false; // Default to closed if not found
    } catch (error) {
      console.warn('Failed to load timeline visibility:', error);
      return false; // Default to closed on error
    }
  }

  /**
   * Save drawer visibility state
   */
  async saveDrawerVisibility(isOpen: boolean): Promise<boolean> {
    try {
      const success = await this.set(STORES.SETTINGS, 'drawer_visibility', { isOpen });
      return success;
    } catch (error) {
      console.warn('Failed to save drawer visibility:', error);
      return false;
    }
  }

  /**
   * Load drawer visibility state
   */
  async loadDrawerVisibility(): Promise<boolean> {
    try {
      const result = await this.get<{ isOpen: boolean }>(STORES.SETTINGS, 'drawer_visibility');
      return result?.isOpen ?? false; // Default to closed if not found
    } catch (error) {
      console.warn('Failed to load drawer visibility:', error);
      return false; // Default to closed on error
    }
  }

  /**
   * Save prompt drawer visibility state
   */
  async savePromptDrawerVisibility(isOpen: boolean): Promise<boolean> {
    try {
      const success = await this.set(STORES.SETTINGS, 'prompt_drawer_visibility', { isOpen });
      return success;
    } catch (error) {
      console.warn('Failed to save prompt drawer visibility:', error);
      return false;
    }
  }

  /**
   * Load prompt drawer visibility state
   */
  async loadPromptDrawerVisibility(): Promise<boolean> {
    try {
      const result = await this.get<{ isOpen: boolean }>(STORES.SETTINGS, 'prompt_drawer_visibility');
      return result?.isOpen ?? false; // Default to closed if not found
    } catch (error) {
      console.warn('Failed to load prompt drawer visibility:', error);
      return false; // Default to closed on error
    }
  }

  // =============================================================================
  // PROMPT DRAWER SETTINGS METHODS
  // =============================================================================

  /**
   * Save prompt drawer settings per project
   */
  async savePromptDrawerSettings(projectId: string, settings: PromptDrawerSettings): Promise<boolean> {
    try {
      const key = `prompt_drawer_settings_${projectId}`;
      const success = await this.set(STORES.SETTINGS, key, settings);
      return success;
    } catch (error) {
      console.warn('Failed to save prompt drawer settings:', error);
      return false;
    }
  }

  /**
   * Load prompt drawer settings per project
   */
  async loadPromptDrawerSettings(projectId: string): Promise<PromptDrawerSettings | null> {
    try {
      const key = `prompt_drawer_settings_${projectId}`;
      const settings = await this.get<PromptDrawerSettings>(STORES.SETTINGS, key);
      return settings;
    } catch (error) {
      console.warn('Failed to load prompt drawer settings:', error);
      return null;
    }
  }

  // =============================================================================
  // PROJECT PERSISTENCE METHODS
  // =============================================================================

  /**
   * Save current project ID
   */
  async saveCurrentProject(projectId: string): Promise<boolean> {
    try {
      const success = await this.set(STORES.SETTINGS, 'current_project', projectId);
      return success;
    } catch (error) {
      console.warn('Failed to save current project:', error);
      return false;
    }
  }

  /**
   * Load current project ID
   */
  async loadCurrentProject(): Promise<string | null> {
    try {
      const projectId = await this.get<string>(STORES.SETTINGS, 'current_project');
      return projectId;
    } catch (error) {
      console.warn('Failed to load current project:', error);
      return null;
    }
  }

  /**
   * Save hidden images for a specific project
   */
  async saveHiddenImages(projectId: string, hiddenIds: string[]): Promise<boolean> {
    try {
      const key = `hidden_images_${projectId}`;
      const success = await this.set(STORES.SETTINGS, key, hiddenIds);
      return success;
    } catch (error) {
      console.warn('Failed to save hidden images:', error);
      return false;
    }
  }

  /**
   * Load hidden images for a specific project
   */
  async loadHiddenImages(projectId: string): Promise<string[]> {
    try {
      const key = `hidden_images_${projectId}`;
      const hiddenIds = await this.get<string[]>(STORES.SETTINGS, key);
      return hiddenIds || [];
    } catch (error) {
      console.warn('Failed to load hidden images:', error);
      return [];
    }
  }

  /**
   * Save projects list
   */
  async saveProjects(projects: Project[]): Promise<boolean> {
    try {
      const success = await this.set(STORES.SETTINGS, 'projects', projects);
      return success;
    } catch (error) {
      console.warn('Failed to save projects:', error);
      return false;
    }
  }

  /**
   * Load projects list
   */
  async loadProjects(): Promise<Project[]> {
    try {
      const projects = await this.get<Project[]>(STORES.SETTINGS, 'projects');
      return projects || [];
    } catch (error) {
      console.warn('Failed to load projects:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dbCache = new IndexedDBCache();

// Export types
export type { ImageCacheEntry, VideoCacheEntry, ApiCacheEntry, PromptDrawerSettings }; 