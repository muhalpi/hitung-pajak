import { cn } from '../lib/cn'
import { Card } from './ui/card'
import { FormulaSourceNote } from './FormulaSourceNote'
import type { ReactNode } from 'react'

interface TaxPageLayoutProps {
  title: string
  description: string
  form: ReactNode
  result: ReactNode
  summary: ReactNode
  explanation: ReactNode
  info?: ReactNode
  toolbar?: ReactNode
  footer?: ReactNode
  className?: string
}

export function TaxPageLayout({
  title,
  description,
  form,
  result,
  summary,
  explanation,
  info,
  toolbar,
  footer,
  className,
}: TaxPageLayoutProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className="text-4xl font-semibold leading-tight text-[#1d1d1f] md:text-5xl">
          {title}
        </h1>
        <p className="text-balance text-[17px] leading-relaxed text-[#6e6e73]">
          {description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0">{form}</Card>
        <div className="flex flex-col gap-6">
          {summary}
          <Card className="flex-1">{result}</Card>
        </div>
      </div>

      {toolbar && <div>{toolbar}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>{explanation}</Card>
        {info ? <Card className="bg-[#f5f5f7]">{info}</Card> : <div />}
      </div>

      <FormulaSourceNote />

      {footer && <div>{footer}</div>}
    </section>
  )
}
