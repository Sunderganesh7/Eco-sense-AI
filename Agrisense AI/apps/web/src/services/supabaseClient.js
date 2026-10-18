/**
 * Supabase Client — Used only for Google OAuth on the frontend.
 * All other database operations go through our FastAPI backend.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not set — Google login will not work')
}

let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err)
  }
}

// Fallback stub when Supabase is not configured to prevent white screen crashes
if (!supabase) {
  supabase = {
    auth: {
      signInWithOAuth: async () => ({
        error: new Error('Google OAuth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google sign-in.')
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    }
  }
}

export { supabase }

