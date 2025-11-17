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

// POST endpoint for admin to create new registrations (bypasses registration status check)
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

    // Get registration data from request
    const registrationData = await request.json();

    // Validate required fields
    const requiredFields = ['full_name', 'kit_number', 'email', 'whatsapp_number', 'house', 'profession', 'attend_gala', 'morale', 'excited_for_gala'];
    for (const field of requiredFields) {
      if (!registrationData[field] || registrationData[field].trim() === '') {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate kit number is numeric only
    const kitNumber = registrationData.kit_number.trim();
    if (!/^\d+$/.test(kitNumber)) {
      return NextResponse.json(
        { error: 'Kit number must contain only numbers (0-9)' },
        { status: 400 }
      );
    }

    // Check if kit number already exists
    const { data: existing, error: checkError } = await supabaseClient
      .from('registrations')
      .select('kit_number')
      .eq('kit_number', kitNumber)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check kit number availability' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: `Kit number ${kitNumber} has already been registered! Each kit number can only be registered once.` },
        { status: 400 }
      );
    }

    // Clear cache when adding new registration
    cachedData = [];
    lastFetchTime = 0;

    // Insert registration (admin can add even if registration is closed)
    const { error: insertError } = await supabaseClient
      .from('registrations')
      .insert([{
        full_name: registrationData.full_name.trim(),
        kit_number: kitNumber,
        email: registrationData.email.trim(),
        whatsapp_number: registrationData.whatsapp_number.trim(),
        car_number_plate: registrationData.car_number_plate?.trim() || 'N/A',
        house: registrationData.house,
        profession: registrationData.profession.trim(),
        postal_address: registrationData.postal_address?.trim() || '',
        attend_gala: registrationData.attend_gala,
        morale: registrationData.morale,
        excited_for_gala: registrationData.excited_for_gala,
        photo_url: registrationData.photo_url || '',
      }]);

    if (insertError) {
      if (insertError.code === '23505' || insertError.message.includes('unique')) {
        return NextResponse.json(
          { error: `Kit number ${kitNumber} has already been registered! Each kit number can only be registered once.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: insertError.message || 'Failed to create registration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate added successfully!'
    });
  } catch (error: any) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the registration' },
      { status: 500 }
    );
  }
}

// Optional: Export runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;