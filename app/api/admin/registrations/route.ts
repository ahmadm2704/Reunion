import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache for tracking database state
let lastFetchTime = 0;
let cachedData: any[] = [];
const CACHE_DURATION = 500; // 500ms cache to avoid excessive DB hits

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    // Use service role key if available for better access
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    const now = Date.now();
    
    // Use cache if recent
    if (now - lastFetchTime < CACHE_DURATION && cachedData.length > 0) {
      console.log(`📦 Returning cached data (${cachedData.length} records)`);
      return NextResponse.json(
        { data: cachedData },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    console.log('🔄 Fetching fresh data from Supabase...');

    // Fetch all registrations in one query
    const { data, error, count } = await supabaseClient
      .from('registrations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch registrations',
          details: error 
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    const allData = data || [];
    
    // Update cache
    cachedData = allData;
    lastFetchTime = now;

    console.log(`✅ Successfully fetched ${allData.length} registrations (Total in DB: ${count})`);

    return NextResponse.json(
      { 
        data: allData,
        count: count,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }
}

// Optional: Export runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;