'use client'

import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'

type DashboardTopbarProps = {
  active: string
  dark: boolean
  onMenu: () => void
  onToggleTheme: () => void
}

export default function DashboardTopbar({ active, dark, onMenu, onToggleTheme }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={onMenu} aria-label="Ouvrir le menu"><Menu size={19} /></button>
      <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><span>Workspace</span><span>/</span><b className="text-slate-900 dark:text-slate-100">{active}</b></div>
      <div className="flex items-center gap-3"><div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><Search size={16} className="text-slate-400" /><input className="bg-transparent border-none outline-none text-sm w-48 placeholder-slate-400 text-slate-900 dark:text-slate-100" placeholder="Rechercher dans Biblius…" aria-label="Rechercher" /></div><button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={onToggleTheme} aria-label="Changer de thème">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" aria-label="Notifications"><Bell size={17} /><i className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" /></button><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">MC</div></div>
    </header>
  )
}
