export function cn(...inputs: unknown[]): string {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ')
}

export { formatDate, formatDateTime } from '@/utils/date'
