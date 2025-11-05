import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { kit_number } = await request.json();

    if (!kit_number) {
      return NextResponse.json(
        { error: 'Kit number is required' },
        { status: 400 }
      );
    }

    // Validate kit number is numeric only
    const kitNumberStr = String(kit_number).trim();
    if (!/^\d+$/.test(kitNumberStr)) {
      return NextResponse.json(
        { error: 'Kit number must contain only numbers (0-9)', available: false },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('registrations')
      .select('kit_number')
      .eq('kit_number', kitNumberStr)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is what we want
      throw error;
    }

    return NextResponse.json({
      available: !data,
      message: data ? 'This kit number is already registered' : 'Kit number is available',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', available: false },
      { status: 500 }
    );
  }
}


