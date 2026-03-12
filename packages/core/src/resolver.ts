import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from './errors.js'
import { __meta } from './internal/meta.js'
import type { Task, Unit } from './types.js'

interface ResolveScope<U> {
  value: U
  isDynamic: boolean
}

export async function resolve<U>(
  unit: Unit<U, string, readonly Unit[], boolean>
): Promise<U> {
  const cache = new Map<symbol, U>()
  const bindingGraph = new Map<symbol, Set<symbol>>()
  const resolving = new Set<symbol>()

  async function resolveWithScope(
    unit: Unit<U, string, readonly Unit[], boolean>,
    currentBindings: Map<symbol, U>,
    currentDynamic: Map<symbol, U>
  ): Promise<ResolveScope<U>> {
    if (resolving.has(unit[__meta].identity))
      throw new CycleError(
        Array.from(resolving)
          .map((id) => id.toString())
          .concat([unit[__meta].identity.toString()])
      )

    resolving.add(unit[__meta].identity)

    const depValues: Record<string, U> = {}
    const scopeBindings = new Map(currentBindings)
    const scopeDynamic = new Map(currentDynamic)
    const definedBindings = new Set<symbol>()
    let isDynamic = false

    for (const dep of unit.using as readonly Task<U>[]) {
      if (dep.name in depValues) throw new DuplicateDependencyError(unit.name, dep.name)

      if (dep[__meta].type === 'binding') {
        const value = await dep.factory({})

        isDynamic = true
        bindingGraph.set(
          dep[__meta].identity,
          new Set([
            ...(bindingGraph.get(dep[__meta].identity) ?? []),
            unit[__meta].identity,
          ])
        )
        for (const boundUnitId of bindingGraph.get(dep[__meta].identity) ?? [])
          scopeDynamic.delete(boundUnitId)

        definedBindings.add(dep[__meta].identity)
        scopeBindings.set(dep[__meta].identity, value)
        depValues[dep.name] = value
      } else if (scopeBindings.has(dep[__meta].identity)) {
        isDynamic = true
        bindingGraph.set(
          dep[__meta].identity,
          new Set([
            ...(bindingGraph.get(dep[__meta].identity) ?? []),
            unit[__meta].identity,
          ])
        )
        depValues[dep.name] = scopeBindings.get(dep[__meta].identity) as U
      } else if (scopeDynamic.has(dep[__meta].identity)) {
        isDynamic = true
        depValues[dep.name] = scopeDynamic.get(dep[__meta].identity) as U
      } else if (cache.has(dep[__meta].identity)) {
        depValues[dep.name] = cache.get(dep[__meta].identity) as U
      } else {
        try {
          const value = await resolveWithScope(dep, scopeBindings, scopeDynamic)

          depValues[dep.name] = value.value

          if (value.isDynamic) {
            isDynamic = true
            scopeDynamic.set(dep[__meta].identity, value.value)
          }
        } catch (error) {
          if (error instanceof ExciloneError) throw error
          throw new ExecutionError(unit.name, error)
        }
      }
    }

    const blacklist = new Set<symbol>()
    for (const id of definedBindings) {
      for (const boundId of bindingGraph.get(id) ?? []) blacklist.add(boundId)
    }

    for (const [id, value] of scopeDynamic.entries()) {
      if (!blacklist.has(id)) currentDynamic.set(id, value)
    }

    resolving.delete(unit[__meta].identity)

    const value = await unit.factory(depValues)

    if (!isDynamic) cache.set(unit[__meta].identity, value)

    return { isDynamic, value }
  }

  const { value } = await resolveWithScope(unit, new Map(), new Map())
  return value
}
