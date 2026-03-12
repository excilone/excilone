import { describe, expect, it } from 'vitest'
import { createTask, resolveUnit } from '../src/index.js'

describe('Basic tasks', () => {
  it('should resolve single task', async () => {
    const GreetingTask = createTask({
      name: 'greeting',
      factory: () => 'World',
    })

    await expect(resolveUnit(GreetingTask)).resolves.toBe('World')
  })

  it('should resolve task with dependency', async () => {
    const NameTask = createTask({
      name: 'name',
      factory: () => 'Alice',
    })

    const GreetingTask = createTask({
      name: 'greeting',
      using: [NameTask],
      factory: (deps) => `Hello, ${deps.name}!`,
    })

    await expect(resolveUnit(GreetingTask)).resolves.toBe('Hello, Alice!')
  })

  it('should resolve nested dependencies', async () => {
    const FirstNameTask = createTask({
      name: 'firstName',
      factory: () => 'John',
    })

    const LastNameTask = createTask({
      name: 'lastName',
      factory: () => 'Doe',
    })

    const FullNameTask = createTask({
      name: 'fullName',
      using: [FirstNameTask, LastNameTask],
      factory: (deps) => `${deps.firstName} ${deps.lastName}`,
    })

    const GreetingTask = createTask({
      name: 'greeting',
      using: [FullNameTask],
      factory: (deps) => `Hello, ${deps.fullName}!`,
    })

    await expect(resolveUnit(GreetingTask)).resolves.toBe('Hello, John Doe!')
  })

  it('should execute factory functions only once per task', async () => {
    let callCount = 0

    const CounterTask = createTask({
      name: 'counter',
      factory: () => {
        callCount++
        return 42
      },
    })

    const FirstDependentTask = createTask({
      name: 'firstDependent',
      using: [CounterTask],
      factory: (deps) => deps.counter + 1,
    })

    const SecondDependentTask = createTask({
      name: 'secondDependent',
      using: [CounterTask],
      factory: (deps) => deps.counter + 2,
    })

    const MainTask = createTask({
      name: 'main',
      using: [FirstDependentTask, SecondDependentTask],
      factory: (deps) => deps.firstDependent + deps.secondDependent,
    })

    await expect(resolveUnit(MainTask)).resolves.toBe(87)
    expect(callCount).toBe(1)
  })
})

describe('Task naming', () => {
  it('should allow renaming tasks using as()', async () => {
    const OriginalTask = createTask({
      name: 'original',
      factory: () => 100,
    })

    const RenamedTask = OriginalTask.as('renamed')

    const DependentTask = createTask({
      name: 'dependent',
      using: [RenamedTask],
      factory: (deps) => deps.renamed + 50,
    })

    await expect(resolveUnit(DependentTask)).resolves.toBe(150)
  })
})

describe('Asynchronous factories', () => {
  it('should handle asynchronous factory functions', async () => {
    const AsyncTask = createTask({
      name: 'asyncValue',
      factory: () => {
        return new Promise<number>((resolve) => {
          setTimeout(() => resolve(7), 50)
        })
      },
    })

    const DependentTask = createTask({
      name: 'dependent',
      using: [AsyncTask],
      factory: (deps) => deps.asyncValue * 3,
    })

    await expect(resolveUnit(DependentTask)).resolves.toBe(21)
  })
})
