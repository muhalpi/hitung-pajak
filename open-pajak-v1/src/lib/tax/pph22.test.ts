import { describe, expect, it } from 'vitest'
import { calculatePph22 } from './pph22'

describe('calculatePph22', () => {
  it('calculates import withholding from the net DPP', () => {
    const result = calculatePph22({
      transactionType: 'impor',
      transactionValue: 100_000_000,
      otherCosts: 5_000_000,
      deduction: 10_000_000,
    })

    expect(result.totalTax).toBe(2_375_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'Dasar pungut (DPP)',
        value: 95_000_000,
      }),
    )
  })
})
