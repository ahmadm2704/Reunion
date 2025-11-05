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

    // Fetch all registrations efficiently
    // Use larger batch size and fetch sequentially without expensive count checks
    let allData: any[] = [];
    const batchSize = 5000; // Larger batch for better performance
    let from = 0;
    let hasMore = true;

    // Fetch all data in efficient batches
    while (hasMore) {
      const { data, error } = await supabaseClient
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

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

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        // If we got fewer records than batch size, we've reached the end
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
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


