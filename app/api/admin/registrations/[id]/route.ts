import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle both Promise and direct params (Next.js 14 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Get update data from request body
    const updateData = await request.json();

    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Remove id and created_at from update data (these shouldn't be updated)
    const { id: _, created_at: __, ...dataToUpdate } = updateData;

    // Validate kit_number is numeric only if it's being updated
    if (dataToUpdate.kit_number !== undefined) {
      const kitNumber = String(dataToUpdate.kit_number).trim();
      if (!kitNumber || !/^\d+$/.test(kitNumber)) {
        return NextResponse.json(
          { error: 'Kit number must contain only numbers (0-9)' },
          { status: 400 }
        );
      }
      dataToUpdate.kit_number = kitNumber;
    }

    // Use service role key if available, otherwise use anon key
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    // Check if kit_number is being updated and if it's already taken
    if (dataToUpdate.kit_number) {
      const { data: existingReg } = await supabaseClient
        .from('registrations')
        .select('id')
        .eq('kit_number', dataToUpdate.kit_number)
        .neq('id', id)
        .single();

      if (existingReg) {
        return NextResponse.json(
          { error: `Kit number ${dataToUpdate.kit_number} is already taken by another registration` },
          { status: 400 }
        );
      }
    }

    // Update the registration
    const { data, error } = await supabaseClient
      .from('registrations')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating registration:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505' || error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Kit number already exists. Please choose a different kit number.' },
          { 
            status: 400,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
          }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to update registration' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Successfully updated registration ${id}`);

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('Error updating registration:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle both Promise and direct params (Next.js 14 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Use service role key if available, otherwise use anon key
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    const { data, error } = await supabaseClient
      .from('registrations')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete registration' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    return NextResponse.json(
      { success: true, deleted: data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('Error deleting registration:', error);
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


