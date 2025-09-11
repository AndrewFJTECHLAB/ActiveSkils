// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const supabase_url = process.env.SUPABASE_URL
  const supabase_key = process.env.SUPABASE_SECRET_KEY

  if (!supabase) {
    if (!supabase_url|| !supabase_key) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY are required');
    }
    supabase = createClient(supabase_url, supabase_key);
  }
  return supabase;
}
