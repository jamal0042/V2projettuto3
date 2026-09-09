    import type { Metadata } from 'next'

    export const metadata: Metadata = {
    title: 'Biblius · Dashboard',
    description: 'Library OS - Gestion de bibliothèque universitaire',
    }

    export default function DashboardLayout({
    children,
    }: {
    children: React.ReactNode
    }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
        </div>
    )
    }