# i18n: mensajes, `formatMessage` y tipado

El paquete `@maurotaliente/react-i18n` ofrece formato ICU en **texto plano** con **`formatMessage(locale, pattern, values?)`** e interpolación **rica** con **`ct`**. La resolución de locale (`getLocale`, helpers de navegador, adaptadores Next) va aparte: acá se trata la **forma** de los mensajes y **TypeScript**.

## Cuándo usar cada API

| API | Caso de uso |
|-----|-------------|
| **`formatMessage`** | Strings planos, atributos, `document.title`, logs, pasar un string resuelto a un hijo que no debe recibir nodos React. |
| **`ct`** | Textos de UI que pueden incluir nodos React (negrita, links) en el patrón. |

Ambas aceptan patrones **ICU MessageFormat** (plurales, `select`, placeholders `{name}`). Los valores son **`MessageValues`** (`string | number | boolean | Date | null | undefined`).

## Namespaces y módulos

La librería no exige un objeto “namespace” en runtime. Patrones habituales:

- **Un archivo por locale** — p. ej. `en.ts`, `es.ts` exportando un diccionario `Record<string, string>` (u objetos anidados que fusionás al cargar).
- **Mapas por feature** — exportar objetos chicos por ruta o paquete y componerlos donde la app arma el diccionario.

Carga perezosa: **`import()` dinámico** por trozos de locale si importa el tamaño del bundle; la API pública no impone un loader.

## Mapas tipados

Usá **`defineMessages`** para marcar un objeto `const` como fuente de mensajes sin cambiar el runtime:

```ts
import { defineMessages, formatMessage } from '@maurotaliente/react-i18n';

const labels = defineMessages({
  greeting: 'Hola, {name}!',
  count: 'Tenés {count, plural, one {# ítem} other {# ítems}}.',
});

const s = formatMessage('es', labels.greeting, { name: 'Ada' });
```

`defineMessages` es una función identidad; sirve para **inferencia** y documentación. Podés usar solo **`as const`** en un mapa chico si preferís.

## Next.js y componentes servidor

Los loaders solo-servidor y los adaptadores `next.client` están en **`@maurotaliente/react-i18n/next`** y **`@maurotaliente/react-i18n/next/server`** (ver README del paquete). Los **diccionarios** deberían ser serializables (solo strings en rutas `formatMessage`); **`ct`** es para componentes cliente donde tienen sentido nodos React.
