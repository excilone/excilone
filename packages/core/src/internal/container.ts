import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from '../errors.js'
import type { Container, Unit } from '../types.js'
import { __meta, type UnitKey } from './meta.js'

export function createContainer(): Container {
  const context = new Map<symbol, unknown>()
  const resolving = new Set<symbol>()
  const graph = new Map<symbol, Set<symbol>>()
  const stack = createStack()

  const needToResolve = (unit: Unit): boolean =>
    (unit.using as readonly Unit[]).some((dep) => {
      const deps = graph.get(dep[__meta].identity)
      return deps ? !deps.has(unit[__meta].identity) : false
    })

  const get = async <T>(unit: Unit<T>): Promise<T> => {
    if (unit[__meta].type === 'binding') {
      const value = await unit.factory({})
      stack.bind(unit, context, graph)
      context.set(unit[__meta].identity, value)
      graph.set(unit[__meta].identity, new Set())
      return value
    }
    if (context.has(unit[__meta].identity) && !needToResolve(unit))
      return context.get(unit[__meta].identity) as T
    try {
      const value = await resolve(unit)
      context.set(unit[__meta].identity, value)
      return value
    } catch (error) {
      if (error instanceof ExciloneError) throw error
      throw new ExecutionError(unit[__meta].identity.toString(), error)
    }
  }

  const resolve = async <T>(unit: Unit<T>): Promise<T> => {
    if (resolving.has(unit[__meta].identity))
      throw new CycleError(
        [...resolving, unit[__meta].identity].map((id) => id.toString())
      )

    resolving.add(unit[__meta].identity)

    const values: Record<UnitKey, unknown> = {}
    const dependencies = unit.using as readonly Unit[]

    stack.push()

    for (const dep of dependencies) {
      if (dep[__meta].key !== null && dep[__meta].key in values)
        throw new DuplicateDependencyError(
          unit[__meta].identity.toString(),
          dep[__meta].key.toString()
        )

      const value = await get(dep)
      if (graph.has(dep[__meta].identity)) {
        const bindings = graph.get(dep[__meta].identity) ?? new Set()
        bindings.add(unit[__meta].identity)
        graph.set(dep[__meta].identity, bindings)
        if (!graph.has(unit[__meta].identity)) graph.set(unit[__meta].identity, new Set())
      }
      if (dep[__meta].key !== null) values[dep[__meta].key] = value
    }

    stack.run(context, graph)
    resolving.delete(unit[__meta].identity)

    const value = await unit.factory(values)

    return value
  }

  return {
    get,
  }
}

interface Step {
  replace: Map<symbol, unknown>
  delete: Set<symbol>
  bindings: Map<symbol, Set<symbol>>
}

export function createStack() {
  const stack: Step[] = []

  return {
    push() {
      stack.push({ replace: new Map(), delete: new Set(), bindings: new Map() })
    },
    bind(unit: Unit, context: Map<symbol, unknown>, graph: Map<symbol, Set<symbol>>) {
      const top = stack.at(-1)
      if (!top) return
      if (context.has(unit[__meta].identity))
        top.replace.set(unit[__meta].identity, context.get(unit[__meta].identity))
      else top.delete.add(unit[__meta].identity)
      const clearDependants = (id: symbol) => {
        const dependants = graph.get(id)
        if (dependants) {
          graph.set(id, new Set())
          top.bindings.set(id, dependants)
          for (const dep of dependants) {
            clearDependants(dep)
          }
        }
      }
      clearDependants(unit[__meta].identity)
    },
    run(context: Map<symbol, unknown>, graph: Map<symbol, Set<symbol>>) {
      const top = stack.pop()

      if (top) {
        for (const [key, value] of top.replace) context.set(key, value)
        for (const key of top.delete) context.delete(key)
        for (const [key, bindings] of top.bindings) graph.set(key, bindings)
      }
    },
  }
}
