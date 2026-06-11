import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-[12px] border border-[#d2d2d7] bg-white px-4 py-2 text-[17px] text-[#1d1d1f] transition placeholder:text-[#86868b] focus-visible:border-[#0066cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066cc]/15 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
