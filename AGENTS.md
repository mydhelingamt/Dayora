# DAYORA PERFORMANCE RULE

For every implementation, choose the simplest solution that satisfies the requirement.

## Priorities

1. **Minimum dependencies**: Prefer native platform capabilities (Kotlin/Android, React Native core) over third-party npm packages.
2. **Minimum application size**: Continuously monitor and minimize APK/AAB bundle size, asset footprints, and binary overhead.
3. **Fast startup**: Keep the cold-start and splash path lightweight; execute background synchronization and reconciliations asynchronously without blocking the UI thread.
4. **Low memory usage**: Enforce image thumbnailing, clean bitmap allocation/recycling, bounded cache sizes, and bounded SQLite page buffers.
5. **Low CPU usage**: Leverage native driver for animations, minimize JS thread workload, and avoid unneeded computations.
6. **Low battery consumption**: Use SQLite WAL with `synchronous = NORMAL` to cut disk I/O; avoid polling or periodic wake-locks.
7. **Efficient SQLite queries**: Index frequently queried columns; avoid redundant round-trips and full table scans.
8. **Minimal React re-renders**: Use `React.memo`, `useMemo`, and `useCallback` on reusable list items, headers, cards, and handlers.
9. **Efficient list rendering**: Configure `FlatList` with `removeClippedSubviews`, `initialNumToRender`, `maxToRenderPerBatch`, and `windowSize`.
10. **Optimized image storage**: Use native compression, downscaling (512x512 JPEG), thumbnail generation (128x128 JPEG), and SHA-256 deduplication.
11. **Lightweight animations**: Rely on `Animated` with `useNativeDriver: true`.
12. **Responsive layouts**: Support small to large Android screens and font accessibility scaling (`maxFontSizeMultiplier`) without layout overflow or content clipping.
13. **Stable navigation**: Use native stack navigation transitions without route leaks or unhandled parameters.
14. **Reliable local persistence**: Guarantee offline-first relational persistence with migration tracking.
15. **Production-quality error handling**: Implement graceful fallbacks (`onError`, fallback avatars, try/catch with logged context) without crashing or swallowing fatal issues.

## Guidelines

- Before adding any library, asset, abstraction, animation, or background operation, determine whether it is actually required.
- Do not optimize by removing required functionality.
- Do not hide errors.
- Do not suppress warnings that indicate real implementation problems.
- Fix the underlying cause of performance, stability, layout, storage, or build issues.
