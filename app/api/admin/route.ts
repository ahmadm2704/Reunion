import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Try to get password from database first (only if Supabase is configured)
    let storedPassword: string | null = null;
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabaseAdmin
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'admin_password')
          .single();

        if (!error && data) {
          storedPassword = data.setting_value;
        }
      } catch (error) {
        // If table doesn't exist or query fails, fall back to env variable
        console.log('Admin settings table not found or query failed, using env variable');
      }
    }

    // Fallback to environment variable if database doesn't have it
    const adminPassword = storedPassword || process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error in admin login:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

