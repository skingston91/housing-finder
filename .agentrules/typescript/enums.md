**Do not use enums. Always use types instead.**

For enum-like behavior, use union types:

```ts
// Good: Use union types
type Direction = 'up' | 'down' | 'left' | 'right';

// Good: For more complex cases, use an `as const` object:

```ts
const backendToFrontendEnum = {
  xs: "EXTRA_SMALL",
  sm: "SMALL",
  md: "MEDIUM",
} as const;

type LowerCaseEnum = keyof typeof backendToFrontendEnum; // "xs" | "sm" | "md"

type UpperCaseEnum =
  (typeof backendToFrontendEnum)[LowerCaseEnum]; // "EXTRA_SMALL" | "SMALL" | "MEDIUM"
```

## Why Types Over Enums

1. **Types are simpler**: Union types are more straightforward and don't introduce runtime code
2. **Better tree-shaking**: Types are compile-time only, enums generate runtime JavaScript
3. **No reverse mapping issues**: Types don't have the numeric enum reverse mapping problem
4. **More flexible**: Types can be extended and combined more easily

## Examples

```ts
// ✅ Good: Union type
type Status = 'pending' | 'approved' | 'rejected';

// ❌ Bad: Enum
enum Status {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}
```

```ts
// ✅ Good: Union type for keyboard controls
type CameraControls = 'forward' | 'backward' | 'left' | 'right';

// ❌ Bad: Enum
enum CameraControls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right'
}
```

## Legacy Code

If you encounter existing enums in the codebase, retain them but do not create new ones. When refactoring, convert enums to types.

Remember that numeric enums behave differently to string enums. Numeric enums produce a reverse mapping:

```ts
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

const direction = Direction.Up; // 0
const directionName = Direction[0]; // "Up"
```

This means that the enum `Direction` above will have eight keys instead of four.

```ts
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

Object.keys(Direction).length; // 8
```
