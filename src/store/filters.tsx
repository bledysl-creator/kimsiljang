import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Drink, Food, Mood, Restaurant } from '@/types';
import { rank, type Scored } from '@/lib/score';
import { useStore } from './AppStore';

export type RegionFilter = '전체' | '서울' | '성남' | '분당·판교' | '수원' | '기타 경기';
/** any: 전체 · free: 무료 확인만 · free_cond: 무료+조건부 무료 · review: 후기상 무료까지 */
export type CorkageFilter = 'any' | 'free' | 'free_cond' | 'review';
export type SortKey = 'fit' | 'recent';

export interface Bounds {
  sw: [number, number];
  ne: [number, number];
}

export interface Filters {
  q: string;
  region: RegionFilter;
  food: Food | '전체';
  corkage: CorkageFilter;
  parking: boolean;
  mood: Mood | null;
  budget: number | null;
  drink: Drink | null;
  bounds: Bounds | null;
  /** 폐업 의심 가게 숨기기 (기본 켜짐) */
  hideSuspected: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  region: '전체',
  food: '전체',
  corkage: 'any',
  parking: false,
  mood: null,
  budget: null,
  drink: null,
  bounds: null,
  hideSuspected: true,
  sort: 'fit',
};

export const CORKAGE_FILTER_LABEL: Record<CorkageFilter, string> = {
  any: '콜키지 전체',
  free: '무료 확인만',
  free_cond: '조건부 무료 포함',
  review: '후기상 무료까지',
};

const BUNDANG_PANGYO = /분당|판교|정자|서현|수내|미금|야탑|이매|삼평|백현|운중|구미동|금곡동|궁내동/;
const MOOD_TAGS: Record<Mood, string[]> = {
  데이트: ['데이트', '분위기'],
  조용한: ['조용한', '룸'],
  활기찬: ['활기찬', '단체', '늦게까지'],
  룸: ['룸'],
  뷰: ['뷰'],
};

export function matches(r: Restaurant, f: Filters) {
  if (f.hideSuspected && r.closure.status === 'suspected') return false;
  if (f.region !== '전체') {
    if (f.region === '분당·판교') {
      if (!BUNDANG_PANGYO.test(`${r.area} ${r.address}`)) return false;
    } else if (r.region !== f.region) return false;
  }
  if (f.food !== '전체' && r.food !== f.food) return false;
  const st = r.corkage.status;
  if (f.corkage === 'free' && st !== 'verified_free') return false;
  if (f.corkage === 'free_cond' && st !== 'verified_free' && st !== 'conditional_free') return false;
  if (
    f.corkage === 'review' &&
    st !== 'verified_free' &&
    st !== 'conditional_free' &&
    !(st === 'unknown' && (r.corkage.reviewSignal === 'free' || r.corkage.reviewSignal === 'conditional'))
  )
    return false;
  if (f.parking && !r.tags.includes('주차')) return false;
  if (f.mood && !MOOD_TAGS[f.mood].some((t) => r.tags.includes(t))) return false;
  if (f.budget && r.priceFor2 != null && r.priceFor2 > f.budget) return false;
  if (f.drink && !r.corkage.drinkTypes.includes(f.drink)) return false;
  if (f.bounds) {
    if (r.lat == null || r.lng == null) return false;
    if (r.lat < f.bounds.sw[0] || r.lat > f.bounds.ne[0] || r.lng < f.bounds.sw[1] || r.lng > f.bounds.ne[1]) return false;
  }
  if (f.q) {
    const hay = `${r.name} ${r.area} ${r.region} ${r.food} ${r.category} ${r.tags.join(' ')} ${r.menus.join(' ')} ${r.corkage.drinkTypes.join(' ')}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

/** 화면에 보여줄 활성 필터 목록 (초기화 버튼용) */
export function activeFilters(f: Filters): { key: keyof Filters; label: string }[] {
  const out: { key: keyof Filters; label: string }[] = [];
  if (f.q) out.push({ key: 'q', label: `"${f.q}"` });
  if (f.region !== '전체') out.push({ key: 'region', label: f.region });
  if (f.food !== '전체') out.push({ key: 'food', label: f.food });
  if (f.corkage !== 'any') out.push({ key: 'corkage', label: CORKAGE_FILTER_LABEL[f.corkage] });
  if (f.parking) out.push({ key: 'parking', label: '주차' });
  if (f.mood) out.push({ key: 'mood', label: f.mood });
  if (f.budget) out.push({ key: 'budget', label: `2인 ${f.budget / 10000}만원 이하` });
  if (f.drink) out.push({ key: 'drink', label: `반입 ${f.drink}` });
  if (f.bounds) out.push({ key: 'bounds', label: '지도 영역' });
  if (!f.hideSuspected) out.push({ key: 'hideSuspected', label: '폐업 의심 포함' });
  return out;
}

interface Ctx {
  filters: Filters;
  set<K extends keyof Filters>(k: K, v: Filters[K]): void;
  clear(k: keyof Filters): void;
  reset(): void;
  results: Scored[];
}
const FCtx = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { restaurants, prefs } = useStore();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const results = useMemo(() => {
    const list = rank(restaurants.filter((r) => matches(r, filters)), prefs);
    if (filters.sort === 'recent') {
      const d = (s: Scored) => s.r.corkage.verifiedAt ?? s.r.corkage.reviewCheckedAt ?? '';
      list.sort((a, b) => d(b).localeCompare(d(a)));
    }
    return list;
  }, [restaurants, filters, prefs]);

  return (
    <FCtx.Provider
      value={{
        filters,
        set: (k, v) => setFilters((p) => ({ ...p, [k]: v })),
        clear: (k) => setFilters((p) => ({ ...p, [k]: DEFAULT_FILTERS[k] })),
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
