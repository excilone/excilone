import { describe, expect, it } from 'vitest'
import {
  createSyncTask,
  createTask,
  createToken,
  resolve,
  resolveSync,
} from '../src/index.js'

describe('Token and Binding creation', () => {
  it('should create a token and binding correctly', () => {
    const NameToken = createToken<string>().as('name')

    const GreetingTask = createSyncTask({
      using: [NameToken.bind('World')],
      factory: (deps) => `Hello, ${deps.name}`,
    })

    expect(resolveSync(GreetingTask)).toBe('Hello, World')
  })

  it('should use the nearest binding', () => {
    const AgeToken = createToken<number>().as('age')

    const PersonTask = createSyncTask({
      using: [AgeToken],
      factory: (deps) => ({ age: deps.age }),
    })

    const MainTask = createSyncTask({
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

    expect(resolveSync(MainTask)).toEqual({
      personAge: 30,
      childPersonAge: 12,
    })
  })

  it('should use the nearest nested binding', () => {
    const ColorToken = createToken<string>().as('color')

    const ForegroundTask = createSyncTask({
      using: [ColorToken],
      factory: (deps) => `Foreground color is: ${deps.color}`,
    }).as('fg')

    const OuterTask = createSyncTask({
      using: [ColorToken.bind('blue'), ForegroundTask],
      factory: (deps) => `Outer task says: ${deps.fg}`,
    }).as('outer')

    const MainTask = createSyncTask({
      using: [ColorToken.bind('red'), ForegroundTask, OuterTask],
      factory: (deps) => `Main task says: ${deps.fg}. ${deps.outer}.`,
    })

    expect(resolveSync(MainTask)).toBe(
      'Main task says: Foreground color is: red. Outer task says: Foreground color is: blue.'
    )
  })

  it('should not override bindings in sibling units', () => {
    const FlagToken = createToken<boolean>().as('flag')

    const TaskA = createSyncTask({
      using: [FlagToken.bind(true)],
      factory: (deps) => `Flag is ${deps.flag}`,
    }).as('taskA')

    const TaskB = createSyncTask({
      using: [FlagToken.bind(false)],
      factory: (deps) => `Flag is ${deps.flag}`,
    }).as('taskB')

    const MainTask = createSyncTask({
      using: [TaskA, TaskB],
      factory: (deps) => `${deps.taskA}; ${deps.taskB}`,
    })

    expect(resolveSync(MainTask)).toBe('Flag is true; Flag is false')
  })

  it('should not override units when declaring new bindings', () => {
    const SizeToken = createToken<number>().as('size')

    const SizeTask = createSyncTask({
      using: [SizeToken],
      factory: (deps) => deps.size + 10,
    }).as('sizeTask')

    const MainTask = createSyncTask({
      using: [SizeToken.bind(5), SizeTask, SizeToken.bind(20).as('sizeToken')],
      factory: (deps) => ({
        sizeUnitValue: deps.sizeTask,
        sizeTokenValue: deps.sizeToken,
      }),
    })

    expect(resolveSync(MainTask)).toEqual({
      sizeUnitValue: 15,
      sizeTokenValue: 20,
    })
  })

  it('should use the correct binding in nested tasks', () => {
    const ValueToken = createToken<number>().as('value')

    const ValueTask = createSyncTask({
      using: [ValueToken],
      factory: (deps) => deps.value * 2,
    }).as('task')

    const FirstTask = createSyncTask({
      using: [ValueToken.bind(3), ValueTask],
      factory: (deps) => deps.task + 1,
    }).as('first')

    const SecondTask = createSyncTask({
      using: [ValueToken.bind(5), ValueTask],
      factory: (deps) => deps.task + 1,
    }).as('second')

    const MainTask = createSyncTask({
      using: [FirstTask, SecondTask],
      factory: (deps) => `${deps.first}, ${deps.second}`,
    })

    expect(resolveSync(MainTask)).toBe('7, 11')
  })

  it('should execute factory functions only once per binding', () => {
    let callCount = 0

    const NumberToken = createToken<number>().as('number')

    const NumberTask = createSyncTask({
      using: [NumberToken],
      factory: (deps) => {
        callCount++
        return deps.number * 2
      },
    }).as('numberTask')

    const InnerTask = createSyncTask({
      using: [NumberToken.bind(7), NumberTask],
      factory: (deps) => deps.numberTask + 1,
    }).as('inner')

    const AnotherInnerTask = createSyncTask({
      using: [NumberTask],
      factory: (deps) => deps.numberTask + 5,
    }).as('anotherInner')

    const MainTask = createSyncTask({
      using: [NumberToken.bind(5), InnerTask, AnotherInnerTask, NumberTask],
      factory: (deps) => deps.inner + deps.anotherInner + deps.numberTask,
    })

    expect(resolveSync(MainTask)).toBe(
      [7 * 2 + 1, 5 * 2 + 5, 5 * 2].reduce((a, b) => a + b, 0)
    )
    expect(callCount).toBe(2)
  })

  it('should detect dynamic task dependencies correctly', () => {
    const NumberToken = createToken<number>()

    const DynamicTask = createSyncTask({
      using: [NumberToken.as('number')],
      factory: (deps) => deps.number * 3,
    })

    const InnerTask = createSyncTask({
      using: [DynamicTask.as('dynamic')],
      factory: (deps) => deps.dynamic + 2,
    })

    const MainTask = createSyncTask({
      using: [
        NumberToken.bind(4),
        InnerTask.as('first'),
        NumberToken.bind(10),
        InnerTask.as('second'),
      ],
      factory: (deps) => deps.first + deps.second,
    })

    expect(resolveSync(MainTask)).toBe(4 * 3 + 2 + (10 * 3 + 2))
  })

  it('should execute factory functions only once per binding with dynamic tasks', () => {
    const NumberToken = createToken<number>()
    let calls = 0

    const DynamicTask = createSyncTask({
      using: [NumberToken.as('number')],
      factory: (deps) => deps.number * 3,
    })

    const InnerTask = createSyncTask({
      using: [DynamicTask.as('dynamic')],
      factory: (deps) => {
        calls++
        return deps.dynamic + 2
      },
    })

    const MainTask = createSyncTask({
      using: [
        NumberToken.bind(4),
        InnerTask.as('first'),
        NumberToken.bind(10),
        InnerTask.as('second'),
        InnerTask.as('third'),
      ],
      factory: (deps) => deps.first + deps.second + deps.third,
    })

    expect(resolveSync(MainTask)).toBe(4 * 3 + 2 + (10 * 3 + 2) * 2)
    expect(calls).toBe(2)
  })

  it('should allow reusing tokens in different task', () => {
    const ValueToken = createToken<number>().as('value')

    const TaskA = createSyncTask({
      using: [ValueToken.bind(10)],
      factory: (deps) => deps.value * 2,
    }).as('taskA')

    const TaskB = createSyncTask({
      using: [ValueToken.bind(20)],
      factory: (deps) => deps.value + 5,
    }).as('taskB')

    const MainTask = createSyncTask({
      using: [TaskA, TaskB],
      factory: (deps) => ({
        resultA: deps.taskA,
        resultB: deps.taskB,
      }),
    })

    expect(resolveSync(MainTask)).toEqual({
      resultA: 20,
      resultB: 25,
    })
  })
})

describe('Async tokens in async mode', () => {
  it('should keep async tokens as promises in sync mode', () => {
    const AsyncToken = createToken<Promise<number>>().as('token')

    const DependentTask = createTask({
      using: [AsyncToken],
      factory: (deps) => deps.token.then((value) => value * 3),
    }).as('dependent')

    const MainTask = createTask({
      using: [AsyncToken.bind(Promise.resolve(7)), DependentTask],
      factory: (deps) => deps.dependent + 1,
    })

    return expect(resolve(MainTask)).resolves.toBe(22)
  })
})
