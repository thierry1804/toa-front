import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  description?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', id, required, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id ?? generatedId
    const descriptionId = `${checkboxId}-description`
    const errorId = `${checkboxId}-error`
    const describedBy = [description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined

    return (
      <div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            required={required}
            aria-required={required || undefined}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${error ? 'border-red-500' : ''} ${className}`}
            {...props}
          />
          <div>
            {label && (
              <span className="text-sm text-gray-700">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
              </span>
            )}
            {description && (
              <p id={descriptionId} className="text-xs text-gray-500">
                {description}
              </p>
            )}
          </div>
        </label>
        {error && (
          <p id={errorId} className="mt-1 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
