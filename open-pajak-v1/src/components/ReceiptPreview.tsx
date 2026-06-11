import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatPercent } from '../lib/format'
import type { TFunction } from 'i18next'
import type { TaxReceiptSummary } from '../lib/storage/receipts'
import type { TaxBreakdownRow } from '../lib/tax/types'

type SnapshotValue = string | number | boolean

export interface ReceiptPreviewData {
  title: string
  summary: TaxReceiptSummary
  breakdown: Array<TaxBreakdownRow>
  identifier?: string
  groupName?: string
  createdAt?: string
  sourceLabel?: string
  locale?: string
  formSnapshot: Record<string, SnapshotValue>
}

export function ReceiptPreview({
  title,
  summary,
  breakdown,
  identifier,
  groupName,
  createdAt,
  sourceLabel,
  locale,
  formSnapshot,
}: ReceiptPreviewData) {
  const { t } = useTranslation()

  const formatter = useMemo(() => {
    if (!createdAt) return null
    try {
      return new Intl.DateTimeFormat(locale ?? 'id', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return new Intl.DateTimeFormat('id', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    }
  }, [createdAt, locale])

  const formattedDate =
    createdAt && formatter ? formatter.format(new Date(createdAt)) : null

  const summaryRows = [
    { label: t('receipts.summary.totalTax'), value: summary.totalTax },
    summary.terPerPeriod !== undefined && {
      label: t('receipts.summary.terMonthly'),
      value: summary.terPerPeriod,
    },
    summary.decemberAdjustment !== undefined && {
      label: t('receipts.summary.decAdjustment'),
      value: summary.decemberAdjustment,
    },
    summary.takeHomeAnnual !== undefined && {
      label: t('receipts.summary.thpAnnual'),
      value: summary.takeHomeAnnual,
    },
    summary.takeHomePerPeriod !== undefined && {
      label: t('receipts.summary.thpPeriod'),
      value: summary.takeHomePerPeriod,
    },
  ].filter(Boolean) as Array<{ label: string; value: number }>

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-[#d2d2d7]/70 bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-[#0066cc]">
              {t('receipts.print.title')}
            </p>
            <h3 className="text-2xl font-semibold text-[#1d1d1f]">{title}</h3>
            {sourceLabel && (
              <p className="text-xs text-[#6e6e73]">{sourceLabel}</p>
            )}
          </div>
          <div className="text-right text-xs text-[#6e6e73]">
            {identifier && (
              <p>
                {t('receipts.print.identifier')}: <strong>{identifier}</strong>
              </p>
            )}
            {groupName && (
              <p>
                {t('receipts.print.group')}: <strong>{groupName}</strong>
              </p>
            )}
            {formattedDate && (
              <p>
                {t('receipts.modal.created')}: <strong>{formattedDate}</strong>
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="rounded-[12px] border border-[#d2d2d7]/70 bg-[#f5f5f7] px-4 py-3"
            >
              <p className="text-xs font-semibold text-[#6e6e73]">
                {row.label}
              </p>
              <p className="text-lg font-semibold text-[#1d1d1f]">
                {formatCurrency(row.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[18px] border border-[#d2d2d7]/70 bg-white p-4">
        <p className="text-xs font-semibold text-[#6e6e73]">
          {t('receipts.modal.breakdownTitle')}
        </p>
        <div className="mt-3 rounded-[12px] border border-[#d2d2d7]/70">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f5f5f7] text-xs uppercase text-[#6e6e73]">
                <tr>
                  <th className="px-3 py-2 text-left">
                    {t('table.component')}
                  </th>
                  <th className="px-3 py-2 text-left">{t('table.value')}</th>
                  <th className="px-3 py-2 text-left">{t('table.note')}</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row, index) => {
                  if (row.variant === 'group') {
                    return (
                      <tr
                        key={`group-${row.label}-${index}`}
                        className="bg-[#f5f5f7] text-xs uppercase text-[#6e6e73]"
                      >
                        <td className="px-3 py-2" colSpan={3}>
                          {row.label}
                        </td>
                      </tr>
                    )
                  }
                  if (row.variant === 'section') {
                    return (
                      <tr
                        key={`section-${row.label}-${index}`}
                        className="bg-[#fafafc] font-semibold text-[#1d1d1f]"
                      >
                        <td className="px-3 py-2" colSpan={3}>
                          {row.label}
                        </td>
                      </tr>
                    )
                  }
                  if (row.variant === 'spacer') {
                    return (
                      <tr key={`spacer-${index}`}>
                        <td colSpan={3} className="py-2" />
                      </tr>
                    )
                  }
                  const value =
                    row.valueType === 'percent'
                      ? typeof row.value === 'number'
                        ? formatPercent(row.value)
                        : (row.value ?? '')
                      : typeof row.value === 'number'
                        ? formatCurrency(row.value)
                        : (row.value ?? '')
                  return (
                    <tr
                      key={`${row.label}-${index}`}
                      className="border-t border-[#d2d2d7]/60 text-[#1d1d1f]"
                    >
                      <td className="px-3 py-2 font-medium">{row.label}</td>
                      <td className="px-3 py-2 tabular-nums">{value}</td>
                      <td className="px-3 py-2 text-xs text-[#6e6e73]">
                        {row.note ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#d2d2d7]/70 bg-white p-4">
        <p className="text-xs font-semibold text-[#6e6e73]">
          {t('receipts.modal.dataTitle')}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.entries(formSnapshot).map(([key, value]) => (
            <div
              key={key}
              className="rounded-[12px] border border-[#d2d2d7]/70 bg-[#f5f5f7] px-3 py-2"
            >
              <p className="text-[11px] font-semibold text-[#6e6e73]">
                {t(`receipts.fields.${key}`, { defaultValue: key })}
              </p>
              <p className="text-sm font-medium text-[#1d1d1f]">
                {renderSnapshotValue(key, value, t)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renderSnapshotValue(key: string, value: SnapshotValue, t: TFunction) {
  if (typeof value === 'boolean') {
    return value ? t('receipts.boolean.true') : t('receipts.boolean.false')
  }
  if (typeof value === 'number') {
    if (CURRENCY_KEYS.has(key)) {
      return formatCurrency(value)
    }
    if (PERCENT_KEYS.has(key)) {
      return formatPercent(value / 100)
    }
    return value.toString()
  }
  return value
}

const CURRENCY_KEYS = new Set([
  'brutoMonthly',
  'pensionContribution',
  'bonusAnnual',
  'zakatOrDonation',
])

const PERCENT_KEYS = new Set(['foreignTaxRate'])
