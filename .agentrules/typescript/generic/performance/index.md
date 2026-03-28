# Performance Rules

## Overview

Performance optimization should follow a priority order based on real-world impact. These rules are organized by category and impact level.

## Rule Categories

- **[React Performance](react.md)** - React-specific performance optimizations
- **[JavaScript Performance](javascript.md)** - JavaScript language-level optimizations

## Priority Framework

### CRITICAL Impact
These optimizations have the highest real-world impact:
1. **Eliminating async waterfalls** - Parallelize independent async operations
2. **Bundle size optimization** - Dynamic imports and code splitting
3. **Re-render optimization** - Memoization and context splitting

### HIGH Impact
Significant performance improvements:
1. **Lazy state initialization** - Avoid re-computation on every render
2. **Loop optimization** - Combine iterations, use efficient data structures
3. **Context optimization** - Split contexts and memoize values

### MEDIUM Impact
Moderate improvements:
1. **Dependency array optimization** - Proper useEffect dependencies
2. **Memory management** - Prevent leaks, clear listeners
3. **Object/array operations** - Efficient creation and manipulation

### LOW Impact
Incremental improvements:
1. **Rendering optimizations** - Key props, inline object/function avoidance
2. **String operations** - Efficient concatenation
3. **Function optimization** - Debouncing, throttling

## Quick Reference

### Async Operations
```typescript
// ✅ Parallel independent operations
const [a, b] = await Promise.all([fetchA(), fetchB()])

// ✅ Conditional async - only fetch when needed
if (needed) {
  const data = await fetchData()
}
```

### React Optimization
```typescript
// ✅ Lazy state initialization
const [state] = useState(() => expensiveComputation())

// ✅ Memoize expensive components
const Expensive = React.memo(Component)

// ✅ Memoize calculations
const value = useMemo(() => expensiveCalc(input), [input])
```

### JavaScript Optimization
```typescript
// ✅ Single pass loops
for (const item of items) {
  // Combine operations
}

// ✅ Set for lookups
const set = new Set(ids)
items.filter(item => set.has(item.id))
```

## Performance Monitoring

- Use React DevTools Profiler for component performance
- Use Performance API for measuring execution time
- Monitor bundle size with build analysis tools
- Track memory usage in development

## Related Rules

- **[React Rules](../react.md)** - General React patterns
- **[Architecture Rules](../architecture.md)** - Component design and data flow
- **[Quality Rules](../quality.md)** - Code quality standards
