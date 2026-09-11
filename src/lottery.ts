export type GameId = 'ssq' | 'dlt'

export interface LotteryRule {
  id: GameId
  name: string
  shortRule: string
  primaryLabel: string
  primaryMax: number
  primaryCount: number
  secondaryLabel: string
  secondaryMax: number
  secondaryCount: number
}

export interface LotteryTicket {
  primary: number[]
  secondary: number[]
}

export interface GenerationBatch {
  id: string
  gameId: GameId
  tickets: LotteryTicket[]
  createdAt: Date
}

export type RandomInt = (maxExclusive: number) => number

export const LOTTERY_RULES: Record<GameId, LotteryRule> = {
  ssq: {
    id: 'ssq',
    name: '双色球',
    shortRule: '6个红球（1–33）+ 1个蓝球（1–16）',
    primaryLabel: '红球',
    primaryMax: 33,
    primaryCount: 6,
    secondaryLabel: '蓝球',
    secondaryMax: 16,
    secondaryCount: 1,
  },
  dlt: {
    id: 'dlt',
    name: '超级大乐透',
    shortRule: '5个前区号码（1–35）+ 2个后区号码（1–12）',
    primaryLabel: '前区',
    primaryMax: 35,
    primaryCount: 5,
    secondaryLabel: '后区',
    secondaryMax: 12,
    secondaryCount: 2,
  },
}

export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive integer')
  }

  const range = 0x1_0000_0000
  const limit = range - (range % maxExclusive)
  const buffer = new Uint32Array(1)
  let value: number

  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]!
  } while (value >= limit)

  return value % maxExclusive
}

export function drawUnique(
  max: number,
  count: number,
  randomInt: RandomInt = secureRandomInt,
): number[] {
  const pool = Array.from({ length: max }, (_, index) => index + 1)

  for (let index = 0; index < count; index += 1) {
    const swapIndex = index + randomInt(max - index)
    ;[pool[index], pool[swapIndex]] = [pool[swapIndex]!, pool[index]!]
  }

  return pool.slice(0, count).sort((left, right) => left - right)
}

export function generateTicket(
  rule: LotteryRule,
  randomInt: RandomInt = secureRandomInt,
): LotteryTicket {
  return {
    primary: drawUnique(rule.primaryMax, rule.primaryCount, randomInt),
    secondary: drawUnique(rule.secondaryMax, rule.secondaryCount, randomInt),
  }
}

export function generateTickets(
  rule: LotteryRule,
  count: number,
  randomInt: RandomInt = secureRandomInt,
): LotteryTicket[] {
  return Array.from({ length: count }, () => generateTicket(rule, randomInt))
}

export function formatNumber(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatTicket(ticket: LotteryTicket): string {
  const primary = ticket.primary.map(formatNumber).join(', ')
  const secondary = ticket.secondary.map(formatNumber).join(', ')
  return `${primary} + ${secondary}`
}

export function formatBatch(batch: GenerationBatch): string {
  const title = LOTTERY_RULES[batch.gameId].name
  return [title, ...batch.tickets.map(formatTicket)].join('\n')
}
