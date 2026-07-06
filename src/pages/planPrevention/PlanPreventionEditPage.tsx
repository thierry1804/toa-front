import { useParams } from 'react-router-dom'
import PlanPreventionCreatePage from './PlanPreventionCreatePage'

export default function PlanPreventionEditPage() {
  const { id } = useParams<{ id: string }>()
  return <PlanPreventionCreatePage mode="edit" editPlanId={id} />
}
