import { __identity } from './constants.js'
import type { Unit } from './types.js'

export async function resolve<U>(
  unit: Unit<U, string, readonly Unit[]>,
  resolvedDeps: Map<symbol, U> = new Map<symbol, U>(),
  resolving: Set<symbol> = new Set<symbol>()
): Promise<U> {
  if (resolving.has(unit[__identity]))
    throw new Error(
      `Circular dependency detected for unit: ${unit.name} [${unit[__identity].toString()}]`
    )

  if (resolvedDeps.has(unit[__identity])) return resolvedDeps.get(unit[__identity]) as U

  resolving.add(unit[__identity])

  const depValues: Record<string, unknown> = {}
  for (const dep of unit.using) {
    if (dep.name in depValues)
      throw new Error(
        `Duplicate dependency name detected: ${dep.name} in unit: ${unit.name} [${unit[__identity].toString()}]`
      )
    depValues[dep.name] = await resolve(dep, resolvedDeps, resolving)
  }

  resolving.delete(unit[__identity])

  const value = await unit.factory(depValues as Record<string, unknown>)
  resolvedDeps.set(unit[__identity], value)
  return value
}
