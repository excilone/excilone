import type { __bind, __identity } from './constants.js'

export interface Unit<
  T = unknown,
  N extends string = string,
  // biome-ignore lint/suspicious/noExplicitAny: any needed for generic constraints
  D extends readonly Unit[] = any,
> extends UnitPayload<T, N, D> {
  readonly [__identity]: symbol
  as<NewName extends string>(name: NewName): Unit<T, NewName, D>
}

export interface Token<T, N extends string> extends BindingUnit<T, N, false> {
  (data: T): Binding<T, N>
  as<NewName extends string>(name: NewName): Token<T, NewName>
}

export interface Binding<T, N extends string> extends BindingUnit<T, N, true> {
  as<NewName extends string>(name: NewName): Binding<T, NewName>
}

export interface UnitPayload<T, N extends string, D extends readonly Unit[]> {
  readonly name: N
  readonly using: D
  readonly factory: (deps: MapUnits<D>) => T | Promise<T>
}

export interface TokenDeclaration<T> {
  // biome-ignore lint/style/useShorthandFunctionType: this interface will be updated
  <N extends string>(name: N): Token<T, N>
}

export interface BindingUnit<T, N extends string, B extends boolean>
  extends Unit<T, N, []> {
  readonly [__bind]: B
}

export type MapUnits<D extends readonly Unit[]> = {
  [K in D[number] as K['name']]: InferReturnType<K>
}

export type InferReturnType<U> = U extends Unit<infer T> ? T : never
