import { Car, ChevronDown, MapPin, Search, Sparkles, Wine } from 'lucide-react';
import { useState } from 'react';
import { FOODS, FOOD_EMOJI } from '@/lib/constants';
import { useFilters, type RegionFilter, type SortKey } from '@/store/filters';
import { Chip, cx } from './ui';

const REGION_OPTIONS: RegionFilter[] = ['전체', '서울', '성남', '분당·판교', '수원', '기타 경기'];

export function SearchBar({ onSubmit }: { onSubmit?: () => void }) {
  const { filters, set } = useFilters();
  const [q, setQ] = useState(filters.q);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        set('q', q.trim());
        onSubmit?.();
      }}
      className="flex items-center gap-2 rounded-2xl border border-line bg-card p-1.5 pl-4 shadow-lg shadow-brand/5"
    >
      <Search size={20} className="shrink-0 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="가게 이름, 음식 종류(예: 이자카야, 와인바, 스테이크) 검색"
        aria-label="검색어"
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-fg placeholder:text-muted focus:outline-none"
      />
      <label className="relative hidden items-center gap-1.5 border-l border-line pl-3 pr-1 sm:flex">
        <MapPin size={18} className="text-brand" />
        <select
          aria-label="지역"
          value={filters.region}
          onChange={(e) => set('region', e.target.value as RegionFilter)}
          className="appearance-none bg-transparent pr-5 text-sm font-semibold text-fg focus:outline-none"
        >
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r === '전체' ? '서울 · 경기 전체' : r}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-1 text-muted" />
      </label>
      <button className="shrink-0 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 font-bold text-brand-ink sm:px-8">검색</button>
    </form>
  );
}

export function CategoryChips() {
  const { filters, set } = useFilters();
  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      <Chip active={filters.food === '전체'} onClick={() => set('food', '전체')}>
        전체
      </Chip>
      {FOODS.map((f) => (
        <Chip key={f} active={filters.food === f} onClick={() => set('food', f)} icon={<span>{FOOD_EMOJI[f]}</span>}>
          {f.replace('·', '/')}
        </Chip>
      ))}
    </div>
  );
}

export function FilterChips({ showSort }: { showSort?: boolean }) {
  const { filters, set } = useFilters();
  return (
    <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1">
      <label className="relative sm:hidden">
        <select
          aria-label="지역"
          value={filters.region}
          onChange={(e) => set('region', e.target.value as RegionFilter)}
          className={cx('appearance-none rounded-full border px-3.5 py-1.5 pr-7 text-[13px] font-medium', filters.region !== '전체' ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-card text-fg')}
        >
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r === '전체' ? '지역 전체' : r}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5" />
      </label>
      <Chip active={filters.freeOnly} onClick={() => set('freeOnly', !filters.freeOnly)} icon={<Wine size={14} />}>
        콜키지 프리만
      </Chip>
      <Chip active={filters.parking} onClick={() => set('parking', !filters.parking)} icon={<Car size={14} />}>
        주차 가능
      </Chip>
      <Chip active={filters.date} onClick={() => set('date', !filters.date)} icon={<Sparkles size={14} />}>
        데이트 분위기
      </Chip>
      <label className="relative">
        <select
          aria-label="예산"
          value={filters.budget ?? ''}
          onChange={(e) => set('budget', e.target.value ? Number(e.target.value) : null)}
          className={cx('appearance-none rounded-full border px-3.5 py-1.5 pr-7 text-[13px] font-medium', filters.budget ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-card text-fg')}
        >
          <option value="">예산</option>
          <option value="50000">2인 5만원 이하</option>
          <option value="100000">2인 10만원 이하</option>
          <option value="150000">2인 15만원 이하</option>
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5" />
      </label>
      {showSort && (
        <label className="relative ml-auto">
          <select
            aria-label="정렬"
            value={filters.sort}
            onChange={(e) => set('sort', e.target.value as SortKey)}
            className="appearance-none rounded-full border border-line bg-card px-3.5 py-1.5 pr-7 text-[13px] font-medium"
          >
            <option value="fit">적합도순</option>
            <option value="new">새로 발견순</option>
            <option value="evidence">후기 많은순</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5" />
        </label>
      )}
    </div>
  );
}
