# Excilone

Simple and extensible <b>Dependency Injection</b> library.

## Usage

Creating a simple **Task** with dependencies:

```js
import { createTask, resolveUnit } from '@excilone/core'

const UserTask = createTask({
  name: 'user',
  factory: () => 'John Doe'
})

const GreetingTask = createTask({
  name: 'greeting',
  using: [UserTask],
  factory: (deps) => `Hello, ${deps.user}!`
})

console.log(await resolveUnit(GreetingTask)) // Hello, John Doe!
```

Using **Tokens**:

```ts
import { createTask, declareToken, resolveUnit } from '@excilone/core'

const UserToken = declareToken<string>()('user')

const GreetingTask = createTask({
  name: 'greeting',
  using: [UserToken], // Requesting to bind `UserToken` in a upper `Unit`
  factory: (deps) => `Hello, ${deps.user}!`
})

const LogTask = createTask({
  name: 'log',
  using: [UserToken('John Doe'), GreetingTask],
  factory: (deps) => console.log(deps.greeting)
})

await resolveUnit(LogTask) // Hello, John Doe!
```

## License

See [LICENSE](/LICENSE).
