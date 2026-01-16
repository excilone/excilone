import type { __identity } from './constants.js'

export interface Unit<
  T = unknown,
  N extends string = string,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly Unit[] = any,
> extends UnitPayload<T, N, D> {
  readonly [__identity]: symbol
  as<NewName extends string>(name: NewName): Unit<T, NewName, D>
}

export interface UnitPayload<T, N extends string, D extends readonly Unit[]> {
  readonly name: N
  readonly using: D
  readonly factory: (deps: MapUnits<D>) => T | Promise<T>
}

export type MapUnits<D extends readonly Unit[]> = {
  [K in D[number] as K['name']]: InferReturnType<K>
}

export type InferReturnType<U> = U extends Unit<infer T> ? T : never
