/**
 * Database Service for Forge
 * Provides CRUD operations for SQLite database
 */

import { 
  getDatabase
} from '@/lib/database';
import { ImageMetadata } from '@/data/images';
import { VideoMetadata } from '@/services/videoService';
import { Character, Scene } from '@/contexts/ProjectContext';

// Helper functions for data conversion
function convertToImageMetadata(dbImage: Record<string, unknown>): ImageMetadata {
  return {
    id: String(dbImage.id),
    filename: String(dbImage.filename),
    title: String(dbImage.title),
    description: dbImage.description ? String(dbImage.description) : undefined,
    tags: dbImage.tags ? JSON.parse(String(dbImage.tags)) : undefined,
    createdAt: String(dbImage.created_at),
    updatedAt: String(dbImage.updated_at),
    projectId: String(dbImage.project_id),
    fileSize: dbImage.file_size ? Number(dbImage.file_size) : undefined,
    dimensions: dbImage.width && dbImage.height ? {
      width: Number(dbImage.width),
      height: Number(dbImage.height)
    } : undefined,
    metadata: dbImage.metadata ? JSON.parse(String(dbImage.metadata)) : undefined,
    hidden: dbImage.hidden === 1 || dbImage.hidden === true,
    timelineOrder: dbImage.timeline_order !== null && dbImage.timeline_order !== undefined 
      ? Number(dbImage.timeline_order) 
      : null
  };
}

function convertToVideoMetadata(dbVideo: Record<string, unknown>): VideoMetadata {
  const metadata = dbVideo.metadata ? JSON.parse(String(dbVideo.metadata)) : undefined;
  
  // Extract dimensions from database columns first, fallback to metadata
  let width = dbVideo.width ? Number(dbVideo.width) : undefined;
  let height = dbVideo.height ? Number(dbVideo.height) : undefined;
  let duration = dbVideo.duration ? Number(dbVideo.duration) : undefined;
  
  // Fallback: extract from metadata if database columns are empty
  if (!width && !height && metadata) {
    // Try direct width/height in metadata
    if (metadata.width && metadata.height) {
      width = Number(metadata.width);
      height = Number(metadata.height);
    }
    
    // Try API response video dimensions
    if (!width && !height && metadata.api_response?.video) {
      const video = metadata.api_response.video;
      if (video.width && video.height) {
        width = Number(video.width);
        height = Number(video.height);
      }
    }
    
    // Try generation parameters
    if (!width && !height && metadata.generationParams) {
      const params = metadata.generationParams;
      if (params.width && params.height) {
        width = Number(params.width);
        height = Number(params.height);
      }
    }
    
    // Try aspect ratio conversion as last resort
    if (!width && !height) {
      const aspectRatio = metadata.aspect_ratio;
      if (aspectRatio) {
        const dims = convertAspectRatioToDimensions(aspectRatio);
        if (dims) {
          width = dims.width;
          height = dims.height;
        }
      }
    }
  }
  
  // Extract duration from metadata if not in database
  if (!duration && metadata?.duration) {
    duration = Number(metadata.duration);
  }
  
  // Extract thumbnailPath from metadata
  const thumbnailPath = metadata?.thumbnailPath ? String(metadata.thumbnailPath) : undefined;
  
  return {
    id: String(dbVideo.id),
    filename: String(dbVideo.filename),
    title: String(dbVideo.title),
    description: dbVideo.description ? String(dbVideo.description) : undefined,
    tags: dbVideo.tags ? JSON.parse(String(dbVideo.tags)) : undefined,
    createdAt: String(dbVideo.created_at),
    updatedAt: String(dbVideo.updated_at),
    projectId: String(dbVideo.project_id),
    fileSize: Number(dbVideo.file_size),
    width,
    height,
    duration,
    thumbnailPath,
    metadata,
    hidden: dbVideo.hidden === 1 || dbVideo.hidden === true,
    timelineOrder: dbVideo.timeline_order !== null && dbVideo.timeline_order !== undefined 
      ? Number(dbVideo.timeline_order) 
      : null
  };
}

// Helper function to convert aspect ratio strings to dimensions
function convertAspectRatioToDimensions(aspectRatio: string): { width: number; height: number } | null {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '4:3':
      return { width: 1440, height: 1080 };
    case '3:4':
      return { width: 1080, height: 1440 };
    default:
      return null;
  }
}

function convertToCharacter(dbCharacter: Record<string, unknown>): Character {
  return {
    id: String(dbCharacter.id),
    name: String(dbCharacter.name),
    projectId: String(dbCharacter.project_id),
    age: Number(dbCharacter.age),
    gender: String(dbCharacter.gender),
    race: String(dbCharacter.race),
    height: String(dbCharacter.height),
    hairColor: String(dbCharacter.hair_color),
    eyeColor: String(dbCharacter.eye_color),
    physicalAppearance: String(dbCharacter.physical_appearance),
    outfits: dbCharacter.outfits ? JSON.parse(String(dbCharacter.outfits)) : [],
    defaultOutfit: Number(dbCharacter.default_outfit) || 0,
    background: String(dbCharacter.background),
    profession: dbCharacter.profession ? String(dbCharacter.profession) : undefined,
    caseDetails: dbCharacter.case_details ? String(dbCharacter.case_details) : undefined,
    sceneOfCrime: dbCharacter.scene_of_crime ? String(dbCharacter.scene_of_crime) : undefined,
    tags: dbCharacter.tags ? JSON.parse(String(dbCharacter.tags)) : undefined,
    notes: dbCharacter.notes ? String(dbCharacter.notes) : undefined,
    createdAt: String(dbCharacter.created_at),
    updatedAt: String(dbCharacter.updated_at),
    
    // Note: Active flags are stored in database but not exposed in Character interface
    // They are used internally for database operations
  };
}

function convertToScene(dbScene: Record<string, unknown>): Scene {
  return {
    id: String(dbScene.id),
    name: String(dbScene.name),
    projectId: String(dbScene.project_id),
    setting: String(dbScene.setting),
    timeOfDay: String(dbScene.time_of_day),
    lighting: String(dbScene.lighting),
    mood: String(dbScene.mood),
    cameraAngle: String(dbScene.camera_angle),
    description: String(dbScene.description),
    props: dbScene.props ? JSON.parse(String(dbScene.props)) : undefined,
    atmosphere: dbScene.atmosphere ? String(dbScene.atmosphere) : undefined,
    characterIds: dbScene.character_ids ? JSON.parse(String(dbScene.character_ids)) : [],
    tags: dbScene.tags ? JSON.parse(String(dbScene.tags)) : undefined,
    notes: dbScene.notes ? String(dbScene.notes) : undefined,
    createdAt: String(dbScene.created_at),
    updatedAt: String(dbScene.updated_at),
    
    // Note: Active flags are stored in database but not exposed in Scene interface
    // They are used internally for database operations
  };
}

class DatabaseService {
  private db: any;
  
  constructor() {
    // Only initialize database on server-side
    if (typeof window === 'undefined') {
      this.db = getDatabase();
    } else {
      this.db = null;
    }
  }
  
  private ensureServerSide() {
    if (!this.db) {
      throw new Error('Database operations can only be performed on the server-side');
    }
  }

  // ===== IMAGE OPERATIONS =====

  /**
   * Save image metadata to database
   */
  async saveImage(image: ImageMetadata): Promise<boolean> {
    this.ensureServerSide();
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO images (
          id, filename, title, description, tags, created_at, updated_at,
          project_id, file_size, width, height, metadata, hidden, timeline_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
      `);

      stmt.run(
        image.id,
        image.filename,
        image.title,
        image.description || null,
        image.tags ? JSON.stringify(image.tags) : null,
        image.createdAt,
        image.updatedAt,
        image.projectId || 'default',
        image.fileSize || null,
        image.dimensions?.width || null,
        image.dimensions?.height || null,
        image.metadata ? JSON.stringify(image.metadata) : null
      );

      return true;
    } catch (error) {
      console.error('Error saving image to database:', error);
      return false;
    }
  }

  /**
   * Get image by ID
   */
  async getImage(id: string): Promise<ImageMetadata | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM images WHERE id = ?');
      const result = stmt.get(id) as Record<string, unknown> | undefined;
      
      return result ? convertToImageMetadata(result) : null;
    } catch (error) {
      console.error('Error getting image from database:', error);
      return null;
    }
  }

  /**
   * Get all images for a project (excludes hidden images)
   */
  async getImages(projectId: string = 'default'): Promise<ImageMetadata[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM images 
        WHERE project_id = ? AND hidden = 0
        ORDER BY created_at DESC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToImageMetadata);
    } catch (error) {
      console.error('Error getting images from database:', error);
      return [];
    }
  }

  /**
   * Get ALL images for a project (including hidden images)
   * Used by frontend to load complete image state
   */
  async getAllImages(projectId: string = 'default'): Promise<ImageMetadata[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM images 
        WHERE project_id = ?
        ORDER BY created_at DESC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToImageMetadata);
    } catch (error) {
      console.error('Error getting all images from database:', error);
      return [];
    }
  }

  /**
   * Get only hidden images for a project
   */
  async getHiddenImages(projectId: string = 'default'): Promise<ImageMetadata[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM images 
        WHERE project_id = ? AND hidden = 1
        ORDER BY created_at DESC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToImageMetadata);
    } catch (error) {
      console.error('Error getting hidden images from database:', error);
      return [];
    }
  }

  /**
   * Delete image from database
   */
  async deleteImage(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM images WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting image from database:', error);
      return false;
    }
  }

  // ===== VIDEO OPERATIONS =====

  /**
   * Save video metadata to database
   */
  async saveVideo(video: VideoMetadata): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO videos (
          id, filename, title, description, tags, created_at, updated_at,
          project_id, file_size, metadata, hidden, timeline_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
      `);

      // Include dimensions and thumbnailPath in metadata instead of separate columns
      const enhancedMetadata = {
        ...video.metadata,
        width: video.width,
        height: video.height,
        duration: video.duration,
        thumbnailPath: video.thumbnailPath
      };

      stmt.run(
        video.id,
        video.filename,
        video.title,
        video.description || null,
        video.tags ? JSON.stringify(video.tags) : null,
        video.createdAt,
        video.updatedAt,
        video.projectId || 'default',
        video.fileSize,
        enhancedMetadata ? JSON.stringify(enhancedMetadata) : null
      );

      return true;
    } catch (error) {
      console.error('Error saving video to database:', error);
      return false;
    }
  }

  /**
   * Extract video metadata (dimensions and duration) from various API formats
   */
  private extractVideoMetadata(metadata?: Record<string, unknown>): {
    width?: number;
    height?: number;
    duration?: number;
  } {
    if (!metadata) return {};

    const result: { width?: number; height?: number; duration?: number } = {};

    // Try direct width/height properties
    if (typeof metadata.width === 'number') result.width = metadata.width;
    if (typeof metadata.height === 'number') result.height = metadata.height;
    if (typeof metadata.duration === 'number') result.duration = metadata.duration;

    // Try API response video object
    const apiResponse = metadata.api_response as Record<string, unknown>;
    if (apiResponse?.video && typeof apiResponse.video === 'object') {
      const video = apiResponse.video as Record<string, unknown>;
      if (typeof video.width === 'number') result.width = video.width;
      if (typeof video.height === 'number') result.height = video.height;
      if (typeof video.duration === 'number') result.duration = video.duration;
    }

    // Try generation parameters
    const generationParams = metadata.generationParams as Record<string, unknown>;
    if (generationParams) {
      if (typeof generationParams.width === 'number') result.width = generationParams.width;
      if (typeof generationParams.height === 'number') result.height = generationParams.height;
      if (typeof generationParams.duration === 'number') result.duration = generationParams.duration;
    }

    // Infer from aspect ratio if dimensions not found
    if (!result.width || !result.height) {
      const aspectRatio = metadata.aspect_ratio as string || generationParams?.aspect_ratio as string;
      if (aspectRatio) {
        const inferred = this.inferDimensionsFromAspectRatio(aspectRatio);
        if (inferred) {
          result.width = result.width || inferred.width;
          result.height = result.height || inferred.height;
        }
      }
    }

    return result;
  }

  /**
   * Infer dimensions from aspect ratio string
   */
  private inferDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } | null {
    switch (aspectRatio) {
      case '16:9': return { width: 1920, height: 1080 };
      case '9:16': return { width: 1080, height: 1920 };
      case '1:1': return { width: 1080, height: 1080 };
      case '4:5': return { width: 1080, height: 1350 };
      case '3:4': return { width: 1080, height: 1440 };
      case '4:3': return { width: 1440, height: 1080 };
      default: return null;
    }
  }

  /**
   * Get video by ID
   */
  async getVideo(id: string): Promise<VideoMetadata | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM videos WHERE id = ?');
      const result = stmt.get(id) as Record<string, unknown> | undefined;
      
      return result ? convertToVideoMetadata(result) : null;
    } catch (error) {
      console.error('Error getting video from database:', error);
      return null;
    }
  }

  /**
   * Get all videos for a project (excludes hidden videos)
   */
  async getVideos(projectId: string = 'default'): Promise<VideoMetadata[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM videos 
        WHERE project_id = ? AND hidden = 0
        ORDER BY created_at DESC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToVideoMetadata);
    } catch (error) {
      console.error('Error getting videos from database:', error);
      return [];
    }
  }

  /**
   * Get ALL videos for a project (including hidden videos)
   * Used by frontend to load complete video state
   */
  async getAllVideos(projectId: string = 'default'): Promise<VideoMetadata[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM videos 
        WHERE project_id = ?
        ORDER BY created_at DESC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToVideoMetadata);
    } catch (error) {
      console.error('Error getting all videos from database:', error);
      return [];
    }
  }

  /**
   * Get only hidden videos for a project
   */
  async getHiddenVideos(projectId: string = 'default'): Promise<VideoMetadata[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM videos 
        WHERE project_id = ? AND hidden = 1
        ORDER BY created_at DESC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToVideoMetadata);
    } catch (error) {
      console.error('Error getting hidden videos from database:', error);
      return [];
    }
  }

  /**
   * Delete video from database
   */
  async deleteVideo(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM videos WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting video from database:', error);
      return false;
    }
  }

  // ===== CHARACTER OPERATIONS =====

  /**
   * Save character to database
   */
  async saveCharacter(character: Character): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO characters (
          id, name, project_id, age, gender, race, height, hair_color, eye_color,
          physical_appearance, outfits, default_outfit, background, profession,
          case_details, scene_of_crime, tags, notes, created_at, updated_at,
          age_active, gender_active, race_active, height_active, hair_color_active,
          eye_color_active, physical_appearance_active, profession_active,
          background_active, case_details_active, scene_of_crime_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        character.id,
        character.name,
        character.projectId,
        character.age,
        character.gender,
        character.race,
        character.height,
        character.hairColor,
        character.eyeColor,
        character.physicalAppearance,
        JSON.stringify(character.outfits),
        character.defaultOutfit || 0,
        character.background,
        character.profession || null,
        character.caseDetails || null,
        character.sceneOfCrime || null,
        character.tags ? JSON.stringify(character.tags) : null,
        character.notes || null,
        character.createdAt,
        character.updatedAt,
        1, // age_active - default to true
        1, // gender_active - default to true
        1, // race_active - default to true
        1, // height_active - default to true
        1, // hair_color_active - default to true
        1, // eye_color_active - default to true
        1, // physical_appearance_active - default to true
        1, // profession_active - default to true
        1, // background_active - default to true
        1, // case_details_active - default to true
        1  // scene_of_crime_active - default to true
      );

      return true;
    } catch (error) {
      console.error('Error saving character to database:', error);
      console.error('Character data that failed:', JSON.stringify(character, null, 2));
      console.error('Error details:', error);
      return false;
    }
  }

  /**
   * Get character by ID
   */
  async getCharacter(id: string): Promise<Character | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM characters WHERE id = ?');
      const result = stmt.get(id) as Record<string, unknown> | undefined;
      
      return result ? convertToCharacter(result) : null;
    } catch (error) {
      console.error('Error getting character from database:', error);
      return null;
    }
  }

  /**
   * Get all characters for a project
   */
  async getCharacters(projectId: string): Promise<Character[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM characters 
        WHERE project_id = ? 
        ORDER BY name ASC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToCharacter);
    } catch (error) {
      console.error('Error getting characters from database:', error);
      return [];
    }
  }

  /**
   * Get character by name (for prompt generation)
   */
  async getCharacterByName(name: string, projectId: string): Promise<Character | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM characters WHERE name = ? AND project_id = ?');
      const result = stmt.get(name, projectId) as Record<string, unknown> | undefined;
      
      return result ? convertToCharacter(result) : null;
    } catch (error) {
      console.error('Error getting character by name from database:', error);
      return null;
    }
  }

  /**
   * Delete character from database
   */
  async deleteCharacter(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM characters WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting character from database:', error);
      return false;
    }
  }

  // ===== SCENE OPERATIONS =====

  /**
   * Save scene to database
   */
  async saveScene(scene: Scene): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO scenes (
          id, name, project_id, setting, time_of_day, lighting, mood, camera_angle,
          description, props, atmosphere, character_ids, tags, notes, created_at, updated_at,
          setting_active, time_of_day_active, lighting_active, mood_active, camera_angle_active,
          props_active, atmosphere_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        scene.id,
        scene.name,
        scene.projectId,
        scene.setting,
        scene.timeOfDay,
        scene.lighting,
        scene.mood,
        scene.cameraAngle,
        scene.description,
        scene.props ? JSON.stringify(scene.props) : null,
        scene.atmosphere || null,
        JSON.stringify(scene.characterIds),
        scene.tags ? JSON.stringify(scene.tags) : null,
        scene.notes || null,
        scene.createdAt,
        scene.updatedAt,
        1, // setting_active - default to true
        1, // time_of_day_active - default to true
        1, // lighting_active - default to true
        1, // mood_active - default to true
        1, // camera_angle_active - default to true
        1, // props_active - default to true
        1  // atmosphere_active - default to true
      );

      return true;
    } catch (error) {
      console.error('Error saving scene to database:', error);
      return false;
    }
  }

  /**
   * Get scene by ID
   */
  async getScene(id: string): Promise<Scene | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM scenes WHERE id = ?');
      const result = stmt.get(id) as Record<string, unknown> | undefined;
      
      return result ? convertToScene(result) : null;
    } catch (error) {
      console.error('Error getting scene from database:', error);
      return null;
    }
  }

  /**
   * Get all scenes for a project
   */
  async getScenes(projectId: string): Promise<Scene[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM scenes 
        WHERE project_id = ? 
        ORDER BY name ASC
      `);
      const results = stmt.all(projectId) as Record<string, unknown>[];
      
      return results.map(convertToScene);
    } catch (error) {
      console.error('Error getting scenes from database:', error);
      return [];
    }
  }

  /**
   * Get scene by name (for prompt generation)
   */
  async getSceneByName(name: string, projectId: string): Promise<Scene | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM scenes WHERE name = ? AND project_id = ?');
      const result = stmt.get(name, projectId) as Record<string, unknown> | undefined;
      
      return result ? convertToScene(result) : null;
    } catch (error) {
      console.error('Error getting scene by name from database:', error);
      return null;
    }
  }

  /**
   * Delete scene from database
   */
  async deleteScene(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM scenes WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting scene from database:', error);
      return false;
    }
  }

  // ===== PROJECT OPERATIONS =====

  /**
   * Save project to database
   */
  async saveProject(project: { id: string; name: string; description?: string; settings?: Record<string, unknown>; created_at: string; updated_at: string }): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO projects (
          id, name, description, settings, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        project.id,
        project.name,
        project.description || null,
        project.settings ? JSON.stringify(project.settings) : null,
        project.created_at,
        project.updated_at
      );

      return true;
    } catch (error) {
      console.error('Error saving project to database:', error);
      return false;
    }
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<{ id: string; name: string; description?: string; settings?: Record<string, unknown>; created_at: string; updated_at: string } | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
      const result = stmt.get(id) as Record<string, unknown>;
      
      if (!result) return null;

      return {
        id: String(result.id),
        name: String(result.name),
        description: result.description ? String(result.description) : undefined,
        created_at: String(result.created_at),
        updated_at: String(result.updated_at),
        settings: result.settings ? JSON.parse(String(result.settings)) : undefined
      };
    } catch (error) {
      console.error('Error getting project from database:', error);
      return null;
    }
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<{ id: string; name: string; description?: string; settings?: Record<string, unknown>; created_at: string; updated_at: string }[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
      const results = stmt.all() as Record<string, unknown>[];
      
      return results.map(project => ({
        id: String(project.id),
        name: String(project.name),
        description: project.description ? String(project.description) : undefined,
        created_at: String(project.created_at),
        updated_at: String(project.updated_at),
        settings: project.settings ? JSON.parse(String(project.settings)) : undefined
      }));
    } catch (error) {
      console.error('Error getting projects from database:', error);
      return [];
    }
  }

  /**
   * Delete project from database
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting project from database:', error);
      return false;
    }
  }

  // ===== TIMELINE OPERATIONS =====

  /**
   * Save timeline configuration
   */
  async saveTimelineConfig(projectId: string, config: Record<string, unknown>): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO timeline_configs (project_id, config, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(projectId, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Error saving timeline config to database:', error);
      return false;
    }
  }

  /**
   * Get timeline configuration for project
   */
  async getTimelineConfig(projectId: string): Promise<Record<string, unknown> | null> {
    try {
      const stmt = this.db.prepare('SELECT config FROM timeline_configs WHERE project_id = ?');
      const result = stmt.get(projectId) as Record<string, unknown> | undefined;
      
      return result ? JSON.parse(String(result.config)) : null;
    } catch (error) {
      console.error('Error getting timeline config from database:', error);
      return null;
    }
  }

  /**
   * Update timeline order for images/videos
   */
  async updateTimelineOrder(items: { id: string; order: number; type: 'image' | 'video' }[]): Promise<boolean> {
    try {
      const imageStmt = this.db.prepare('UPDATE images SET timeline_order = ? WHERE id = ?');
      const videoStmt = this.db.prepare('UPDATE videos SET timeline_order = ? WHERE id = ?');

      for (const item of items) {
        if (item.type === 'image') {
          imageStmt.run(item.order, item.id);
        } else {
          videoStmt.run(item.order, item.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating timeline order in database:', error);
      return false;
    }
  }

  /**
   * Append a single item to the end of the timeline (images + videos unified order)
   */
  async appendToTimeline(itemId: string, type: 'image' | 'video'): Promise<boolean> {
    try {
      // Compute the current max timeline order across images and videos
      const maxQuery = `
        SELECT MAX(timeline_order) as max_order FROM (
          SELECT timeline_order FROM images
          UNION ALL
          SELECT timeline_order FROM videos
        )
      `;
      const row = this.db.prepare(maxQuery).get() as { max_order?: number } | undefined;
      const nextOrder = ((row?.max_order ?? 0) as number) + 1;

      if (type === 'image') {
        const stmt = this.db.prepare('UPDATE images SET timeline_order = ? WHERE id = ?');
        stmt.run(nextOrder, itemId);
      } else {
        const stmt = this.db.prepare('UPDATE videos SET timeline_order = ? WHERE id = ?');
        stmt.run(nextOrder, itemId);
      }

      return true;
    } catch (error) {
      console.error('Error appending item to timeline:', error);
      return false;
    }
  }

  /**
   * Get recent images for a project with optional limit/offset (excludes hidden)
   */
  async getRecentImages(projectId: string = 'default', limit?: number, offset?: number): Promise<ImageMetadata[]> {
    try {
      let sql = `SELECT * FROM images WHERE project_id = ? AND hidden = 0 ORDER BY created_at DESC`;
      const params: (string | number)[] = [projectId];

      if (limit !== undefined) {
        sql += ` LIMIT ?`;
        params.push(limit);
      }
      if (offset !== undefined) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }

      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params) as Record<string, unknown>[];
      return results.map(convertToImageMetadata);
    } catch (error) {
      console.error('Error getting recent images from database:', error);
      return [];
    }
  }

  /**
   * Get recent videos for a project with optional limit/offset (excludes hidden)
   */
  async getRecentVideos(projectId: string = 'default', limit?: number, offset?: number): Promise<VideoMetadata[]> {
    try {
      let sql = `SELECT * FROM videos WHERE project_id = ? AND hidden = 0 ORDER BY created_at DESC`;
      const params: (string | number)[] = [projectId];

      if (limit !== undefined) {
        sql += ` LIMIT ?`;
        params.push(limit);
      }
      if (offset !== undefined) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }

      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params) as Record<string, unknown>[];
      return results.map(convertToVideoMetadata);
    } catch (error) {
      console.error('Error getting recent videos from database:', error);
      return [];
    }
  }

  /**
   * Get all timeline items (images + videos) with full details, sorted by timeline_order.
   * Parses prompt fields out of the metadata JSON for easy access.
   */
  async getTimelineItemsWithDetails(projectId: string): Promise<Array<{
    id: string;
    type: 'image' | 'video';
    title: string;
    filename: string;
    local_path: string;
    timeline_order: number;
    created_at: string;
    prompt?: string;
    user_prompt?: string;
    character_name?: string;
    scene_name?: string;
    model?: string;
    image_size?: string;
    loras?: unknown[];
    metadata?: Record<string, unknown>;
  }>> {
    try {
      const imgStmt = this.db.prepare(`
        SELECT id, filename, title, created_at, timeline_order, metadata
        FROM images
        WHERE project_id = ? AND timeline_order IS NOT NULL AND hidden = 0
      `);
      const vidStmt = this.db.prepare(`
        SELECT id, filename, title, created_at, timeline_order, metadata
        FROM videos
        WHERE project_id = ? AND timeline_order IS NOT NULL AND hidden = 0
      `);

      const images = (imgStmt.all(projectId) as Record<string, unknown>[]).map(row => ({
        ...row,
        type: 'image' as const,
      }));
      const videos = (vidStmt.all(projectId) as Record<string, unknown>[]).map(row => ({
        ...row,
        type: 'video' as const,
      }));

      const all = [...images, ...videos].sort(
        (a, b) => Number(a.timeline_order) - Number(b.timeline_order)
      );

      return all.map(row => {
        const meta = row.metadata ? JSON.parse(String(row.metadata)) : {};
        const fname = String(row.filename);
        const localPath = row.type === 'image'
          ? `public/images/${fname}`
          : `public/videos/clips/${fname}`;
        return {
          id: String(row.id),
          type: row.type,
          title: String(row.title),
          filename: fname,
          local_path: localPath,
          timeline_order: Number(row.timeline_order),
          created_at: String(row.created_at),
          prompt: meta.prompt ?? undefined,
          user_prompt: meta.user_prompt ?? undefined,
          character_name: meta.character_name ?? undefined,
          scene_name: meta.scene_name ?? undefined,
          model: meta.model ?? undefined,
          image_size: meta.image_size ?? undefined,
          loras: meta.loras ?? undefined,
          metadata: meta,
        };
      });
    } catch (error) {
      console.error('Error getting timeline items with details:', error);
      return [];
    }
  }

  /**
   * Update hidden state for images
   */
  async updateImageHiddenState(imageId: string, hidden: boolean): Promise<boolean> {
    try {
      const stmt = this.db.prepare('UPDATE images SET hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(hidden ? 1 : 0, imageId);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating image hidden state in database:', error);
      return false;
    }
  }

  /**
   * Update hidden state for videos
   */
  async updateVideoHiddenState(videoId: string, hidden: boolean): Promise<boolean> {
    try {
      const stmt = this.db.prepare('UPDATE videos SET hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(hidden ? 1 : 0, videoId);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating video hidden state in database:', error);
      return false;
    }
  }

  /**
   * Batch update hidden state for multiple images/videos
   */
  async batchUpdateHiddenState(items: { id: string; hidden: boolean; type: 'image' | 'video' }[]): Promise<boolean> {
    try {
      const imageStmt = this.db.prepare('UPDATE images SET hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const videoStmt = this.db.prepare('UPDATE videos SET hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

      for (const item of items) {
        const hiddenValue = item.hidden ? 1 : 0;
        if (item.type === 'image') {
          imageStmt.run(hiddenValue, item.id);
        } else {
          videoStmt.run(hiddenValue, item.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error batch updating hidden state in database:', error);
      return false;
    }
  }

  // ===== SETTINGS OPERATIONS =====

  /**
   * Save user setting
   */
  async saveSetting(key: string, value: unknown): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving setting to database:', error);
      return false;
    }
  }

  /**
   * Get user setting
   */
  async getSetting(key: string): Promise<unknown | null> {
    try {
      const stmt = this.db.prepare('SELECT value FROM user_settings WHERE key = ?');
      const result = stmt.get(key) as Record<string, unknown> | undefined;
      
      return result ? JSON.parse(String(result.value)) : null;
    } catch (error) {
      console.error('Error getting setting from database:', error);
      return null;
    }
  }

  /**
   * Delete user setting
   */
  async deleteSetting(key: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM user_settings WHERE key = ?');
      const result = stmt.run(key);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting setting from database:', error);
      return false;
    }
  }

  // ===== API CACHE OPERATIONS =====

  /**
   * Cache API response
   */
  async cacheApiResponse(endpoint: string, params: string, data: unknown, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO api_cache (endpoint, params, response_data, expires_at)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(endpoint, params, JSON.stringify(data), expiresAt);
      return true;
    } catch (error) {
      console.error('Error caching API response to database:', error);
      return false;
    }
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint: string, params: string): Promise<unknown | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT response_data FROM api_cache 
        WHERE endpoint = ? AND params = ? AND expires_at > CURRENT_TIMESTAMP
      `);
      
      const result = stmt.get(endpoint, params) as Record<string, unknown> | undefined;
      return result ? JSON.parse(String(result.response_data)) : null;
    } catch (error) {
      console.error('Error getting cached API response from database:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    try {
      const stmt = this.db.prepare('DELETE FROM api_cache WHERE expires_at <= CURRENT_TIMESTAMP');
      const result = stmt.run();
      
      return result.changes;
    } catch (error) {
      console.error('Error clearing expired cache from database:', error);
      return 0;
    }
  }

  // ===== PROMPT DEFAULTS OPERATIONS =====

  /**
   * Get prompt default value from database
   */
  async getPromptDefault(category: string, fieldName: string): Promise<string | null> {
    this.ensureServerSide();
    try {
      const stmt = this.db.prepare(`
        SELECT default_value FROM prompt_defaults 
        WHERE category = ? AND field_name = ? AND is_active = true
      `);
      const result = stmt.get(category, fieldName) as { default_value: string } | undefined;
      
      return result ? result.default_value : null;
    } catch (error) {
      console.error('Error getting prompt default from database:', error);
      return null;
    }
  }

  /**
   * Get all prompt defaults for a category
   */
  async getPromptDefaults(category: string): Promise<Record<string, string>> {
    try {
      const stmt = this.db.prepare(`
        SELECT field_name, default_value FROM prompt_defaults 
        WHERE category = ? AND is_active = true
      `);
      const results = stmt.all(category) as Array<{ field_name: string; default_value: string }>;
      
      const defaults: Record<string, string> = {};
      results.forEach(row => {
        defaults[row.field_name] = row.default_value;
      });
      
      return defaults;
    } catch (error) {
      console.error('Error getting prompt defaults from database:', error);
      return {};
    }
  }

  /**
   * Update or insert prompt default
   */
  async savePromptDefault(category: string, fieldName: string, defaultValue: string, description?: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO prompt_defaults (category, field_name, default_value, description, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(category, fieldName, defaultValue, description || null);
      return true;
    } catch (error) {
      console.error('Error saving prompt default to database:', error);
      return false;
    }
  }

  // ===== LORA OPERATIONS =====

  /**
   * Save LoRA to database
   */
  async saveLoRA(lora: { id: string; name: string; safetensorsLink?: string; civitaiLink?: string; triggerWords?: string[]; description?: string; tags?: string[] }): Promise<boolean> {
    this.ensureServerSide();
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO loras (
          id, name, safetensors_link, civitai_link, trigger_words, description, tags, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        lora.id,
        lora.name,
        lora.safetensorsLink || null,
        lora.civitaiLink || null,
        lora.triggerWords ? JSON.stringify(lora.triggerWords) : null,
        lora.description || null,
        lora.tags ? JSON.stringify(lora.tags) : null
      );

      return true;
    } catch (error) {
      console.error('Error saving LoRA to database:', error);
      return false;
    }
  }

  /**
   * Get LoRA by ID
   */
  async getLoRA(id: string): Promise<{ id: string; name: string; safetensorsLink?: string; civitaiLink?: string; triggerWords?: string[]; description?: string; tags?: string[]; createdAt: string; updatedAt: string } | null> {
    this.ensureServerSide();
    try {
      const stmt = this.db.prepare('SELECT * FROM loras WHERE id = ?');
      const result = stmt.get(id) as Record<string, unknown> | undefined;
      
      if (!result) return null;

      return {
        id: String(result.id),
        name: String(result.name),
        safetensorsLink: result.safetensors_link ? String(result.safetensors_link) : undefined,
        civitaiLink: result.civitai_link ? String(result.civitai_link) : undefined,
        triggerWords: result.trigger_words ? JSON.parse(String(result.trigger_words)) : undefined,
        description: result.description ? String(result.description) : undefined,
        tags: result.tags ? JSON.parse(String(result.tags)) : undefined,
        createdAt: String(result.created_at),
        updatedAt: String(result.updated_at)
      };
    } catch (error) {
      console.error('Error getting LoRA from database:', error);
      return null;
    }
  }

  /**
   * Get all LoRAs
   */
  async getLoRAs(): Promise<Array<{ id: string; name: string; safetensorsLink?: string; civitaiLink?: string; triggerWords?: string[]; description?: string; tags?: string[]; createdAt: string; updatedAt: string }>> {
    this.ensureServerSide();
    try {
      const stmt = this.db.prepare('SELECT * FROM loras ORDER BY name ASC');
      const results = stmt.all() as Record<string, unknown>[];
      
      return results.map(result => ({
        id: String(result.id),
        name: String(result.name),
        safetensorsLink: result.safetensors_link ? String(result.safetensors_link) : undefined,
        civitaiLink: result.civitai_link ? String(result.civitai_link) : undefined,
        triggerWords: result.trigger_words ? JSON.parse(String(result.trigger_words)) : undefined,
        description: result.description ? String(result.description) : undefined,
        tags: result.tags ? JSON.parse(String(result.tags)) : undefined,
        createdAt: String(result.created_at),
        updatedAt: String(result.updated_at)
      }));
    } catch (error) {
      console.error('Error getting LoRAs from database:', error);
      return [];
    }
  }

  /**
   * Delete LoRA by ID
   */
  async deleteLoRA(id: string): Promise<boolean> {
    this.ensureServerSide();
    try {
      const stmt = this.db.prepare('DELETE FROM loras WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting LoRA from database:', error);
      return false;
    }
  }

  // ===== UTILITY OPERATIONS =====

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    images: number;
    videos: number;
    projects: number;
    cacheEntries: number;
    loras: number;
  }> {
    try {
      const imageCount = this.db.prepare('SELECT COUNT(*) as count FROM images').get() as Record<string, unknown>;
      const videoCount = this.db.prepare('SELECT COUNT(*) as count FROM videos').get() as Record<string, unknown>;
      const projectCount = this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as Record<string, unknown>;
      const cacheCount = this.db.prepare('SELECT COUNT(*) as count FROM api_cache WHERE expires_at > CURRENT_TIMESTAMP').get() as Record<string, unknown>;
      const loraCount = this.db.prepare('SELECT COUNT(*) as count FROM loras').get() as Record<string, unknown>;

      return {
        images: Number(imageCount.count),
        videos: Number(videoCount.count),
        projects: Number(projectCount.count),
        cacheEntries: Number(cacheCount.count),
        loras: Number(loraCount.count)
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { images: 0, videos: 0, projects: 0, cacheEntries: 0, loras: 0 };
    }
  }
}

// Export singleton instance (only on server-side)
export const databaseService = typeof window === 'undefined' ? new DatabaseService() : null; 