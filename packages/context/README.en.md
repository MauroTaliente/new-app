# `@maurotaliente/react-context`

`newContext` builds a **state** context and a **dispatch** context from your reducer and initial values. The dispatcher reference stays stable across updates; consumers use generated hooks such as `useFooState` and `useFooUpdater`.

## Re-renders and selectors

Reading the **full** state via `useFooState()` re-renders the component whenever **any** part of that state changes. To limit updates, derive a narrow value (or pass only part of the tree into children that subscribe):

```tsx
function ThemeName() {
  const state = useThemeState();
  const name = useMemo(() => state.theme.name, [state.theme.name]);
  return <span>{name}</span>;
}
```

For large stores, prefer **splitting** into multiple `newContext` instances or multiple providers so leaves do not subscribe to unrelated slices.
