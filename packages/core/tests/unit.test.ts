import { describe, expect, it } from 'vitest'
import { createUnit, resolveUnit } from '../src/index.js'

describe('Basic units', () => {
  it('should resolve single unit', async () => {
    const GreetingUnit = createUnit({
      name: 'greeting',
      factory: () => 'World',
    })

    await expect(resolveUnit(GreetingUnit)).resolves.toBe('World')
  })

  it('should resolve unit with dependency', async () => {
    const NameUnit = createUnit({
      name: 'name',
      factory: () => 'Alice',
    })

    const GreetingUnit = createUnit({
      name: 'greeting',
      using: [NameUnit],
      factory: (deps) => `Hello, ${deps.name}!`,
    })

    await expect(resolveUnit(GreetingUnit)).resolves.toBe('Hello, Alice!')
  })

  it('should resolve nested dependencies', async () => {
    const FirstNameUnit = createUnit({
      name: 'firstName',
      factory: () => 'John',
    })

    const LastNameUnit = createUnit({
      name: 'lastName',
      factory: () => 'Doe',
    })

    const FullNameUnit = createUnit({
      name: 'fullName',
      using: [FirstNameUnit, LastNameUnit],
      factory: (deps) => `${deps.firstName} ${deps.lastName}`,
    })

    const GreetingUnit = createUnit({
      name: 'greeting',
      using: [FullNameUnit],
      factory: (deps) => `Hello, ${deps.fullName}!`,
    })

    await expect(resolveUnit(GreetingUnit)).resolves.toBe('Hello, John Doe!')
  })

  it('should execute factory functions only once per unit', async () => {
    let callCount = 0

    const CounterUnit = createUnit({
      name: 'counter',
      factory: () => {
        callCount++
        return 42
      },
    })

    const FirstDependentUnit = createUnit({
      name: 'firstDependent',
      using: [CounterUnit],
      factory: (deps) => deps.counter + 1,
    })

    const SecondDependentUnit = createUnit({
      name: 'secondDependent',
      using: [CounterUnit],
      factory: (deps) => deps.counter + 2,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [FirstDependentUnit, SecondDependentUnit],
      factory: (deps) => deps.firstDependent + deps.secondDependent,
    })

    await expect(resolveUnit(MainUnit)).resolves.toBe(87)
    expect(callCount).toBe(1)
  })
})

describe('Unit naming', () => {
  it('should allow renaming units using as()', async () => {
    const OriginalUnit = createUnit({
      name: 'original',
      factory: () => 100,
    })

    const RenamedUnit = OriginalUnit.as('renamed')

    const DependentUnit = createUnit({
      name: 'dependent',
      using: [RenamedUnit],
      factory: (deps) => deps.renamed + 50,
    })

    await expect(resolveUnit(DependentUnit)).resolves.toBe(150)
  })
})

describe('Asynchronous factories', () => {
  it('should handle asynchronous factory functions', async () => {
    const AsyncUnit = createUnit({
      name: 'asyncValue',
      factory: () => {
        return new Promise<number>((resolve) => {
          setTimeout(() => resolve(7), 50)
        })
      },
    })

    const DependentUnit = createUnit({
      name: 'dependent',
      using: [AsyncUnit],
      factory: (deps) => deps.asyncValue * 3,
    })

    await expect(resolveUnit(DependentUnit)).resolves.toBe(21)
  })
})
