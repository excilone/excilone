import { describe, expect, it } from 'vitest'
import { createTask, declareToken, resolveUnit } from '../src/index.js'

describe('Token and Binding creation', () => {
  it('should create a token and binding correctly', async () => {
    const createToken = declareToken<string>()

    const NameToken = createToken('name')

    const GreetingTask = createTask({
      name: 'greeting',
      using: [NameToken('World')],
      factory: (deps) => `Hello, ${deps.name}`,
    })

    await expect(resolveUnit(GreetingTask)).resolves.toBe('Hello, World')
  })

  it('should use the nearest binding', async () => {
    const createToken = declareToken<number>()

    const AgeToken = createToken('age')

    const PersonTask = createTask({
      name: 'person',
      using: [AgeToken],
      factory: (deps) => ({ age: deps.age }),
    })

    const MainTask = createTask({
      name: 'main',
      using: [
        AgeToken(30),
        PersonTask,
        AgeToken(12).as('childAge'),
        PersonTask.as('childPerson'),
      ],
      factory: (deps) => ({
        personAge: deps.person.age,
        childPersonAge: deps.childPerson.age,
      }),
    })

    await expect(resolveUnit(MainTask)).resolves.toEqual({
      personAge: 30,
      childPersonAge: 12,
    })
  })

  it('should use the nearest nested binding', async () => {
    const createToken = declareToken<string>()

    const ColorToken = createToken('color')

    const ForegroundTask = createTask({
      name: 'fg',
      using: [ColorToken],
      factory: (deps) => `Foreground color is: ${deps.color}`,
    })

    const OuterTask = createTask({
      name: 'outer',
      using: [ColorToken('blue'), ForegroundTask],
      factory: (deps) => `Outer task says: ${deps.fg}`,
    })

    const MainTask = createTask({
      name: 'main',
      using: [ColorToken('red'), ForegroundTask, OuterTask],
      factory: (deps) => `Main task says: ${deps.fg}. ${deps.outer}.`,
    })

    await expect(resolveUnit(MainTask)).resolves.toBe(
      'Main task says: Foreground color is: red. Outer task says: Foreground color is: blue.'
    )
  })

  it('should not override bindings in sibling units', async () => {
    const createToken = declareToken<boolean>()

    const FlagToken = createToken('flag')

    const TaskA = createTask({
      name: 'taskA',
      using: [FlagToken(true)],
      factory: (deps) => `Flag is ${deps.flag}`,
    })

    const TaskB = createTask({
      name: 'taskB',
      using: [FlagToken(false)],
      factory: (deps) => `Flag is ${deps.flag}`,
    })

    const MainTask = createTask({
      name: 'main',
      using: [TaskA, TaskB],
      factory: (deps) => `${deps.taskA}; ${deps.taskB}`,
    })

    await expect(resolveUnit(MainTask)).resolves.toBe('Flag is true; Flag is false')
  })

  it('should not override units when declaring new bindings', async () => {
    const createToken = declareToken<number>()

    const SizeToken = createToken('size')

    const SizeTask = createTask({
      name: 'sizeTask',
      using: [SizeToken],
      factory: (deps) => deps.size + 10,
    })

    const MainTask = createTask({
      name: 'main',
      using: [SizeToken(5), SizeTask, SizeToken(20).as('sizeToken')],
      factory: (deps) => ({
        sizeUnitValue: deps.sizeTask,
        sizeTokenValue: deps.sizeToken,
      }),
    })

    await expect(resolveUnit(MainTask)).resolves.toEqual({
      sizeUnitValue: 15,
      sizeTokenValue: 20,
    })
  })

  it('should execute factory functions only once per binding', async () => {
    let callCount = 0

    const createToken = declareToken<number>()

    const NumberToken = createToken('number')

    const NumberTask = createTask({
      name: 'numberTask',
      using: [NumberToken],
      factory: (deps) => {
        callCount++
        return deps.number * 2
      },
    })

    const InnerTask = createTask({
      name: 'inner',
      using: [NumberToken(7), NumberTask],
      factory: (deps) => deps.numberTask + 1,
    })

    const AnotherInnerTask = createTask({
      name: 'anotherInner',
      using: [NumberTask],
      factory: (deps) => deps.numberTask + 5,
    })

    const MainTask = createTask({
      name: 'main',
      using: [NumberToken(5), InnerTask, AnotherInnerTask, NumberTask],
      factory: (deps) => deps.inner + deps.anotherInner + deps.numberTask,
    })

    await expect(resolveUnit(MainTask)).resolves.toBe(
      [7 * 2 + 1, 5 * 2 + 5, 5 * 2].reduce((a, b) => a + b, 0)
    )
    expect(callCount).toBe(2)
  })

  it('should allow reusing tokens in different task', async () => {
    const createToken = declareToken<number>()

    const ValueToken = createToken('value')

    const TaskA = createTask({
      name: 'taskA',
      using: [ValueToken(10)],
      factory: (deps) => deps.value * 2,
    })

    const TaskB = createTask({
      name: 'taskB',
      using: [ValueToken(20)],
      factory: (deps) => deps.value + 5,
    })

    const MainTask = createTask({
      name: 'main',
      using: [TaskA, TaskB],
      factory: (deps) => ({
        resultA: deps.taskA,
        resultB: deps.taskB,
      }),
    })

    await expect(resolveUnit(MainTask)).resolves.toEqual({
      resultA: 20,
      resultB: 25,
    })
  })
})
