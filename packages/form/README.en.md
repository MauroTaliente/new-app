# @maurotaliente/react-form

Form framework consumed by app code (and by `@maurotaliente/react-ui` for the concrete inputs).

## Exports

- `Form`, `FormProvider`, `useFormState`, `useFormApi` — form root + registry/context
- `Field`, `FieldPropsExtended` — wraps a child input, injects `FormInputApi` props, renders `label`, `disclaimer`, `error`, `loading` overlay
- `InputFrame` — visual shell shared by inputs (border, focus state, indicators, clear button, right actions)
- `InputOptions` and option helpers (`normalizeActiveIndex`, `moveActiveIndex`, `pickActiveOption`, `splitInputSegments`, `readOptionText`, `readOptionLabel`, `resolveOptionsDirection`)
- Types: `FormApi`, `FormConfig`, `FormInputApi`, `FromInputCustomApi`, `FromInputNativeApi`, `HtmlOmittedProps`, `Values`, `Errors`, `ValidatorsRules`, etc.
- Re-exported from `@maurotaliente/react-ui-base`: `Button`, `Icon`, `Overlay`

## Install

```bash
pnpm add @maurotaliente/react-form @maurotaliente/react-styles
```

`@maurotaliente/react-ui-base` is pulled transitively — no need to install it explicitly.

## Use

```tsx
import { Form, Field, InputFrame, Button } from '@maurotaliente/react-form';

function MyForm() {
  return (
    <Form
      config={{
        space: 'signup',
        initialValues: { email: '' },
        validatorsRules: { email: (v) => (!v ? 'required' : undefined) },
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
          <Button type="submit">Submit</Button>
        </>
      )}
    </Form>
  );
}
```

For batteries-included inputs (`InputText`, `InputSelect`, `InputSwitch`, `InputSlider`, `InputDatePicker`, `InputChips`) install `@maurotaliente/react-ui`.

## License

MIT
