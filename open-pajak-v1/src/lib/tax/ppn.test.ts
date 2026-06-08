import { describe, expect, it } from 'vitest'
import { calculatePpn } from './ppn'

describe('calculatePpn', () => {
  it('calculates standard exclusive PPN', () => {
    const result = calculatePpn({
      taxYear: '2024',
      basePrice: 100_000_000,
      discount: 10_000_000,
      otherCosts: 5_000_000,
      includePpn: false,
    })

    expect(result.totalTax).toBe(10_450_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({ label: 'DPP', value: 95_000_000 }),
    )
  })

  it('backs out DPP correctly when the price already includes PPN', () => {
    const result = calculatePpn({
      taxYear: '2024',
      basePrice: 111_000_000,
      discount: 0,
      otherCosts: 0,
      includePpn: true,
    })

    expect(result.totalTax).toBe(11_000_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({ label: 'DPP', value: 100_000_000 }),
    )
  })

  it('supports custom rates and clamps negative bases to zero', () => {
    const custom = calculatePpn({
      taxYear: '2025',
      basePrice: 80_000_000,
      discount: 0,
      otherCosts: 0,
      customRate: 12.5,
      includePpn: false,
    })
    expect(custom.totalTax).toBe(10_000_000)

    const normalized = calculatePpn({
      taxYear: '2024',
      basePrice: 100,
      discount: 200,
      otherCosts: 0,
      includePpn: false,
    })
    expect(normalized.totalTax).toBe(0)
  })

  it('uses PMK 131/2024 DPP Nilai Lain for non-luxury 2025 transactions', () => {
    const result = calculatePpn({
      taxYear: '2025',
      basePrice: 100_000_000,
      discount: 0,
      otherCosts: 0,
      transactionType: 'standard',
      includePpn: false,
    })

    expect(result.totalTax).toBe(11_000_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'DPP Nilai Lain',
        value: 91_666_667,
      }),
    )
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({ label: 'Tarif efektif', value: 0.11 }),
    )
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({ label: 'Total tagihan', value: 111_000_000 }),
    )
  })

  it('applies the full 12% VAT base for 2025 luxury goods', () => {
    const result = calculatePpn({
      taxYear: '2025',
      basePrice: 100_000_000,
      discount: 0,
      otherCosts: 0,
      transactionType: 'luxury',
      includePpn: false,
    })

    expect(result.totalTax).toBe(12_000_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({ label: 'DPP', value: 100_000_000 }),
    )
  })

  it('backs out a 2025 non-luxury VAT-inclusive amount using the 11% effective rate', () => {
    const result = calculatePpn({
      taxYear: '2025',
      basePrice: 111_000_000,
      discount: 0,
      otherCosts: 0,
      transactionType: 'standard',
      includePpn: true,
    })

    expect(result.totalTax).toBe(11_000_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({ label: 'Nilai transaksi', value: 100_000_000 }),
    )
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'DPP Nilai Lain',
        value: 91_666_667,
      }),
    )
  })
})
