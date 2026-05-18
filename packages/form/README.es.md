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
