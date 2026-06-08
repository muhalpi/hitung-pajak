import { describe, expect, it } from 'vitest'
import { calculatePph23 } from './pph23'

describe('calculatePph23', () => {
  it('calculates the correct rate for consultant services', () => {
    const result = calculatePph23({
      serviceType: 'jasaKonsultan',
      grossAmount: 50_000_000,
      isFinal: false,
    })

    expect(result.totalTax).toBe(2_000_000)
    expect(result.breakdown).toContainEqual(
      expect.objectContaining({
        label: 'Tarif PPh 23',
        value: 0.04,
        valueType: 'percent',
      }),
    )
  })
})
