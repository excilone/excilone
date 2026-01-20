import { __bind } from './constants.js'
import { MissingBindingError } from './errors.js'
import type { Binding, Token } from './types.js'
import { createUnitInternal } from './unit.js'

function createBindingInternal<T, const N extends string>(
  id: symbol,
  name: N,
  value: T
): Binding<T, N> {
  return {
    ...createUnitInternal<T, N, []>(id, {
      name,
      using: [],
      factory: () => value,
    }),
    [__bind]: true,
    as<NewName extends string>(newName: NewName): Binding<T, NewName> {
      return createBindingInternal(id, newName, value)
    },
  }
}

export function createTokenInternal<T, const N extends string>(
  id: symbol,
  name: N
): Token<T, N> {
  const providerFn = (data: T): Binding<T, N> => createBindingInternal(id, name, data)

  // TODO: use Proxy to make name read-only in a better way
  Object.defineProperty(providerFn, 'name', {
    value: name,
    configurable: true,
  })

  const { name: _, ...rest } = createUnitInternal<T, N, []>(id, {
    name,
    using: [],
    factory: () => {
      throw new MissingBindingError(name)
    },
  })

  return Object.assign(providerFn, {
    ...rest,
    [__bind]: false as const,
    as<NewName extends string>(newName: NewName): Token<T, NewName> {
      return createTokenInternal(id, newName)
    },
  }) as Token<T, N>
}
