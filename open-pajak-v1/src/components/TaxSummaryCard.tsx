import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../lib/format'
import { Card, CardTitle } from './ui/card'

interface TaxSummaryCardProps {
  total: number
  label?: string
  meta?: string
  terPerPeriod?: number
  decemberAdjustment?: number
  takeHomeAnnual?: number
  takeHomePerPeriod?: number
}

export function TaxSummaryCard({
  total,
  label,
  meta,
  terPerPeriod,
  decemberAdjustment,
  takeHomeAnnual,
  takeHomePerPeriod,
}: TaxSummaryCardProps) {
  const { t } = useTranslation()
  const taxLabel = label ?? t('summary.taxOverview')
  const showTakeHome =
    typeof takeHomeAnnual === 'number' || typeof takeHomePerPeriod === 'number'

  return (
    <Card className="border-[#1d1d1f] bg-[#1d1d1f] px-6 py-5 text-white">
      <div className={`grid gap-6 ${showTakeHome ? 'lg:grid-cols-2' : ''}`}>
        <div className="space-y-3">
          <CardTitle className="text-sm font-normal text-white/70">
            {taxLabel}
          </CardTitle>
          <div className="space-y-2 text-sm text-white">
            <SummaryMetric label={t('summary.totalTax')} value={total} />
            {typeof terPerPeriod === 'number' && (
              <SummaryMetric
                label={t('summary.terMonthly')}
                value={terPerPeriod}
              />
            )}
            {typeof decemberAdjustment === 'number' && (
              <SummaryMetric
                label={t('summary.decAdjustment')}
                value={decemberAdjustment}
              />
            )}
          </div>
          {meta && <p className="text-xs text-white/60">{meta}</p>}
        </div>

        {showTakeHome && (
          <div className="space-y-3">
            <CardTitle className="text-sm font-normal text-white/70">
              {t('summary.takeHome')}
            </CardTitle>
            <div className="space-y-2 text-sm text-white">
              {typeof takeHomeAnnual === 'number' && (
                <SummaryMetric
                  label={t('summary.thpAnnual')}
                  value={takeHomeAnnual}
                />
              )}
              {typeof takeHomePerPeriod === 'number' && (
                <SummaryMetric
                  label={t('summary.thpPeriod')}
                  value={takeHomePerPeriod}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t border-white/15 pt-2">
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-lg font-semibold text-white">
        {formatCurrency(value)}
      </span>
    </div>
  )
}
