import { PageHero } from '@/components/Layout';
import { CategoryChips, FilterChips } from '@/components/SearchPanel';
import { KakaoMap } from '@/components/KakaoMap';
import { RestaurantRow } from '@/components/RestaurantCard';
import { useFilters } from '@/store/filters';
import { useStore } from '@/store/AppStore';
import { MapPin } from 'lucide-react';

export default function MapPage() {
  const { results } = useFilters();
  const { selectedId } = useStore();
  return (
    <div className="space-y-4">
      <PageHero title="지도 탐색" icon={<MapPin className="text-brand" />} subtitle="마커 색으로 콜키지 상태를 한눈에 봐요. 버건디는 무료, 노랑은 확인 필요예요." />
      <div className="space-y-1">
        <CategoryChips />
        <FilterChips />
      </div>
      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <KakaoMap items={results.map((s) => s.r)} className="order-1 h-[60dvh] min-h-[420px] lg:order-2 lg:h-[calc(100dvh-260px)]" />
        <div className="order-2 max-h-[calc(100dvh-260px)] space-y-3 overflow-y-auto lg:order-1">
          <p className="text-sm text-muted">{results.length}곳</p>
          {results.map((s) => (
            <RestaurantRow key={s.r.id} s={s} active={s.r.id === selectedId} />
          ))}
        </div>
      </div>
    </div>
  );
}
