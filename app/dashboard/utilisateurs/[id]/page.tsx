import UserProfilePage from '@/components/users/UserProfilePage'

export default async function UserProfileRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <UserProfilePage id={id} />
}