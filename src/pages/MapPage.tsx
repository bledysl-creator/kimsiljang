import { useState } from 'react';
import { List, Map as MapIcon } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { ActiveFilters, CategoryChips, FilterChips } from '@/components/SearchPanel';
import { KakaoMap } from '@/components/KakaoMap';
import { useFilters } from '@/store/filters';
import { cx } from '@/components/ui';
import { ResultList } from './Explore';

export default function MapPage() {
  const { results } = useFilters();
  const [mobileList, setMobileList] = useState(false);
  return (
    <div className="space-y-3">
      <PageHeader title="지도 탐색" subtitle="와인잔 마커 색과 기호로 콜키지 상태를 봐요. 지도를 움직인 뒤 '이 지역에서 재검색'을 누르면 그 영역만 보여요." />
      <div className="space-y-2">
        <CategoryChips />
        <FilterChips />
        <ActiveFilters />
      </div>
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm font-semibold">{results.length}곳</p>
        <button onClick={() => setMobileList((m) => !m)} aria-pressed={mobileList} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-sm font-bold">
          {mobileList ? <MapIcon size={17} aria-hidden /> : <List size={17} aria-hidden />}
          {mobileList ? '지도 보기' : '목록 보기'}
        </button>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(360px,2fr)_minmax(0,3fr)] lg:gap-4">
        <section aria-label="결과 목록" className={cx('lg:block lg:h-[calc(100dvh-120px)] lg:overflow-y-auto lg:pr-1', !mobileList && 'hidden')}>
          <p className="mb-2 hidden text-sm font-semibold lg:block">{results.length}곳</p>
          <ResultList view="list" />
        </section>
        <KakaoMap items={results.map((s) => s.r)} className={cx('h-[calc(100dvh-200px)] min-h-[380px] lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-120px)]', mobileList && 'hidden')} />
      </div>
    </div>
  );
}
