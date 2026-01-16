# Excilone

Simple and extensible <b>Dependency Injection</b> library.

## Usage

Creating a simple **Unit** with dependencies:

```js
import { createUnit, resolveUnit } from '@excilone/core'

const UserUnit = createUnit({
  name: 'user',
  using: [],
  factory: () => 'John Doe'
})

const GreetingUnit = createUnit({
  name: 'greeting',
  using: [UserUnit],
  factory: (deps) => `Hello, ${deps.user}!`
})

console.log(await resolveUnit(GreetingUnit))
```

## License

See [LICENSE](/LICENSE).
