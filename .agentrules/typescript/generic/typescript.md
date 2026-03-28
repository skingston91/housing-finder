# TypeScript Rules

## Type Safety

### General Guidelines
- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use interfaces for component props
- Follow React functional component patterns
- Use proper type imports/exports
- **Use type-safe array and object access patterns** (see `type-safe-patterns.md`)

### Type Definitions
- Define interfaces for all component props
- Use union types for variant props
- Implement proper generic types when needed (e.g., FormField<T>)
- Avoid type assertions unless absolutely necessary
- Use Formik's FieldInputProps for form field types

### File Extensions
- Use `.ts` for type definition files (`types.ts`, `types/production.ts`)
- Use `.ts` for utility files with no JSX (`theme.ts`, `utils/*.ts`)
- Use `.ts` for component index files (`index.ts`) - re-export only
- Use `.tsx` for files containing JSX or React components
- Follow the rule: `.ts` for TypeScript only, `.tsx` for TypeScript + JSX

### Interface Design
```typescript
// Good: Extend ComponentPropsWithChildren for React components
interface ComponentProps extends ComponentPropsWithChildren {
  title: string
  description?: string
  onAction: () => void
}

// Good: Use union types for variants
type ButtonVariant = 'primary' | 'secondary' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant: ButtonVariant
  size: ButtonSize
  children: React.ReactNode
}
```

## Type Imports and Exports

### Import Patterns
```typescript
// Good: Named imports for types
import { ComponentProps, ComponentPropsWithChildren } from 'react'
import { ButtonProps, FormData } from '../types'

// Good: Type-only imports when appropriate
import type { GraphQLData } from '../types'
```

### Export Patterns
```typescript
// Good: Export types from dedicated types file
export interface UserData {
  id: string
  name: string
  email: string
}

// Good: Export component types alongside components
export interface ButtonProps {
  // props definition
}
```

## Type Safety in Components

### Props Typing
```typescript
// Good: Proper prop interface
interface HeroImageProps extends ComponentPropsWithChildren {
  imageData: {
    src: string
    alt?: string
  }
  height?: string
}

// Good: Use the interface
const HeroImage: React.FC<HeroImageProps> = ({ 
  imageData, 
  height = "50vh", 
  children 
}) => {
  // component implementation
}
```

### Event Handling
```typescript
// Good: Proper event types
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault()
  // handle click
}

// Good: Form event types
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  // handle form submission
}
```

## GraphQL and Data Types

### Static Query Types
```typescript
// Good: Type your GraphQL queries
interface ImagesData {
  heroImageData: {
    publicURL: string
  }
  aaTLogo: {
    publicURL: string
  }
}

const imagesRequest = useStaticQuery<ImagesData>(graphql`
  query {
    heroImageData: file(relativePath: { eq: "Alt_Temp_Hero.jpg" }) {
      publicURL
    }
    aaTLogo: file(relativePath: { eq: "LA_AAT_green_online_logo.png" }) {
      publicURL
    }
  }
`)
```

### Data Validation
```typescript
// Good: Validate data before use
const Component = ({ data }: { data?: SomeDataType }) => {
  if (!data || !data.requiredField) {
    return <div>Loading...</div>
  }
  
  return <div>{data.requiredField}</div>
}
```

## Testing Types and Best Practices

### Test Data Types
```typescript
// Good: Use chance for test data generation with proper typing
import chance from "../../test-utils/chance"

const defaultProps = {
  icon: undefined,
  heading: chance.word({ length: chance.integer({ min: 5, max: 12 }) }),
  text: chance.paragraph({ sentences: 2 }),
  color: chance.pickone(["black", "blue", "green", "red"]),
  textColor: chance.pickone(["white", "black", "gray"]),
} as const

// Good: Type your test data
type TestProps = typeof defaultProps
```

### Testing Guidelines
```typescript
// Good: Don't wrap getBy* selectors with expect()
describe("Component", () => {
  beforeEach(() => {
    render(<Component {...defaultProps} />)
  })

  it("should display content", () => {
    screen.getByText(defaultProps.heading) // ✅
    screen.getByText(defaultProps.text)    // ✅
  })
})

// Bad: Redundant expect() wrapper
it("should display content", () => {
  expect(screen.getByText("Text")).toBeInTheDocument() // ❌
})
```

### Avoiding Hardcoded Test Values
```typescript
// Bad: Hardcoded test values
const testData = {
  heading: "Hi",
  color: "red",
  size: "64px"
} // ❌

// Good: Use chance for varied test data
const testData = {
  heading: chance.word({ length: 2 }),
  color: chance.pickone(["red", "blue", "green", "purple"]),
  size: chance.pickone(["32px", "48px", "64px", "96px"])
} // ✅
```

## Advanced Types

### Utility Types
```typescript
// Good: Use utility types when appropriate
type OptionalProps<T> = Partial<T>
type RequiredProps<T> = Required<T>
type ReadonlyProps<T> = Readonly<T>

// Good: Conditional types
type ConditionalType<T> = T extends string ? 'string' : 'other'
```

### Generic Components
```typescript
// Good: Generic components when needed
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  )
}
```

## Error Handling

### Type Guards
```typescript
// Good: Use type guards for runtime type checking
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  )
}

// Usage
if (isUserData(responseData)) {
  // TypeScript knows responseData is UserData here
  console.log(responseData.name)
}
```

### Error Types
```typescript
// Good: Define custom error types
interface ApiError {
  message: string
  code: number
  details?: Record<string, unknown>
}

// Good: Use in error handling
try {
  // API call
} catch (error) {
  if (error instanceof Error) {
    // Handle standard error
  } else if (isApiError(error)) {
    // Handle API error
  }
}
```

## Best Practices

### Avoid Any
```typescript
// Bad: Using any
const handleData = (data: any) => {
  console.log(data.someProperty) // No type safety
}

// Good: Proper typing
const handleData = (data: UserData) => {
  console.log(data.name) // Type safe
}
```

### Use Strict Mode
- Enable strict mode in tsconfig.json
- Use strict null checks
- Enable noImplicitAny
- Use strict function types

### Type Documentation
```typescript
/**
 * Represents a user in the system
 * @interface UserData
 */
interface UserData {
  /** Unique identifier for the user */
  id: string
  /** User's display name */
  name: string
  /** User's email address */
  email: string
}
```
