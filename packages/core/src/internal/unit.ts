import type { Task, Unit, UnitPayload } from '../types.js'
import { __meta, type UnitType } from './meta.js'

export function createUnit<T, const N extends string, D extends readonly Unit[]>(
  id: symbol,
  type: UnitType,
  payload: UnitPayload<T, N, D>
): Task<T, N, D> {
  return {
    ...payload,
    using: payload.using ?? ([] as unknown as D),
    [__meta]: {
      identity: id,
      type,
    },
    as(name) {
      return createUnit(id, type, {
        ...payload,
        name,
      })
    },
  }
}
