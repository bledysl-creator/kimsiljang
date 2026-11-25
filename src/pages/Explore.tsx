import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { CategoryChips, FilterChips, SearchBar } from '@/components/SearchPanel';
import { RestaurantRow, RestaurantTile } from '@/components/RestaurantCard';
import { KakaoMap } from '@/components/KakaoMap';
import { Empty, cx } from '@/components/ui';
import { useFilters } from '@/store/filters';
import { useStore } from '@/store/AppStore';

export default function Explore() {
  const { results, reset } = useFilters();
  const { selectedId } = useStore();
  const [view, setView] = useState<'list' | 'grid'>('list');

  return (
    <div className="space-y-5">
      <PageHero
        title="콜키지 프리 맛집 탐색"
        subtitle={
          <>
            서울 · 경기(성남, 분당, 판교, 수원)에서
            <br className="hidden sm:block" /> 좋은 음식과 좋아하는 술을 함께할 수 있는 곳을 찾아보세요.
          </>
        }
      >
        <SearchBar />
      </PageHero>

      <div className="space-y-1">
        <CategoryChips />
        <FilterChips />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">검색 결과 {results.length}곳</h2>
            <div className="flex items-center gap-2">
              <SortSelect />
              <div className="flex rounded-xl border border-line bg-card p-0.5">
                {(['list', 'grid'] as const).map((v) => (
                  <button key={v} aria-label={v === 'list' ? '목록형' : '카드형'} onClick={() => setView(v)} className={cx('rounded-lg p-1.5', view === v ? 'bg-brand-soft text-brand' : 'text-muted')}>
                    {v === 'list' ? <List size={18} /> : <LayoutGrid size={18} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {results.length === 0 ? (
            <Empty>
              조건에 맞는 맛집이 없어요.{' '}
              <button onClick={reset} className="font-semibold text-brand underline">
                필터 초기화
              </button>
            </Empty>
          ) : view === 'list' ? (
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
          )}
        </section>
        <KakaoMap items={results.map((s) => s.r)} className="hidden h-[calc(100dvh-140px)] min-h-[520px] xl:sticky xl:top-6 xl:block" />
      </div>
    </div>
  );
}

export function SortSelect() {
  const { filters, set } = useFilters();
  return (
    <select
      aria-label="정렬"
      value={filters.sort}
      onChange={(e) => set('sort', e.target.value as typeof filters.sort)}
      className="rounded-xl border border-line bg-card px-3 py-1.5 text-sm font-medium"
    >
      <option value="fit">적합도순</option>
      <option value="new">새로 발견순</option>
      <option value="evidence">후기 많은순</option>
    </select>
  );
}
