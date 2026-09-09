import type { Metadata } from 'next'
import AuthForm from './auth-form'

export const metadata: Metadata = {
  title: 'Connexion — Biblius',
  description: 'Accédez à votre espace de gestion Biblius.',
}

export default function AuthPage() {
  return <AuthForm />
}