import type { Unit, UnitPayload } from './types.js'
import { createUnitInternal } from './unit.js'

export function createUnit<T, const N extends string, D extends readonly Unit[]>(
  payload: UnitPayload<T, N, D>
): Unit<T, N, D> {
  return createUnitInternal(Symbol(payload.name), payload)
}

export type * from './types.js'
