import { DuplicateDependencyError, ExciloneError, ExecutionError } from '../errors.js'
import type { Unit } from '../types.js'
import type { Context } from './context.js'
import { __meta, type UnitKey } from './meta.js'

export interface Resolve<T> {
  unit: Unit<T>
  values: Record<UnitKey, unknown>
}

export function* getValue<T>(
  unit: Unit<T>,
  context: Context
): Generator<Resolve<T>, T, T> {
  if (context.has(unit) && context.isUpToDate(unit) && !unit[__meta].bind)
    return context.get(unit) as T

  try {
    return yield* resolveValue(unit, context)
  } catch (error) {
    if (error instanceof ExciloneError) throw error
    throw new ExecutionError(unit[__meta].identity.toString(), error)
  }
}

function* resolveValue<T>(unit: Unit<T>, context: Context): Generator<Resolve<T>, T, T> {
  using scope = context.createScope(unit)

  for (const dep of unit.using as readonly Unit[]) {
    if (dep[__meta].key !== null && dep[__meta].key in scope.values)
      throw new DuplicateDependencyError(
        unit[__meta].identity.toString(),
        dep[__meta].key.toString()
      )

    const value = yield* getValue(dep as Unit<T>, context)
    if (dep[__meta].key !== null) scope.values[dep[__meta].key] = value

    scope.addDependency(dep)
  }

  const value = yield execute(unit, scope.values)
  scope.save(value)

  return value
}

function execute<T>(unit: Unit<T>, values: Record<symbol, unknown>): Resolve<T> {
  return { unit, values }
}
