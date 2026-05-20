import { useState } from 'react';
import { cn } from '@react33/react-styles';
import { usePokemonList, usePokemonRetrieve } from './api/pokemon.openapi.client.generated';

export function PokemonDemo() {
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const {
    data: pokemonList,
    loading: listLoading,
    initialLoading: listInitialLoading,
    error: listError,
    trigger: refetchList,
  } = usePokemonList(
    {
      fetchOnMount: true,
      verbose: true,
      mapWatchToParams: () => ({ query: { limit: 10, offset: 0 } }),
    },
    [],
  );

  const {
    data: detail,
    loading: detailLoading,
    error: detailError,
    trigger: fetchDetail,
  } = usePokemonRetrieve();

  const names = pokemonList?.results?.map((r) => r.name) ?? [];

  const handleSelect = (name: string) => {
    setSelectedName(name);
    fetchDetail({ path: { id: name } });
  };

  return (
    <section
      className={cn(
        'bg-bg-200 rounded-card shadow-card',
        'overflow-hidden border border-border-100',
      )}
    >
      <h2 className="text-(length:--text-xl) font-semibold text-text-100 p-space-lg">
        OpenAPI codegen + PokeAPI
      </h2>
      <p className="px-space-lg pb-space-md text-sm text-text-200">
        Spec:{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">openapi/pokeapi.openapi.yaml</code>{' '}
        — operaciones{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">pokemon_list</code>,{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">pokemon_retrieve</code>. Auth:{' '}
        <code className="bg-bg-300 px-space-xs rounded-input">auth.registry.example.ts</code>.
      </p>
      <ul>
        {listInitialLoading && (
          <li className="px-space-lg py-space-md text-text-300">Cargando 10 Pokémon…</li>
        )}
        {listError != null && (
          <li className="px-space-lg py-space-md text-accent-100">
            {listError instanceof Error ? listError.message : String(listError)}
          </li>
        )}
        {!listInitialLoading &&
          listError == null &&
          names.map((name, i) => (
            <li key={name}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between px-space-lg py-space-md text-left',
                  'border-t border-border-200 border-(length:--border-row)',
                  'hover:bg-bg-300',
                  i === 0 && 'border-t-0',
                  selectedName === name && 'bg-bg-300',
                )}
                onClick={() => handleSelect(name)}
              >
                <span className="text-text-100 capitalize">{name}</span>
                <span className="text-xs text-text-300 font-mono">#{i + 1}</span>
              </button>
            </li>
          ))}
      </ul>
      {selectedName && (
        <div className="border-t border-border-200 px-space-lg py-space-md text-sm text-text-200">
          <p className="font-medium text-text-100 capitalize">{detail?.name ?? selectedName}</p>
          {detailLoading && <p className="text-text-300">Cargando detalle…</p>}
          {detailError != null && (
            <p className="text-accent-100">
              {detailError instanceof Error ? detailError.message : String(detailError)}
            </p>
          )}
          {!detailLoading && detail && !detailError && (
            <p className="font-mono text-xs">id: {detail.id}</p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-space-md px-space-lg pb-space-md">
        <button
          type="button"
          className="rounded-button border border-border-100 px-space-md py-space-xs text-sm text-text-200 hover:bg-bg-300"
          onClick={() => refetchList({ query: { limit: 10, offset: 0 } })}
        >
          Refetch lista
        </button>
        {listLoading && !listInitialLoading ? (
          <span className="text-xs text-text-300">Actualizando lista…</span>
        ) : null}
      </div>
    </section>
  );
}
