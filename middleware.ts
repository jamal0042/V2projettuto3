    import { createServerClient, type CookieOptions } from '@supabase/ssr'
    import { NextResponse, type NextRequest } from 'next/server'

    export async function middleware(request: NextRequest) {
    // 1. Créer une réponse par défaut
    let response = NextResponse.next({
        request: {
        headers: request.headers,
        },
    })

    // 2. Initialiser le client Supabase avec la gestion des cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
        }
    )

    // Vérifier et rafraîchir la session une seule fois.
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        return NextResponse.redirect(url)
    }

    return response
    }

    // 5. Configuration du matcher : exclure les fichiers statiques pour les performances
    export const config = {
    matcher: [
        /*
        * Exclut les chemins suivants du middleware pour éviter les ralentissements :
        * - _next/static (fichiers statiques)
        * - _next/image (optimisation d'images)
        * - favicon.ico
        * - fichiers d'extension courante (svg, png, jpg, etc.)
        */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
    }