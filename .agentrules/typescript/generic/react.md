# React Rules

## Component Patterns

### Functional Components
- Use functional components with hooks
- Follow the pure component pattern for testable components
- Use proper prop interfaces extending ComponentPropsWithChildren
- Implement proper error boundaries and loading states

### Component Design
- Separate data fetching from presentation
- Use real components for testing (no mocking)
- Implement proper error handling
- Follow single responsibility principle

### State Management
- Use React hooks for local state
- Consider context for shared state
- Keep state as local as possible
- Use proper state update patterns

## Styling and UI

### Chakra UI
- Use Chakra UI components for consistent styling
- Follow Chakra UI design patterns
- Use theme-based styling when possible
- Maintain consistent spacing and typography

### Component Styling
- Use Chakra UI props for styling
- Avoid inline styles when possible
- Use responsive design patterns
- Maintain consistent color schemes

## Performance

### Optimization
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders
- Use proper key props in lists

### Best Practices
- Lazy load components when appropriate
- Use React.lazy for code splitting
- Optimize bundle size with dynamic imports
- Monitor component re-render patterns

## Common Patterns

### Component File Structure
Each component must follow this structure:
```
ComponentName/
├── ComponentName.tsx        # Main component implementation
├── ComponentName.test.tsx   # Component tests
└── index.ts                # Re-export only (never main implementation)
```

### Component Export Pattern
```typescript
// ComponentName.tsx - Main implementation file
const Component = (props: ComponentProps) => {
  const data = useStaticQuery<ComponentData>(graphql`...`)
  return <PureComponent {...props} data={data} />
}

// Pure component for testing (when needed)
export const PureComponent = ({ data, ...props }: PureComponentProps) => {
  // Component implementation
}

export default Component
```

```typescript
// index.ts - Re-export only
export { default } from "./ComponentName"
export { type ComponentProps } from "./ComponentName"
```

**Note**: Pure components are only needed when you need to test the component logic separately from data fetching. Most components can be tested directly with real Chakra UI components.

### Testing React Components
```typescript
// Good: Use chance for test data generation
import chance from "../../test-utils/chance"

describe("ComponentName", () => {
  const defaultProps = {
    title: chance.company(),
    description: chance.paragraph({ sentences: 2 }),
    color: chance.pickone(["red", "blue", "green", "purple"])
  }

  describe("when rendered with default props", () => {
    beforeEach(() => {
      render(<ComponentName {...defaultProps} />)
    })

    it("should display the title", () => {
      screen.getByText(defaultProps.title)
    })

    it("should display the description", () => {
      screen.getByText(defaultProps.description)
    })
  })
})
```

**Key Testing Guidelines:**
- ✅ **Don't wrap `getBy*` selectors with `expect()`** - they already throw if not found
- ✅ **Use `chance` consistently** for test data instead of hardcoded values
- ✅ **Use `beforeEach` appropriately** when rendering the same component multiple times
- ✅ **Avoid duplicated tests** - each test should be unique and meaningful

### Alignment Consistency
**Ensure heading and content alignment match:**
- If content is center-aligned (`textAlign="center"`, `justifyContent="center"`), use `headingAlignment="center"`
- If content is left-aligned (default), leave heading alignment as default (`"left"`)
- Maintain visual consistency between section headings and their content
- Use `headingAlignment` prop on Section components to control heading text alignment

**Examples:**
```typescript
// ✅ CORRECT: Center-aligned content with center-aligned heading
<Section headingText="Services" headingAlignment="center">
  <Flex justifyContent="center">
    <Stack textAlign="center">
      {/* centered content */}
    </Stack>
  </Flex>
</Section>

// ✅ CORRECT: Left-aligned content with left-aligned heading (default)
<Section headingText="About">
  <Stack>
    {/* left-aligned content */}
  </Stack>
</Section>

// ❌ INCORRECT: Mismatched alignment
<Section headingText="Services"> {/* heading left-aligned by default */}
  <Flex justifyContent="center"> {/* content center-aligned */}
    {/* This creates visual misalignment */}
  </Flex>
</Section>
```

### File Extension Guidelines
**Use `.tsx` for files containing JSX:**
- Component implementation files (`ComponentName.tsx`)
- Page files (`index.tsx`, `404.tsx`)
- Test files (`.test.tsx`)
- Files with React components or JSX

**Use `.ts` for files containing only TypeScript:**
- Component index files (`index.ts`) - re-export only
- Type definition files (`types.ts`, `types/production.ts`)
- Utility files (`theme.ts`, `utils/*.ts`)
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

// ❌ INCORRECT: index.tsx for re-exports only
export { default } from "./ComponentName" // Should be index.ts
```

### Error Boundary Pattern
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}
```

## Hooks Guidelines

### useEffect
- Always include dependency array
- Use cleanup functions when necessary
- Avoid infinite loops
- Consider using useCallback for function dependencies

### useState
- Use functional updates for complex state
- Avoid deeply nested state objects
- Consider useReducer for complex state logic
- Use proper TypeScript types for state

### Custom Hooks
- Extract reusable logic into custom hooks
- Follow naming convention: use[Name]
- Keep hooks focused and single-purpose
- Test custom hooks independently

## Accessibility

### ARIA and Semantics
- Use proper semantic HTML elements
- Implement ARIA labels and descriptions
- Ensure keyboard navigation works
- Test with screen readers

### Focus Management
- Manage focus properly in modals
- Use proper tab order
- Implement skip links when needed
- Handle focus on component mount/unmount
