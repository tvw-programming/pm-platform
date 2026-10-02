import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ViewState {
  groupBy: string | null;
  sortBy: string | null;
  sortDir: 'asc' | 'desc';
  filter: Record<string, string>;
  search: string;
  itemId: string | null;
}

function parseFilter(raw: string | null): Record<string, string> {
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const [key, value] = pair.split(':');
    if (key && value) result[key] = value;
  }
  return result;
}

function serializeFilter(filter: Record<string, string>): string | null {
  const entries = Object.entries(filter).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${k}:${v}`).join(',');
}

export function useViewState(): [ViewState, (patch: Partial<ViewState>) => void] {
  const [params, setParams] = useSearchParams();

  const state = useMemo<ViewState>(() => {
    const sortRaw = params.get('sort');
    const desc = sortRaw?.startsWith('-') ?? false;
    return {
      groupBy: params.get('group'),
      sortBy: sortRaw ? (desc ? sortRaw.slice(1) : sortRaw) : null,
      sortDir: desc ? 'desc' : 'asc',
      filter: parseFilter(params.get('filter')),
      search: params.get('q') ?? '',
      itemId: params.get('item'),
    };
  }, [params]);

  const update = useCallback(
    (patch: Partial<ViewState>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          if ('groupBy' in patch) {
            if (patch.groupBy) next.set('group', patch.groupBy);
            else next.delete('group');
          }
          if ('sortBy' in patch || 'sortDir' in patch) {
            const by = patch.sortBy ?? state.sortBy;
            const dir = patch.sortDir ?? state.sortDir;
            if (by) next.set('sort', dir === 'desc' ? `-${by}` : by);
            else next.delete('sort');
          }
          if ('filter' in patch) {
            const serialized = serializeFilter(patch.filter ?? {});
            if (serialized) next.set('filter', serialized);
            else next.delete('filter');
          }
          if ('search' in patch) {
            if (patch.search) next.set('q', patch.search);
            else next.delete('q');
          }
          if ('itemId' in patch) {
            if (patch.itemId) next.set('item', patch.itemId);
            else next.delete('item');
          }

          return next;
        },
        { replace: true },
      );
    },
    [setParams, state.sortBy, state.sortDir],
  );

  return [state, update];
}
