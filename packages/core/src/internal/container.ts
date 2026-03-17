import {
  CycleError,
  DuplicateDependencyError,
  ExciloneError,
  ExecutionError,
} from '../errors.js'
import type { Container, Unit } from '../types.js'
import { __meta, type UnitKey } from './meta.js'

interface GeneratorValue<T> {
  unit: Unit<T>
  values: Record<UnitKey, unknown>
}

export function createContainer(sync: false): Container<false>
export function createContainer(sync: true): Container<true>
export function createContainer(sync: boolean): Container<boolean> {
  const context = new Map<symbol, unknown>()
  const resolving = new Set<symbol>()
  const graph = new Map<symbol, Set<symbol>>()
  const stack = createStack()

  const needToResolve = (unit: Unit): boolean =>
    (unit.using as readonly Unit[]).some((dep) => {
      const deps = graph.get(dep[__meta].identity)
      return deps ? !deps.has(unit[__meta].identity) : false
    })

  const get = function* <T>(unit: Unit<T>): Generator<GeneratorValue<T>, T, T> {
    if (unit[__meta].type === 'binding') {
      const value = unit.factory({})
      stack.bind(unit, context, graph)
      context.set(unit[__meta].identity, value)
      graph.set(unit[__meta].identity, new Set())
      return value
    }
    if (context.has(unit[__meta].identity) && !needToResolve(unit))
      return context.get(unit[__meta].identity) as T
    try {
      const value = yield* resolve(unit)
      context.set(unit[__meta].identity, value)
      return value
    } catch (error) {
      if (error instanceof ExciloneError) throw error
      throw new ExecutionError(unit[__meta].identity.toString(), error)
    }
  }

  const resolve = function* <T>(unit: Unit<T>): Generator<GeneratorValue<T>, T, T> {
    if (resolving.has(unit[__meta].identity))
      throw new CycleError(
        [...resolving, unit[__meta].identity].map((id) => id.toString())
      )

    resolving.add(unit[__meta].identity)

    const values: Record<UnitKey, unknown> = {}
    const dependencies = unit.using as readonly Unit[]

    stack.push()

    try {
      for (const dep of dependencies) {
        if (dep[__meta].key !== null && dep[__meta].key in values)
          throw new DuplicateDependencyError(
            unit[__meta].identity.toString(),
            dep[__meta].key.toString()
          )

        const value = yield* get(dep as Unit<T>)
        if (graph.has(dep[__meta].identity)) {
          const bindings = graph.get(dep[__meta].identity) ?? new Set()
          bindings.add(unit[__meta].identity)
          graph.set(dep[__meta].identity, bindings)
          if (!graph.has(unit[__meta].identity))
            graph.set(unit[__meta].identity, new Set())
        }
        if (dep[__meta].key !== null) values[dep[__meta].key] = value
      }

      const value = yield { unit, values }

      return value
    } finally {
      stack.run(context, graph)
      resolving.delete(unit[__meta].identity)
    }
  }

  return {
    get<T, USync extends boolean>(
      unit: Unit<T, USync>
    ): (USync extends true ? T : Promise<T>) | Promise<T> {
      const generator = get(unit)
      try {
        if (sync) return executeSync(generator, generator.next()) as Promise<T>
        return execute(generator, generator.next())
      } catch (error) {
        if (sync) throw error
        return Promise.reject(error)
      }
    },
  }
}

async function execute<T, G extends Generator<GeneratorValue<T>, T, T>>(
  generator: G,
  result: IteratorResult<GeneratorValue<T>>
): Promise<T> {
  if (result.done) return result.value
  try {
    const { unit, values } = result.value
    const value = unit.factory(values)

    return execute(generator, generator.next(unit[__meta].sync ? value : await value))
  } catch (error) {
    return execute(generator, generator.throw(error))
  }
}

function executeSync<T, G extends Generator<GeneratorValue<T>, T, T | Promise<T>>>(
  generator: G,
  result: IteratorResult<GeneratorValue<T>>
): T {
  if (result.done) return result.value
  try {
    const { unit, values } = result.value
    const value = unit[__meta].sync
      ? unit.factory(values)
      : Promise.resolve(unit.factory(values))
    return executeSync(generator, generator.next(value))
  } catch (error) {
    return executeSync(generator, generator.throw(error))
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
      if (!top) return
      for (const [key, value] of top.replace) context.set(key, value)
      for (const key of top.delete) context.delete(key)
      for (const [key, bindings] of top.bindings) graph.set(key, bindings)
    },
  }
}
