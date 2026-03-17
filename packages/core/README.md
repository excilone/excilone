# Excilone

Simple and extensible <b>Dependency Injection</b> library.

## Usage

Creating a simple **Task** with dependencies:

```js
import { createSyncTask, resolveSync } from '@excilone/core'

const UserTask = createSyncTask(() => 'John Doe')

const GreetingTask = createSyncTask({
  using: [UserTask.as('user')],
  factory: (deps) => `Hello, ${deps.user}!`
})

console.log(resolveSync(GreetingTask)) // Hello, John Doe!
```

Using **Tokens**:

```ts
import { createSyncTask, createToken, resolveSync } from '@excilone/core'

const UserToken = createToken<string>()

const GreetingTask = createSyncTask({
  using: [UserToken.as('user')], // Requesting to bind `UserToken` in a upper `Unit`
  factory: (deps) => `Hello, ${deps.user}!`
})

const LogTask = createSyncTask({
  using: [UserToken.bind('John Doe'), GreetingTask.as('greeting')],
  factory: (deps) => console.log(deps.greeting)
})

resolveSync(LogTask) // Hello, John Doe!
```

## License

See [LICENSE](/LICENSE).
