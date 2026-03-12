export const __meta: unique symbol = Symbol.for('@excilone/core:meta')

export type UnitType = 'task' | 'token' | 'binding'

export interface Meta {
  identity: symbol
  type: UnitType
}
