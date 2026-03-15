import type { __meta, Meta, UnitKey } from './internal/meta.js'

export type Factory<T, S extends boolean, D extends readonly Unit[]> = (
  deps: MapUnits<D, S>
) => T

export interface CoreUnit<T, S extends boolean, D extends readonly Unit[]> {
  readonly using: D
  readonly factory: Factory<T, S, D>
}

export interface Unit<
  T = unknown,
  S extends boolean = boolean,
  K extends UnitKey | null = UnitKey | null,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly Unit[] = any,
> extends CoreUnit<T, S, D> {
  readonly [__meta]: Meta<K>
  as<NewKey extends UnitKey>(k: NewKey): Unit<T, S, NewKey, D>
}

export interface Token<T, K extends UnitKey | null> extends Unit<T, true, K, []> {
  as<NewKey extends UnitKey>(k: NewKey): Token<T, NewKey>
  bind(data: T): Unit<T, true, K, []>
}

export interface Container<S extends boolean> {
  get<T>(unit: Unit<T>): S extends true ? T : Promise<T>
}

export type MapUnits<D extends readonly Unit[], S extends boolean> = {
  [K in D[number] as K extends Unit<unknown, boolean, infer N extends UnitKey>
    ? N
    : never]: K extends Unit<infer T, infer CSync>
    ? CSync extends true
      ? T
      : S extends true
        ? Promise<T>
        : Awaited<T>
    : never
}
