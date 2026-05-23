import { useToast } from '../../components/common/Toast'
import { useErrorDisplay } from '../useErrorDisplay'

export function useFinanceBase() {
  const { toast } = useToast()
  const { displayError } = useErrorDisplay()
  const handleError = (err: unknown) => toast(displayError(err), 'error')
  return { handleError }
}
