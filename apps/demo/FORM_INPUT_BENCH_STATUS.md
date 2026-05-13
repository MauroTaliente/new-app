# Form Input Bench - Estado actual

## Objetivo de este esquema

Estandarizar la demo de `Form` para validar cada input en forma consistente:

- probar el componente real (no mocks)
- mostrar props activas visibles en UI (tags)
- cubrir combinaciones de estados/variantes sin depender de scroll largo
- facilitar QA manual y migraciones por componente

## Convenciones definidas

### 1) Patrón de inyección con `Field`

Para inputs del bench:

- `Field<TProps>` recibe las props de prueba
- `Field` inyecta esas mismas props a:
  - el input (`InputSlider`, etc.)
  - el row de props (`InputPropRow`)

Esto evita duplicar configuración entre componente y metadata visible.

### 2) Row de props reusable

Se creó `InputPropRow` genérico con `config` por input.

Archivo:

- `apps/demo/src/demo/input-prop-row.tsx`

Cada input define:

- keys a mostrar
- booleans
- defaults de enums
- defaults numéricos
- props siempre visibles (`alwaysInclude`, ej. `disabled: false`)

### 3) Semántica de color en tags

- `boolean`
  - `false` -> `grey`
  - `true` -> `green`
- `enum`
  - valor default -> `violet`
  - valor no default -> `blue`
- `number`
  - valor default -> `violet`
  - valor no default -> `blue`
- `disabled` se muestra siempre como tag

## Estado funcional actual

## ✅ InputSlider implementado bajo el esquema

En `apps/demo/src/demo/form-panel.tsx`:

- casos incluidos:
  - continuo
  - segmentado
  - range
  - disabled
  - loading
- cada caso usa:
  - `Field<InputSliderProps>`
  - `InputSlider`
  - `InputPropRow config={sliderPropRowConfig}`

## ✅ InputText implementado bajo el esquema

En `apps/demo/src/demo/form-panel.tsx`:

- se agregó `inputTextPropRowConfig` con:
  - keys visibles
  - booleanKeys
  - enumDefaults
  - numberDefaults
  - `alwaysInclude` razonable (`disabled: false`, `mode: 'text'`)
- casos incluidos:
  - email conectado (`required`, `indicators`, `isClearable`)
  - notas conectada (`mode='area'`)
  - password conectado
  - disabled
  - loading
- cada caso usa:
  - `Field<InputTextProps>`
  - `InputText`
  - `InputPropRow config={inputTextPropRowConfig}`

Notas de estabilidad cerradas:

- `required` ahora se propaga desde `Field` a children (antes solo afectaba label):
  - `packages/ui/src/components/molecules/field.tsx`
- `Password state` conectado al form state real (`api.connect('textPassword')`) con `initialValues`.
- toggle de password corregido para mantener el ojo al mostrar caracteres y poder volver a ofuscar.
- acción del ojo migrada a `Button` del sistema con `disabled` explícito:
  - `packages/ui/src/components/molecules/input-text.tsx`

## ✅ Navegación interna de Form en modo tabs

En `FormPanel`:

- subnav con `Button variant="subtle"`
- `active` refleja tab seleccionado
- comportamiento actual: tab real (cambia contenido visible), no scroll por hash

## ✅ Modularización de la demo

Estructura actual:

- `apps/demo/src/App.tsx` -> shell/layout + navegación principal
- `apps/demo/src/demo/form-panel.tsx` -> vista Form completa
- `apps/demo/src/demo/input-prop-row.tsx` -> renderer reusable de props
- `apps/demo/src/demo/button-panel.tsx` -> vista Button
- `apps/demo/src/demo/overview-panel.tsx` -> vista Overview
- `apps/demo/src/demo/theme-switch.tsx` -> switch global de tema

## Cambios de soporte aplicados

- `Field` soporta genéricos para inyección tipada:
  - `packages/ui/src/components/molecules/field.tsx`
- `Field` ahora también inyecta `required` a children:
  - `packages/ui/src/components/molecules/field.tsx`
- ajuste de navegación IDE a source definition:
  - `.vscode/settings.json`
- `InputFrame` indicators no capturan click:
  - `packages/ui/src/components/electrons/input-frame.tsx`
  - clase `pointer-events-none`

## ✅ InputDatePicker implementado bajo el esquema

En `apps/demo/src/demo/form-panel.tsx`:

- se agregó `inputDatePickerPropRowConfig` con:
  - keys visibles
  - booleanKeys (incluye `loading`)
  - enumDefaults
  - `alwaysInclude` razonable (`disabled: false`, `selectionMode: 'single'`)
- casos incluidos:
  - single conectado (`scheduleDate`)
  - range conectado (`vacationRange`)
  - highlighted/rules
  - disabled
  - loading
- cada caso usa:
  - `Field<InputDatePickerProps>`
  - `InputDatePicker`
  - `InputPropRow config={inputDatePickerPropRowConfig}`

Soporte de estado aplicado en componente:

- `InputDatePicker` ahora maneja `loading` como estado bloqueado (`disabled || loading`):
  - `packages/ui/src/components/molecules/input-date-picker.tsx`

## Criterio de diseño acordado

Componentizar lo justo y necesario:

- preferir claridad y costo de mantenimiento bajo
- evitar sobredimensionar abstracciones
- extraer solo cuando hay repetición real o fricción de lectura
