import { describe, expect, it } from 'vitest'
import { createUnit, declareToken, resolveUnit } from '../src/index.js'

describe('Token and Binding creation', () => {
  it('should create a token and binding correctly', async () => {
    const createToken = declareToken<string>()

    const NameToken = createToken('name')

    const GreetingUnit = createUnit({
      name: 'greeting',
      using: [NameToken('World')],
      factory: (deps) => `Hello, ${deps.name}`,
    })

    await expect(resolveUnit(GreetingUnit)).resolves.toBe('Hello, World')
  })

  it('should use the nearest binding', async () => {
    const createToken = declareToken<number>()

    const AgeToken = createToken('age')

    const PersonUnit = createUnit({
      name: 'person',
      using: [AgeToken],
      factory: (deps) => ({ age: deps.age }),
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [
        AgeToken(30),
        PersonUnit,
        AgeToken(12).as('childAge'),
        PersonUnit.as('childPerson'),
      ],
      factory: (deps) => ({
        personAge: deps.person.age,
        childPersonAge: deps.childPerson.age,
      }),
    })

    await expect(resolveUnit(MainUnit)).resolves.toEqual({
      personAge: 30,
      childPersonAge: 12,
    })
  })

  it('should use the nearest nested binding', async () => {
    const createToken = declareToken<string>()

    const ColorToken = createToken('color')

    const ForegroundUnit = createUnit({
      name: 'fg',
      using: [ColorToken],
      factory: (deps) => `Foreground color is: ${deps.color}`,
    })

    const OuterUnit = createUnit({
      name: 'outer',
      using: [ColorToken('blue'), ForegroundUnit],
      factory: (deps) => `Outer unit says: ${deps.fg}`,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [ColorToken('red'), ForegroundUnit, OuterUnit],
      factory: (deps) => `Main unit says: ${deps.fg}. ${deps.outer}.`,
    })

    await expect(resolveUnit(MainUnit)).resolves.toBe(
      'Main unit says: Foreground color is: red. Outer unit says: Foreground color is: blue.',
    )
  })
})
