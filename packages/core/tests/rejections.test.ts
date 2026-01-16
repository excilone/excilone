import { describe, expect, it } from 'vitest'
import { createUnit, resolveUnit } from '../src/index.js'

describe('Error handling', () => {
  it('should propagate errors from factory functions', async () => {
    const FailingUnit = createUnit({
      name: 'failing',
      using: [],
      factory: () => {
        throw new Error('Factory error')
      },
    })

    const DependentUnit = createUnit({
      name: 'dependent',
      using: [FailingUnit],
      factory: (deps) => deps.failing + 1,
    })

    await expect(resolveUnit(DependentUnit)).rejects.toThrow('Factory error')
  })

  it('should detect duplicate dependency names and throw an error', async () => {
    const Unit1 = createUnit({
      name: 'sharedDep',
      using: [],
      factory: () => 10,
    })

    const Unit2 = createUnit({
      name: 'sharedDep',
      using: [],
      factory: () => 20,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [Unit1, Unit2],
      factory: (deps) => deps.sharedDep + 5,
    })

    await expect(resolveUnit(MainUnit)).rejects.toThrow(
      /^Duplicate dependency name detected: sharedDep in unit: main .*/g
    )
  })
})

describe('Circular dependencies', () => {
  it('should detect circular dependencies and throw an error', async () => {
    const UnitA = createUnit({
      name: 'unitA',
      using: [],
      factory: () => 52,
    })

    const UnitB = createUnit({
      name: 'unitB',
      using: [UnitA],
      factory: (deps) => deps.unitA + 1,
    })

    // Introducing circular dependency
    UnitA.using.push(UnitB as never)

    await expect(resolveUnit(UnitA)).rejects.toThrow(/^Circular dependency detected.*/g)
  })

  it('should detect indirect circular dependencies and throw an error', async () => {
    const UnitX = createUnit({
      name: 'unitX',
      using: [],
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

    await expect(resolveUnit(UnitX)).rejects.toThrow(/^Circular dependency detected.*/g)
  })

  it('should handle self-referencing units and throw an error', async () => {
    const SelfRefUnit = createUnit({
      name: 'selfRef',
      using: [],
      factory: () => 'Self',
    })

    // Introducing self-reference
    SelfRefUnit.using.push(SelfRefUnit as never)

    await expect(resolveUnit(SelfRefUnit)).rejects.toThrow(
      /^Circular dependency detected.*/g
    )
  })
})
