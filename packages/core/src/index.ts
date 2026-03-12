import { createToken } from './internal/token.js'
import { createUnit } from './internal/unit.js'
import { resolve } from './resolver.js'
import type { Task, TokenDeclaration, Unit, UnitPayload } from './types.js'

export function createTask<T, const N extends string, D extends readonly Unit[] = []>(
  payload: UnitPayload<T, N, D>
): Task<T, N, D> {
  return createUnit(Symbol(payload.name), 'task', payload)
}

export function declareToken<T>(): TokenDeclaration<T> {
  return <N extends string>(name: N) => createToken<T, N>(Symbol(name), name)
}

export function resolveUnit<T>(unit: Unit<T>): Promise<T> {
  return resolve(unit)
}

export type * from './types.js'
