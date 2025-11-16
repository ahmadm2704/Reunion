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
        { status: 500 }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    // Get registration status from admin_settings
    const { data, error } = await supabaseClient
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'registration_open')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine - default to open
      console.error('Error fetching registration status:', error);
    }

    // Check registration status - explicitly check for 'true', otherwise closed
    // If setting doesn't exist, default to open (for backward compatibility)
    const isOpen = !data ? true : data.setting_value === 'true';

    return NextResponse.json(
      { isOpen },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('Error checking registration status:', error);
    // Default to open on error
    return NextResponse.json(
      { isOpen: true, error: error.message },
      { status: 500 }
    );
  }
}

