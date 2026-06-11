import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500'
            } ${rightElement ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
