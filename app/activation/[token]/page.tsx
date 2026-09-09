import type { Metadata } from 'next'
import ActivationForm from './activation-form'

export const metadata: Metadata = {
  title: 'Activation du compte — Biblius',
  description: 'Définissez votre mot de passe pour activer votre compte Biblius.',
}

export default async function ActivationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <ActivationForm token={token} />
}