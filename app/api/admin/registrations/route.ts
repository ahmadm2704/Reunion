import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Use service role key if available, otherwise use anon key
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    // Fetch all registrations without pagination limit
    // Supabase default limit is 1000, so we'll fetch in batches if needed
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error, count } = await supabaseClient
        .from('registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Supabase error fetching registrations:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch registrations' },
          { 
            status: 500,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
          }
        );
      }

      if (data) {
        allData = [...allData, ...data];
        console.log(`Fetched ${data.length} registrations (total: ${allData.length})`);
      }

      // Check if we've fetched all records
      // Stop if we got fewer records than pageSize, or if we've fetched all records according to count
      if (!data || data.length === 0 || data.length < pageSize) {
        hasMore = false;
      } else if (count !== null && allData.length >= count) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    console.log(`Total registrations fetched: ${allData.length}`);

    return NextResponse.json(
      { data: allData || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }
}


