import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function createClient() {
  const cookieStore = await cookies()

  function build(url: string, key: string) {
    return createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Gérer le cas où les cookies sont appelés dans un Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Gérer le cas où les cookies sont appelés dans un Server Component
          }
        },
      },
    })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase : variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes dans l’environnement serveur. Ajoutez-les à la plateforme de déploiement.'
    )
    // Client factice : les requêtes renvoient des erreurs propres au lieu d’un crash 500.
    return build('http://localhost:54321', 'missing-anon-key')
  }

  return build(supabaseUrl, supabaseAnonKey)
}