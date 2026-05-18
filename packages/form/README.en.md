# @react33/react-form

Form framework consumed by app code (and by `@react33/react-ui` for the concrete inputs).

## Exports

- `Form`, `FormProvider`, `useFormState`, `useFormApi` — form root + registry/context
- `Field`, `FieldPropsExtended` — wraps a child input, injects `FormInputApi` props, renders `label`, `disclaimer`, `error`, `loading` overlay
- `InputFrame` — visual shell shared by inputs (border, focus state, indicators, clear button, right actions)
- `InputOptions` and option helpers (`normalizeActiveIndex`, `moveActiveIndex`, `pickActiveOption`, `splitInputSegments`, `readOptionText`, `readOptionLabel`, `resolveOptionsDirection`)
- Types: `FormApi`, `FormConfig`, `FormInputApi`, `FromInputCustomApi`, `FromInputNativeApi`, `HtmlOmittedProps`, `Values`, `Errors`, `Messages`, `StatusErrors`, `FORM_MESSAGE_KEY`, `ValidatorsRules`, etc.
- Re-exported from `@react33/react-ui-base`: `Button`, `Icon`, `Overlay`

## Install

```bash
pnpm add @react33/react-form @react33/react-styles
```

`@react33/react-ui-base` is pulled transitively — no need to install it explicitly.

## Use

```tsx
import { Form, Field, InputFrame, Button } from '@react33/react-form';

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

For batteries-included inputs (`InputText`, `InputSelect`, `InputSwitch`, `InputSlider`, `InputDatePicker`, `InputChips`) install `@react33/react-ui`.

## Remote and HTTP feedback

| API | Role |
|-----|------|
| `errors` / `validatorsRules` | Client validation; drives `isValid`. |
| `messages` / `setMessage` / `clearMessages` | Per-field or `FORM_MESSAGE_KEY` (`'_form'`) copy; does not affect `isValid`. |
| `status` (config) | Live pulse from `useAsyncFetch` (`422` → `0`); internal input. |
| `statusErrors` (config) | `HttpCode → ReactNode` map (optional `default`). |
| `statusError` / `lastStatus` (API) | **Latched** banner message and code; kept when config `status` goes back to `0`. |

Latch clears on `submit()` and `reset()`. `2xx` resets values (`emptyValues` / `initialValues`) but does **not** clear `messages`.

```tsx
const fetch = useAsyncFetch({ /* ... */ });

<Form
  config={{
    space: 'signup',
    status: fetch.status,
    loading: fetch.loading,
    statusErrors: {
      [HttpCode.UNPROCESSABLE_ENTITY]: 'Check your data',
      [HttpCode.INTERNAL_SERVER_ERROR]: 'Server error',
      default: 'Request failed',
    },
    onSubmit: (api) => {
      if (fetch.status >= 400) {
        api.setMessage('email', 'Already registered');
      }
    },
  }}
>
  {(api) => (
    <>
      {api.statusError ? <p role="alert">{api.statusError}</p> : null}
    </>
  )}
</Form>
```

## License

MIT
