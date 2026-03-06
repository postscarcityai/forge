import { NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

export async function GET() {
  try {
    // Test database connection and get stats
    const stats = await databaseService.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'SQLite database is working!',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 