import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export function createCollectionHandlers(table: string) {
  async function GET(request: Request) {
    const supabase = await createClient()
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500)
    const search = url.searchParams.get('search')

    let query = (supabase as any).from(table).select('*').limit(limit)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  async function POST(request: Request) {
    const body = await request.json()
    const supabase = await createClient()
    const { data, error } = await (supabase as any).from(table).insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data }, { status: 201 })
  }

  return { GET, POST }
}

export function createItemHandlers(table: string) {
  async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const supabase = await createClient()
    const { data, error } = await (supabase as any).from(table).select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 400 })
    return NextResponse.json({ data })
  }

  async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const body = await request.json()
    const supabase = await createClient()
    const { data, error } = await (supabase as any).from(table).update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const supabase = await createClient()
    const { error } = await (supabase as any).from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return new NextResponse(null, { status: 204 })
  }

  return { GET, PATCH, DELETE }
}
