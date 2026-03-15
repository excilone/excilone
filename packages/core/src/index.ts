import { createContainer as createContainerInternal } from './internal/container.js'
import { createToken as createTokenInternl } from './internal/token.js'
import { createUnit } from './internal/unit.js'
import type { Container, CoreUnit, Factory, Token, Unit } from './types.js'

export function createTask<T>(
  factory: Factory<T | Promise<T>, false, []>,
  tag?: string
): Unit<T, false, null, []>
export function createTask<T, D extends readonly Unit[] = []>(
  payload: CoreUnit<T | Promise<T>, false, D>,
  tag?: string
): Unit<T, false, null, D>
export function createTask<T, D extends readonly Unit[] = []>(
  payload: CoreUnit<T, false, D> | Factory<T, false, D>,
  tag?: string
) {
  return createUnit(
    Symbol(tag),
    false,
    null,
    'task',
    typeof payload === 'function'
      ? { using: [] as unknown as D, factory: payload }
      : payload
  )
}

export function createSyncTask<T>(
  factory: Factory<T, true, []>,
  tag?: string
): Unit<T, true, null, []>
export function createSyncTask<T, D extends readonly Unit[] = []>(
  payload: CoreUnit<T, true, D>,
  tag?: string
): Unit<T, true, null, D>
export function createSyncTask<T, D extends readonly Unit[] = []>(
  payload: CoreUnit<T, true, D> | Factory<T, true, D>,
  tag?: string
): Unit<T, true, null, D> {
  return createUnit(
    Symbol(tag),
    true,
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

export function createContainer(): Container<false> {
  return createContainerInternal(false)
}

export function createSyncContainer(): Container<true> {
  return createContainerInternal(true)
}

export function resolve<T>(unit: Unit<T>): Promise<T> {
  return createContainer().get(unit)
}

export function resolveSync<T>(unit: Unit<T>): T {
  return createSyncContainer().get(unit)
}

export type { UnitKey } from './internal/meta.js'
export type * from './types.js'
