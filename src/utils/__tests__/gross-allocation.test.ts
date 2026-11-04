import { describe, expect, it } from 'vitest'
import { buildGrossOwnerByOrder } from '../gross-allocation'

function lines(...orderIds: number[]) {
  return orderIds.map((doc_order) => ({ doc_order }))
}

describe('buildGrossOwnerByOrder', () => {
  it('assigns gross to the owner of the latest change event', () => {
    const documents = [
      { id: 1, owner: 15 },
      { id: 2, owner: 205 },
    ]
    const linesByDocument = new Map([
      [1, lines(13593)],
      [2, lines(13593)],
    ])
    const events = [
      { document: 13593, company: 15, datetime: '2026-10-25T20:10:00Z' },
      { document: 13593, company: 205, datetime: '2026-10-28T00:22:00Z' },
    ]

    const result = buildGrossOwnerByOrder(documents, linesByDocument, events, new Map())

    expect(result.get(13593)).toBe(205)
  })

  it('assigns gross to the owner of the latest agreement by vehicle', () => {
    const documents = [
      { id: 1, owner: 100 },
      { id: 2, owner: 200 },
    ]
    const linesByDocument = new Map([
      [1, lines(1)],
      [2, lines(1)],
    ])
    const events = [
      { document: 1, vehicle: 2, datetime: '2026-10-25T20:10:00Z' },
      { document: 1, vehicle: 1, datetime: '2026-10-28T00:22:00Z' },
    ]
    const vehicleOwners = new Map([
      [1, 100],
      [2, 200],
    ])

    const result = buildGrossOwnerByOrder(documents, linesByDocument, events, vehicleOwners)

    expect(result.get(1)).toBe(100)
  })

  it('keeps a single owner order untouched', () => {
    const documents = [{ id: 1, owner: 100 }]
    const linesByDocument = new Map([[1, lines(1)]])
    const events = [{ document: 1, company: 100, datetime: '2026-10-25T20:10:00Z' }]

    const result = buildGrossOwnerByOrder(documents, linesByDocument, events, new Map())

    expect(result.has(1)).toBe(false)
  })

  it('falls back to the first owner when there are no events', () => {
    const documents = [
      { id: 1, owner: 15 },
      { id: 2, owner: 205 },
    ]
    const linesByDocument = new Map([
      [1, lines(1)],
      [2, lines(1)],
    ])

    const result = buildGrossOwnerByOrder(documents, linesByDocument, [], new Map())

    expect(result.get(1)).toBe(15)
  })

  it('falls back to the first owner when the latest owner has no payment line', () => {
    const documents = [
      { id: 1, owner: 15 },
      { id: 2, owner: 205 },
    ]
    const linesByDocument = new Map([
      [1, lines(1)],
      [2, lines(1)],
    ])
    const events = [{ document: 1, company: 999, datetime: '2026-10-28T00:22:00Z' }]

    const result = buildGrossOwnerByOrder(documents, linesByDocument, events, new Map())

    expect(result.get(1)).toBe(15)
  })
})
