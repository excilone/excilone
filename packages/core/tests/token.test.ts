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
      'Main unit says: Foreground color is: red. Outer unit says: Foreground color is: blue.'
    )
  })

  it('should not override bindings in sibling units', async () => {
    const createToken = declareToken<boolean>()

    const FlagToken = createToken('flag')

    const UnitA = createUnit({
      name: 'unitA',
      using: [FlagToken(true)],
      factory: (deps) => `Flag is ${deps.flag}`,
    })

    const UnitB = createUnit({
      name: 'unitB',
      using: [FlagToken(false)],
      factory: (deps) => `Flag is ${deps.flag}`,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [UnitA, UnitB],
      factory: (deps) => `${deps.unitA}; ${deps.unitB}`,
    })

    await expect(resolveUnit(MainUnit)).resolves.toBe('Flag is true; Flag is false')
  })

  it('should not override units when declaring new bindings', async () => {
    const createToken = declareToken<number>()

    const SizeToken = createToken('size')

    const SizeUnit = createUnit({
      name: 'sizeUnit',
      using: [SizeToken],
      factory: (deps) => deps.size + 10,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [SizeToken(5), SizeUnit, SizeToken(20).as('sizeToken')],
      factory: (deps) => ({
        sizeUnitValue: deps.sizeUnit,
        sizeTokenValue: deps.sizeToken,
      }),
    })

    await expect(resolveUnit(MainUnit)).resolves.toEqual({
      sizeUnitValue: 15,
      sizeTokenValue: 20,
    })
  })

  it('should execute factory functions only once per binding', async () => {
    let callCount = 0

    const createToken = declareToken<number>()

    const NumberToken = createToken('number')

    const NumberUnit = createUnit({
      name: 'numberUnit',
      using: [NumberToken],
      factory: (deps) => {
        callCount++
        return deps.number * 2
      },
    })

    const InnerUnit = createUnit({
      name: 'inner',
      using: [NumberToken(7), NumberUnit],
      factory: (deps) => deps.numberUnit + 1,
    })

    const AnotherInnerUnit = createUnit({
      name: 'anotherInner',
      using: [NumberUnit],
      factory: (deps) => deps.numberUnit + 5,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [NumberToken(5), InnerUnit, AnotherInnerUnit, NumberUnit],
      factory: (deps) => deps.inner + deps.anotherInner + deps.numberUnit,
    })

    await expect(resolveUnit(MainUnit)).resolves.toBe(
      [7 * 2 + 1, 5 * 2 + 5, 5 * 2].reduce((a, b) => a + b, 0)
    )
    expect(callCount).toBe(2)
  })

  it('should allow reusing tokens in different units', async () => {
    const createToken = declareToken<number>()

    const ValueToken = createToken('value')

    const UnitA = createUnit({
      name: 'unitA',
      using: [ValueToken(10)],
      factory: (deps) => deps.value * 2,
    })

    const UnitB = createUnit({
      name: 'unitB',
      using: [ValueToken(20)],
      factory: (deps) => deps.value + 5,
    })

    const MainUnit = createUnit({
      name: 'main',
      using: [UnitA, UnitB],
      factory: (deps) => ({
        resultA: deps.unitA,
        resultB: deps.unitB,
      }),
    })

    await expect(resolveUnit(MainUnit)).resolves.toEqual({
      resultA: 20,
      resultB: 25,
    })
  })
})
