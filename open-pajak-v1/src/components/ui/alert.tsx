import { cn } from '../../lib/cn'
import type { HTMLAttributes } from 'react'

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-[18px] border border-[#d2d2d7]/70 bg-[#f5f5f7] px-4 py-3 text-sm text-[#424245]',
        className,
      )}
      {...props}
    />
  )
}
