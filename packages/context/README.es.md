# `@maurotaliente/react-context`

`newContext` arma un contexto de **estado** y uno de **dispatch** a partir de tu reducer y valores iniciales. La referencia del dispatch se mantiene estable; los consumidores usan hooks generados como `useFooState` y `useFooUpdater`.

## Re-renders y “selectores”

Leer el estado **completo** con `useFooState()` re-renderiza el componente cuando cambia **cualquier** parte de ese estado. Para acotar actualizaciones, derivá un valor estrecho (o pasá solo parte del árbol a hijos que se suscriben):

```tsx
function ThemeName() {
  const state = useThemeState();
  const name = useMemo(() => state.theme.name, [state.theme.name]);
  return <span>{name}</span>;
}
```

En stores grandes, conviene **partir** el estado en varias instancias de `newContext` o varios providers para que las hojas no dependan de slices ajenos.
