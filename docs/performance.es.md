# Notas de rendimiento

## Modelo de networking (`useAsyncFetch`)

Cada instancia de hook ejecuta **como mucho una request lógica a la vez**. Nuevos triggers reemplazan el trabajo anterior.

**Paralelismo:** varias **instancias** de hook (distinto `name` / scope) o `joinResponses`.

**Dedup / TTL compartido:** el mismo **`requestCache: 'global'`** (o la misma instancia **`RequestCache`**) + **`cacheTtlMs`** en `useAsyncFetch`—ver [architecture.es.md](architecture.es.md).

## Tamaño de bundle

- Imports **nombrados** desde `@maurotaliente/react-helpers` y el resto para facilitar tree-shaking.
- `@maurotaliente/react-networking` usa `use-memo-one` y React como peers.
- `@maurotaliente/react-i18n` incluye **`intl-messageformat`** para ICU—medí el bundle si el presupuesto es ajustado.

## Contexto y tema

El tema global usa contexto de React; los re-renders siguen las reglas habituales. Partir subárboles pesados o memoizar hijos si el perfilado lo justifica.

## Presupuesto de bundle (opcional)

Podés sumar **`size-limit`** u otra herramienta sobre el bundle del demo; el repo no impone límite por defecto.
