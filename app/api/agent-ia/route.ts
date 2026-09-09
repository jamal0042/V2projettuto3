import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message) return NextResponse.json({ error: 'Message vide.' }, { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY est absente du serveur.' }, { status: 500 })

  let response: Response
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: 'Tu es Biblius Intelligence, un assistant concis pour une bibliothèque universitaire. Réponds en français et aide à trouver des documents, comprendre les prêts et organiser le catalogue. Ne prétends jamais avoir exécuté une action si elle n’a pas été faite.' }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
      }),
      signal: AbortSignal.timeout(20000),
    })
  } catch (err) {
    const reason = err instanceof Error && err.name === 'TimeoutError' ? 'Le service IA a mis trop de temps à répondre.' : 'Connexion au service IA impossible.'
    return NextResponse.json({ error: reason }, { status: 504 })
  }

  const result = await response.json().catch(() => null)
  if (!response.ok) return NextResponse.json({ error: result?.error?.message || 'Le service IA est indisponible.' }, { status: 502 })
  return NextResponse.json({ answer: result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Je n’ai pas pu générer de réponse.' })
}
