import { resolve } from './resolver.js'
import { createTokenInternal } from './token.js'
import type { BaseUnit, TokenDeclaration, Unit, UnitPayload } from './types.js'
import { createUnitInternal } from './unit.js'

export function createUnit<T, const N extends string, D extends readonly BaseUnit[]>(
  payload: UnitPayload<T, N, D>
): Unit<T, N, D> {
  return createUnitInternal(Symbol(payload.name), payload)
}

export function declareToken<T>(): TokenDeclaration<T> {
  return <N extends string>(name: N) => createTokenInternal<T, N>(Symbol(name), name)
}

export function resolveUnit<T>(unit: Unit<T>): Promise<T> {
  return resolve(unit)
}

export type * from './types.js'
