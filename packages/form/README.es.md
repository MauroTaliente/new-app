# @maurotaliente/react-form

Framework de formularios consumido por las apps (y por `@maurotaliente/react-ui` para los inputs concretos).

## Exports

- `Form`, `FormProvider`, `useFormState`, `useFormApi` — root del formulario + registry/contexto
- `Field`, `FieldPropsExtended` — envuelve un input child, le inyecta props de `FormInputApi`, renderiza `label`, `disclaimer`, `error`, overlay de `loading`
- `InputFrame` — shell visual compartido por los inputs (borde, foco, indicadores, clear, acciones derechas)
- `InputOptions` + helpers de opciones (`normalizeActiveIndex`, `moveActiveIndex`, `pickActiveOption`, `splitInputSegments`, `readOptionText`, `readOptionLabel`, `resolveOptionsDirection`)
- Tipos: `FormApi`, `FormConfig`, `FormInputApi`, `FromInputCustomApi`, `FromInputNativeApi`, `HtmlOmittedProps`, `Values`, `Errors`, `ValidatorsRules`, etc.
- Re-export de `@maurotaliente/react-ui-base`: `Button`, `Icon`, `Overlay`

## Instalación

```bash
pnpm add @maurotaliente/react-form @maurotaliente/react-styles
```

`@maurotaliente/react-ui-base` viene como dep transitiva — no hace falta instalarlo aparte.

## Uso

```tsx
import { Form, Field, Button } from '@maurotaliente/react-form';

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

Para inputs listos para usar (`InputText`, `InputSelect`, `InputSwitch`, `InputSlider`, `InputDatePicker`, `InputChips`) instalá `@maurotaliente/react-ui`.

## Licencia

MIT
