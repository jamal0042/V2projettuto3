import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message) return NextResponse.json({ error: 'Message vide.' }, { status: 400 })

  // Nettoyage de la clé : certains environnement stockent la valeur copiée AVEC des guillemets
  // (ex. GEMINI_API_KEY="AIza...") ce qui rend la clé invalide pour l'API Google.
  const rawKey = (process.env.GEMINI_API_KEY || '').trim()
  const apiKey = rawKey.replace(/^["']+|["']+$/g, '')
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY est absente du serveur.' }, { status: 500 })

  // Modèle Gemini actif. Surchargable via GEMINI_MODEL pour suivre les évolutions de l'API.
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

  const { data: resources } = await supabase
    .from('digital_resources')
    .select('id, title, description, type, category')
    .order('title')
    .limit(30)

  const catalog = (resources ?? [])
    .map((r) => `- "${r.title}" (${r.type}, catégorie: ${r.category ?? '—'}) [id: ${r.id}]`)
    .join('\n')

  const systemPrompt =
    'Tu es Biblius Intelligence, un assistant concis pour une bibliothèque universitaire. Réponds en français et aide à trouver des documents, comprendre les prêts et organiser le catalogue. Ne prétends jamais avoir exécuté une action si elle n\'a pas été faite.\n\n' +
    'Voici la liste des ressources numériques disponibles dans la bibliothèque :\n' +
    (catalog || 'Aucune ressource numérique disponible pour le moment.') +
    '\n\n' +
    'RÈGLE IMPORTANTE : quand tu proposes une ressource numérique pertinente pour la question de l\'utilisateur, tu dois l\'afficher sur une ligne séparée au format exact : [OUVRIR]Titre de la ressource[ID]identifiant=LETTRE[/ID][/OUVRIR]. ' +
    'Le [ID] doit contenir l\'id d\'une ressource de la liste ci-dessus (ne l\'invente jamais). ' +
    'Un seul tag [OUVRIR] par ressource proposée, placé sur sa propre ligne. ' +
    'Si l\'utilisateur demande un document qui n\'est pas dans la liste, propose ce qui s\'en rapproche ou indique qu\'il doit le consulter au format physique.'

  let response: Response
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
      }),
      signal: AbortSignal.timeout(20000),
    })
  } catch (err) {
    const reason = err instanceof Error && err.name === 'TimeoutError' ? 'Le service IA a mis trop de temps à répondre.' : 'Connexion au service IA impossible.'
    return NextResponse.json({ error: reason }, { status: 504 })
  }

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    const apiMessage = String(result?.error?.message || '')
    let friendly = 'Le service IA est indisponible.'
    if (/API key not valid/i.test(apiMessage)) {
      friendly =
        'La clé API Gemini est invalide. Régénérez une clé sur Google AI Studio (https://aistudio.google.com/apikey), puis remplacez la valeur de GEMINI_API_KEY dans les variables d’environnement (sans guillemets).'
    } else if (/model|not found|deprecated|no longer available/i.test(apiMessage)) {
      friendly = `Le modèle IA configuré n’est plus disponible. La variable GEMINI_MODEL doit pointer vers un modèle actif (actuellement « ${model} »).`
    } else if (/quota|rate limit|429|resourceExhausted/i.test(apiMessage)) {
      friendly = 'Quota de l’API Gemini dépassé. Réessayez dans quelques instants ou vérifiez votre plan de facturation.'
    } else if (apiMessage) {
      friendly = `Erreur du service IA : ${apiMessage}`
    }
    return NextResponse.json({ error: friendly }, { status: 502 })
  }
  return NextResponse.json({ answer: result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Je n\'ai pas pu générer de réponse.' })
}