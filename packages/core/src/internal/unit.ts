import type { Task, Unit, UnitPayload } from '../types.js'
import { __bind, __identity } from './constants.js'

export function createUnit<T, const N extends string, D extends readonly Unit[]>(
  id: symbol,
  payload: UnitPayload<T, N, D>
): Task<T, N, D> {
  return {
    ...payload,
    using: payload.using ?? ([] as unknown as D),
    [__identity]: id,
    [__bind]: false,
    as(name) {
      return createUnit(id, {
        ...payload,
        name,
      })
    },
  }
}
