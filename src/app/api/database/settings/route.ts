import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

/**
 * User Settings API for SQLite database
 * Handles all user preferences and application settings
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const keys = searchParams.get('keys'); // Comma-separated list of keys

    if (key) {
      // Get single setting
      const value = await databaseService.getSetting(key);
      
      if (value === null) {
        return NextResponse.json({
          success: false,
          error: 'Setting not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: { key, value }
      });
    } else if (keys) {
      // Get multiple settings
      const keyList = keys.split(',').map(k => k.trim());
      const settings: Record<string, unknown> = {};
      
      for (const settingKey of keyList) {
        const value = await databaseService.getSetting(settingKey);
        if (value !== null) {
          settings[settingKey] = value;
        }
      }

      return NextResponse.json({
        success: true,
        data: settings,
        message: `Retrieved ${Object.keys(settings).length} settings`
      });
    } else {
      // For security reasons, we don't allow getting ALL settings
      // Instead, suggest using specific keys
      return NextResponse.json({
        success: false,
        error: 'Please specify setting key(s) to retrieve',
        usage: {
          singleSetting: '?key=settingName',
          multipleSettings: '?keys=setting1,setting2,setting3'
        }
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in settings API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting, settings } = body;

    if (setting) {
      // Save single setting
      const { key, value } = setting;
      
      if (!key || typeof key !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'Setting key is required and must be a string'
        }, { status: 400 });
      }

      const success = await databaseService.saveSetting(key, value);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to save setting'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Setting saved successfully',
        data: { key, value }
      });
    } else if (settings && typeof settings === 'object') {
      // Save multiple settings
      let savedCount = 0;
      const errors: string[] = [];

      for (const [key, value] of Object.entries(settings)) {
        if (typeof key !== 'string') {
          errors.push(`Invalid key type: ${key}`);
          continue;
        }

        const success = await databaseService.saveSetting(key, value);
        if (success) {
          savedCount++;
        } else {
          errors.push(`Failed to save setting: ${key}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${savedCount} settings`,
        savedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected setting object or settings object',
        usage: {
          singleSetting: '{ "setting": { "key": "settingName", "value": "settingValue" } }',
          multipleSettings: '{ "settings": { "key1": "value1", "key2": "value2" } }'
        }
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Setting key is required'
      }, { status: 400 });
    }

    // Check if setting exists
    const existingValue = await databaseService.getSetting(key);
    if (existingValue === null) {
      return NextResponse.json({
        success: false,
        error: 'Setting not found'
      }, { status: 404 });
    }

    // Note: We need to add a deleteSetting method to the database service
    const success = await databaseService.deleteSetting(key);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete setting'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 