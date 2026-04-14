/**
 * Supercell rotation / event payloads expose the map identifier as `mapId`
 * or, more commonly, as `id` alongside string `map` (name) — same pattern as battle log events.
 */

export function eventFromRotationSlot(slot: Record<string, unknown>): Record<string, unknown> {
  if (slot.event && typeof slot.event === 'object') {
    return slot.event as Record<string, unknown>
  }
  return slot
}

export function mapIdFromRotationEvent(ev: Record<string, unknown>): string | null {
  if (ev.mapId != null) return String(ev.mapId)
  if (ev.id != null) return String(ev.id)
  const map = ev.map
  if (map && typeof map === 'object' && map !== null) {
    const m = map as Record<string, unknown>
    if (m.id != null) return String(m.id)
  }
  return null
}
