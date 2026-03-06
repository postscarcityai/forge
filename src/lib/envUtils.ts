/**
 * Environment Variable Utilities
 * Provides access to database-stored environment variables at runtime
 */

import { databaseService } from '@/services/databaseService';

interface EnvVars {
  [key: string]: string;
}

/**
 * Get environment variable from database storage
 * Falls back to process.env if database value not found
 */
export async function getEnvVar(key: string, projectId?: string): Promise<string | undefined> {
  try {
    // Try project-specific env vars first if projectId provided
    if (projectId) {
      const projectEnvVars = await databaseService.getSetting(`project_env_${projectId}`) as EnvVars || {};
      if (projectEnvVars[key]) {
        return projectEnvVars[key];
      }
    }

    // Try user-level env vars
    const userEnvVars = await databaseService.getSetting('env_variables') as EnvVars || {};
    if (userEnvVars[key]) {
      return userEnvVars[key];
    }

    // Fall back to process.env
    return process.env[key];
  } catch (error) {
    console.error(`Error retrieving environment variable ${key}:`, error);
    // Fall back to process.env on error
    return process.env[key];
  }
}

/**
 * Get all environment variables merged in priority order:
 * 1. Project-specific variables (if projectId provided)
 * 2. User-level variables
 * 3. Process environment variables
 */
export async function getAllEnvVars(projectId?: string): Promise<EnvVars> {
  try {
    // Start with process.env
    const envVars: EnvVars = { ...process.env } as EnvVars;

    // Overlay user-level env vars
    const userEnvVars = await databaseService.getSetting('env_variables') as EnvVars || {};
    Object.assign(envVars, userEnvVars);

    // Overlay project-specific env vars if projectId provided
    if (projectId) {
      const projectEnvVars = await databaseService.getSetting(`project_env_${projectId}`) as EnvVars || {};
      Object.assign(envVars, projectEnvVars);
    }

    return envVars;
  } catch (error) {
    console.error('Error retrieving environment variables:', error);
    return { ...process.env } as EnvVars;
  }
}

/**
 * Configure fal.ai client with database-stored credentials
 */
export async function configureFalClient(falModule: any, projectId?: string): Promise<void> {
  try {
    const falKey = await getEnvVar('FAL_KEY', projectId);
    
    if (!falKey) {
      throw new Error('FAL_KEY not found in database or environment variables');
    }

    falModule.config({
      credentials: falKey
    });

    console.log('✅ fal.ai client configured with database credentials');
  } catch (error) {
    console.error('❌ Failed to configure fal.ai client:', error);
    throw error;
  }
} 