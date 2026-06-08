import i18n from '../../i18n/config'
import { PPN_RATES_PER_YEAR, RATE_SCALE } from './constants'
import { applyRate, rateBpsToPercent } from './utils'
import type { TaxResult } from './types'

export type PpnTransactionType = 'standard' | 'luxury'

export interface PpnInput {
  taxYear: string
  basePrice: number
  discount: number
  otherCosts: number
  transactionType?: PpnTransactionType
  customRate?: number
  includePpn: boolean
}

type DppRatio = {
  numerator: number
  denominator: number
}

const FULL_DPP_RATIO: DppRatio = { numerator: 1, denominator: 1 }
const PMK_131_STANDARD_DPP_RATIO: DppRatio = { numerator: 11, denominator: 12 }
const PMK_131_YEAR = '2025'

function isPmk131NilaiLain(
  taxYear: string,
  transactionType: PpnTransactionType,
  hasCustomRate: boolean,
) {
  return (
    taxYear === PMK_131_YEAR && transactionType === 'standard' && !hasCustomRate
  )
}

function multiplyByRatio(amount: number, ratio: DppRatio) {
  const denominator = BigInt(ratio.denominator)
  const numerator = BigInt(Math.round(amount)) * BigInt(ratio.numerator)
  return Number((numerator + denominator / 2n) / denominator)
}

function applyRatioToRate(rateBps: number, ratio: DppRatio) {
  return Math.round((rateBps * ratio.numerator) / ratio.denominator)
}

function backOutTransactionValue(total: number, effectiveRateBps: number) {
  const denominator = BigInt(RATE_SCALE + effectiveRateBps)
  const numerator = BigInt(Math.round(total)) * BigInt(RATE_SCALE)
  return Number((numerator + denominator / 2n) / denominator)
}

export function calculatePpn({
  taxYear,
  basePrice,
  discount,
  otherCosts,
  transactionType = 'standard',
  customRate,
  includePpn,
}: PpnInput): TaxResult {
  const t = (
    key: string,
    fallback: string,
    options?: Record<string, unknown>,
  ) => i18n.t(key, { defaultValue: fallback, ...options })
  const customRateValue = customRate ?? 0
  const hasCustomRate = customRateValue > 0
  const rateBps = hasCustomRate
    ? Math.round(customRateValue * 100)
    : (PPN_RATES_PER_YEAR[taxYear] ?? PPN_RATES_PER_YEAR['2024'])
  const rateDecimal = rateBpsToPercent(rateBps)
  const grossBase = Math.max(0, basePrice - discount + otherCosts)
  const dppRatio = isPmk131NilaiLain(taxYear, transactionType, hasCustomRate)
    ? PMK_131_STANDARD_DPP_RATIO
    : FULL_DPP_RATIO
  const usesDppNilaiLain = dppRatio !== FULL_DPP_RATIO
  const effectiveRateBps = applyRatioToRate(rateBps, dppRatio)
  const effectiveRateDecimal = rateBpsToPercent(effectiveRateBps)

  let transactionValue: number
  let dppPpn: number
  let ppn: number
  if (includePpn) {
    transactionValue = backOutTransactionValue(grossBase, effectiveRateBps)
    dppPpn = multiplyByRatio(transactionValue, dppRatio)
    ppn = grossBase - transactionValue
  } else {
    transactionValue = grossBase
    dppPpn = multiplyByRatio(transactionValue, dppRatio)
    ppn = applyRate(dppPpn, rateBps)
  }

  const baseBreakdown = usesDppNilaiLain
    ? [
        {
          label: t('ppnCalc.breakdown.transactionValue', 'Nilai transaksi'),
          value: transactionValue,
          note: includePpn
            ? t(
                'ppnCalc.notes.transactionInclusive',
                'nilai transaksi sebelum PPN dari harga termasuk PPN',
              )
            : t(
                'ppnCalc.notes.transactionExclusive',
                'harga jual/penggantian/nilai impor sebelum PPN',
              ),
        },
        {
          label: t('ppnCalc.breakdown.dppNilaiLain', 'DPP Nilai Lain'),
          value: dppPpn,
          note: t(
            'ppnCalc.notes.dppNilaiLain',
            'PMK 131/2024: 11/12 x nilai transaksi',
          ),
          variant: 'subtotal' as const,
        },
      ]
    : [
        {
          label: t('ppnCalc.breakdown.dpp', 'DPP'),
          value: dppPpn,
          note: includePpn
            ? t('ppnCalc.notes.dppInclusive', 'harga termasuk PPN')
            : t('ppnCalc.notes.dppExclusive', 'harga sebelum PPN'),
          variant: 'subtotal' as const,
        },
      ]

  return {
    totalTax: ppn,
    breakdown: [
      {
        label: t('ppnCalc.breakdown.baseSection', 'Dasar Pengenaan'),
        variant: 'section',
      },
      ...baseBreakdown,
      {
        label: t('ppnCalc.breakdown.taxSection', 'Perhitungan PPN'),
        variant: 'section',
      },
      {
        label: t('ppnCalc.breakdown.rate', 'Tarif PPN'),
        value: rateDecimal,
        valueType: 'percent',
        note: usesDppNilaiLain
          ? t('ppnCalc.notes.statutoryRate', 'tarif dikalikan DPP Nilai Lain')
          : undefined,
      },
      ...(usesDppNilaiLain
        ? [
            {
              label: t('ppnCalc.breakdown.effectiveRate', 'Tarif efektif'),
              value: effectiveRateDecimal,
              valueType: 'percent' as const,
              note: t('ppnCalc.notes.effectiveRate', '12% x 11/12'),
            },
          ]
        : []),
      { label: t('ppnCalc.breakdown.tax', 'PPN terutang'), value: ppn },
      {
        label: t('ppnCalc.breakdown.total', 'Total tagihan'),
        value: transactionValue + ppn,
        variant: 'total',
      },
    ],
  }
}
