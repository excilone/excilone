import type { Container, Unit } from '../types.js'
import { createContext } from './context.js'
import { __meta } from './meta.js'
import { getValue, type Resolve } from './resolver.js'

export function createContainer(sync: false): Container<false>
export function createContainer(sync: true): Container<true>
export function createContainer(sync: boolean): Container<boolean> {
  return {
    get<T, USync extends boolean>(unit: Unit<T, USync>) {
      const ctx = createContext()
      const generator = getValue(unit, ctx)

      try {
        if (sync)
          return executeSync(generator, generator.next()) as USync extends true
            ? T
            : Promise<T>

        return execute(generator, generator.next())
      } catch (error) {
        if (sync) throw error
        return Promise.reject(error) as USync extends true ? T : Promise<T>
      }
    },
  }
}

async function execute<T, G extends Generator<Resolve<T>, T, T>>(
  generator: G,
  result: IteratorResult<Resolve<T>>
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

function executeSync<T, G extends Generator<Resolve<T>, T, T | Promise<T>>>(
  generator: G,
  result: IteratorResult<Resolve<T>>
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
