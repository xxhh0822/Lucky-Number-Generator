import { describe, expect, it } from 'vitest'
import {
  LOTTERY_RULES,
  drawUnique,
  formatBatch,
  formatNumber,
  formatTicket,
  generateTicket,
  generateTickets,
  type GenerationBatch,
} from './lottery'

const sequenceRandom = () => {
  let value = 0
  return (maxExclusive: number) => value++ % maxExclusive
}

describe('lottery generator', () => {
  it.each([
    ['ssq', 6, 33, 1, 16],
    ['dlt', 5, 35, 2, 12],
  ] as const)(
    'generates valid %s tickets',
    (gameId, primaryCount, primaryMax, secondaryCount, secondaryMax) => {
      const ticket = generateTicket(LOTTERY_RULES[gameId], sequenceRandom())

      expect(ticket.primary).toHaveLength(primaryCount)
      expect(ticket.secondary).toHaveLength(secondaryCount)
      expect(new Set(ticket.primary)).toHaveLength(primaryCount)
      expect(new Set(ticket.secondary)).toHaveLength(secondaryCount)
      expect(ticket.primary).toEqual([...ticket.primary].sort((a, b) => a - b))
      expect(ticket.secondary).toEqual([...ticket.secondary].sort((a, b) => a - b))
      expect(ticket.primary.every((value) => value >= 1 && value <= primaryMax)).toBe(true)
      expect(ticket.secondary.every((value) => value >= 1 && value <= secondaryMax)).toBe(true)
    },
  )

  it('draws unique sorted values using the supplied random source', () => {
    expect(drawUnique(6, 4, () => 0)).toEqual([1, 2, 3, 4])
  })

  it('generates the requested number of tickets', () => {
    expect(generateTickets(LOTTERY_RULES.ssq, 5, sequenceRandom())).toHaveLength(5)
  })

  it('formats numbers and tickets with two digits', () => {
    expect(formatNumber(7)).toBe('07')
    expect(formatTicket({ primary: [1, 9, 10], secondary: [2, 12] })).toBe(
      '01, 09, 10 + 02, 12',
    )
  })

  it('formats a batch with its game name', () => {
    const batch: GenerationBatch = {
      id: 'test',
      gameId: 'ssq',
      tickets: [{ primary: [1, 2, 3, 4, 5, 6], secondary: [7] }],
      createdAt: new Date('2026-09-11T00:00:00Z'),
    }

    expect(formatBatch(batch)).toBe('双色球\n01, 02, 03, 04, 05, 06 + 07')
  })
})
