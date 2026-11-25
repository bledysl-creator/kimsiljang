import type { Scored } from '@/lib/score';
import type { Restaurant } from '@/types';
import { money } from '@/lib/constants';
import { useStore } from '@/store/AppStore';
import { CorkageBadge, DataBadge, FitBadge, HeartButton, PhotoBox, ReviewBadge, cx } from './ui';

export function conditionText(r: Restaurant) {
  const c = r.corkage;
  const parts: string[] = [];
  if (c.freeBottles) parts.push(`${c.freeBottles}병 무료`);
  if (c.drinkTypes.length) parts.push(`${c.drinkTypes.join('·')} 반입`);
  if (c.extraFee) parts.push(c.extraFee);
  if (c.glassIce) parts.push(c.glassIce);
  return parts.join(' · ') || '반입 조건 확인 필요';
}

export function checkedText(r: Restaurant) {
  const c = r.corkage;
  if (c.verifiedAt) return `${c.verifiedAt} ${{ official: '공식 안내', phone: '전화 확인', visit: '방문 확인', review: '후기', none: '' }[c.verificationMethod]}`;
  if (c.reviewCheckedAt) return `${c.reviewCheckedAt} 후기 분석`;
  return '확인 전';
}

/** 목록형 카드 */
export function RestaurantRow({ s, active }: { s: Scored; active?: boolean }) {
  const { openDetail } = useStore();
  const { r } = s;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${r.name} 상세 보기`}
      onClick={() => openDetail(r.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openDetail(r.id))}
      className={cx(
        'flex min-w-0 cursor-pointer gap-3.5 rounded-[var(--radius-card)] border bg-card p-3 shadow-[var(--shadow-card)] transition hover:border-brand/40',
        active ? 'border-brand ring-2 ring-brand/15' : 'border-line'
      )}
    >
      <PhotoBox r={r} className="size-[110px] shrink-0 sm:size-[120px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {r.region} · {r.area} <span aria-hidden className="text-line">|</span> {r.food} <DataBadge r={r} />
            </p>
            <h3 className="mt-0.5 truncate text-[17px] font-bold sm:text-lg">{r.name}</h3>
          </div>
          <HeartButton id={r.id} className="-mr-1.5 -mt-1.5" />
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <CorkageBadge status={r.corkage.status} />
          <ReviewBadge signal={r.corkage.reviewSignal} count={r.corkage.freeMentions} />
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div className="min-w-0 space-y-0.5 text-[13px] text-muted">
            <p className="truncate">{conditionText(r)}</p>
            <p className="truncate">
              {r.priceFor2 != null ? `2인 약 ${money(r.priceFor2)}` : '가격 확인 필요'}
              {r.tags.length > 0 && ` · ${r.tags.slice(0, 2).join('·')}`}
            </p>
            <p className="truncate text-xs">확인: {checkedText(r)}</p>
          </div>
          <FitBadge score={s.score} coverage={s.coverage} />
        </div>
      </div>
    </div>
  );
}

/** 격자형 카드 */
export function RestaurantTile({ s }: { s: Scored }) {
  const { openDetail } = useStore();
  const { r } = s;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${r.name} 상세 보기`}
      onClick={() => openDetail(r.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openDetail(r.id))}
      className="cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-card)] transition hover:border-brand/40"
    >
      <div className="relative">
        <PhotoBox r={r} className="aspect-[4/3] w-full border-0" rounded="rounded-none" />
        <HeartButton id={r.id} className="absolute right-1.5 top-1.5 bg-card/90" />
        <span className="absolute left-2 top-2">
          <DataBadge r={r} />
        </span>
      </div>
      <div className="space-y-1 p-3.5">
        <p className="text-xs text-muted">
          {r.region} · {r.area}
        </p>
        <h3 className="truncate text-[17px] font-bold">{r.name}</h3>
        <CorkageBadge status={r.corkage.status} />
        <ReviewBadge signal={r.corkage.reviewSignal} count={r.corkage.freeMentions} />
        <p className="text-sm text-muted">
          {s.coverage >= 0.5 ? <b className="text-brand">적합도 {s.score}%</b> : '적합도 정보 부족'} · {r.priceFor2 != null ? `2인 ${money(r.priceFor2)}` : r.food}
        </p>
      </div>
    </div>
  );
}
