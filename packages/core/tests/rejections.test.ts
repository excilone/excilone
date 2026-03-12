import { describe, expect, it } from 'vitest'
import {
  CycleError,
  DuplicateDependencyError,
  ExecutionError,
  MissingBindingError,
} from '../src/errors.js'
import { createTask, declareToken, resolveUnit } from '../src/index.js'

describe('Error handling', () => {
  it('should propagate errors from factory functions', async () => {
    const FailingTask = createTask({
      name: 'failing',
      factory: () => {
        throw new Error('Factory error')
      },
    })

    const DependentTask = createTask({
      name: 'dependent',
      using: [FailingTask],
      factory: (deps) => deps.failing + 1,
    })

    await expect(resolveUnit(DependentTask)).rejects.toThrow(ExecutionError)
  })

  it('should detect duplicate dependency names and throw an error', async () => {
    const Task1 = createTask({
      name: 'sharedDep',
      factory: () => 10,
    })

    const Task2 = createTask({
      name: 'sharedDep',
      factory: () => 20,
    })

    const MainTask = createTask({
      name: 'main',
      using: [Task1, Task2],
      factory: (deps) => deps.sharedDep + 5,
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(DuplicateDependencyError)
  })
})

describe('Circular dependencies', () => {
  it('should detect circular dependencies and throw an error', async () => {
    const TaskA = createTask({
      name: 'taskA',
      factory: () => 52,
    })

    const TaskB = createTask({
      name: 'taskB',
      using: [TaskA],
      factory: (deps) => deps.taskA + 1,
    })

    // Introducing circular dependency
    TaskA.using.push(TaskB as never)

    await expect(resolveUnit(TaskA)).rejects.toThrow(CycleError)
  })

  it('should detect indirect circular dependencies and throw an error', async () => {
    const TaskX = createTask({
      name: 'taskX',
      factory: () => 'X',
    })

    const TaskY = createTask({
      name: 'taskY',
      using: [TaskX],
      factory: (deps) => `${deps.taskX}Y`,
    })

    const TaskZ = createTask({
      name: 'taskZ',
      using: [TaskY],
      factory: (deps) => `${deps.taskY}Z`,
    })

    // Introducing indirect circular dependency
    TaskX.using.push(TaskZ as never)

    await expect(resolveUnit(TaskX)).rejects.toThrow(CycleError)
  })

  it('should handle self-referencing tasks and throw an error', async () => {
    const SelfRefTask = createTask({
      name: 'selfRef',
      factory: () => 'Self',
    })

    // Introducing self-reference
    SelfRefTask.using.push(SelfRefTask as never)

    await expect(resolveUnit(SelfRefTask)).rejects.toThrow(CycleError)
  })
})

describe('Token binding errors', () => {
  it('should throw an error when a required token is not bound', async () => {
    const createToken = declareToken<number>()

    const Token = createToken('requiredToken')

    const MainTask = createTask({
      name: 'main',
      using: [Token],
      factory: (deps) => deps.requiredToken * 2,
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(MissingBindingError)
  })

  it('should throw an error when a token is bound dynamically but required statically', async () => {
    const createToken = declareToken<string>()

    const DynamicToken = createToken('dynamicToken')

    const DynamicBindingTask = createTask({
      name: 'dynamicBindingTask',
      using: [DynamicToken('dynamicValue')],
      factory: (deps) => deps.dynamicToken,
    })

    const MainTask = createTask({
      name: 'mainTask',
      using: [DynamicBindingTask, DynamicToken],
      factory: (deps) => deps.dynamicToken.toUpperCase(),
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(MissingBindingError)
  })

  it('should throw an error when a binding is not in the correct scope', async () => {
    const createToken = declareToken<boolean>()

    const FlagToken = createToken('flagToken')

    const DependentTask = createTask({
      name: 'dependentTask',
      using: [FlagToken],
      factory: (deps) => (deps.flagToken ? 'ON' : 'OFF'),
    })

    const MainTask = createTask({
      name: 'mainTask',
      using: [DependentTask, FlagToken(true)],
      factory: (deps) => deps.dependentTask,
    })

    await expect(resolveUnit(MainTask)).rejects.toThrow(MissingBindingError)
  })
})
