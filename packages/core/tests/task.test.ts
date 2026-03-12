import { describe, expect, it } from 'vitest'
import { createTask, resolveUnit } from '../src/index.js'

describe('Basic tasks', () => {
  it('should resolve single task', async () => {
    const GreetingTask = createTask(() => 'World')

    await expect(resolveUnit(GreetingTask)).resolves.toBe('World')
  })

  it('should resolve task with dependency', async () => {
    const NameTask = createTask(() => 'Alice').as('name')

    const GreetingTask = createTask({
      using: [NameTask],
      factory: (deps) => `Hello, ${deps.name}!`,
    })

    await expect(resolveUnit(GreetingTask)).resolves.toBe('Hello, Alice!')
  })

  it('should resolve task with symbol key', async () => {
    const AgeTask = createTask(() => 30)

    const key = Symbol('age')

    const MainTask = createTask({
      using: [AgeTask.as(key)],
      factory: (deps) => `Age is ${deps[key]}`,
    })

    await expect(resolveUnit(MainTask)).resolves.toBe('Age is 30')
  })

  it('should resolve nested dependencies', async () => {
    const FirstNameTask = createTask(() => 'John').as('firstName')

    const LastNameTask = createTask(() => 'Doe').as('lastName')

    const FullNameTask = createTask({
      using: [FirstNameTask, LastNameTask],
      factory: (deps) => `${deps.firstName} ${deps.lastName}`,
    }).as('fullName')

    const GreetingTask = createTask({
      using: [FullNameTask],
      factory: (deps) => `Hello, ${deps.fullName}!`,
    })

    await expect(resolveUnit(GreetingTask)).resolves.toBe('Hello, John Doe!')
  })

  it('should execute factory functions only once per task', async () => {
    let callCount = 0

    const CounterTask = createTask(() => {
      callCount++
      return 42
    }).as('counter')

    const FirstDependentTask = createTask({
      using: [CounterTask],
      factory: (deps) => deps.counter + 1,
    }).as('firstDependent')

    const SecondDependentTask = createTask({
      using: [CounterTask],
      factory: (deps) => deps.counter + 2,
    }).as('secondDependent')

    const MainTask = createTask({
      using: [FirstDependentTask, SecondDependentTask],
      factory: (deps) => deps.firstDependent + deps.secondDependent,
    })

    await expect(resolveUnit(MainTask)).resolves.toBe(87)
    expect(callCount).toBe(1)
  })
})

describe('Task naming', () => {
  it('should allow renaming tasks using as()', async () => {
    const OriginalTask = createTask(() => 100)

    const RenamedTask = OriginalTask.as('renamed')

    const DependentTask = createTask({
      using: [RenamedTask],
      factory: (deps) => deps.renamed + 50,
    })

    await expect(resolveUnit(DependentTask)).resolves.toBe(150)
  })
})

describe('Asynchronous factories', () => {
  it('should handle asynchronous factory functions', async () => {
    const AsyncTask = createTask(() => {
      return Promise.resolve(7)
    }).as('asyncValue')

    const DependentTask = createTask({
      using: [AsyncTask],
      factory: (deps) => deps.asyncValue * 3,
    })

    await expect(resolveUnit(DependentTask)).resolves.toBe(21)
  })
})
