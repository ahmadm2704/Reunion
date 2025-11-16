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
      throw error;
    }

    // Check registration status - explicitly check for 'true', otherwise closed
    // If setting doesn't exist, default to open (for backward compatibility)
    const isOpen = !data ? true : data.setting_value === 'true';

    return NextResponse.json({ isOpen });
  } catch (error: any) {
    console.error('Error fetching registration status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registration status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { isOpen } = await request.json();

    if (typeof isOpen !== 'boolean') {
      return NextResponse.json(
        { error: 'isOpen must be a boolean' },
        { status: 400 }
      );
    }

    // Upsert the registration status
    const { error: upsertError } = await supabaseClient
      .from('admin_settings')
      .upsert({
        setting_key: 'registration_open',
        setting_value: isOpen.toString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key'
      });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ 
      success: true, 
      isOpen,
      message: `Registration ${isOpen ? 'opened' : 'closed'} successfully` 
    });
  } catch (error: any) {
    console.error('Error updating registration status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update registration status' },
      { status: 500 }
    );
  }
}

