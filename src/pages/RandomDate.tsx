import { useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { ActiveFilters, CategoryChips, FilterChips } from '@/components/SearchPanel';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Card, Empty, PrimaryButton } from '@/components/ui';
import { useFilters } from '@/store/filters';
import { isFreeConfirmed } from '@/lib/constants';
import type { Scored } from '@/lib/score';

export default function RandomDate() {
  const { results } = useFilters();
  // 현재 필터 + 무료 확인(무료/조건부 무료) 조건을 모두 만족한 후보만 (CLAUDE.md 3절)
  const pool = results.filter((s) => isFreeConfirmed(s.r.corkage.status) && s.r.closure.status !== 'suspected');
  const [pick, setPick] = useState<Scored | null | 'none'>(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const roll = () => {
    if (!pool.length) return setPick('none');
    setSpinning(true);
    let n = 0;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++n > 8) {
        window.clearInterval(timer.current);
        setSpinning(false);
      }
    }, 90);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="랜덤 데이트" subtitle="지금 필터에 맞고, 콜키지 무료가 확인된(무료·조건부 무료) 곳 중에서만 한 곳을 골라요." />
      <div className="space-y-2">
        <CategoryChips />
        <FilterChips />
        <ActiveFilters />
      </div>
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted">후보 {pool.length}곳</p>
        <PrimaryButton onClick={roll} disabled={spinning} className="flex items-center gap-2 px-8 text-lg">
          <Dices aria-hidden /> {spinning ? '고르는 중…' : '맛집 뽑기'}
        </PrimaryButton>
      </Card>
      <div aria-live="polite">
        {pick === 'none' && (
          <Empty>
            조건을 만족하는 무료 확인 후보가 없어요.
            <br />
            필터를 줄이거나, 가게 상세에서 '직접 확인했어요'로 무료 여부를 기록해 보세요.
          </Empty>
        )}
        {pick && pick !== 'none' && (
          <div className="mx-auto max-w-xl">
            <RestaurantRow s={pick} />
          </div>
        )}
      </div>
    </div>
  );
}
