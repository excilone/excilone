import { MissingBindingError } from '../errors.js'
import type { Binding, Token } from '../types.js'
import { createUnit } from './unit.js'

function createBinding<T, const N extends string>(
  id: symbol,
  name: N,
  value: T
): Binding<T, N> {
  return {
    ...createUnit<T, N, []>(id, 'binding', {
      name,
      using: [],
      factory: () => value,
    }),
    as<NewName extends string>(newName: NewName): Binding<T, NewName> {
      return createBinding(id, newName, value)
    },
  }
}

export function createToken<T, const N extends string>(id: symbol, name: N): Token<T, N> {
  const providerFn = (data: T): Binding<T, N> => createBinding(id, name, data)

  // TODO: use Proxy to make name read-only in a better way
  Object.defineProperty(providerFn, 'name', {
    value: name,
    configurable: true,
  })

  const { name: _, ...rest } = createUnit<T, N, []>(id, 'token', {
    name,
    using: [],
    factory: () => {
      throw new MissingBindingError(name)
    },
  })

  return Object.assign(providerFn, {
    ...rest,
    as<NewName extends string>(newName: NewName): Token<T, NewName> {
      return createToken(id, newName)
    },
  }) as Token<T, N>
}
