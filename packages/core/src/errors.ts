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
  constructor(unitName: string, dependencyName: string) {
    super(`Duplicate dependency name "${dependencyName}" detected in unit "${unitName}"`)
    this.name = 'DuplicateDependencyError'
  }
}

export class ExecutionError extends ExciloneError {
  constructor(unitName: string, originalError: unknown) {
    super(
      `Error executing unit "${unitName}": ${originalError instanceof Error ? originalError.message : String(originalError)}`
    )
    this.name = 'ExecutionError'
    this.cause = originalError
  }
}
