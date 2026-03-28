# JavaScript Performance Rules

## CRITICAL: Eliminating Async Waterfalls

### Parallelize Independent Async Operations
```typescript
// ❌ BAD: Sequential waterfall
async function fetchUserData(userId: string) {
  const user = await api.getUser(userId)
  const settings = await api.getUserSettings(userId) // Waits unnecessarily
  const preferences = await api.getUserPreferences(userId) // Waits unnecessarily
  return { user, settings, preferences }
}

// ✅ GOOD: Parallel execution
async function fetchUserData(userId: string) {
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
    return { skipped: true } // Returns immediately but still waited
  }
  
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

### Promise.allSettled for Partial Failures
```typescript
// ✅ GOOD: Handle partial failures gracefully
async function fetchMultipleData(userIds: string[]) {
  const results = await Promise.allSettled(
    userIds.map(id => api.getUser(id))
  )
  
  const successful = results
    .filter((r): r is PromiseFulfilledResult<User> => r.status === 'fulfilled')
    .map(r => r.value)
  
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason)
  
  return { successful, failed }
}
```

## HIGH: Loop Optimization

### Combining Loop Iterations
```typescript
// ❌ BAD: Multiple passes over same data
function processMessages(messages: Message[]) {
  const validMessages = messages.filter(m => m.isValid)
  const sortedMessages = validMessages.sort((a, b) => a.timestamp - b.timestamp)
  const messageCounts = sortedMessages.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1
    return acc
  }, {})
  const totalLength = sortedMessages.reduce((sum, m) => sum + m.length, 0)
  // Scans the same list multiple times
}

// ✅ GOOD: Single pass combining operations
function processMessages(messages: Message[]) {
  const valid = messages.filter(m => m.isValid)
  valid.sort((a, b) => a.timestamp - b.timestamp)
  
  // Single pass for remaining operations
  const messageCounts: Record<string, number> = {}
  let totalLength = 0
  
  for (const message of valid) {
    messageCounts[message.type] = (messageCounts[message.type] || 0) + 1
    totalLength += message.length
  }
  
  return { valid, messageCounts, totalLength }
}
```

### Efficient Array Operations
```typescript
// ❌ BAD: Chaining multiple array methods
const result = items
  .filter(item => item.active)
  .map(item => item.value)
  .filter(value => value > 0)
  .reduce((sum, value) => sum + value, 0)
// Creates intermediate arrays

// ✅ GOOD: Single pass when possible
let sum = 0
for (const item of items) {
  if (item.active && item.value > 0) {
    sum += item.value
  }
}
// No intermediate arrays
```

### Set/Map for Lookups
```typescript
// ❌ BAD: Array.includes() for frequent lookups
function findItems(ids: string[], allItems: Item[]) {
  return allItems.filter(item => ids.includes(item.id)) // O(n*m) complexity
}

// ✅ GOOD: Use Set for O(1) lookups
function findItems(ids: string[], allItems: Item[]) {
  const idSet = new Set(ids) // O(n) to create
  return allItems.filter(item => idSet.has(item.id)) // O(m) to filter
}
```

## MEDIUM: Object and Array Operations

### Avoiding Unnecessary Object Creation
```typescript
// ❌ BAD: Creating new objects unnecessarily
function updateUser(user: User, field: string, value: string) {
  return { ...user, [field]: value } // Creates new object
}

// ✅ GOOD: Mutate when appropriate (if user is not shared)
function updateUser(user: User, field: string, value: string) {
  user[field] = value
  return user
}

// ✅ GOOD: Or use structuredClone for deep copies when needed
function updateUser(user: User, field: string, value: string) {
  const updated = structuredClone(user)
  updated[field] = value
  return updated
}
```

### Efficient Object Merging
```typescript
// ❌ BAD: Multiple spread operations
const merged = { ...obj1, ...obj2, ...obj3, ...obj4 } // Creates intermediate objects

// ✅ GOOD: Object.assign for multiple merges
const merged = Object.assign({}, obj1, obj2, obj3, obj4)

// ✅ GOOD: Or single spread if only a few objects
const merged = { ...obj1, ...obj2 }
```

### Array Methods vs Loops
```typescript
// Use array methods for readability, loops for performance-critical code

// ✅ GOOD: Array methods (readable, functional)
const activeUsers = users.filter(u => u.active).map(u => u.name)

// ✅ GOOD: Loop (faster for large datasets)
const activeUserNames: string[] = []
for (const user of users) {
  if (user.active) {
    activeUserNames.push(user.name)
  }
}
```

## MEDIUM: Memory Management

### Avoiding Memory Leaks
```typescript
// ❌ BAD: Storing references that prevent garbage collection
const cache = new Map()
function processData(data: DataType) {
  cache.set(data.id, data) // Never cleared, grows indefinitely
  return process(data)
}

// ✅ GOOD: Limit cache size or use WeakMap
const cache = new Map()
const MAX_CACHE_SIZE = 100

function processData(data: DataType) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(data.id, data)
  return process(data)
}

// ✅ GOOD: WeakMap for object keys (auto garbage collected)
const cache = new WeakMap<object, DataType>()
```

### Clearing Event Listeners
```typescript
// ❌ BAD: Event listeners not cleaned up
useEffect(() => {
  window.addEventListener('scroll', handleScroll)
  // Missing cleanup
}, [])

// ✅ GOOD: Clean up event listeners
useEffect(() => {
  window.addEventListener('scroll', handleScroll)
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}, [])
```

### Avoiding Closure Memory Leaks
```typescript
// ❌ BAD: Closure captures large objects
function createHandler(largeData: LargeDataType) {
  return () => {
    // Uses largeData - keeps it in memory
    process(largeData)
  }
}

// ✅ GOOD: Only capture what's needed
function createHandler(largeData: LargeDataType) {
  const neededData = extractNeededData(largeData) // Only small subset
  return () => {
    process(neededData)
  }
}
```

## LOW: String Operations

### Template Literals vs Concatenation
```typescript
// ✅ GOOD: Template literals (modern, readable)
const message = `Hello ${name}, you have ${count} items`

// ❌ BAD: String concatenation (less efficient)
const message = 'Hello ' + name + ', you have ' + count + ' items'
```

### Efficient String Building
```typescript
// ❌ BAD: String concatenation in loops
let result = ''
for (const item of items) {
  result += item.name + ', ' // Creates new string each iteration
}

// ✅ GOOD: Array.join() for building strings
const names = items.map(item => item.name)
const result = names.join(', ')
```

## LOW: Function Optimization

### Avoiding Function Creation in Loops
```typescript
// ❌ BAD: Creating functions in loops
for (let i = 0; i < items.length; i++) {
  items[i].onClick = () => handleClick(i) // New function each iteration
}

// ✅ GOOD: Extract function creation
const createHandler = (index: number) => () => handleClick(index)
for (let i = 0; i < items.length; i++) {
  items[i].onClick = createHandler(i)
}
```

### Debouncing and Throttling
```typescript
// ✅ GOOD: Debounce expensive operations
import { debounce } from 'lodash/debounce'

const handleSearch = debounce((query: string) => {
  performSearch(query)
}, 300)

// ✅ GOOD: Throttle scroll/resize handlers
import { throttle } from 'lodash/throttle'

const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)
```

## Performance Monitoring

### Performance API
```typescript
// ✅ GOOD: Measure function execution time
function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${label} took ${end - start}ms`)
  return result
}

// Usage
const result = measurePerformance(() => {
  return expensiveOperation()
}, 'ExpensiveOperation')
```

### Memory Profiling
```typescript
// ✅ GOOD: Monitor memory usage
if (performance.memory) {
  const memory = performance.memory
  console.log({
    used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
    total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
    limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
  })
}
```

## Best Practices Summary

### Priority Order (by Impact)
1. **CRITICAL**: Eliminate async waterfalls - use Promise.all for parallel operations
2. **HIGH**: Combine loop iterations - single pass when possible
3. **HIGH**: Use Set/Map for lookups - O(1) instead of O(n)
4. **MEDIUM**: Avoid unnecessary object/array creation
5. **MEDIUM**: Clear event listeners and prevent memory leaks
6. **LOW**: Use efficient string operations
7. **LOW**: Debounce/throttle expensive operations

### Performance Checklist
- [ ] Independent async operations use Promise.all
- [ ] Conditional async operations only execute when needed
- [ ] Loops combine operations when possible
- [ ] Set/Map used for frequent lookups
- [ ] Event listeners are cleaned up
- [ ] Memory leaks prevented (cache limits, WeakMap)
- [ ] Expensive operations are debounced/throttled
- [ ] String building uses array.join() for multiple concatenations
