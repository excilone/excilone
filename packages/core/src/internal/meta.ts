export const __meta: unique symbol = Symbol.for('@excilone/core:meta')

export type UnitKey = string | symbol

export interface Meta<K extends UnitKey | null> {
  key: K
  identity: symbol
  bind: boolean
  sync: boolean
}
