import { resolve } from './resolver.js'
import type { Unit, UnitPayload } from './types.js'
import { createUnitInternal } from './unit.js'

export function createUnit<T, const N extends string, D extends readonly Unit[]>(
  payload: UnitPayload<T, N, D>
): Unit<T, N, D> {
  return createUnitInternal(Symbol(payload.name), payload)
}

export function resolveUnit<T>(unit: Unit<T>): Promise<T> {
  return resolve(unit)
}

export type * from './types.js'
