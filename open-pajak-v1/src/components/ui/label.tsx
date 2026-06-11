import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import type { LabelHTMLAttributes } from 'react'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-[13px] font-semibold text-[#1d1d1f]', className)}
      {...props}
    />
  ),
)
Label.displayName = 'Label'
