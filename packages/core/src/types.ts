import type { __bind, __identity } from './constants.js'

export interface Unit<
  T = unknown,
  N extends string = string,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly BaseUnit[] = any,
> extends BaseUnit<T, N, D, false> {
  as<NewName extends string>(name: NewName): Unit<T, NewName, D>
}

export interface Token<T, N extends string> extends BaseUnit<T, N, [], false> {
  (data: T): Binding<T, N>
  as<NewName extends string>(name: NewName): Token<T, NewName>
}

export interface Binding<T, N extends string> extends BaseUnit<T, N, [], true> {
  as<NewName extends string>(name: NewName): Binding<T, NewName>
}

export interface BaseUnit<
  T = unknown,
  N extends string = string,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly BaseUnit[] = any,
  B extends boolean = boolean,
> extends UnitPayload<T, N, D> {
  readonly [__identity]: symbol
  readonly [__bind]: B
  // all units can be renamed
  as<NewName extends string>(name: NewName): BaseUnit<T, NewName, D, B>
}

export interface UnitPayload<T, N extends string, D extends readonly BaseUnit[]> {
  readonly name: N
  readonly using: D
  readonly factory: (deps: MapUnits<D>) => T | Promise<T>
}

export interface TokenDeclaration<T> {
  // biome-ignore lint/style/useShorthandFunctionType: this interface will be updated
  <N extends string>(name: N): Token<T, N>
}

export type MapUnits<D extends readonly BaseUnit[]> = {
  [K in D[number] as K['name']]: InferReturnType<K>
}

export type InferReturnType<U> = U extends BaseUnit<infer T> ? T : never
