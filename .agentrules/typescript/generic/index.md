# Agent Rules — Generic

## Overview

Shared rules for a TypeScript React project. Typical stack:

- React with React Router
- Chakra UI for component styling
- Jest and React Testing Library for testing
- Playwright for E2E testing
- MSW (Mock Service Worker) for API mocking

## Rule Organization

The agent rules are organized into the following categories and are **consolidated at the project root**:

- **[React Rules](react.md)** - React component patterns, hooks, and best practices
- **[React Three Fiber Rules](react-three-fiber.md)** - R3F patterns, Canvas setup, animations, and Three.js integration
- **[Performance Rules](performance/)** - Performance optimization by category (React and JavaScript)
- **[TypeScript Rules](typescript.md)** - TypeScript guidelines, interfaces, and type safety
- **[Testing Rules](testing.md)** - Testing strategies, Jest, React Testing Library, and real Chakra UI components
- **[Architecture Rules](architecture.md)** - Component design, state management, and patterns
- **[Quality Rules](quality.md)** - Code quality, ESLint, and performance guidelines
- **[Process Rules](process.md)** - Code review, documentation, and security

**Note**: All packages should reference these consolidated rules. No duplicate rule files should exist in individual packages.

## Quick Reference

### Before Committing

- All tests must pass (currently 204/204 passing)
- TypeScript compilation successful (no errors)
- ESLint rules satisfied (no warnings)
- Build process completes successfully
- No console.log statements in production code

### Common Patterns

- Use real Chakra UI components in tests (no mocking)
- Separate data fetching from presentation
- Follow KISS principle in testing
- Use proper TypeScript interfaces
- Use chance-based test data generation

## File Structure

- Components in `src/components/`
- Pages in `src/pages/`
- Types in `src/types/` (organized by domain)
- Utilities in `src/utils/`
- Tests alongside components with `.test.tsx` extension
- Test utilities in `src/test-utils.tsx` (with ChakraProvider wrapper)

### Component File Structure Pattern

Each component should follow this structure:

```
ComponentName/
├── ComponentName.tsx        # Main component implementation
├── ComponentName.test.tsx   # Component tests
└── index.ts                # Re-export only (never main implementation)
```

**Index File Pattern:**

```typescript
// ✅ CORRECT: Re-export only
export { default } from "./ComponentName"
export { type ComponentProps } from "./ComponentName"

// ❌ INCORRECT: Main implementation in index.tsx
const Component = () => { /* implementation */ }
export default Component
```

### File Extension Rules

**Use `.tsx` for files containing JSX:**

- Component implementation files (`ComponentName.tsx`)
- Page files (`index.tsx`, `404.tsx`)
- Test files (`.test.tsx`)
- Files with React components or JSX

**Use `.ts` for files containing only TypeScript:**

- Type definition files (`types.ts`, `types/production.ts`)
- Utility files (`theme.ts`, `utils/*.ts`)
- Component index files (`index.ts`) - re-export only
- Configuration files (`jest.config.js`, `setup-test.ts`)
- Files with no JSX, only types, imports, and exports

**Examples:**

```typescript
// ✅ CORRECT: index.ts (re-export only)
export { default } from "./ComponentName"
export { type ComponentProps } from "./ComponentName"

// ✅ CORRECT: ComponentName.tsx (contains JSX)
const Component = () => <div>Content</div>
export default Component

// ✅ CORRECT: types.ts (no JSX)
export interface Props { name: string }
export type ComponentType = React.ComponentType<Props>
```

## Current Status

- **Test Coverage**: 83.14% statements, 80.26% branches, 87.5% functions, 84.09% lines
- **All 204 tests passing** across 12 test suites
- **Real Chakra UI components** used in tests (no mocking)
- **Chance-based test data** for realistic, dynamic testing
- **Performance optimized** with render consolidation

## 🚀 **Recent Testing Improvements**

### **Test Quality Enhancements**

All test files have been refactored to follow consistent testing guidelines:

- ✅ **Eliminated redundant `expect().toBeInTheDocument()` wrappers** around `getBy*` queries
- ✅ **Replaced hardcoded test values** with `chance`-generated data
- ✅ **Added `beforeEach` appropriately** where the same component is rendered multiple times
- ✅ **Removed duplicated test cases** that were testing the same functionality
- ✅ **Standardized test structure** across all components

### **Updated Test Files**

- **Snippet.test.tsx** - Removed duplications, added `beforeEach`, uses `chance` consistently
- **DynamicIcon.test.tsx** - Removed `expect()` wrappers, uses `chance` consistently  
- **FormField.test.tsx** - Removed `expect()` wrappers
- **Footer.test.tsx** - Removed `expect()` wrappers
- **index.test.tsx** - Removed `expect()` wrappers
- **All other test files** - Already following best practices

### **Testing Guidelines Established**

1. **Don't wrap `getBy*` selectors with `expect()`** - they already throw if not found
2. **Use `chance` consistently** for test data instead of hardcoded values
3. **Use `beforeEach` appropriately** when rendering the same component multiple times
4. **Avoid duplicated tests** - each test should be unique and meaningful
5. **Follow consistent test structure** across all components
