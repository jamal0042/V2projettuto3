'use client'

import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDDEN_PREFIXES = ['/dashboard', '/auth', '/activation']

export default function FloatingDashboardFab() {
  const pathname = usePathname() || ''
  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null

  return (
    <Link
      href="/dashboard"
      aria-label="Accéder au tableau de bord"
      className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/30 ring-1 ring-white/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/40"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-500/40" aria-hidden="true" />
      <MessageCircle size={22} strokeWidth={2.2} className="transition-transform group-hover:scale-110" />
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
        Accéder au tableau de bord
      </span>
    </Link>
  )
}