import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  Calculator,
  Github,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { FormulaSourceNote } from '../components/FormulaSourceNote'
import type { ReactNode } from 'react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const calculatorCards = [
  {
    to: '/pph21',
    titleKey: 'home.calculatorList.cards.pph21.title',
    descKey: 'home.calculatorList.cards.pph21.description',
  },
  {
    to: '/pph22',
    titleKey: 'home.calculatorList.cards.pph22.title',
    descKey: 'home.calculatorList.cards.pph22.description',
  },
  {
    to: '/pph23',
    titleKey: 'home.calculatorList.cards.pph23.title',
    descKey: 'home.calculatorList.cards.pph23.description',
  },
  {
    to: '/pph4-2',
    titleKey: 'home.calculatorList.cards.pph4_2.title',
    descKey: 'home.calculatorList.cards.pph4_2.description',
  },
  {
    to: '/ppn',
    titleKey: 'home.calculatorList.cards.ppn.title',
    descKey: 'home.calculatorList.cards.ppn.description',
  },
  {
    to: '/ppnbm',
    titleKey: 'home.calculatorList.cards.ppnbm.title',
    descKey: 'home.calculatorList.cards.ppnbm.description',
  },
]

const GITHUB_URL = 'https://github.com/muhalpi/hitung-pajak'

function HomePage() {
  const { t } = useTranslation()
  const features = t('home.features', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <div className="space-y-10">
      <section className="rounded-[28px] bg-[#1d1d1f] px-6 py-12 text-white md:px-10 lg:px-14">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            {t('home.hero.title')}
          </h1>
          <p className="text-[19px] leading-relaxed text-white/72">
            {t('home.hero.body')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/pph21">
                {t('home.hero.ctaPrimary')}{' '}
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              size="lg"
              className="text-[#2997ff] hover:bg-white/10 hover:text-[#2997ff]"
            >
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="size-4" />
                {t('home.hero.ctaSecondary')}
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[18px] border border-white/10 bg-white/10 md:grid-cols-3">
          {features.map((feature, index) => {
            const icons = [Calculator, ShieldCheck, Sparkles]
            const Icon = icons[index] ?? Calculator
            return (
              <Highlight
                key={feature.title}
                icon={<Icon className="size-6" />}
                title={feature.title}
                description={feature.description}
              />
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[#1d1d1f]">
              {t('home.calculatorList.title')}
            </h2>
            <p className="text-[17px] text-[#6e6e73]">
              {t('home.calculatorList.subtitle')}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {calculatorCards.map((calc) => (
            <Card
              key={calc.to}
              className="p-0 transition-colors hover:border-[#0066cc]/40"
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[21px] font-semibold text-[#1d1d1f]">
                      {t(calc.titleKey)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#6e6e73]">
                      {t(calc.descKey)}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="icon">
                    <Link to={calc.to}>
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <FormulaSourceNote />
    </div>
  )
}

function Highlight({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4 bg-[#272729] p-5 text-white md:items-start">
      <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-white/10 text-white">
        <div className="flex size-full items-center justify-center">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm leading-relaxed text-white/65">{description}</p>
      </div>
    </div>
  )
}
