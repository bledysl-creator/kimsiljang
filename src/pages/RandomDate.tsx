import { useState } from 'react';
import { Dices } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { CategoryChips, FilterChips } from '@/components/SearchPanel';
import { RestaurantTile } from '@/components/RestaurantCard';
import { Card, Empty, PrimaryButton } from '@/components/ui';
import { useFilters } from '@/store/filters';
import type { Scored } from '@/lib/score';

export default function RandomDate() {
  const { results } = useFilters();
  const pool = results.filter((s) => s.r.corkage.status === 'free' || s.r.corkage.status === 'conditional');
  const [pick, setPick] = useState<Scored | null | 'none'>(null);
  const [spinning, setSpinning] = useState(false);

  const roll = () => {
    if (!pool.length) return setPick('none');
    setSpinning(true);
    let n = 0;
    const t = setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++n > 10) {
        clearInterval(t);
        setSpinning(false);
      }
    }, 90);
  };

  return (
    <div className="space-y-5">
      <PageHero title="랜덤 데이트" icon={<Dices className="text-brand" />} subtitle="필터에 맞는 무료·조건부 무료 콜키지 후보 중에서 한 곳을 골라드려요." />
      <div className="space-y-1">
        <CategoryChips />
        <FilterChips />
      </div>
      <Card className="flex flex-col items-center gap-3 bg-gradient-to-br from-brand-soft to-card py-8 text-center">
        <p className="text-sm text-muted">후보 {pool.length}곳</p>
        <PrimaryButton onClick={roll} disabled={spinning} className="px-8 text-lg">
          🎲 {spinning ? '고르는 중…' : '맛집 뽑기'}
        </PrimaryButton>
      </Card>
      {pick === 'none' && <Empty>조건에 맞는 무료 후보가 없어요. 필터를 줄여보세요.</Empty>}
      {pick && pick !== 'none' && (
        <div className="mx-auto max-w-sm">
          <RestaurantTile s={pick} />
        </div>
      )}
    </div>
  );
}
