import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from './errors.js'
import { __meta, type UnitKey } from './internal/meta.js'
import type { Unit } from './types.js'

interface ResolveScope<U> {
  value: U
  isDynamic: boolean
}

export async function resolve<U>(
  unit: Unit<U, UnitKey | null, readonly Unit[]>
): Promise<U> {
  const cache = new Map<symbol, U>()
  const bindingGraph = new Map<symbol, Set<symbol>>()
  const resolving = new Set<symbol>()

  async function resolveWithScope(
    unit: Unit<U, UnitKey | null, readonly Unit[]>,
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

    for (const dep of unit.using as readonly Unit<U, UnitKey | null>[]) {
      if (dep[__meta].key !== null && dep[__meta].key in depValues)
        throw new DuplicateDependencyError(
          String(unit[__meta].identity),
          String(dep[__meta].key)
        )

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
        if (dep[__meta].key !== null) depValues[dep[__meta].key] = value
      } else if (scopeBindings.has(dep[__meta].identity)) {
        isDynamic = true
        bindingGraph.set(
          dep[__meta].identity,
          new Set([
            ...(bindingGraph.get(dep[__meta].identity) ?? []),
            unit[__meta].identity,
          ])
        )
        if (dep[__meta].key !== null)
          depValues[dep[__meta].key] = scopeBindings.get(dep[__meta].identity) as U
      } else if (scopeDynamic.has(dep[__meta].identity)) {
        isDynamic = true
        if (dep[__meta].key !== null)
          depValues[dep[__meta].key] = scopeDynamic.get(dep[__meta].identity) as U
      } else if (cache.has(dep[__meta].identity)) {
        if (dep[__meta].key !== null)
          depValues[dep[__meta].key] = cache.get(dep[__meta].identity) as U
      } else {
        try {
          const value = await resolveWithScope(dep, scopeBindings, scopeDynamic)

          if (dep[__meta].key !== null) depValues[dep[__meta].key] = value.value

          if (value.isDynamic) {
            isDynamic = true
            scopeDynamic.set(dep[__meta].identity, value.value)
          }
        } catch (error) {
          if (error instanceof ExciloneError) throw error
          throw new ExecutionError(String(unit[__meta].identity), error)
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
