'use client'

import { ChevronDown, CircleHelp, Library, LogOut, MoreHorizontal, Settings, X } from 'lucide-react'
import type { DashboardNavGroup, MemberRole } from './dashboard-types'

type DashboardSidebarProps = {
  groups: DashboardNavGroup[]
  active: string
  open: boolean
  onNavigate: (label: string, href: string) => void
  onClose: () => void
  onLogout: () => void
  onSettings: () => void
  onHelp: () => void
  role: MemberRole
  member: { first_name: string; last_name: string; role: MemberRole } | null
}

const roleLabels: Record<MemberRole, string> = { admin: 'Administrateur', librarian: 'Bibliothécaire', teacher: 'Enseignant', student: 'Étudiant', external: 'Externe' }

export default function DashboardSidebar({ groups, active, open, onNavigate, onClose, onLogout, onSettings, onHelp, role, member }: DashboardSidebarProps) {
  const name = member ? `${member.first_name} ${member.last_name}` : 'Chargement…'
  const initials = member ? `${(member.first_name[0] || '').toUpperCase()}${(member.last_name[0] || '').toUpperCase()}` : '··'
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center"><Library size={18} strokeWidth={2.5} /></div>
          <div className="flex-1"><strong className="block text-sm">Biblius</strong><span className="text-xs text-slate-500 dark:text-slate-400">Library OS</span></div>
          <button className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={onClose} aria-label="Fermer le menu"><X size={17} /></button>
        </div>
        <div className="flex items-center gap-3 p-3 mx-4 mt-4 mb-2 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">U</div>
          <div className="flex-1 min-w-0"><b className="block text-sm truncate">Université de Lyon</b><span className="text-xs text-slate-500 dark:text-slate-400 truncate block">Bibliothèque centrale</span></div>
          <ChevronDown size={15} className="text-slate-400" />
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6" aria-label="Navigation principale">
          {groups.map((group) => <div key={group.label} className="space-y-1"><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 block">{group.label}</span>{group.items.map((item) => { const Icon = item.icon; return <button key={item.label} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${active === item.label ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => onNavigate(item.label, item.href)}><Icon size={16} /><span>{item.label}</span></button> })}</div>)}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button onClick={onSettings} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><Settings size={16} /><span>Paramètres</span></button>
          <button onClick={onHelp} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><CircleHelp size={16} /><span>Centre d&apos;aide</span></button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"><LogOut size={16} /><span>Se déconnecter</span></button>
          <div className="flex items-center gap-3 p-2 mt-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">{initials}</div><div className="flex-1 min-w-0"><b className="block text-sm truncate">{name}</b><span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{roleLabels[role]}</span></div><MoreHorizontal size={16} className="text-slate-400" /></div>
        </div>
      </aside>
    </>
  )
}
