export const __meta: unique symbol = Symbol.for('@excilone/core:meta')

export type UnitKey = string | symbol

export type UnitType = 'task' | 'token' | 'binding'

export interface Meta<K extends UnitKey | null> {
  key: K
  identity: symbol
  type: UnitType
}
