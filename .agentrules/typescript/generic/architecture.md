# Architecture Rules

## Component Design Principles

### Single Responsibility
- Each component should have one clear purpose
- Separate concerns: data fetching, presentation, logic
- Keep components focused and maintainable

### Pure Component Pattern
```typescript
// Good: Separate data fetching from presentation
const Component = (props: ComponentProps) => {
  const data = useStaticQuery<ComponentData>(graphql`...`)
  return <PureComponent {...props} data={data} />
}

// Pure component for testing and reusability
export const PureComponent = ({ data, ...props }: PureComponentProps) => {
  // Component implementation without side effects
  return <div>{data.content}</div>
}

export default Component
```

### Component Composition
```typescript
// Good: Compose components from smaller pieces
const UserProfile = ({ user }: UserProfileProps) => (
  <Card>
    <UserAvatar user={user} />
    <UserInfo user={user} />
    <UserActions user={user} />
  </Card>
)

// Bad: One large monolithic component
const UserProfile = ({ user }: UserProfileProps) => (
  <div className="user-profile">
    {/* 100+ lines of JSX */}
  </div>
)
```

## State Management

### Local State
- Use React hooks for component-level state
- Keep state as local as possible
- Use proper state update patterns

### State Update Patterns
```typescript
// Good: Functional updates for complex state
const [count, setCount] = useState(0)

const increment = () => {
  setCount(prev => prev + 1)
}

// Good: Object state updates
const [user, setUser] = useState({ name: '', email: '' })

const updateUser = (field: string, value: string) => {
  setUser(prev => ({ ...prev, [field]: value }))
}
```

### Context Usage
```typescript
// Good: Use context for shared state
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>('light')
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Usage in components
const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

## Data Flow

### Props Down, Events Up
```typescript
// Good: Data flows down through props
const ParentComponent = () => {
  const [data, setData] = useState([])
  
  return (
    <ChildComponent 
      data={data} 
      onDataChange={setData}
    />
  )
}

// Good: Events bubble up through callbacks
const ChildComponent = ({ data, onDataChange }: ChildProps) => {
  const handleClick = () => {
    onDataChange([...data, newItem])
  }
  
  return <button onClick={handleClick}>Add Item</button>
}
```

### Data Fetching Strategy
```typescript
// Good: Centralized data fetching
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const userData = await api.getUser(userId)
        setUser(userData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  return { user, loading, error }
}
```

## Error Handling

### Error Boundaries
```typescript
// Good: Implement error boundaries for component trees
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

### Graceful Degradation
```typescript
// Good: Handle missing data gracefully
const Component = ({ data }: { data?: DataType }) => {
  if (!data) {
    return <LoadingSpinner />
  }

  if (data.error) {
    return <ErrorMessage error={data.error} />
  }

  return <DataDisplay data={data} />
}
```

## Performance Patterns

### Memoization
```typescript
// Good: Memoize expensive components
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Expensive rendering logic
  return <div>{/* complex JSX */}</div>
})

// Good: Memoize expensive calculations
const useExpensiveValue = (input: string) => {
  return useMemo(() => {
    return expensiveCalculation(input)
  }, [input])
}
```

### Lazy Loading
```typescript
// Good: Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'))

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyComponent />
  </Suspense>
)
```

## File Organization

### Component Structure
```
src/
├── components/
│   ├── ComponentName/
│   │   ├── ComponentName.tsx      # Main component
│   │   ├── ComponentName.test.tsx # Tests
│   │   ├── index.tsx             # Exports
│   │   └── types.ts              # Component types
│   └── shared/                   # Reusable components
├── pages/                        # Page components
├── hooks/                        # Custom hooks
├── utils/                        # Utility functions
└── types.ts                      # Global types
```

### Import Organization
```typescript
// Good: Organized imports
// External libraries
import React from 'react'
import { Box, Text } from '@chakra-ui/react'

// Internal components
import { Layout } from '../Layout'
import { SEO } from '../Seo'

// Types and utilities
import { ComponentProps } from '../types'
import { formatDate } from '../utils'
```

## Code Splitting

### Route-Based Splitting
```typescript
// Good: Split by routes
const HomePage = React.lazy(() => import('./pages/HomePage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))
const ContactPage = React.lazy(() => import('./pages/ContactPage'))

const App = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Suspense>
  </Router>
)
```

### Component-Based Splitting
```typescript
// Good: Split heavy components
const HeavyChart = React.lazy(() => import('./HeavyChart'))

const Dashboard = () => (
  <div>
    <LightweightHeader />
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  </div>
)
```

## Testing Architecture

### Testable Components
```typescript
// Good: Separate logic for testing
const useUserLogic = (userId: string) => {
  // Business logic here
  return { user, loading, error, actions }
}

const UserComponent = ({ userId }: { userId: string }) => {
  const { user, loading, error, actions } = useUserLogic(userId)
  
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  
  return <UserDisplay user={user} actions={actions} />
}

// Test the logic separately
describe('useUserLogic', () => {
  it('should handle user data correctly', () => {
    // Test business logic
  })
})
```

### Testing Guidelines & Best Practices
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
      screen.getByText(defaultProps.title) // ✅ Don't wrap with expect()
    })
  })
})
```

**Key Testing Principles:**
1. **Don't wrap `getBy*` selectors with `expect()`** - they already throw if not found
2. **Use `chance` consistently** for test data instead of hardcoded values
3. **Use `beforeEach` appropriately** when rendering the same component multiple times
4. **Avoid duplicated tests** - each test should be unique and meaningful
5. **Follow consistent test structure** across all components

### Recent Test Refactoring Results
All test files have been updated to follow our testing guidelines:
- ✅ **Eliminated redundant `expect().toBeInTheDocument()` wrappers**
- ✅ **Replaced hardcoded test values with `chance`-generated data**
- ✅ **Added `beforeEach` appropriately where needed**
- ✅ **Removed duplicated test cases**
- ✅ **Standardized test structure across all components**

## Documentation

### Component Documentation
```typescript
/**
 * HeroImage component displays a hero image with optional overlay content
 * 
 * @param imageData - Image source and metadata
 * @param height - Height of the hero image
 * @param children - Optional overlay content
 * 
 * @example
 * <HeroImage imageData={{ src: '/hero.jpg' }} height="60vh">
 *   <h1>Welcome to our site</h1>
 * </HeroImage>
 */
const HeroImage: React.FC<HeroImageProps> = ({ 
  imageData, 
  height = "50vh", 
  children 
}) => {
  // Component implementation
}
```
