import { describe, expect, it } from 'vitest'
import { createTask, createToken, resolve } from '../src/index.js'

describe('Token and Binding creation', () => {
  it('should create a token and binding correctly', async () => {
    const NameToken = createToken<string>().as('name')

    const GreetingTask = createTask({
      using: [NameToken.bind('World')],
      factory: (deps) => `Hello, ${deps.name}`,
    })

    await expect(resolve(GreetingTask)).resolves.toBe('Hello, World')
  })

  it('should use the nearest binding', async () => {
    const AgeToken = createToken<number>().as('age')

    const PersonTask = createTask({
      using: [AgeToken],
      factory: (deps) => ({ age: deps.age }),
    })

    const MainTask = createTask({
      using: [
        AgeToken.bind(30),
        PersonTask.as('person'),
        AgeToken.bind(12).as('childAge'),
        PersonTask.as('childPerson'),
      ],
      factory: (deps) => ({
        personAge: deps.person.age,
        childPersonAge: deps.childPerson.age,
      }),
    })

    await expect(resolve(MainTask)).resolves.toEqual({
      personAge: 30,
      childPersonAge: 12,
    })
  })

  it('should use the nearest nested binding', async () => {
    const ColorToken = createToken<string>().as('color')

    const ForegroundTask = createTask({
      using: [ColorToken],
      factory: (deps) => `Foreground color is: ${deps.color}`,
    }).as('fg')

    const OuterTask = createTask({
      using: [ColorToken.bind('blue'), ForegroundTask],
      factory: (deps) => `Outer task says: ${deps.fg}`,
    }).as('outer')

    const MainTask = createTask({
      using: [ColorToken.bind('red'), ForegroundTask, OuterTask],
      factory: (deps) => `Main task says: ${deps.fg}. ${deps.outer}.`,
    })

    await expect(resolve(MainTask)).resolves.toBe(
      'Main task says: Foreground color is: red. Outer task says: Foreground color is: blue.'
    )
  })

  it('should not override bindings in sibling units', async () => {
    const FlagToken = createToken<boolean>().as('flag')

    const TaskA = createTask({
      using: [FlagToken.bind(true)],
      factory: (deps) => `Flag is ${deps.flag}`,
    }).as('taskA')

    const TaskB = createTask({
      using: [FlagToken.bind(false)],
      factory: (deps) => `Flag is ${deps.flag}`,
    }).as('taskB')

    const MainTask = createTask({
      using: [TaskA, TaskB],
      factory: (deps) => `${deps.taskA}; ${deps.taskB}`,
    })

    await expect(resolve(MainTask)).resolves.toBe('Flag is true; Flag is false')
  })

  it('should not override units when declaring new bindings', async () => {
    const SizeToken = createToken<number>().as('size')

    const SizeTask = createTask({
      using: [SizeToken],
      factory: (deps) => deps.size + 10,
    }).as('sizeTask')

    const MainTask = createTask({
      using: [SizeToken.bind(5), SizeTask, SizeToken.bind(20).as('sizeToken')],
      factory: (deps) => ({
        sizeUnitValue: deps.sizeTask,
        sizeTokenValue: deps.sizeToken,
      }),
    })

    await expect(resolve(MainTask)).resolves.toEqual({
      sizeUnitValue: 15,
      sizeTokenValue: 20,
    })
  })

  it('should execute factory functions only once per binding', async () => {
    let callCount = 0

    const NumberToken = createToken<number>().as('number')

    const NumberTask = createTask({
      using: [NumberToken],
      factory: (deps) => {
        callCount++
        return deps.number * 2
      },
    }).as('numberTask')

    const InnerTask = createTask({
      using: [NumberToken.bind(7), NumberTask],
      factory: (deps) => deps.numberTask + 1,
    }).as('inner')

    const AnotherInnerTask = createTask({
      using: [NumberTask],
      factory: (deps) => deps.numberTask + 5,
    }).as('anotherInner')

    const MainTask = createTask({
      using: [NumberToken.bind(5), InnerTask, AnotherInnerTask, NumberTask],
      factory: (deps) => deps.inner + deps.anotherInner + deps.numberTask,
    })

    await expect(resolve(MainTask)).resolves.toBe(
      [7 * 2 + 1, 5 * 2 + 5, 5 * 2].reduce((a, b) => a + b, 0)
    )
    expect(callCount).toBe(2)
  })

  it('should detect dynamic task dependencies correctly', async () => {
    const NumberToken = createToken<number>()

    const DynamicTask = createTask({
      using: [NumberToken.as('number')],
      factory: (deps) => deps.number * 3,
    })

    const InnerTask = createTask({
      using: [DynamicTask.as('dynamic')],
      factory: (deps) => deps.dynamic + 2,
    })

    const MainTask = createTask({
      using: [
        NumberToken.bind(4),
        InnerTask.as('first'),
        NumberToken.bind(10),
        InnerTask.as('second'),
      ],
      factory: (deps) => deps.first + deps.second,
    })

    await expect(resolve(MainTask)).resolves.toBe(4 * 3 + 2 + (10 * 3 + 2))
  })

  it('should allow reusing tokens in different task', async () => {
    const ValueToken = createToken<number>().as('value')

    const TaskA = createTask({
      using: [ValueToken.bind(10)],
      factory: (deps) => deps.value * 2,
    }).as('taskA')

    const TaskB = createTask({
      using: [ValueToken.bind(20)],
      factory: (deps) => deps.value + 5,
    }).as('taskB')

    const MainTask = createTask({
      using: [TaskA, TaskB],
      factory: (deps) => ({
        resultA: deps.taskA,
        resultB: deps.taskB,
      }),
    })

    await expect(resolve(MainTask)).resolves.toEqual({
      resultA: 20,
      resultB: 25,
    })
  })
})
