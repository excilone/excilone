import type { __bind, __identity } from './internal/constants.js'

export interface Task<
  T = unknown,
  N extends string = string,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly Unit[] = any,
> extends Unit<T, N, D, false> {
  as<NewName extends string>(name: NewName): Task<T, NewName, D>
}

export interface Token<T, N extends string> extends Unit<T, N, [], false> {
  (data: T): Binding<T, N>
  as<NewName extends string>(name: NewName): Token<T, NewName>
}

export interface Binding<T, N extends string> extends Unit<T, N, [], true> {
  as<NewName extends string>(name: NewName): Binding<T, NewName>
}

export interface Unit<
  T = unknown,
  N extends string = string,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly Unit[] = any,
  B extends boolean = boolean,
> extends UnitPayload<T, N, D> {
  readonly [__identity]: symbol
  readonly [__bind]: B
  readonly using: D
  // all units can be renamed
  as<NewName extends string>(name: NewName): Unit<T, NewName, D, B>
}

export interface UnitPayload<T, N extends string, D extends readonly Unit[]> {
  readonly name: N
  readonly using?: D
  readonly factory: (deps: MapUnits<D>) => T | Promise<T>
}

export interface TokenDeclaration<T> {
  // biome-ignore lint/style/useShorthandFunctionType: this interface will be updated
  <N extends string>(name: N): Token<T, N>
}

export type MapUnits<D extends readonly Unit[]> = {
  [K in D[number] as K['name']]: InferReturnType<K>
}

export type InferReturnType<U> = U extends Unit<infer T> ? T : never
