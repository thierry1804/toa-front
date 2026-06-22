interface ApiErrorBody {
  error_key?: string
  violations?: Array<{ propertyPath: string; message: string }>
}

/**
 * Extracts field errors from an Axios error response.
 * Returns { formFieldName: i18nKey } — caller is responsible for translating.
 * For API Platform violations the value is the propertyPath (e.g. "email").
 * For a single error_key the value is the error_key itself (e.g. "email_already_used").
 * Translate with: t(`errors.${value}`, value)
 */
export function parseApiFieldErrors(
  error: unknown,
  propertyToField: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  const data = (error as { response?: { data?: ApiErrorBody } })?.response?.data
  if (!data) return out

  // API Platform violations array
  if (Array.isArray(data.violations)) {
    for (const v of data.violations) {
      const field = propertyToField[v.propertyPath]
      if (field) out[field] = v.propertyPath
    }
  }

  // Single error_key → field
  if (data.error_key) {
    const field = propertyToField[data.error_key]
    if (field && !out[field]) out[field] = data.error_key
  }

  return out
}
