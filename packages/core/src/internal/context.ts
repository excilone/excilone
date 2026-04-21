import { CycleError } from '../errors.js'
import type { Unit } from '../types.js'
import { __meta, type UnitKey } from './meta.js'

export interface Context {
  has(unit: Unit): boolean
  get<T>(unit: Unit<T>): T | undefined

  isUpToDate(unit: Unit): boolean
  createScope<T>(unit: Unit<T>): Scope<T>
}

export interface Scope<T> {
  [Symbol.dispose](): void
  values: Record<UnitKey, unknown>

  addDependency(unit: Unit): void
  save(value: T): void
}

interface Change<T> {
  update: Map<symbol, T>
  delete: Set<symbol>
}

interface Node {
  context: Change<unknown>
  versions: Change<[number, symbol]>
}

export function createContext(): Context {
  const context = new Map<symbol, unknown>()
  // This map only tracks binding versions, the current level is determined by the current index in the stack.
  // The version is a symbol that changes every time the token is updated, thus allowing to track changes even if is updated in the same level.
  // Map<token, [level, version]>
  const versions = new Map<symbol, [number, symbol]>()
  // This map tracks the units that depend on a token, directly or indirectly, with the version of the token used when the dependency was resolved.
  // Map<unit, Map<token, [level, version]>>
  const dynamicDeps = new Map<symbol, Map<symbol, [number, symbol]>>()
  const stack: Node[] = []
  const resolving = new Set<symbol>()

  return {
    has(unit) {
      return context.has(unit[__meta].identity)
    },
    get<T>(unit: Unit) {
      return context.get(unit[__meta].identity) as T | undefined
    },

    isUpToDate(unit) {
      const deps = dynamicDeps.get(unit[__meta].identity)
      if (!deps) return true

      for (const [token, [, version]] of deps) {
        if (versions.get(token)?.[1] !== version) return false
      }

      return true
    },
    createScope<T>(unit: Unit<T>) {
      const id = unit[__meta].identity
      const deps = new Map<symbol, [number, symbol]>()

      if (resolving.has(id))
        throw new CycleError([...resolving, id].map((id) => id.toString()))
      resolving.add(id)

      stack.push({
        context: { update: new Map(), delete: new Set() },
        versions: { update: new Map(), delete: new Set() },
      })

      return {
        values: {},
        [Symbol.dispose]: () => {
          resolving.delete(id)
          const node = stack.pop()
          if (!node) return

          for (const [id, version] of node.versions.update) versions.set(id, version)
          for (const id of node.versions.delete) versions.delete(id)

          for (const [id, val] of node.context.update) context.set(id, val)
          for (const id of node.context.delete) context.delete(id)
        },

        addDependency(dep) {
          const depId = dep[__meta].identity
          const version = versions.get(depId)
          if (version) deps.set(depId, version)

          for (const [token, state] of dynamicDeps.get(depId) ?? [])
            if (!deps.has(token)) deps.set(token, state)
        },
        save(v: T) {
          if (unit[__meta].bind) {
            const parent = stack.at(-2)
            if (parent) {
              const version = versions.get(id)
              if (version) parent.versions.update.set(id, version)
              else parent.versions.delete.add(id)

              if (context.has(id)) parent.context.update.set(id, context.get(id))
              else parent.context.delete.add(id)

              versions.set(id, [stack.length - 2, Symbol()])
            }
          }

          if (deps.size > 0) {
            dynamicDeps.set(id, deps)
            const values = deps.values()
            const first = values.next()
            let level = first.value?.[0] as number

            if (!first.done)
              level = values.reduce((max, [level]) => Math.min(max, level), level)

            const node = stack.at(level)
            if (node) {
              if (context.has(id)) node.context.update.set(id, context.get(id))
              else node.context.delete.add(id)
            }
          }

          context.set(id, v)
        },
      }
    },
  }
}
