# Excilone

Simple and extensible <b>Dependency Injection</b> library.

## Usage

Creating a simple **Unit** with dependencies:

```js
import { createUnit, resolveUnit } from '@excilone/core'

const UserUnit = createUnit({
  name: 'user',
  factory: () => 'John Doe'
})

const GreetingUnit = createUnit({
  name: 'greeting',
  using: [UserUnit],
  factory: (deps) => `Hello, ${deps.user}!`
})

console.log(await resolveUnit(GreetingUnit)) // Hello, John Doe!
```

Using **Tokens**:

```ts
import { createUnit, declareToken, resolveUnit } from '@excilone/core'

const UserToken = declareToken<string>()('user')

const GreetingUnit = createUnit({
  name: 'greeting',
  using: [UserToken], // Requesting to bind `UserToken` in a upper `Unit`
  factory: (deps) => `Hello, ${deps.user}!`
})

const LogUnit = createUnit({
  name: 'log',
  using: [UserToken('John Doe'), GreetingUnit],
  factory: (deps) => console.log(deps.greeting)
})

await resolveUnit(LogUnit) // Hello, John Doe!
```

## License

See [LICENSE](/LICENSE).
