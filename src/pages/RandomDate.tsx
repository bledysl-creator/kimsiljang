import { useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { ActiveFilters, CategoryChips, FilterChips } from '@/components/SearchPanel';
import { RestaurantRow } from '@/components/RestaurantCard';
import { Card, Chip, Empty, PrimaryButton } from '@/components/ui';
import { useFilters } from '@/store/filters';
import { isFreeConfirmed } from '@/lib/constants';
import type { Scored } from '@/lib/score';

export default function RandomDate() {
  const { results } = useFilters();
  // 현재 필터 + 무료 확인(무료/조건부 무료) 조건을 모두 만족한 후보만 (CLAUDE.md 3절)
  const alive = results.filter((s) => s.r.closure.status !== 'suspected');
  const confirmedPool = alive.filter((s) => isFreeConfirmed(s.r.corkage.status));
  // 후기상 무료: 아직 직접 확인 전이지만 블로그 후기 2곳 이상에서 무료·조건부 무료라고 한 곳 (상충 제외)
  const reviewPool = alive.filter(
    (s) => isFreeConfirmed(s.r.corkage.status) || (s.r.corkage.status === 'unknown' && (s.r.corkage.reviewSignal === 'free' || s.r.corkage.reviewSignal === 'conditional'))
  );
  // 무료 확인된 곳이 하나도 없으면 자동으로 후기상 무료까지 넓혀요
  const [mode, setMode] = useState<'auto' | 'confirmed' | 'review'>('auto');
  const useReview = mode === 'review' || (mode === 'auto' && confirmedPool.length === 0);
  const pool = useReview ? reviewPool : confirmedPool;
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
      <PageHeader title="랜덤 데이트" subtitle="지금 필터에 맞는 곳 중에서 한 곳을 골라요. 기본은 무료가 확인된 곳이고, 아직 확인된 곳이 없으면 블로그 후기상 무료인 곳까지 넓혀요. 정보가 엇갈리거나 폐업 의심인 곳은 빼요." />
      <div className="space-y-2">
        <CategoryChips />
        <FilterChips />
        <ActiveFilters />
      </div>
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <Chip active={!useReview} onClick={() => setMode('confirmed')}>
            무료 확인된 곳만 ({confirmedPool.length})
          </Chip>
          <Chip active={useReview} onClick={() => setMode('review')}>
            후기상 무료 포함 ({reviewPool.length})
          </Chip>
        </div>
        <p className="text-sm text-muted">
          후보 {pool.length}곳{useReview && ' · 후기 기준이라 가기 전에 전화로 콜키지를 확인해 주세요'}
        </p>
        <PrimaryButton onClick={roll} disabled={spinning} className="flex items-center gap-2 px-8 text-lg">
          <Dices aria-hidden /> {spinning ? '고르는 중…' : '맛집 뽑기'}
        </PrimaryButton>
      </Card>
      <div aria-live="polite">
        {pick === 'none' && (
          <Empty>
            조건에 맞는 후보가 없어요.
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
