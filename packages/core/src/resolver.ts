import { __identity } from './constants.js'
import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from './errors.js'
import type { Unit } from './types.js'

export async function resolve<U>(
  unit: Unit<U, string, readonly Unit[]>,
  resolvedDeps: Map<symbol, U> = new Map<symbol, U>(),
  resolving: Set<symbol> = new Set<symbol>()
): Promise<U> {
  if (resolving.has(unit[__identity]))
    throw new CycleError(
      Array.from(resolving)
        .map((id) => id.toString())
        .concat([unit[__identity].toString()])
    )

  if (resolvedDeps.has(unit[__identity])) return resolvedDeps.get(unit[__identity]) as U

  resolving.add(unit[__identity])

  const depValues: Record<string, unknown> = {}
  for (const dep of unit.using) {
    if (dep.name in depValues) throw new DuplicateDependencyError(unit.name, dep.name)
    try {
      depValues[dep.name] = await resolve(dep, resolvedDeps, resolving)
    } catch (error) {
      if (error instanceof ExciloneError) throw error
      throw new ExecutionError(unit.name, error)
    }
  }

  resolving.delete(unit[__identity])

  const value = await unit.factory(depValues as Record<string, unknown>)
  resolvedDeps.set(unit[__identity], value)
  return value
}
