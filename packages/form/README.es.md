# @react33/react-form

Framework de formularios consumido por las apps (y por `@react33/react-ui` para los inputs concretos).

## Exports

- `Form`, `FormProvider`, `useFormState`, `useFormApi` — root del formulario + registry/contexto
- `Field`, `FieldPropsExtended` — envuelve un input child, le inyecta props de `FormInputApi`, renderiza `label`, `disclaimer`, `error`, overlay de `loading`
- `InputFrame` — shell visual compartido por los inputs (borde, foco, indicadores, clear, acciones derechas)
- `InputOptions` + helpers de opciones (`normalizeActiveIndex`, `moveActiveIndex`, `pickActiveOption`, `splitInputSegments`, `readOptionText`, `readOptionLabel`, `resolveOptionsDirection`)
- Tipos: `FormApi`, `FormConfig`, `FormInputApi`, `FromInputCustomApi`, `FromInputNativeApi`, `HtmlOmittedProps`, `Values`, `Errors`, `Messages`, `StatusErrors`, `FORM_MESSAGE_KEY`, `ValidatorsRules`, etc.
- Re-export de `@react33/react-ui-base`: `Button`, `Icon`, `Overlay`

## Instalación

```bash
pnpm add @react33/react-form @react33/react-styles
```

`@react33/react-ui-base` viene como dep transitiva — no hace falta instalarlo aparte.

## Uso

```tsx
import { Form, Field, Button } from '@react33/react-form';

function MiForm() {
  return (
    <Form
      config={{
        space: 'signup',
        initialValues: { email: '' },
        validatorsRules: { email: (v) => (!v ? 'requerido' : undefined) },
        onSubmit: ({ values }) => console.log(values),
      }}
    >
      {(api) => (
        <>
          <Field {...api.connect('email')} label="Email">
            <input
              type="email"
              className="bg-bg-100 border px-3 py-2"
              value={api.connect('email').value ?? ''}
              onChange={(e) => api.setValue('email', e.target.value)}
            />
          </Field>
          <Button type="submit">Enviar</Button>
        </>
      )}
    </Form>
  );
}
```

Para inputs listos para usar (`InputText`, `InputSelect`, `InputSwitch`, `InputSlider`, `InputDatePicker`, `InputChips`) instalá `@react33/react-ui`.

## Conectar inputs — `connect`, `connectRange`, `connectEntity`

Tres conectores enlazan un input de UI al form. Solo difieren en **cuántos
campos** maneja el input y **qué forma de valor** habla — así modelás cualquier
input **sin romper tu contrato/schema**: cada campo queda plano y conserva su
propio validador.

| Conector | Campos | Forma de `value` | `onChange` recibe | Usalo cuando… |
| --- | --- | --- | --- | --- |
| `connect(key)` | **1** | el valor del campo | el nuevo valor | el input mapea 1:1 a un campo |
| `connectRange(a, b)` | **2** | tupla `[a, b]` | `[a, b]` (o escalar → `[v, undefined]`) | los dos campos son un **par ordenado / rango** |
| `connectEntity(map)` | **N** | objeto keyeado por **input keys** | ese mismo objeto (o `null` para limpiar todo) | el input emite un **compuesto con nombres**, cada parte en su propio campo |

Los tres exponen el mismo `error` / `touched` / `focus` / `showError` mergeado y
commitean **cada campo por su propio `setValue`**, así los validadores por campo
y el schema nunca se aplanan ni se reemplazan.

### 1. `connect` — un input, un campo

El caso de todos los días: un text, un select, un switch. El valor del input
*es* el campo.

```tsx
<Field {...api.connect('email')} label="Email">
  <InputText type="email" />
</Field>
// values → { email: 'a@b.com' }
```

### 2. `connectRange` — un input, un par ordenado

Un solo control que produce **dos valores correlacionados con significado
posicional** — un rango de fechas, un min/max, un desde/hasta. El input habla
una tupla `[inicio, fin]`; cada extremo va a su propio campo (así `start_date`
y `end_date` mantienen validadores separados).

```tsx
<Field {...api.connectRange('start_date', 'end_date')} label="Fechas del viaje">
  <InputDatePicker selectionMode="range" />
</Field>
// el picker emite ['2026-06-01', '2026-06-10']
// values → { start_date: '2026-06-01', end_date: '2026-06-10' }
```

### 3. `connectEntity` — un input, un compuesto con nombres

Un control cuyo valor natural es un **objeto con sus propias claves de dominio**,
pero cuyas partes deben caer en **campos planos separados** para respetar tu
contrato. El `keyMap` (`{ inputKey: fieldPath }`) es el único lugar donde se
cruzan los dos vocabularios; el input queda genérico, el schema queda plano.

```tsx
// Un media picker habla { url, assetId }; el contrato quiere el asset id plano.
export type MediaEntity = { url: string; assetId: string | null };

<Field label="Portada">
  <InputMedia
    {...api.connectEntity<MediaEntity>({
      url: 'cover_image_url',    // preview
      assetId: 'cover_asset_id', // lo que se envía
    })}
  />
</Field>
// el picker emite { url: 'https://…', assetId: 'ast_123' }
// values → { cover_image_url: 'https://…', cover_asset_id: 'ast_123' }
```

`fieldPath` puede ser anidado (`'destination/city'`), y las claves hermanas
bajo un mismo padre se preservan. Tipalo por input
(`connectEntity<MediaEntity>(…)`) para que un keyMap mal/incompleto sea error de
compilación.

## Errores remotos y HTTP

| API | Uso |
|-----|-----|
| `errors` / `validatorsRules` | Validación cliente; define `isValid`. |
| `messages` / `setMessage` / `clearMessages` | Errores por campo o `FORM_MESSAGE_KEY` (`'_form'`); no afectan `isValid`. |
| `status` (config) | Pulso vivo desde `useAsyncFetch` (`422` → `0`); input interno. |
| `statusErrors` (config) | Mapa `HttpCode → ReactNode` (opcional `default`). |
| `statusError` / `lastStatus` (API) | Mensaje y código **latcheados**; persisten cuando `status` vuelve a `0`. |

El latch se limpia en `submit()` y `reset()`. Un `2xx` resetea valores (`emptyValues` / `initialValues`) pero **no** borra `messages`.

```tsx
const fetch = useAsyncFetch({ /* ... */ });

<Form
  config={{
    space: 'signup',
    status: fetch.status,
    loading: fetch.loading,
    statusErrors: {
      [HttpCode.UNPROCESSABLE_ENTITY]: 'Revisá los datos',
      [HttpCode.INTERNAL_SERVER_ERROR]: 'Error del servidor',
      default: 'No se pudo completar la operación',
    },
    onSubmit: (api) => {
      if (fetch.status >= 400) {
        api.setMessage('email', 'Ya está registrado');
      }
    },
  }}
>
  {(api) => (
    <>
      {api.statusError ? <p role="alert">{api.statusError}</p> : null}
      {/* fields con api.connect — sin `status` en el input */}
    </>
  )}
</Form>
```

## Licencia

MIT
