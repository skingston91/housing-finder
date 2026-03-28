# Type-Safe Patterns

## Core Principle

**Never use unsafe array or object access in TypeScript code.** All access to potentially undefined values must use type-safe utility functions that provide clear error messages and prevent runtime errors.

## Required Utility Functions

### Import Pattern
```typescript
// Always import from the centralized utilities
import { 
  getArrayElement, 
  assertDefined, 
  assertNonEmptyArray 
} from '../../utils/arrayUtils';
```

### Available Functions

#### `getArrayElement<T>(array: T[], index: number, name: string): T`
Safely gets an element from an array with descriptive error messages.

```typescript
// ✅ Good: Type-safe array access
const firstScene = getArrayElement(scenes, 0, 'FirstScene');
const lastStep = getArrayElement(steps, steps.length - 1, 'LastStep');

// ❌ Bad: Unsafe array access
const firstScene = scenes[0];
if (!firstScene) throw new Error('First scene must exist');
```

#### `assertDefined<T>(value: T | undefined, message: string): T`
Asserts that a value is defined, throwing an error if it's undefined.

```typescript
// ✅ Good: Type-safe object property access
const referenceObject = assertDefined(
  referenceObjects[id],
  `Reference object with id ${id} not found`
);

// ❌ Bad: Unsafe object access
const referenceObject = referenceObjects[id];
if (!referenceObject) throw new Error('Reference object not found');
```

#### `assertNonEmptyArray<T>(array: T[], message: string): T[]`
Asserts that an array is not empty, throwing an error if it is.

```typescript
// ✅ Good: Type-safe array validation
const validatedScenes = assertNonEmptyArray(scenes, 'Schematic must have at least one scene');

// ❌ Bad: Manual array validation
if (scenes.length === 0) throw new Error('Schematic must have at least one scene');
```

## Test-Specific Utilities

### Mock Call Access
```typescript
// Import from test helpers
import { getMockCallArg } from '../../test.helpers';

// ✅ Good: Type-safe mock call access
const mockArg = getMockCallArg(mock, 0, 1);

// ❌ Bad: Unsafe mock call access
const mockArg = mock.calls[0][1];
if (!mockArg) throw new Error('Mock argument not found');
```

## Production Code Patterns

### Array Access in Production
```typescript
// ✅ Good: Production code using type-safe patterns
const getInitialSchematicIds = ({ schematic }: Props) => {
  const firstScene = getArrayElement(schematic.scenes, 0, 'FirstScene');
  const firstStep = getArrayElement(firstScene.steps, 0, 'FirstStep');
  
  return { sceneId: firstScene.id, stepId: firstStep.id };
};

// ❌ Bad: Production code with unsafe access
const getInitialSchematicIds = ({ schematic }: Props) => {
  const firstScene = schematic.scenes[0];
  if (!firstScene) throw new Error('Schematic has no scenes');
  
  const firstStep = firstScene.steps[0];
  if (!firstStep) throw new Error('First scene has no steps');
  
  return { sceneId: firstScene.id, stepId: firstStep.id };
};
```

### Object Property Access in Production
```typescript
// ✅ Good: Safe object property access
const getStepById = (schematic: Schematic, stepId: string) => {
  const step = assertDefined(
    schematic.steps.find(s => s.id === stepId),
    `Step with id ${stepId} not found`
  );
  return step;
};

// ❌ Bad: Unsafe object property access
const getStepById = (schematic: Schematic, stepId: string) => {
  const step = schematic.steps.find(s => s.id === stepId);
  if (!step) throw new Error(`Step with id ${stepId} not found`);
  return step;
};
```

## Test Code Patterns

### Array Access in Tests
```typescript
// ✅ Good: Test code using type-safe patterns
describe('Component', () => {
  it('should handle multiple scenes', () => {
    const { schematic, scenes } = createSchematicWithMultipleScenesAndStages();
    const firstScene = getArrayElement(scenes, 0, 'FirstScene');
    const secondScene = getArrayElement(scenes, 1, 'SecondScene');
    
    expect(firstScene.id).toBeDefined();
    expect(secondScene.id).toBeDefined();
  });
});

// ❌ Bad: Test code with unsafe access
describe('Component', () => {
  it('should handle multiple scenes', () => {
    const { schematic, scenes } = createSchematicWithMultipleScenesAndStages();
    const firstScene = scenes[0];
    const secondScene = scenes[1];
    
    if (!firstScene || !secondScene) {
      throw new Error('Scenes must exist');
    }
    
    expect(firstScene.id).toBeDefined();
    expect(secondScene.id).toBeDefined();
  });
});
```

### Mock Call Access in Tests
```typescript
// ✅ Good: Type-safe mock call access in tests
it('should call the correct function', () => {
  const mockFn = jest.fn();
  mockFn('test', 'value');
  
  const firstArg = getMockCallArg(mockFn, 0, 0);
  const secondArg = getMockCallArg(mockFn, 0, 1);
  
  expect(firstArg).toBe('test');
  expect(secondArg).toBe('value');
});

// ❌ Bad: Unsafe mock call access in tests
it('should call the correct function', () => {
  const mockFn = jest.fn();
  mockFn('test', 'value');
  
  const firstArg = mockFn.mock.calls[0][0];
  const secondArg = mockFn.mock.calls[0][1];
  
  if (!firstArg || !secondArg) {
    throw new Error('Mock arguments not found');
  }
  
  expect(firstArg).toBe('test');
  expect(secondArg).toBe('value');
});
```

## Error Message Standards

### Descriptive Error Messages
All utility functions must provide clear, descriptive error messages that help with debugging.

```typescript
// ✅ Good: Descriptive error messages
const scene = getArrayElement(scenes, 0, 'FirstScene');
const step = getArrayElement(steps, 5, 'Step at index 5');
const object = assertDefined(
  objects[id],
  `Reference object with id ${id} not found in schematic`
);

// ❌ Bad: Generic error messages
const scene = getArrayElement(scenes, 0, 'Scene');
const step = getArrayElement(steps, 5, 'Step');
const object = assertDefined(objects[id], 'Object not found');
```

## File Organization

### Utility File Location
- **Array utilities**: `src/utils/arrayUtils.ts`
- **Type utilities**: `src/utils/typeUtils.ts`
- **Test utilities**: `src/test.helpers.tsx`

### Import Organization
```typescript
// ✅ Good: Organized imports
import { getArrayElement, assertDefined } from '../../utils/arrayUtils';
import { createPosition, createRotation } from '../../utils/typeUtils';
import { getMockCallArg } from '../../test.helpers';

// ❌ Bad: Mixed imports
import { getArrayElement } from '../../test.helpers';
import { assertDefined } from '../../utils/arrayUtils';
```

## Migration Guidelines

### When Adding New Code
1. **Always use type-safe utilities** for array and object access
2. **Import from the correct utility files**
3. **Provide descriptive error messages**
4. **Follow the established patterns**

### When Refactoring Existing Code
1. **Replace unsafe array access** with `getArrayElement`
2. **Replace unsafe object access** with `assertDefined`
3. **Replace manual null checks** with utility functions
4. **Update error messages** to be descriptive

### When Writing Tests
1. **Use type-safe patterns** for all test data access
2. **Use `getMockCallArg`** for mock call access
3. **Use `getArrayElement`** for array access in test setup
4. **Use `assertDefined`** for object property access

## Benefits

### Runtime Safety
- **Prevents undefined errors** at runtime
- **Clear error messages** for debugging
- **Consistent error handling** across the codebase

### Developer Experience
- **Type safety** at compile time
- **Consistent patterns** across all files
- **Easy to understand** and maintain
- **Self-documenting** code

### Code Quality
- **Reduced bugs** from unsafe access
- **Better maintainability** with centralized utilities
- **Consistent error handling** patterns
- **Professional code standards**

## Compliance Checklist

### ✅ Required for All Code
- [ ] **No direct array indexing** without type-safe utilities
- [ ] **No unsafe object property access** without `assertDefined`
- [ ] **No manual null checks** - use utility functions instead
- [ ] **Descriptive error messages** in all utility calls
- [ ] **Correct imports** from utility files
- [ ] **Consistent patterns** across all files

### ✅ Required for Tests
- [ ] **Type-safe array access** in test setup
- [ ] **Type-safe mock call access** with `getMockCallArg`
- [ ] **Type-safe object access** in test data
- [ ] **Consistent error messages** in test utilities

### ✅ Required for Production Code
- [ ] **Type-safe array access** in all functions
- [ ] **Type-safe object access** in all functions
- [ ] **Proper error handling** with utility functions
- [ ] **Clear error messages** for debugging

## Examples of Compliance

### ✅ Fully Compliant Code
```typescript
import { getArrayElement, assertDefined } from '../../utils/arrayUtils';
import { getMockCallArg } from '../../test.helpers';

// Production function
const getSceneById = (schematic: Schematic, sceneId: string) => {
  const scene = assertDefined(
    schematic.scenes.find(s => s.id === sceneId),
    `Scene with id ${sceneId} not found in schematic`
  );
  return scene;
};

// Test function
describe('getSceneById', () => {
  it('should return the correct scene', () => {
    const { schematic, scenes } = createSchematicWithMultipleScenesAndStages();
    const firstScene = getArrayElement(scenes, 0, 'FirstScene');
    
    const result = getSceneById(schematic, firstScene.id);
    
    expect(result.id).toBe(firstScene.id);
  });
});
```

This pattern ensures that all code in the project follows consistent, type-safe practices that prevent runtime errors and provide clear debugging information.
