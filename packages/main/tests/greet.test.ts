import { describe, expect, it } from 'vitest'
import { greet } from '../src/index.js'

describe('greet', () => {
  it('should return a greeting message', () => {
    const name = 'World'
    const result = greet(name)
    expect(result).toBe('Hello, World!')
  })

  it('should handle empty names', () => {
    const name = ''
    const result = greet(name)
    expect(result).toBe('Hello, !')
  })
})
