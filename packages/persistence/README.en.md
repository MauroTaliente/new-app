# @lib/persistence

Browser storage (localStorage, sessionStorage, cookies) and optional Next.js cookie-store helpers.

## HTTP auth loaders (`createLoadRequestPropsFromAuthProfile`)

`@lib/networking` owns `createDataFlow` and **`AuthProfile`** types. This package adds **reading** a raw token from a cookie or storage and merging headers via `mergeRequestProps` / `buildHeadersFromTokenTemplate` from `@lib/networking`.

- **`createLoadRequestPropsFromAuthProfile(profile)`** — returns a `LoadRequestProps` for one API.
- **`createLoadRequestPropsFromAuthProfiles(record)`** — map of named loaders for `createApiRegistry(..., { loads })`.

Cookies are read with **`parseDocumentCookie`** so opaque JWT strings work (not only JSON values).

Re-exported type: **`AuthProfile`** (from `@lib/networking`).
