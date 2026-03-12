import { describe, expect, it } from 'vitest'
import {
  CycleError,
  DuplicateDependencyError,
  ExecutionError,
  MissingBindingError,
} from '../src/errors.js'
import { createTask, createToken, resolveUnit } from '../src/index.js'

describe('Error handling', () => {
  it('should propagate errors from factory functions', async () => {
    const FailingTask = createTask({
      factory: () => {
        throw new Error('Factory error')
      },
    })

    const DependentTask = createTask({
      using: [FailingTask.as('failing')],
      factory: (deps) => deps.failing + 1,
    })

    await expect(resolveUnit(DependentTask)).rejects.toThrow(ExecutionError)
  })

  it('should detect duplicate dependency names and throw an error', async () => {
    const Task1 = createTask({
      factory: () => 10,
    })

    const Task2 = createTask({
      factory: () => 20,
    })

    const MainTask = createTask({
      using: [Task1.as('sharedDep'), Task2.as('sharedDep')],
      factory: (deps) => deps.sharedDep + 5,
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(DuplicateDependencyError)
  })
})

describe('Circular dependencies', () => {
  it('should detect circular dependencies and throw an error', async () => {
    const TaskA = createTask({
      factory: () => 52,
    })

    const TaskB = createTask({
      using: [TaskA.as('taskA')],
      factory: (deps) => deps.taskA + 1,
    })

    // Introducing circular dependency
    TaskA.using.push(TaskB as never)

    await expect(resolveUnit(TaskA)).rejects.toThrow(CycleError)
  })

  it('should detect indirect circular dependencies and throw an error', async () => {
    const TaskX = createTask({
      factory: () => 'X',
    })

    const TaskY = createTask({
      using: [TaskX.as('taskX')],
      factory: (deps) => `${deps.taskX}Y`,
    })

    const TaskZ = createTask({
      using: [TaskY.as('taskY')],
      factory: (deps) => `${deps.taskY}Z`,
    })

    // Introducing indirect circular dependency
    TaskX.using.push(TaskZ as never)

    await expect(resolveUnit(TaskX)).rejects.toThrow(CycleError)
  })

  it('should handle self-referencing tasks and throw an error', async () => {
    const SelfRefTask = createTask({
      factory: () => 'Self',
    })

    // Introducing self-reference
    SelfRefTask.using.push(SelfRefTask as never)

    await expect(resolveUnit(SelfRefTask)).rejects.toThrow(CycleError)
  })
})

describe('Token binding errors', () => {
  it('should throw an error when a required token is not bound', async () => {
    const Token = createToken<number>()

    const MainTask = createTask({
      using: [Token.as('requiredToken')],
      factory: (deps) => deps.requiredToken * 2,
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(MissingBindingError)
  })

  it('should throw an error when a token is bound dynamically but required statically', async () => {
    const DynamicToken = createToken<string>()

    const DynamicBindingTask = createTask({
      using: [DynamicToken.bind('dynamicValue').as('dynamicToken')],
      factory: (deps) => deps.dynamicToken,
    })

    const MainTask = createTask({
      using: [DynamicBindingTask, DynamicToken.as('dynamicToken')],
      factory: (deps) => deps.dynamicToken.toUpperCase(),
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(MissingBindingError)
  })

  it('should throw an error when a binding is not in the correct scope', async () => {
    const FlagToken = createToken<boolean>().as('flagToken')

    const DependentTask = createTask({
      using: [FlagToken],
      factory: (deps) => (deps.flagToken ? 'ON' : 'OFF'),
    }).as('dependentTask')

    const MainTask = createTask({
      using: [DependentTask, FlagToken.bind(true)],
      factory: (deps) => deps.dependentTask,
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(MissingBindingError)
  })
})
