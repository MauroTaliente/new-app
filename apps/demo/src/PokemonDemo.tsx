import { cn } from '@react33/react-styles';
import { usePokemonRequest } from './api/apis.client.generated';

type PokemonListResponse = {
  results: { name: string; url: string }[];
};

export function PokemonDemo() {
  const {
    data: pokemonList,
    loading,
    initialLoading,
    author,
    trigger,
    error,
  } = usePokemonRequest<null, PokemonListResponse>({
    name: 'pokemon-list',
    scope: 'demo',
    url: '/pokemon?limit=10',
    method: 'GET',
    initData: { results: [] },
    auto: true,
    verbose: true,
    /** Shared in-memory cache: dedupes identical keys and keeps last 2xx response for 5 min. */
    requestCache: 'global',
    cacheTtlMs: 5 * 60 * 1000,
  }, []);

  const names = pokemonList?.results?.map((r) => r.name) ?? [];

  return (
    <section
      className={cn(
        'bg-bg-200 rounded-card shadow-card',
        'overflow-hidden border border-border-100',
      )}
    >
      <h2 className="text-(length:--text-xl) font-semibold text-text-100 p-space-lg">
        @react33/react-networking + PokeAPI
      </h2>
      <p className="px-space-lg pb-space-md text-sm text-text-200">
        Generated hook <code className="bg-bg-300 px-space-xs rounded-input">usePokemonRequest</code> in{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">apis.client.generated.tsx</code> wraps{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">useAsyncFetch</code> with the registry client. Direct
        fetch: <code className="bg-bg-300 px-space-xs rounded-input">pokemonRequest</code> from{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">apis.generated.ts</code>.
      </p>
      <ul>
        {initialLoading && (
          <li className="px-space-lg py-space-md text-text-300">Cargando 10 Pokémon…</li>
        )}
        {error != null && (
          <li className="px-space-lg py-space-md text-accent-100">
            {error instanceof Error ? error.message : String(error)}
          </li>
        )}
        {!initialLoading &&
          error == null &&
          names.map((name, i) => (
            <li
              key={name}
              className={cn(
                'flex items-center justify-between px-space-lg py-space-md',
                'border-t border-border-200 border-(length:--border-row)',
                i === 0 && 'border-t-0',
              )}
            >
              <span className="text-text-100 capitalize">{name}</span>
              <span className="text-xs text-text-300 font-mono">#{i + 1}</span>
            </li>
          ))}
      </ul>
      <div className="flex flex-wrap items-center gap-space-md px-space-lg pb-space-md">
        <button
          type="button"
          className="rounded-button border border-border-100 px-space-md py-space-xs text-sm text-text-200 hover:bg-bg-300"
          onClick={() => trigger(undefined)}
        >
          Refetch
        </button>
        {author ? (
          <span className="text-xs text-text-300 font-mono" title="author del último trigger">
            author: {author}
          </span>
        ) : null}
        {loading && !initialLoading ? (
          <span className="text-xs text-text-300">Actualizando…</span>
        ) : null}
      </div>
    </section>
  );
}
