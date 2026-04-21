# @excilone/core

## 0.4.0

### Minor Changes

- 74ff73b: Rename `resolveUnit` to `resolve`
- 326cc10: Add `createSyncTask`, `createSyncContainer` and `resolveSync`
- 326cc10: Remove the type `InferReturnType`
- 74ff73b: Add containers with the `createContainer` function
- 326cc10: Add a sync (S) generic to available types

### Patch Changes

- 74ff73b: Fix the revalidation of `Task` when it indirectly depends on another dynamic `Task`.

## 0.3.0

### Minor Changes

- e514300: Remove `name` of Unit props to use the `as` function
- e514300: Add tags to unit identifiers
- e514300: Add symbols as valid keys
- e514300: Replace `declareToken` with `createToken`
- e514300: Add `bind` to Token to use instead of calling himself
- e514300: Rename the `UnitPayload` type to `CoreUnit`
- e514300: Rename Unit to Task and BaseUnit type to Unit
- 0ae31ab: Make `using` optional in units
- e514300: `createTask` can receive only a factory function

## 0.2.0

### Minor Changes

- c6ef9af: Add `ExciloneError` for error handling
- 54b822c: Add Tokens and Bindings to provide imperative data to Units

## 0.1.0

### Minor Changes

- 49f00db: Add basic package functionality with `createUnit` and `resolveUnit`.
