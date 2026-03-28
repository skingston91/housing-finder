# Quality Rules

## Code Quality Standards

### General Principles
- Write clean, readable, and maintainable code
- Follow established patterns and conventions
- Prioritize clarity over cleverness
- Document complex logic and decisions

### Code Organization
- Group related functionality together
- Use meaningful variable and function names
- Keep functions small and focused
- Limit function complexity (max 10-15 lines)

## ESLint Configuration

### Follow ESLint Rules
- Follow ESLint configuration in `eslint.config.mjs`
- Use explicit return types where beneficial
- Handle unused variables appropriately
- Follow React best practices

### ESLint Rules Enforcement
```typescript
// Good: Proper return types
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Good: Handle unused variables
const Component = ({ title, description }: Props) => {
  // Use all props or prefix with underscore
  const { title: _title, description } = props
  return <div>{description}</div>
}

// Good: Proper React patterns
const Component = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}
```

### Common ESLint Rules
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // React rules
      'react/prop-types': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      
      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
]
```

## Performance Guidelines

### React Performance
- Use `React.memo` for expensive components
- Implement proper dependency arrays in `useEffect`
- Avoid unnecessary re-renders
- Use proper `key` props in lists

### Memoization Strategies
```typescript
// Good: Memoize expensive components
const ExpensiveChart = React.memo(({ data }: ChartProps) => {
  // Expensive rendering logic
  return <div>{/* complex chart */}</div>
})

// Good: Memoize expensive calculations
const useExpensiveValue = (input: string) => {
  return useMemo(() => {
    return expensiveCalculation(input)
  }, [input])
}

// Good: Memoize callbacks
const handleClick = useCallback(() => {
  // Handle click logic
}, [dependencies])
```

### Bundle Optimization
```typescript
// Good: Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'))

// Good: Dynamic imports for code splitting
const loadFeature = async () => {
  const { default: Feature } = await import('./Feature')
  return Feature
}
```

## Code Review Standards

### Before Committing
- All tests must pass
- TypeScript compilation successful
- ESLint rules satisfied
- Build process completes successfully
- No `console.log` statements in production code

### Review Checklist
- [ ] Code follows established patterns
- [ ] Tests cover new functionality
- [ ] Types are properly defined
- [ ] Error handling is implemented
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met

### Code Review Process
```typescript
/**
 * Code Review Template
 * 
 * ## Changes Made
 * - [Description of changes]
 * 
 * ## Testing
 * - [ ] Unit tests added/updated
 * - [ ] Integration tests pass
 * - [ ] Manual testing completed
 * 
 * ## Code Quality
 * - [ ] ESLint passes
 * - [ ] TypeScript compiles
 * - [ ] No console.log statements
 * - [ ] Proper error handling
 * 
 * ## Performance
 * - [ ] No unnecessary re-renders
 * - [ ] Efficient data structures
 * - [ ] Proper memoization
 */
```

## Error Handling

### Component Error Handling
```typescript
// Good: Implement proper null checks for data
const Component = ({ data }: { data?: DataType }) => {
  if (!data) {
    return <div>Loading...</div>
  }

  if (data.error) {
    return <ErrorMessage error={data.error} />
  }

  return <DataDisplay data={data} />
}
```

### Error Boundary Implementation
```typescript
// Good: Error boundaries for component trees
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
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

### Form Validation
```typescript
// Good: Proper form validation
const useFormValidation = (initialValues: FormValues) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Partial<FormValues>>({})
  const [touched, setTouched] = useState<Partial<FormValues>>({})

  const validate = (fieldValues: Partial<FormValues> = values) => {
    const newErrors: Partial<FormValues> = {}
    
    if (!fieldValues.name) {
      newErrors.name = 'Name is required'
    }
    
    if (!fieldValues.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(fieldValues.email)) {
      newErrors.email = 'Email is invalid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return { values, errors, touched, setValues, validate }
}
```

## Accessibility Standards

### ARIA and Semantics
```typescript
// Good: Proper semantic HTML and ARIA
const Button = ({ children, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      aria-label={props['aria-label'] || typeof children === 'string' ? children : undefined}
    >
      {children}
    </button>
  )
}

// Good: Proper heading hierarchy
const Page = () => (
  <div>
    <h1>Main Page Title</h1>
    <section>
      <h2>Section Title</h2>
      <h3>Subsection Title</h3>
    </section>
  </div>
)
```

### Keyboard Navigation
```typescript
// Good: Keyboard event handling
const useKeyboardNavigation = (onEnter: () => void, onEscape: () => void) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        onEnter()
        break
      case 'Escape':
        event.preventDefault()
        onEscape()
        break
    }
  }, [onEnter, onEscape])

  return { handleKeyDown }
}
```

## Documentation Standards

### Code Comments
```typescript
/**
 * Calculates the total price including tax and discounts
 * 
 * @param items - Array of items with prices
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code
 * @returns Total price with tax and discounts applied
 * 
 * @example
 * const total = calculateTotal(items, 0.08, 'SAVE20')
 */
const calculateTotal = (
  items: Item[], 
  taxRate: number, 
  discountCode?: string
): number => {
  // Implementation
}
```

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

## Security Considerations

### Input Validation
```typescript
// Good: Validate all user inputs
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}
```

### Data Sanitization
```typescript
// Good: Sanitize data before rendering
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
}

// Good: Safe HTML rendering
const SafeHtml = ({ html }: { html: string }) => {
  const sanitized = sanitizeHtml(html)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

## Testing Quality

### Test Coverage
- Aim for 80%+ test coverage
- Test all critical user paths
- Test edge cases and error conditions
- Test accessibility features

### Test Quality Standards
```typescript
// Good: Comprehensive test coverage
describe('UserRegistration', () => {
  it('should validate required fields', () => {
    // Test validation logic
  })

  it('should handle server errors gracefully', () => {
    // Test error handling
  })

  it('should be accessible to screen readers', () => {
    // Test accessibility
  })

  it('should work with keyboard navigation', () => {
    // Test keyboard support
  })
})
```

## Performance Monitoring

### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Check for duplicate dependencies
npm ls
npm dedupe
```

### Performance Metrics
```typescript
// Good: Performance monitoring
const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (duration > 100) {
        console.warn(`${componentName} took ${duration}ms to render`)
      }
    }
  })
}
```

## Code Metrics

### Complexity Limits
- **Cyclomatic Complexity**: Max 10 per function
- **Function Length**: Max 20 lines
- **File Length**: Max 300 lines
- **Nesting Depth**: Max 4 levels

### Quality Gates
```typescript
// Good: Quality gate checks
const qualityChecks = {
  maxFunctionLength: 20,
  maxFileLength: 300,
  maxComplexity: 10,
  minTestCoverage: 80
}

// Implement in CI/CD pipeline
const runQualityChecks = () => {
  // Run ESLint
  // Run TypeScript compiler
  // Run tests
  // Check coverage
  // Validate bundle size
}
```
