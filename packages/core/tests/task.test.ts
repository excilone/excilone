import { describe, expect, it } from 'vitest'
import { createSyncTask, createTask, resolve, resolveSync } from '../src/index.js'

describe('Basic tasks', () => {
  it('should resolve single task', () => {
    const GreetingTask = createSyncTask(() => 'World')

    expect(resolveSync(GreetingTask)).toBe('World')
  })

  it('should resolve task with dependency', () => {
    const NameTask = createSyncTask(() => 'Alice').as('name')

    const GreetingTask = createSyncTask({
      using: [NameTask],
      factory: (deps) => `Hello, ${deps.name}!`,
    })

    expect(resolveSync(GreetingTask)).toBe('Hello, Alice!')
  })

  it('should resolve task with symbol key', () => {
    const NameTask = createSyncTask(() => 'Bob')
    const AgeTask = createSyncTask(() => 30)

    const name = Symbol('name')
    const age = Symbol('age')

    const HumanTask = createSyncTask({
      using: [NameTask.as(name), AgeTask.as(age)],
      factory: (deps) => {
        const n = deps[name]
        const a = deps[age]

        return `Your name is ${n} and your age is ${a}`
      },
    })

    expect(resolveSync(HumanTask)).toBe('Your name is Bob and your age is 30')
  })

  it('should resolve nested dependencies', () => {
    const FirstNameTask = createSyncTask(() => 'John').as('firstName')

    const LastNameTask = createSyncTask(() => 'Doe').as('lastName')

    const FullNameTask = createSyncTask({
      using: [FirstNameTask, LastNameTask],
      factory: (deps) => `${deps.firstName} ${deps.lastName}`,
    }).as('fullName')

    const GreetingTask = createSyncTask({
      using: [FullNameTask],
      factory: (deps) => `Hello, ${deps.fullName}!`,
    })

    expect(resolveSync(GreetingTask)).toBe('Hello, John Doe!')
  })

  it('should execute factory functions only once per task', () => {
    let callCount = 0

    const CounterTask = createSyncTask(() => {
      callCount++
      return 42
    }).as('counter')

    const FirstDependentTask = createSyncTask({
      using: [CounterTask],
      factory: (deps) => deps.counter + 1,
    }).as('firstDependent')

    const SecondDependentTask = createSyncTask({
      using: [CounterTask],
      factory: (deps) => deps.counter + 2,
    }).as('secondDependent')

    const MainTask = createSyncTask({
      using: [FirstDependentTask, SecondDependentTask],
      factory: (deps) => deps.firstDependent + deps.secondDependent,
    })

    expect(resolveSync(MainTask)).toBe(87)
    expect(callCount).toBe(1)
  })
})

describe('Task naming', () => {
  it('should allow renaming tasks using as()', () => {
    const OriginalTask = createSyncTask(() => 100)

    const RenamedTask = OriginalTask.as('renamed')

    const DependentTask = createSyncTask({
      using: [RenamedTask],
      factory: (deps) => deps.renamed + 50,
    })

    expect(resolveSync(DependentTask)).toBe(150)
  })
})

describe('Asynchronous factories', () => {
  it('should handle asynchronous factory functions', () => {
    const AsyncTask = createTask(() => Promise.resolve(7)).as('asyncValue')

    const DependentTask = createTask({
      using: [AsyncTask],
      factory: (deps) => deps.asyncValue * 3,
    })

    return expect(resolve(DependentTask)).resolves.toBe(21)
  })
})
