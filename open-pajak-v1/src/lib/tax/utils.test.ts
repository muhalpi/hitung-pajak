import { describe, expect, it } from 'vitest'
import {
  applyRate,
  getPTKP,
  getTerBulananRate,
  getTerHarianRate,
  hitungPajakPasal17,
  rateBpsToPercent,
  roundDown,
  roundDownToThousand,
} from './utils'

describe('tax utils', () => {
  it('rounds and clamps helpers safely', () => {
    expect(roundDown(-10)).toBe(0)
    expect(roundDown(10.9)).toBe(10)
    expect(roundDownToThousand(-500)).toBe(0)
    expect(roundDownToThousand(60_999)).toBe(60_000)
  })

  it('applies basis-point rates with nearest and floor rounding', () => {
    expect(applyRate(12_345, 1_250)).toBe(1_543)
    expect(applyRate(12_345, 1_250, 'floor')).toBe(1_543)
    expect(applyRate(999, 333)).toBe(33)
    expect(rateBpsToPercent(1_250)).toBe(0.125)
  })

  it('falls back to TK/0 for unknown PTKP statuses', () => {
    expect(getPTKP('K/3')).toBe(72_000_000)
    expect(getPTKP('unknown')).toBe(54_000_000)
  })

  it('calculates Pasal 17 progressively at bracket boundaries', () => {
    expect(hitungPajakPasal17(0)).toBe(0)
    expect(hitungPajakPasal17(60_000_000)).toBe(3_000_000)
    expect(hitungPajakPasal17(60_001_000)).toBe(3_000_150)
    expect(hitungPajakPasal17(250_000_000)).toBe(31_500_000)
    expect(hitungPajakPasal17(500_000_000)).toBe(94_000_000)
    expect(hitungPajakPasal17(5_000_000_000)).toBe(1_444_000_000)
  })

  it('looks up TER monthly and daily boundaries correctly', () => {
    expect(getTerBulananRate('A', 5_400_000)).toBe(0)
    expect(getTerBulananRate('A', 5_400_001)).toBe(25)
    expect(getTerBulananRate('C', 6_600_000)).toBe(0)
    expect(getTerBulananRate('C', 6_600_001)).toBe(25)

    expect(getTerHarianRate('A', 750_000)).toBe(25)
    expect(getTerHarianRate('A', 750_001)).toBe(150)
    expect(getTerHarianRate('B', 2_500_001)).toBe(175)
  })
})
