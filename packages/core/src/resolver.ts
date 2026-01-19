import { __bind, __identity } from './constants.js'
import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from './errors.js'
import type { BaseUnit, Unit } from './types.js'

interface CacheEntry<U> {
  value: U
  /**
   * Indicates if the scope is dynamic (is a token or depends on a token)
   */
  isDynamic: boolean
}

interface ResolveScope<U> extends CacheEntry<U> {
  /**
   * Singletons that are specific to this scope (dymamic scopes only)
   */
  scope: Map<symbol, CacheEntry<U>>
}

export async function resolveWithScope<U>(
  unit: BaseUnit<U, string, readonly BaseUnit[], boolean>,
  global: Map<symbol, U>,
  scope: Map<symbol, CacheEntry<U>>,
  tokenGraph: Map<symbol, Set<symbol>>,
  resolving: Set<symbol>
): Promise<ResolveScope<U>> {
  if (resolving.has(unit[__identity]))
    throw new CycleError(
      Array.from(resolving)
        .map((id) => id.toString())
        .concat([unit[__identity].toString()])
    )

  if (unit[__bind]) {
    const value = await unit.factory({})

    if (!tokenGraph.has(unit[__identity])) tokenGraph.set(unit[__identity], new Set())

    for (const id of tokenGraph.get(unit[__identity]) ?? []) scope.delete(id)

    return {
      value,
      isDynamic: true,
      scope: new Map([[unit[__identity], { value, isDynamic: true }]]),
    }
  }

  if (scope.has(unit[__identity])) {
    const { value, isDynamic } = scope.get(unit[__identity]) as CacheEntry<U>

    return {
      value,
      isDynamic,
      scope: new Map([...scope.entries()]),
    }
  }

  resolving.add(unit[__identity])

  const depValues: Record<string, U> = {}
  let isDynamic = false
  let depsScope = new Map<symbol, CacheEntry<U>>([
    ...scope.entries(),
    ...global
      .entries()
      .map(([key, value]) => [key, { value, isDynamic: false }] as const),
  ])

  for (const dep of unit.using as readonly Unit<U>[]) {
    if (dep.name in depValues) throw new DuplicateDependencyError(unit.name, dep.name)
    try {
      const resolvedDep = await resolveWithScope(
        dep,
        global,
        depsScope,
        tokenGraph,
        resolving
      )

      if (tokenGraph.has(dep[__identity]))
        tokenGraph.set(
          dep[__identity],
          new Set([...(tokenGraph.get(dep[__identity]) ?? []), unit[__identity]])
        )

      depsScope = new Map([...depsScope.entries(), ...resolvedDep.scope.entries()])
      depValues[dep.name] = resolvedDep.value

      if (resolvedDep.isDynamic) isDynamic = true
    } catch (error) {
      if (error instanceof ExciloneError) throw error
      throw new ExecutionError(unit.name, error)
    }
  }

  resolving.delete(unit[__identity])

  const value = await unit.factory(depValues)
  if (!isDynamic) global.set(unit[__identity], value)

  return {
    value,
    isDynamic,
    scope: new Map(isDynamic ? [[unit[__identity], { value, isDynamic }]] : []),
  }
}

export async function resolve<U>(
  unit: BaseUnit<U, string, readonly BaseUnit[], boolean>
): Promise<U> {
  const global = new Map<symbol, U>()
  const resolving = new Set<symbol>()

  const result = await resolveWithScope(unit, global, new Map(), new Map(), resolving)
  return result.value
}
