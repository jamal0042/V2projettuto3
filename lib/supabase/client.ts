import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        'Supabase : variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes. Ajoutez-les à la plateforme de déploiement (Vercel) ou au fichier .env local.'
      )
    }
    // Client factice : évite le crash « URL and API key are required »
    // et laisse les pages afficher leurs états vides.
    return createBrowserClient('http://localhost:54321', 'missing-anon-key')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}