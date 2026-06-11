import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import type { SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-[12px] border border-[#d2d2d7] bg-white px-4 text-[17px] text-[#1d1d1f] transition focus-visible:border-[#0066cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066cc]/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
