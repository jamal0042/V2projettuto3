import DataPage from '@/components/dashboard/data-page'
import Link from 'next/link'

export default function ExemplairesPage() {
	return <><div className="fixed right-8 top-20 z-10"><Link href="/dashboard/exemplaires/ajouter" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Ajouter un exemplaire</Link></div><DataPage resource="exemplaires" /></>
}
