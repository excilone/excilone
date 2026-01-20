import { __bind, __identity } from './constants.js'
import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from './errors.js'
import type { BaseUnit, Unit } from './types.js'

interface ResolveScope<U> {
  value: U
  isDynamic: boolean
}

export async function resolve<U>(
  unit: BaseUnit<U, string, readonly BaseUnit[], boolean>
): Promise<U> {
  const cache = new Map<symbol, U>()
  const bindingGraph = new Map<symbol, Set<symbol>>()
  const resolving = new Set<symbol>()

  async function resolveWithScope(
    unit: BaseUnit<U, string, readonly BaseUnit[], boolean>,
    currentBindings: Map<symbol, U>,
    currentDynamic: Map<symbol, U>
  ): Promise<ResolveScope<U>> {
    if (resolving.has(unit[__identity]))
      throw new CycleError(
        Array.from(resolving)
          .map((id) => id.toString())
          .concat([unit[__identity].toString()])
      )

    resolving.add(unit[__identity])

    const depValues: Record<string, U> = {}
    const scopeBindings = new Map(currentBindings)
    const scopeDynamic = new Map(currentDynamic)
    const definedBindings = new Set<symbol>()
    let isDynamic = false

    for (const dep of unit.using as readonly Unit<U>[]) {
      if (dep.name in depValues) throw new DuplicateDependencyError(unit.name, dep.name)

      if (dep[__bind]) {
        const value = await dep.factory({})

        isDynamic = true
        bindingGraph.set(
          dep[__identity],
          new Set([...(bindingGraph.get(dep[__identity]) ?? []), unit[__identity]])
        )
        for (const boundUnitId of bindingGraph.get(dep[__identity]) ?? [])
          scopeDynamic.delete(boundUnitId)

        definedBindings.add(dep[__identity])
        scopeBindings.set(dep[__identity], value)
        depValues[dep.name] = value
      } else if (scopeBindings.has(dep[__identity])) {
        isDynamic = true
        bindingGraph.set(
          dep[__identity],
          new Set([...(bindingGraph.get(dep[__identity]) ?? []), unit[__identity]])
        )
        depValues[dep.name] = scopeBindings.get(dep[__identity]) as U
      } else if (scopeDynamic.has(dep[__identity])) {
        isDynamic = true
        depValues[dep.name] = scopeDynamic.get(dep[__identity]) as U
      } else if (cache.has(dep[__identity])) {
        depValues[dep.name] = cache.get(dep[__identity]) as U
      } else {
        try {
          const value = await resolveWithScope(dep, scopeBindings, scopeDynamic)

          depValues[dep.name] = value.value

          if (value.isDynamic) {
            isDynamic = true
            scopeDynamic.set(dep[__identity], value.value)
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

    resolving.delete(unit[__identity])

    const value = await unit.factory(depValues)

    if (!isDynamic) cache.set(unit[__identity], value)

    return { isDynamic, value }
  }

  const { value } = await resolveWithScope(unit, new Map(), new Map())
  return value
}
