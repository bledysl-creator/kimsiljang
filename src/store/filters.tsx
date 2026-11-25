import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Food, Restaurant } from '@/types';
import { rank, type Scored } from '@/lib/score';
import { useStore } from './AppStore';

export type RegionFilter = '전체' | '서울' | '성남' | '분당·판교' | '수원' | '기타 경기';
export type SortKey = 'fit' | 'new' | 'evidence';

export interface Filters {
  q: string;
  region: RegionFilter;
  food: Food | '전체';
  freeOnly: boolean;
  parking: boolean;
  date: boolean;
  budget: number | null;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  region: '전체',
  food: '전체',
  freeOnly: false,
  parking: false,
  date: false,
  budget: null,
  sort: 'fit',
};

const isBundangPangyo = (r: Restaurant) => /분당|판교|정자|서현|수내|미금|야탑|이매|삼평|백현|운중/.test(`${r.area} ${r.address}`);

export function matches(r: Restaurant, f: Filters) {
  if (f.region !== '전체') {
    if (f.region === '분당·판교') {
      if (!isBundangPangyo(r)) return false;
    } else if (r.region !== f.region) return false;
  }
  if (f.food !== '전체' && r.food !== f.food) return false;
  if (f.freeOnly && !['free', 'conditional'].includes(r.corkage.status)) return false;
  if (f.parking && !r.tags.includes('주차')) return false;
  if (f.date && !r.tags.some((t) => ['데이트', '분위기', '조용한', '룸'].includes(t))) return false;
  if (f.budget && r.priceFor2 != null && r.priceFor2 > f.budget) return false;
  if (f.q) {
    const hay = `${r.name} ${r.area} ${r.region} ${r.food} ${r.category} ${r.tags.join(' ')} ${r.menus.join(' ')} ${r.drinks.join(' ')}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

interface Ctx {
  filters: Filters;
  set<K extends keyof Filters>(k: K, v: Filters[K]): void;
  reset(): void;
  results: Scored[];
}
const FCtx = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { restaurants, prefs, wishes } = useStore();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const results = useMemo(() => {
    const list = rank(restaurants.filter((r) => matches(r, filters)), prefs, wishes);
    if (filters.sort === 'new') list.sort((a, b) => b.r.firstSeen.localeCompare(a.r.firstSeen));
    if (filters.sort === 'evidence') list.sort((a, b) => b.r.corkage.freeMentions - a.r.corkage.freeMentions);
    return list;
  }, [restaurants, filters, prefs, wishes]);

  return (
    <FCtx.Provider
      value={{
        filters,
        set: (k, v) => setFilters((p) => ({ ...p, [k]: v })),
        reset: () => setFilters(DEFAULT_FILTERS),
        results,
      }}
    >
      {children}
    </FCtx.Provider>
  );
}

export function useFilters() {
  const c = useContext(FCtx);
  if (!c) throw new Error('FiltersProvider 필요');
  return c;
}
