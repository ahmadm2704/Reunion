import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // FIRST: Check if registration is open
    const { data: statusData, error: statusError } = await supabaseClient
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'registration_open')
      .maybeSingle();

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('Error checking registration status:', statusError);
      return NextResponse.json(
        { error: 'Failed to check registration status' },
        { status: 500 }
      );
    }

    // Check if registration is closed
    // If setting doesn't exist, default to open (for backward compatibility)
    // Otherwise, only open if explicitly set to 'true'
    const isOpen = !statusData ? true : statusData.setting_value === 'true';
    
    if (!isOpen) {
      return NextResponse.json(
        { error: 'Registration is currently closed. The registration period has ended.' },
        { status: 403 }
      );
    }

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

    // Insert registration
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
        { error: insertError.message || 'Failed to register' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! We look forward to seeing you at the Gala.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

