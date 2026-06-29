import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  hint?: string
  error?: string | boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, label, hint, error, ...props }, ref) => {
    const errorMessage = typeof error === 'string' ? error : undefined
    const hasError = !!error

    const inputEl =
      leftIcon || rightIcon ? (
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              'flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              hasError && 'border-destructive focus-visible:ring-destructive',
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 flex items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {rightIcon}
            </span>
          )}
        </div>
      ) : (
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          ref={ref}
          {...props}
        />
      )

    if (label || errorMessage || hint) {
      return (
        <div className="flex flex-col gap-1.5">
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
              {props.required && <span className="ml-0.5 text-destructive">*</span>}
            </label>
          )}
          {inputEl}
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          {!errorMessage && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      )
    }

    return inputEl
  },
)
Input.displayName = 'Input'

export { Input }
