import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

export interface Registration {
  id?: string;
  full_name: string;
  kit_number: string;
  email: string;
  whatsapp_number: string;
  car_number_plate: string;
  house: string;
  profession: string;
  postal_address: string;
  attend_gala: string;
  morale: string;
  excited_for_gala: string;
  photo_url: string;
  created_at?: string;
}


