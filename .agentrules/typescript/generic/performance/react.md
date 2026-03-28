# React Performance Rules

## CRITICAL: Eliminating Async Waterfalls

### Problem
Async waterfalls occur when async operations wait for each other unnecessarily, even when they don't depend on each other. This adds significant waiting time that compounds across user sessions.

### Parallelize Independent Async Operations
```typescript
// ❌ BAD: Sequential waterfall - waits unnecessarily
const fetchUserData = async (userId: string) => {
  const user = await api.getUser(userId)
  const settings = await api.getUserSettings(userId) // Waits even though independent
  const preferences = await api.getUserPreferences(userId) // Waits even though independent
  return { user, settings, preferences }
}

// ✅ GOOD: Parallel execution - all fetch simultaneously
const fetchUserData = async (userId: string) => {
  const [user, settings, preferences] = await Promise.all([
    api.getUser(userId),
    api.getUserSettings(userId),
    api.getUserPreferences(userId)
  ])
  return { user, settings, preferences }
}
```

### Conditional Async Operations
```typescript
// ❌ BAD: Blocks unused code path
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId) // Always waits
  
  if (skipProcessing) {
    // Returns immediately but still waited for userData
    return { skipped: true }
  }
  
  // Only this branch uses userData
  return processUserData(userData)
}

// ✅ GOOD: Only fetches when needed
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    return { skipped: true }
  }
  
  const userData = await fetchUserData(userId) // Only fetches when needed
  return processUserData(userData)
}
```

### useEffect Waterfalls
```typescript
// ❌ BAD: Cascading useEffect calls
const Component = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(null)
  
  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])
  
  useEffect(() => {
    if (user) {
      fetchSettings(user.id).then(setSettings) // Waits for user
    }
  }, [user])
  
  // This creates a waterfall: user → settings
}

// ✅ GOOD: Fetch in parallel when possible
const Component = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      const [userData, settingsData] = await Promise.all([
        fetchUser(userId),
        fetchSettings(userId) // Can fetch in parallel if userId is sufficient
      ])
      setUser(userData)
      setSettings(settingsData)
    }
    fetchData()
  }, [userId])
}
```

## CRITICAL: Re-render Optimization

### React.memo Usage
```typescript
// ✅ GOOD: Memoize expensive components
const ExpensiveChart = React.memo(({ data }: ChartProps) => {
  // Expensive rendering logic
  return <div>{/* complex chart */}</div>
}, (prevProps, nextProps) => {
  // Custom comparison function if needed
  return prevProps.data.id === nextProps.data.id
})

// ❌ BAD: Memoizing everything (overhead without benefit)
const SimpleText = React.memo(({ text }: { text: string }) => {
  return <p>{text}</p> // Too simple to benefit from memoization
})
```

### useMemo for Expensive Calculations
```typescript
// ✅ GOOD: Memoize expensive calculations
const useExpensiveValue = (input: string) => {
  return useMemo(() => {
    return expensiveCalculation(input) // Only recalculates when input changes
  }, [input])
}

// ❌ BAD: Recalculating on every render
const Component = ({ items }: { items: Item[] }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0) // Recalculates every render
  return <div>Total: {total}</div>
}

// ✅ GOOD: Memoize the calculation
const Component = ({ items }: { items: Item[] }) => {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0)
  }, [items])
  return <div>Total: {total}</div>
}
```

### useCallback for Stable References
```typescript
// ✅ GOOD: Memoize callbacks passed to child components
const Parent = ({ items }: { items: Item[] }) => {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []) // Stable reference prevents child re-renders
  
  return items.map(item => (
    <Child key={item.id} onClick={handleClick} />
  ))
}

// ❌ BAD: New function on every render causes child re-renders
const Parent = ({ items }: { items: Item[] }) => {
  const handleClick = (id: string) => {
    // Handle click
  } // New function every render
  
  return items.map(item => (
    <Child key={item.id} onClick={handleClick} />
  ))
}
```

## HIGH: Lazy State Initialization

### useState Function Initializers
```typescript
// ❌ BAD: Parses JSON on every render
const Component = () => {
  const [config, setConfig] = useState(
    JSON.parse(localStorage.getItem('config') || '{}')
  ) // Runs on every render
}

// ✅ GOOD: Only parses once on mount
const Component = () => {
  const [config, setConfig] = useState(() => {
    return JSON.parse(localStorage.getItem('config') || '{}')
  }) // Only runs once
}

// ✅ GOOD: Expensive computation only once
const Component = ({ data }: { data: DataType }) => {
  const [processedData, setProcessedData] = useState(() => {
    return expensiveProcessing(data) // Only runs once
  })
}
```

### When to Use Function Initializers
- Parsing JSON from localStorage/sessionStorage
- Expensive computations for initial state
- Creating complex objects/arrays
- Any synchronous work that only needs to run once

## HIGH: Bundle Size Optimization

### Dynamic Imports for Heavy Libraries
```typescript
// ❌ BAD: Heavy library in main bundle
import { Chart } from 'heavy-chart-library' // Adds 300KB to bundle

const Dashboard = () => {
  return <Chart data={data} />
}

// ✅ GOOD: Dynamic import - only loads when needed
const Dashboard = () => {
  const [Chart, setChart] = useState(null)
  
  useEffect(() => {
    import('heavy-chart-library').then(module => {
      setChart(() => module.Chart)
    })
  }, [])
  
  if (!Chart) return <LoadingSpinner />
  return <Chart data={data} />
}

// ✅ GOOD: React.lazy for components
const HeavyChart = React.lazy(() => import('./HeavyChart'))

const Dashboard = () => (
  <Suspense fallback={<ChartSkeleton />}>
    <HeavyChart data={data} />
  </Suspense>
)
```

### Avoid Heavy Client-Side Imports
```typescript
// ❌ BAD: Importing entire library
import _ from 'lodash' // Imports entire library (70KB+)

// ✅ GOOD: Import only what you need
import debounce from 'lodash/debounce' // Only imports debounce

// ✅ GOOD: Use native alternatives when possible
// Instead of lodash debounce, use native or small utility
```

### Code Splitting Strategies
```typescript
// ✅ GOOD: Route-based splitting
const HomePage = React.lazy(() => import('./pages/HomePage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))

// ✅ GOOD: Feature-based splitting
const AdminPanel = React.lazy(() => import('./features/AdminPanel'))
const UserDashboard = React.lazy(() => import('./features/UserDashboard'))

// ✅ GOOD: Conditional loading
const Component = ({ showChart }: { showChart: boolean }) => {
  const [Chart, setChart] = useState(null)
  
  useEffect(() => {
    if (showChart) {
      import('./HeavyChart').then(module => setChart(() => module.default))
    }
  }, [showChart])
  
  return showChart && Chart ? <Chart /> : null
}
```

## MEDIUM: Dependency Array Optimization

### Proper useEffect Dependencies
```typescript
// ❌ BAD: Missing dependencies causes stale closures
const Component = ({ userId, onUpdate }: Props) => {
  useEffect(() => {
    fetchUser(userId).then(onUpdate) // Missing onUpdate in deps
  }, [userId]) // onUpdate might be stale
}

// ✅ GOOD: Include all dependencies
const Component = ({ userId, onUpdate }: Props) => {
  useEffect(() => {
    fetchUser(userId).then(onUpdate)
  }, [userId, onUpdate])
}

// ✅ GOOD: Use useCallback for stable function references
const Parent = () => {
  const handleUpdate = useCallback((user: User) => {
    // Handle update
  }, [])
  
  return <Child onUpdate={handleUpdate} />
}
```

### Avoiding Unnecessary Effect Runs
```typescript
// ❌ BAD: Effect runs on every render
const Component = ({ data }: { data: DataType }) => {
  useEffect(() => {
    processData(data) // Runs even if data hasn't changed
  }) // Missing dependency array
}

// ✅ GOOD: Only runs when data changes
const Component = ({ data }: { data: DataType }) => {
  useEffect(() => {
    processData(data)
  }, [data]) // Only runs when data changes
}

// ✅ GOOD: Use refs for values that shouldn't trigger effects
const Component = () => {
  const renderCount = useRef(0)
  renderCount.current += 1 // Doesn't trigger re-render or effect
}
```

## MEDIUM: Context Optimization

### Splitting Contexts
```typescript
// ❌ BAD: Single large context causes unnecessary re-renders
const AppContext = createContext({
  user: null,
  theme: 'light',
  settings: {},
  notifications: []
}) // Any change re-renders all consumers

// ✅ GOOD: Split into focused contexts
const UserContext = createContext({ user: null })
const ThemeContext = createContext({ theme: 'light' })
const SettingsContext = createContext({ settings: {} })

// ✅ GOOD: Memoize context values
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('light')
  
  const value = useMemo(() => ({
    theme,
    setTheme
  }), [theme]) // Only creates new object when theme changes
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
```

### Context Selectors
```typescript
// ❌ BAD: Consuming entire context
const Component = () => {
  const { user, theme, settings, notifications } = useContext(AppContext)
  // Re-renders when any context value changes
  return <div>{user.name}</div>
}

// ✅ GOOD: Use selectors to subscribe to specific values
const useUser = () => {
  const context = useContext(AppContext)
  return useMemo(() => context.user, [context.user]) // Only re-renders when user changes
}
```

## LOW: Rendering Performance

### Key Props Optimization
```typescript
// ❌ BAD: Using index as key (causes issues with reordering)
{items.map((item, index) => (
  <Item key={index} item={item} />
))}

// ✅ GOOD: Use stable, unique keys
{items.map((item) => (
  <Item key={item.id} item={item} />
))}
```

### Avoiding Inline Object/Function Creation
```typescript
// ❌ BAD: New object/function on every render
const Component = ({ items }: { items: Item[] }) => {
  return (
    <ChildComponent
      style={{ margin: 10 }} // New object every render
      onClick={() => handleClick()} // New function every render
    />
  )
}

// ✅ GOOD: Extract to constants or useMemo/useCallback
const Component = ({ items }: { items: Item[] }) => {
  const style = useMemo(() => ({ margin: 10 }), [])
  const handleClick = useCallback(() => {
    // Handle click
  }, [])
  
  return <ChildComponent style={style} onClick={handleClick} />
}
```

### Virtualization for Long Lists
```typescript
// ❌ BAD: Rendering all items at once
const List = ({ items }: { items: Item[] }) => {
  return (
    <div>
      {items.map(item => <Item key={item.id} item={item} />)}
    </div>
  ) // Renders all 1000+ items
}

// ✅ GOOD: Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual'

const List = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualItem => (
        <Item
          key={items[virtualItem.index].id}
          item={items[virtualItem.index]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}
        />
      ))}
    </div>
  )
}
```

## Performance Monitoring

### Measuring Component Render Time
```typescript
// ✅ GOOD: Monitor render performance
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

// Usage
const ExpensiveComponent = () => {
  usePerformanceMonitor('ExpensiveComponent')
  // Component implementation
}
```

### React DevTools Profiler
- Use React DevTools Profiler to identify slow components
- Look for components that render frequently
- Identify unnecessary re-renders
- Measure actual render times in production builds

## Best Practices Summary

### Priority Order (by Impact)
1. **CRITICAL**: Eliminate async waterfalls - parallelize independent operations
2. **CRITICAL**: Optimize bundle size - use dynamic imports and code splitting
3. **HIGH**: Use lazy state initialization - avoid re-computation on every render
4. **HIGH**: Memoize expensive components and calculations
5. **MEDIUM**: Optimize context usage - split contexts and memoize values
6. **MEDIUM**: Proper dependency arrays - avoid unnecessary effect runs
7. **LOW**: Avoid inline object/function creation
8. **LOW**: Use virtualization for long lists

### Performance Checklist
- [ ] Independent async operations run in parallel
- [ ] Conditional async operations only fetch when needed
- [ ] Heavy libraries are dynamically imported
- [ ] useState uses function initializers for expensive work
- [ ] Expensive components are memoized with React.memo
- [ ] Expensive calculations use useMemo
- [ ] Callbacks passed to children use useCallback
- [ ] Contexts are split and values are memoized
- [ ] useEffect has proper dependency arrays
- [ ] Long lists use virtualization
