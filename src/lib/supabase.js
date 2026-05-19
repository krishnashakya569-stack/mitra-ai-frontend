import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? 'Supabase URL or anon key is missing.'
  : !isValidSupabaseUrl(supabaseUrl)
    ? 'Supabase URL must look like https://your-project-id.supabase.co'
    : ''

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)
