import { describe, it, expect } from 'vitest'
import { computeBattleLogInsights } from './battleInsights'

describe('computeBattleLogInsights', () => {
  const playerTag = '#PLAYER1'

  const sampleItems = [
    {
      battleTime: '20240101T120000.000Z',
      event: { id: 1, mode: 'gemGrab', mapId: 10, map: 'Map A' },
      battle: {
        mode: 'gemGrab',
        result: 'victory',
        trophyChange: 8,
        starPlayer: { tag: '#PLAYER1' },
        teams: [
          [
            {
              tag: '#PLAYER1',
              brawler: { id: 16000000, name: 'Shelly', power: 11, trophies: 500 },
            },
          ],
          [],
        ],
      },
    },
    {
      battleTime: '20240101T110000.000Z',
      event: { id: 1, mode: 'gemGrab', mapId: 10, map: 'Map A' },
      battle: {
        mode: 'gemGrab',
        result: 'defeat',
        trophyChange: -6,
        teams: [
          [
            {
              tag: '#PLAYER1',
              brawler: { id: 16000000, name: 'Shelly', power: 11, trophies: 508 },
            },
          ],
          [],
        ],
      },
    },
    {
      battleTime: '20240101T100000.000Z',
      event: { id: 2, mode: 'brawlBall', mapId: 20, map: 'Map B' },
      battle: {
        mode: 'brawlBall',
        result: 'victory',
        trophyChange: 9,
        teams: [
          [
            {
              tag: '#PLAYER1',
              brawler: { id: 16000001, name: 'Colt', power: 11, trophies: 600 },
            },
          ],
          [],
        ],
      },
    },
  ]

  it('computes overall win rate and streak', () => {
    const ins = computeBattleLogInsights(sampleItems, playerTag)
    expect(ins.sampleSize).toBe(3)
    expect(ins.overallWinRate).toBeCloseTo(2 / 3, 5)
    expect(ins.currentStreak.type).toBe('win')
    expect(ins.currentStreak.length).toBe(1)
  })

  it('aggregates by mode and brawler', () => {
    const ins = computeBattleLogInsights(sampleItems, playerTag)
    const gem = ins.byMode.find((m) => m.key === 'gemGrab')
    expect(gem?.battles).toBe(2)
    expect(gem?.wins).toBe(1)
    const shelly = ins.byBrawlerName.find((b) => b.label === 'Shelly')
    expect(shelly?.battles).toBe(2)
  })

  it('tracks star player rate', () => {
    const ins = computeBattleLogInsights(sampleItems, playerTag)
    expect(ins.starPlayerBattles).toBe(1)
    expect(ins.starPlayerRate).toBeCloseTo(1 / 3, 5)
  })

  it('handles empty list', () => {
    const ins = computeBattleLogInsights([], playerTag)
    expect(ins.sampleSize).toBe(0)
    expect(ins.overallWinRate).toBeNull()
    expect(ins.currentStreak.type).toBe('none')
  })
})
