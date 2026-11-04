export interface GrossAllocationEvent {
  id?: number | null
  document: number
  company?: number | null
  vehicle?: number | null
  datetime?: string | Date | null
  created_at?: string | null
}

export interface GrossAllocationLine {
  doc_order: number
}

export interface GrossAllocationDocument {
  id: number
  owner: number
}

function eventTimestamp(event: GrossAllocationEvent) {
  const raw = event.datetime ?? event.created_at
  const time = raw ? new Date(raw).getTime() : 0
  return Number.isNaN(time) ? 0 : time
}

function compareEvents(a: GrossAllocationEvent, b: GrossAllocationEvent) {
  const diff = eventTimestamp(a) - eventTimestamp(b)
  if (diff !== 0) return diff
  return (Number(a.id) || 0) - (Number(b.id) || 0)
}

export function getEventOwner(
  event: GrossAllocationEvent,
  vehicleOwners: Map<number, number>,
): number | null {
  if (event.company != null) return Number(event.company)
  if (event.vehicle != null) {
    const owner = vehicleOwners.get(Number(event.vehicle))
    return owner != null ? Number(owner) : null
  }
  return null
}

export function buildGrossOwnerByOrder(
  documents: Array<GrossAllocationDocument>,
  linesByDocument: Map<number, Array<GrossAllocationLine>>,
  events: Array<GrossAllocationEvent>,
  vehicleOwners: Map<number, number>,
): Map<number, number> {
  const ownersByOrder = new Map<number, Set<number>>()
  const firstOwnerByOrder = new Map<number, number>()

  for (const document of documents) {
    const lines = linesByDocument.get(document.id) ?? []
    for (const line of lines) {
      const orderId = Number(line.doc_order)
      const ownerId = Number(document.owner)

      let owners = ownersByOrder.get(orderId)
      if (!owners) {
        owners = new Set<number>()
        ownersByOrder.set(orderId, owners)
      }
      owners.add(ownerId)

      if (!firstOwnerByOrder.has(orderId)) {
        firstOwnerByOrder.set(orderId, ownerId)
      }
    }
  }

  const latestEventByOrder = new Map<number, GrossAllocationEvent>()
  for (const event of events) {
    const orderId = Number(event.document)
    const current = latestEventByOrder.get(orderId)
    if (!current || compareEvents(event, current) > 0) {
      latestEventByOrder.set(orderId, event)
    }
  }

  const grossOwnerByOrder = new Map<number, number>()
  for (const [orderId, owners] of ownersByOrder) {
    if (owners.size <= 1) continue

    const latestEvent = latestEventByOrder.get(orderId)
    const latestOwner = latestEvent ? getEventOwner(latestEvent, vehicleOwners) : null
    const grossOwner =
      latestOwner != null && owners.has(latestOwner) ? latestOwner : firstOwnerByOrder.get(orderId)

    if (grossOwner != null) {
      grossOwnerByOrder.set(orderId, grossOwner)
    }
  }

  return grossOwnerByOrder
}
