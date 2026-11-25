import { useState } from 'react';
import { LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { ActiveFilters, CategoryChips, FilterChips, SearchBar } from '@/components/SearchPanel';
import { RestaurantRow, RestaurantTile } from '@/components/RestaurantCard';
import { KakaoMap } from '@/components/KakaoMap';
import { Empty, ListState, cx } from '@/components/ui';
import { useFilters, type SortKey } from '@/store/filters';
import { useStore } from '@/store/AppStore';

export function ResultList({ view }: { view: 'list' | 'grid' }) {
  const { results, reset } = useFilters();
  const { selectedId, loading, loadError, reload } = useStore();
  if (loading || loadError) {
    const state = <ListState loading={loading} error={loadError} onRetry={reload} />;
    if (loading) return state;
    if (results.length === 0) return state;
    return (
      <div className="space-y-3">
        {state}
        <Rows view={view} />
      </div>
    );
  }
  if (results.length === 0)
    return (
      <Empty>
        조건에 맞는 맛집이 없어요.
        <br />
        <button onClick={reset} className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand underline">
          필터 초기화
        </button>
      </Empty>
    );
  return <Rows view={view} selectedId={selectedId} />;
}

function Rows({ view, selectedId }: { view: 'list' | 'grid'; selectedId?: string | null }) {
  const { results } = useFilters();
  return view === 'list' ? (
    <div className="space-y-3">
      {results.map((s) => (
        <RestaurantRow key={s.r.id} s={s} active={s.r.id === selectedId} />
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      {results.map((s) => (
        <RestaurantTile key={s.r.id} s={s} />
      ))}
    </div>
  );
}

export function SortSelect() {
  const { filters, set } = useFilters();
  return (
    <select aria-label="정렬" value={filters.sort} onChange={(e) => set('sort', e.target.value as SortKey)} className="min-h-11 rounded-xl border border-line bg-card px-3 text-sm font-medium">
      <option value="fit">적합도순</option>
      <option value="recent">최근 확인순</option>
    </select>
  );
}

export default function Explore() {
  const { results } = useFilters();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [mobileMap, setMobileMap] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="콜키지 프리 맛집 탐색" subtitle="서울 · 경기(성남, 분당, 판교, 수원)에서 좋은 음식과 좋아하는 술을 함께할 수 있는 곳을 찾아보세요.">
        <SearchBar />
      </PageHeader>

      <div className="space-y-2">
        <CategoryChips />
        <FilterChips />
        <ActiveFilters />
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold" aria-live="polite">
          검색 결과 {results.length}곳
        </h2>
        <div className="flex items-center gap-2">
          <SortSelect />
          <div className="hidden rounded-xl border border-line bg-card p-0.5 sm:flex">
            {(['list', 'grid'] as const).map((v) => (
              <button key={v} aria-label={v === 'list' ? '목록형 보기' : '격자형 보기'} aria-pressed={view === v} onClick={() => setView(v)} className={cx('grid size-10 place-items-center rounded-lg', view === v ? 'bg-brand-soft text-brand' : 'text-muted')}>
                {v === 'list' ? <List size={18} aria-hidden /> : <LayoutGrid size={18} aria-hidden />}
              </button>
            ))}
          </div>
          <button onClick={() => setMobileMap((m) => !m)} aria-pressed={mobileMap} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-bold text-white lg:hidden">
            {mobileMap ? <List size={17} aria-hidden /> : <MapIcon size={17} aria-hidden />}
            {mobileMap ? '목록' : '지도'}
          </button>
        </div>
      </div>

      {/* 모바일: 목록/지도 전환 · 태블릿 이상: 목록 40 / 지도 60 */}
      <div className="lg:grid lg:grid-cols-[minmax(360px,2fr)_minmax(0,3fr)] lg:gap-4">
        <section aria-label="검색 결과 목록" className={cx('lg:block lg:h-[calc(100dvh-120px)] lg:overflow-y-auto lg:pr-1', mobileMap && 'hidden')}>
          <ResultList view={view} />
        </section>
        <KakaoMap items={results.map((s) => s.r)} className={cx('h-[calc(100dvh-210px)] min-h-[380px] lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-120px)]', !mobileMap && 'hidden')} />
      </div>
    </div>
  );
}
