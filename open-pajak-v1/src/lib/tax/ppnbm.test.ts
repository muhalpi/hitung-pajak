import { describe, expect, it } from 'vitest'
import { calculatePpnbm } from './ppnbm'

describe('calculatePpnbm', () => {
  it('supports custom PPNBM rates and clamps negative DPP values', () => {
    const result = calculatePpnbm({
      goodsType: 'kendaraanMewah',
      dppPpn: 200_000_000,
      customRate: 12.5,
    })

    expect(result.totalTax).toBe(25_000_000)

    const normalized = calculatePpnbm({
      goodsType: 'kendaraanMewah',
      dppPpn: -10_000_000,
      customRate: 0,
    })

    expect(normalized.totalTax).toBe(0)
    expect(normalized.breakdown).toContainEqual(
      expect.objectContaining({ label: 'DPP PPNBM', value: 0 }),
    )
  })
})
