export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Same limit as the back upload processors (10 MB).
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type UploadProblem = 'unsupportedType' | 'tooLarge'

export function checkUploadFile(file: Pick<File, 'type' | 'size'>): UploadProblem | null {
  if (!ACCEPTED_MIME.includes(file.type)) return 'unsupportedType'
  if (file.size > MAX_UPLOAD_BYTES) return 'tooLarge'
  return null
}
