import { createToken as createTokenInternl } from './internal/token.js'
import { createUnit } from './internal/unit.js'
import { resolve } from './resolver.js'
import type { CoreUnit, Factory, Token, Unit } from './types.js'

export function createTask<T>(factory: Factory<T, []>, tag?: string): Unit<T, null, []>
export function createTask<T, D extends readonly Unit[] = []>(
  payload: CoreUnit<T, D>,
  tag?: string
): Unit<T, null, D>
export function createTask<T, D extends readonly Unit[] = []>(
  payload: CoreUnit<T, D> | Factory<T, D>,
  tag?: string
): Unit<T, null, D> {
  return createUnit<T, null, D>(
    Symbol(tag),
    null,
    'task',
    typeof payload === 'function'
      ? { using: [] as unknown as D, factory: payload }
      : payload
  )
}

export function createToken<T>(tag?: string): Token<T, null> {
  return createTokenInternl(Symbol(tag), null)
}

export function resolveUnit<T>(unit: Unit<T>): Promise<T> {
  return resolve(unit)
}

export type { UnitKey } from './internal/meta.js'
export type * from './types.js'
