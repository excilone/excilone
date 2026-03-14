import { createContainer as createContainerInternal } from './internal/container.js'
import { createToken as createTokenInternl } from './internal/token.js'
import { createUnit } from './internal/unit.js'
import type { Container, CoreUnit, Factory, Token, Unit } from './types.js'

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

export function createContainer(): Container {
  return createContainerInternal()
}

export function resolve<T>(unit: Unit<T>): Promise<T> {
  return createContainer().get(unit)
}

export type { UnitKey } from './internal/meta.js'
export type * from './types.js'
