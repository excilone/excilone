import type { CoreUnit, Unit } from '../types.js'
import { __meta, type UnitKey } from './meta.js'

export function createUnit<
  T,
  S extends boolean,
  K extends UnitKey | null,
  D extends readonly Unit[],
>(id: symbol, sync: S, key: K, bind: boolean, payload: CoreUnit<T, S, D>) {
  return {
    ...payload,
    [__meta]: {
      identity: id,
      bind,
      key,
      sync,
    },
    as(newKey) {
      return createUnit(id, sync, newKey, bind, payload)
    },
  } as Unit<S extends true ? T : Awaited<T>, S, K, D>
}
