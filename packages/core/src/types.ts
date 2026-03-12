import type { __meta, Meta, UnitKey } from './internal/meta.js'

export interface CoreUnit<T, D extends readonly Unit[]> {
  readonly using: D
  readonly factory: (deps: MapUnits<D>) => T | Promise<T>
}

export interface Unit<
  T = unknown,
  K extends UnitKey | null = UnitKey | null,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly Unit[] = any,
> extends CoreUnit<T, D> {
  readonly [__meta]: Meta<K>
  as<NewKey extends UnitKey>(k: NewKey): Unit<T, NewKey, D>
}

export interface Token<T, K extends UnitKey | null> extends Unit<T, K, []> {
  as<NewKey extends UnitKey>(k: NewKey): Token<T, NewKey>
  bind(data: T): Unit<T, K, []>
}

export type MapUnits<D extends readonly Unit[]> = {
  [K in D[number] as K extends Unit<unknown, infer N extends UnitKey>
    ? N
    : never]: InferReturnType<K>
}

export type InferReturnType<U> = U extends Unit<infer T> ? T : never
