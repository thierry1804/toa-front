import { forwardRef, type InputHTMLAttributes } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    return (
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
          {...props}
        />
        <div>
          {label && <span className="text-sm text-gray-700">{label}</span>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
