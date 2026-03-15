import { MissingBindingError } from '../errors.js'
import type { Token, Unit } from '../types.js'
import type { UnitKey } from './meta.js'
import { createUnit } from './unit.js'

function createBinding<T, const K extends UnitKey | null>(
  id: symbol,
  key: K,
  value: T
): Unit<T, true, K, []> {
  return createUnit(id, true, key, 'binding', {
    using: [],
    factory: () => value,
  })
}

export function createToken<T, const N extends UnitKey | null>(
  id: symbol,
  name: N
): Token<T, N> {
  return {
    ...createUnit(id, true, name, 'token', {
      using: [],
      factory: () => {
        throw new MissingBindingError(String(id))
      },
    }),
    as(newKey) {
      return createToken(id, newKey)
    },
    bind(data: T) {
      return createBinding(id, name, data)
    },
  }
}
