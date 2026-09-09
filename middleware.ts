import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Créer une réponse par défaut
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 2. Si Supabase n'est pas configurée sur ce serveur (ex. déploiement sans
  //    variables d'environnement), on laisse passer : évite un crash 500 du middleware.
  if (!supabaseUrl || !supabaseAnonKey) return response

  try {
    // 3. Initialiser le client Supabase avec la gestion des cookies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    // 4. Vérifier et rafraîchir la session une seule fois.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    // 5. Ne jamais bloquer le site si Supabase échoue côté edge.
    console.error('Middleware Supabase error:', error)
  }

  return response
}

// 6. Config du matcher : exclure les fichiers statiques pour la performance
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}