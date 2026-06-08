import { describe, expect, it } from 'vitest'
import { calculatePph4 } from './pph4_2'

describe('calculatePph4', () => {
  it('calculates final restaurant withholding', () => {
    const result = calculatePph4({
      objectType: 'restoran',
      grossAmount: 10_000_000,
    })

    expect(result.totalTax).toBe(500_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'Tarif final',
        value: 0.05,
        valueType: 'percent',
      }),
    )
  })
})
