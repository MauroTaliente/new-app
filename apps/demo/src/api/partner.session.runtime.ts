/**
 * Un-serializable seam for the `partner` session — strategy `"external"`.
 *
 * An external session brings its own auth: the dev exports a ready `load` and the codegen
 * wires it straight into `apiRuntime.loads`, never constructing a react33 session manager.
 * A real app would call a third-party SDK here (Firebase `getIdToken()`, Auth0
 * `getTokenSilently()`, a token-exchange endpoint, …). This demo uses a static API key.
 */
import { mergeRequestProps, type LoadRequestProps, type RequestProps } from '@react33/react-networking';

export const load: LoadRequestProps = async (shared: RequestProps) =>
  mergeRequestProps(shared, { headers: { 'X-Api-Key': 'demo-partner-key' } });
