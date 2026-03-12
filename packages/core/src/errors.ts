export class ExciloneError extends Error {
  constructor(message: string) {
    super(`[Excilone]: ${message}`)
    this.name = 'ExciloneError'
  }
}

export class CycleError extends ExciloneError {
  constructor(path: string[]) {
    const chain = path.join(' -> ')
    super(`Circular dependency detected: ${chain}`)
    this.name = 'CycleError'
  }
}

export class DuplicateDependencyError extends ExciloneError {
  constructor(unitKey: string, dependencyKey: string) {
    super(`Duplicate dependency name "${dependencyKey}" detected in unit "${unitKey}"`)
    this.name = 'DuplicateDependencyError'
  }
}

export class MissingBindingError extends ExciloneError {
  constructor(tokenKey: string) {
    super(`No binding found for token "${tokenKey}"`)
    this.name = 'MissingBindingError'
  }
}

export class ExecutionError extends ExciloneError {
  constructor(unitKey: string, originalError: unknown) {
    super(
      `Error executing unit "${unitKey}": ${originalError instanceof Error ? originalError.message : String(originalError)}`
    )
    this.name = 'ExecutionError'
    this.cause = originalError
  }
}
