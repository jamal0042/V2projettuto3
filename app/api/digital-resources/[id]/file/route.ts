import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

function contentTypeFor(resourceType: string, url: string) {
  const type = resourceType.toLowerCase()
  if (type === 'pdf') return 'application/pdf'
  if (type === 'video') return 'video/mp4'
  if (type === 'audio') return 'audio/mpeg'
  const extension = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'mp4') return 'video/mp4'
  if (extension === 'mp3') return 'audio/mpeg'
  return 'application/octet-stream'
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })

  const { data: resource, error } = await supabase.from('digital_resources').select('title, url, type, downloadable').eq('id', id).single()
  if (error || !resource) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 })

  const download = new URL(request.url).searchParams.get('download') === '1'
  if (download && !resource.downloadable) return NextResponse.json({ error: 'Le téléchargement est désactivé pour cette ressource.' }, { status: 403 })

  let sourceUrl: URL
  try {
    sourceUrl = new URL(resource.url)
    if (!['http:', 'https:'].includes(sourceUrl.protocol)) throw new Error('Unsupported protocol')
  } catch {
    return NextResponse.json({ error: 'URL de ressource invalide.' }, { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(sourceUrl, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000) })
  } catch (err) {
    const reason = err instanceof Error && err.name === 'TimeoutError' ? 'Le fichier distant a mis trop de temps à répondre.' : 'Impossible d’atteindre le fichier distant.'
    return NextResponse.json({ error: reason }, { status: 504 })
  }
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'Le fichier distant est indisponible.' }, { status: 502 })

  const headers = new Headers()
  headers.set('Content-Type', contentTypeFor(resource.type, resource.url))
  headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${resource.title.replace(/[^a-z0-9-_]/gi, '_')}.${resource.type === 'pdf' ? 'pdf' : 'bin'}"`)
  headers.set('Cache-Control', 'private, no-store')
  return new NextResponse(upstream.body, { status: 200, headers })
}
