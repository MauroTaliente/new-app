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

## Connecting inputs — `connect`, `connectRange`, `connectEntity`

Three connectors bind a UI input to the form. They differ only in **how many
fields** the input drives and **what value shape** it speaks — so you can model
any input **without bending your contract/schema**: every field stays flat and
keeps its own validator.

| Connector | Fields | `value` shape | `onChange` receives | Use when… |
| --- | --- | --- | --- | --- |
| `connect(key)` | **1** | the field's value | the new value | the input maps 1:1 to one field |
| `connectRange(a, b)` | **2** | `[a, b]` tuple | `[a, b]` (or scalar → `[v, undefined]`) | the two fields are an **ordered pair / span** |
| `connectEntity(map)` | **N** | object keyed by **input keys** | that same object (or `null` to clear all) | the input emits a **named composite**, each part living in its own field |

All three expose the same merged `error` / `touched` / `focus` / `showError`
and commit **each field through its own `setValue`**, so per-field validators
and the form schema are never flattened or replaced.

### 1. `connect` — one input, one field

The everyday case: a text box, a select, a switch. The input's value *is* the
field.

```tsx
<Field {...api.connect('email')} label="Email">
  <InputText type="email" />
</Field>
// values → { email: 'a@b.com' }
```

### 2. `connectRange` — one input, an ordered pair

A single control that produces **two correlated values with positional
meaning** — a date range, a min/max, a from/to. The input speaks a `[start,
end]` tuple; each end commits to its own field (so `start_date` and `end_date`
keep separate validators).

```tsx
<Field {...api.connectRange('start_date', 'end_date')} label="Trip dates">
  <InputDatePicker selectionMode="range" />
</Field>
// the picker emits ['2026-06-01', '2026-06-10']
// values → { start_date: '2026-06-01', end_date: '2026-06-10' }
```

### 3. `connectEntity` — one input, a named composite

A control whose natural value is an **object with its own domain keys**, but
whose parts must land in **separate flat fields** to match your contract. The
`keyMap` (`{ inputKey: fieldPath }`) is the only place the two vocabularies
meet; the input stays generic, the schema stays flat.

```tsx
// A media picker speaks { url, assetId }; the contract wants the asset id flat.
export type MediaEntity = { url: string; assetId: string | null };

<Field label="Cover">
  <InputMedia
    {...api.connectEntity<MediaEntity>({
      url: 'cover_image_url',   // preview
      assetId: 'cover_asset_id', // what you submit
    })}
  />
</Field>
// the picker emits { url: 'https://…', assetId: 'ast_123' }
// values → { cover_image_url: 'https://…', cover_asset_id: 'ast_123' }
```

`fieldPath` may be nested (`'destination/city'`), and sibling keys under a
shared parent are preserved. Type it per input
(`connectEntity<MediaEntity>(…)`) so a wrong/incomplete keyMap is a compile
error.

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
