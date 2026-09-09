import DocumentCreateForm from '@/components/dashboard/document-create-form'
import DashboardFrame from '@/components/dashboard/dashboard-frame'

export default function AddDocumentPage() {
  return <DashboardFrame active="Documents"><DocumentCreateForm /></DashboardFrame>
}
