import { describe, expect, it } from 'vitest'
import {
  CycleError,
  DuplicateDependencyError,
  ExecutionError,
  MissingBindingError,
} from '../src/errors.js'
import { createUnit, declareToken, resolveUnit } from '../src/index.js'

describe('Error handling', () => {
  it('should propagate errors from factory functions', async () => {
    const FailingUnit = createUnit({
      name: 'failing',
      factory: () => {
        throw new Error('Factory error')
      },
    })

    const DependentUnit = createUnit({
      name: 'dependent',
      using: [FailingUnit],
      factory: (deps) => deps.failing + 1,
    })

    await expect(resolveUnit(DependentUnit)).rejects.toThrow(ExecutionError)
  })

  it('should detect duplicate dependency names and throw an error', async () => {
    const Unit1 = createUnit({
      name: 'sharedDep',
      factory: () => 10,
    })

    const Unit2 = createUnit({
      name: 'sharedDep',
      factory: () => 20,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [Unit1, Unit2],
      factory: (deps) => deps.sharedDep + 5,
    })

    await expect(resolveUnit(MainUnit)).rejects.toThrow(DuplicateDependencyError)
  })
})

describe('Circular dependencies', () => {
  it('should detect circular dependencies and throw an error', async () => {
    const UnitA = createUnit({
      name: 'unitA',
      factory: () => 52,
    })

    const UnitB = createUnit({
      name: 'unitB',
      using: [UnitA],
      factory: (deps) => deps.unitA + 1,
    })

    // Introducing circular dependency
    UnitA.using.push(UnitB as never)

    await expect(resolveUnit(UnitA)).rejects.toThrow(CycleError)
  })

  it('should detect indirect circular dependencies and throw an error', async () => {
    const UnitX = createUnit({
      name: 'unitX',
      factory: () => 'X',
    })

    const UnitY = createUnit({
      name: 'unitY',
      using: [UnitX],
      factory: (deps) => `${deps.unitX}Y`,
    })

    const UnitZ = createUnit({
      name: 'unitZ',
      using: [UnitY],
      factory: (deps) => `${deps.unitY}Z`,
    })

    // Introducing indirect circular dependency
    UnitX.using.push(UnitZ as never)

    await expect(resolveUnit(UnitX)).rejects.toThrow(CycleError)
  })

  it('should handle self-referencing units and throw an error', async () => {
    const SelfRefUnit = createUnit({
      name: 'selfRef',
      factory: () => 'Self',
    })

    // Introducing self-reference
    SelfRefUnit.using.push(SelfRefUnit as never)

    await expect(resolveUnit(SelfRefUnit)).rejects.toThrow(CycleError)
  })
})

describe('Token binding errors', () => {
  it('should throw an error when a required token is not bound', async () => {
    const createToken = declareToken<number>()

    const Token = createToken('requiredToken')

    const MainUnit = createUnit({
      name: 'mainUnit',
      using: [Token],
      factory: (deps) => deps.requiredToken * 2,
    })

    await expect(resolveUnit(MainUnit)).rejects.toThrow(MissingBindingError)
  })

  it('should throw an error when a token is bound dynamically but required statically', async () => {
    const createToken = declareToken<string>()

    const DynamicToken = createToken('dynamicToken')

    const DynamicBindingUnit = createUnit({
      name: 'dynamicBindingUnit',
      using: [DynamicToken('dynamicValue')],
      factory: (deps) => deps.dynamicToken,
    })

    const MainUnit = createUnit({
      name: 'mainUnit',
      using: [DynamicBindingUnit, DynamicToken],
      factory: (deps) => deps.dynamicToken.toUpperCase(),
    })

    await expect(resolveUnit(MainUnit)).rejects.toThrow(MissingBindingError)
  })

  it('should throw an error when a binding is not in the correct scope', async () => {
    const createToken = declareToken<boolean>()

    const FlagToken = createToken('flagToken')

    const DependentUnit = createUnit({
      name: 'dependentUnit',
      using: [FlagToken],
      factory: (deps) => (deps.flagToken ? 'ON' : 'OFF'),
    })

    const MainUnit = createUnit({
      name: 'mainUnit',
      using: [DependentUnit, FlagToken(true)],
      factory: (deps) => deps.dependentUnit,
    })

    await expect(resolveUnit(MainUnit)).rejects.toThrow(MissingBindingError)
  })
})
