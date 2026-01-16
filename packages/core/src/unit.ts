import { __identity } from './constants.js'
import type { Unit, UnitPayload } from './types.js'

export function createUnitInternal<T, const N extends string, D extends readonly Unit[]>(
  id: symbol,
  payload: UnitPayload<T, N, D>
): Unit<T, N, D> {
  return {
    ...payload,
    [__identity]: id,
    as(name) {
      return createUnitInternal(id, {
        ...payload,
        name,
      })
    },
  }
}
