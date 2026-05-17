/**
 * Ejemplo de capa de auth para APIs generadas — NO se sobrescribe por el generador.
 *
 * El codegen emite `apis.generated.ts` con `createApiRegistry(definitions, { load })` vacío.
 * En la app, podés:
 * 1) Seguir usando `pokemonRequest` / `usePokemonRequest` del archivo generado (PokeAPI es pública).
 * 2) O crear un registry propio con `loads` por scope (cookie / localStorage → Bearer).
 *
 * @see packages/networking/README.en.md — AuthProfile
 */

import {
  createApiRegistry,
  type ApiClientConfigBody,
  type AuthProfile,
} from '@react33/react-networking';
import { createLoadRequestPropsFromAuthProfiles } from '@react33/react-persistence';
import { definitions } from './apis.generated';

/** Perfil reutilizable: token en cookie → header Authorization */
const authMain: AuthProfile = {
  storage: 'cookie',
  key: 'authjs.session-token',
  headers: { Authorization: 'Bearer {token}' },
};

/** Otro backend con token en localStorage */
const authAdmin: AuthProfile = {
  storage: 'localStorage',
  key: 'admin_access_token',
  headers: { Authorization: 'Bearer {token}' },
};

const authLoads = createLoadRequestPropsFromAuthProfiles({
  main: authMain,
  admin: authAdmin,
});

/**
 * Registry con auth por scope.
 * - `pokemon`: sin entry en `loads` → solo headers de `definitions.pokemon` (API pública).
 * - `admin`: usaría `loads.admin` si agregás un scope `admin` en react33.config.json.
 */
export const apisWithAuth = createApiRegistry(definitions satisfies Record<string, ApiClientConfigBody>, {
  load: async (shared) => shared,
  loads: {
    // pokemon: público — no hace falta load
    // admin: authLoads.admin,
  },
});

/**
 * OpenAPI SDK (`pokemon.openapi.ts`) importa `pokemonRequest` de `apis.generated.ts`.
 * Para APIs privadas, agregá el scope en react33.config.json y mapeá `loads.{scope}` aquí.
 */
