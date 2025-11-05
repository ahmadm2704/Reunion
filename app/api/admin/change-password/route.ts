import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Get current password from database or fallback to env
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
        // If table doesn't exist, fall back to env variable
        console.log('Admin settings table not found, using env variable');
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

    // Verify current password
    if (currentPassword !== adminPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password in database (only if Supabase is configured)
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { error: updateError } = await supabaseAdmin
          .from('admin_settings')
          .upsert({
            setting_key: 'admin_password',
            setting_value: newPassword,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'setting_key'
          });

        if (updateError) {
          // If update fails, still return success but note it needs manual update
          console.error('Error updating password in database:', updateError);
          return NextResponse.json({ 
            success: true,
            message: 'Password validated. Database update failed. Please update ADMIN_PASSWORD in .env.local file manually.'
          });
        }

        return NextResponse.json({ 
          success: true,
          message: 'Password changed successfully!'
        });
      } catch (dbError) {
        // Database table might not exist, return success but note manual update needed
        return NextResponse.json({ 
          success: true,
          message: 'Password validated. Please run the updated supabase-schema.sql to enable database password storage, or update ADMIN_PASSWORD in .env.local file manually.'
        });
      }
    } else {
      // No Supabase service key configured, can't update in database
      return NextResponse.json({ 
        success: true,
        message: 'Password validated. Please update ADMIN_PASSWORD in .env.local file manually (SUPABASE_SERVICE_ROLE_KEY not configured).'
      });
    }
  } catch (error: any) {
    console.error('Error in change password:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

