import { __bind, __identity } from './constants.js'
import type { BaseUnit, Unit, UnitPayload } from './types.js'

export function createUnitInternal<
  T,
  const N extends string,
  D extends readonly BaseUnit[],
>(id: symbol, payload: UnitPayload<T, N, D>): Unit<T, N, D> {
  return {
    ...payload,
    [__identity]: id,
    [__bind]: false,
    as(name) {
      return createUnitInternal(id, {
        ...payload,
        name,
      })
    },
  }
}
