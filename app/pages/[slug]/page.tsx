import type { Metadata } from 'next'
import FooterPage from '@/components/site/footer-page'

export const metadata: Metadata = {
  title: 'Biblius — Informations',
  description: 'Informations et ressources de la plateforme Biblius.',
}

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <FooterPage slug={slug} />
}
