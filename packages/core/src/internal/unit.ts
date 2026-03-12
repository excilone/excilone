import type { Unit, UnitPayload } from '../types.js'
import { __meta, type UnitKey, type UnitType } from './meta.js'

export function createUnit<T, K extends UnitKey | null, D extends readonly Unit[]>(
  id: symbol,
  key: K,
  type: UnitType,
  payload: UnitPayload<T, D>
): Unit<T, K, D> {
  return {
    ...payload,
    using: payload.using ?? ([] as unknown as D),
    [__meta]: {
      identity: id,
      type,
      key,
    },
    as(newKey) {
      return createUnit(id, newKey, type, payload)
    },
  }
}
