import { describe, expect, it } from 'vitest'
import { calculatePph21 } from './pph21'

const findValueById = (
  breakdown: ReturnType<typeof calculatePph21>['breakdown'],
  id: string,
) => breakdown.find((row) => row.id === id)?.value

describe('calculatePph21', () => {
  it('uses the annual Pasal 17 liability when TER withholding is higher', () => {
    const result = calculatePph21({
      subjectType: 'pegawai_tetap',
      brutoMonthly: 5_450_000,
      monthsPaid: 12,
      pensionContribution: 500_000,
      zakatOrDonation: 0,
      ptkpStatus: 'TK/0',
      scheme: 'ter',
      terCategory: 'A',
      bonusAnnual: 0,
      foreignTaxRate: 20,
    })

    expect(result.totalTax).toBe(106_500)
    expect(findValueById(result.breakdown, 'december_adjustment')).toBe(0)
    expect(findValueById(result.breakdown, 'take_home_annual')).toBe(65_293_500)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'Kelebihan TER',
        value: 43_375,
      }),
    )
  })

  it('applies the 50 percent DPP rule for non-employees', () => {
    const result = calculatePph21({
      subjectType: 'bukan_pegawai',
      brutoMonthly: 10_000_000,
      monthsPaid: 1,
      pensionContribution: 0,
      zakatOrDonation: 0,
      ptkpStatus: 'TK/0',
      scheme: 'lama',
      terCategory: 'A',
      bonusAnnual: 0,
      foreignTaxRate: 20,
    })

    expect(result.totalTax).toBe(250_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'DPP (50% bruto)',
        value: 5_000_000,
      }),
    )
  })

  it('supports custom PPh 26 treaty rates', () => {
    const result = calculatePph21({
      subjectType: 'wpln',
      brutoMonthly: 20_000_000,
      monthsPaid: 2,
      pensionContribution: 0,
      zakatOrDonation: 0,
      ptkpStatus: 'TK/0',
      scheme: 'lama',
      terCategory: 'A',
      bonusAnnual: 10_000_000,
      foreignTaxRate: 10,
    })

    expect(result.totalTax).toBe(5_000_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'Tarif efektif',
        value: 0.1,
        valueType: 'percent',
      }),
    )
  })
})
