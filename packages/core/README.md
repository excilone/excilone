# Excilone

Simple and extensible <b>Dependency Injection</b> library.

## Usage

Creating a simple **Task** with dependencies:

```js
import { createTask, resolveUnit } from '@excilone/core'

const UserTask = createTask(() => 'John Doe')

const GreetingTask = createTask({
  using: [UserTask.as('user')],
  factory: (deps) => `Hello, ${deps.user}!`
})

console.log(await resolveUnit(GreetingTask)) // Hello, John Doe!
```

Using **Tokens**:

```ts
import { createTask, createToken, resolveUnit } from '@excilone/core'

const UserToken = createToken<string>()

const GreetingTask = createTask({
  using: [UserToken.as('user')], // Requesting to bind `UserToken` in a upper `Unit`
  factory: (deps) => `Hello, ${deps.user}!`
})

const LogTask = createTask({
  using: [UserToken.bind('John Doe'), GreetingTask.as('greeting')],
  factory: (deps) => console.log(deps.greeting)
})

await resolveUnit(LogTask) // Hello, John Doe!
```

## License

See [LICENSE](/LICENSE).
