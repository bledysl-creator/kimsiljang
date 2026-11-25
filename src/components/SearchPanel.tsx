import { Car, ChevronDown, MapPin, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { DRINKS, FOODS, MOODS } from '@/lib/constants';
import type { Drink, Food, Mood } from '@/types';
import { CORKAGE_FILTER_LABEL, activeFilters, useFilters, type CorkageFilter, type RegionFilter } from '@/store/filters';
import { Chip, cx } from './ui';

const REGION_OPTIONS: RegionFilter[] = ['전체', '서울', '성남', '분당·판교', '수원', '기타 경기'];
const FOOD_ICON: Record<Food, string> = { '일식·이자카야': '🏮', 양식: '🍝', 한식: '🍲', 중식: '🥟', 고기: '🥩', '회·해산물': '🐟', 기타: '🍽️' };

export function SearchBar({ onSubmit }: { onSubmit?: () => void }) {
  const { filters, set } = useFilters();
  const [q, setQ] = useState(filters.q);
  useEffect(() => setQ(filters.q), [filters.q]);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        set('q', q.trim());
        onSubmit?.();
      }}
      className="flex items-center gap-2 rounded-2xl border border-line bg-card p-1.5 pl-4 shadow-[var(--shadow-card)]"
    >
      <Search size={20} className="shrink-0 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="가게 이름, 음식 종류(예: 이자카야, 와인바, 스테이크)"
        aria-label="검색어"
        className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] text-fg placeholder:text-muted focus:outline-none"
      />
      <label className="relative hidden items-center gap-1.5 border-l border-line pl-3 pr-1 sm:flex">
        <MapPin size={18} className="text-brand" aria-hidden />
        <select
          aria-label="지역"
          value={filters.region}
          onChange={(e) => set('region', e.target.value as RegionFilter)}
          className="min-h-11 appearance-none bg-transparent pr-6 text-sm font-semibold text-fg focus:outline-none"
        >
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r === '전체' ? '서울 · 경기 전체' : r}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-1 text-muted" aria-hidden />
      </label>
      <button className="min-h-11 shrink-0 rounded-xl bg-brand px-5 font-bold text-brand-ink hover:bg-brand-active sm:px-8">검색</button>
    </form>
  );
}

export function CategoryChips() {
  const { filters, set } = useFilters();
  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group" aria-label="음식 종류">
      <Chip active={filters.food === '전체'} onClick={() => set('food', '전체')}>
        전체
      </Chip>
      {FOODS.map((f) => (
        <Chip key={f} active={filters.food === f} onClick={() => set('food', f)} icon={<span aria-hidden>{FOOD_ICON[f]}</span>}>
          {f.replace('·', '/')}
        </Chip>
      ))}
    </div>
  );
}

function SelectChip<T extends string | number>({
  label,
  value,
  options,
  onChange,
  active,
}: {
  label: string;
  value: T | '';
  options: { v: T | ''; t: string }[];
  onChange: (v: string) => void;
  active: boolean;
}) {
  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-10 appearance-none rounded-full border pl-4 pr-8 text-sm font-medium',
          active ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-card text-fg'
        )}
      >
        {options.map((o) => (
          <option key={String(o.v)} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3" aria-hidden />
    </label>
  );
}

export function FilterChips({ extra }: { extra?: ReactNode }) {
  const { filters, set } = useFilters();
  return (
    <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1" role="group" aria-label="세부 필터">
      <div className="sm:hidden">
        <SelectChip
          label="지역"
          value={filters.region}
          active={filters.region !== '전체'}
          onChange={(v) => set('region', v as RegionFilter)}
          options={REGION_OPTIONS.map((r) => ({ v: r, t: r === '전체' ? '지역 전체' : r }))}
        />
      </div>
      <SelectChip
        label="콜키지 조건"
        value={filters.corkage}
        active={filters.corkage !== 'any'}
        onChange={(v) => set('corkage', v as CorkageFilter)}
        options={(Object.keys(CORKAGE_FILTER_LABEL) as CorkageFilter[]).map((k) => ({ v: k, t: `🍷 ${CORKAGE_FILTER_LABEL[k]}` }))}
      />
      <Chip active={filters.parking} onClick={() => set('parking', !filters.parking)} icon={<Car size={15} aria-hidden />}>
        주차
      </Chip>
      <SelectChip label="분위기" value={filters.mood ?? ''} active={!!filters.mood} onChange={(v) => set('mood', (v || null) as Mood | null)} options={[{ v: '', t: '분위기' }, ...MOODS.map((m) => ({ v: m, t: m }))]} />
      <SelectChip
        label="2인 예산"
        value={filters.budget ?? ''}
        active={!!filters.budget}
        onChange={(v) => set('budget', v ? Number(v) : null)}
        options={[
          { v: '', t: '예산' },
          { v: 50000, t: '2인 5만원 이하' },
          { v: 100000, t: '2인 10만원 이하' },
          { v: 150000, t: '2인 15만원 이하' },
        ]}
      />
      <SelectChip label="반입 주종" value={filters.drink ?? ''} active={!!filters.drink} onChange={(v) => set('drink', (v || null) as Drink | null)} options={[{ v: '', t: '반입 주종' }, ...DRINKS.map((d) => ({ v: d, t: d }))]} />
      {extra}
    </div>
  );
}

export function ActiveFilters() {
  const { filters, clear, reset } = useFilters();
  const list = activeFilters(filters);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="적용된 필터">
      {list.map((f) => (
        <button key={f.key} onClick={() => clear(f.key)} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-brand-soft px-3 text-brand" aria-label={`${f.label} 필터 해제`}>
          {f.label} <X size={13} aria-hidden />
        </button>
      ))}
      <button onClick={reset} className="inline-flex min-h-8 items-center gap-1 px-2 text-muted hover:text-brand">
        <RotateCcw size={13} aria-hidden /> 초기화
      </button>
    </div>
  );
}
