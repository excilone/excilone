import { createToken as createTokenInternl } from './internal/token.js'
import { createUnit } from './internal/unit.js'
import { resolve } from './resolver.js'
import type { Token, Unit, UnitPayload } from './types.js'

export function createTask<T, D extends readonly Unit[] = []>(
  payload: UnitPayload<T, D>
): Unit<T, null, D> {
  return createUnit<T, null, D>(Symbol(), null, 'task', payload)
}

export function createToken<T>(): Token<T, null> {
  return createTokenInternl(Symbol(), null)
}

export function resolveUnit<T>(unit: Unit<T>): Promise<T> {
  return resolve(unit)
}

export type * from './types.js'
