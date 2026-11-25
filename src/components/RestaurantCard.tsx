import { FileText } from 'lucide-react';
import type { Scored } from '@/lib/score';
import { money } from '@/lib/constants';
import { useStore } from '@/store/AppStore';
import { CorkageBadge, DataBadge, FoodArt, HeartButton, cx } from './ui';

/** 목록형 카드 (시안의 검색 결과 카드) */
export function RestaurantRow({ s, active }: { s: Scored; active?: boolean }) {
  const { openDetail } = useStore();
  const { r } = s;
  return (
    <article
      onClick={() => openDetail(r.id)}
      className={cx(
        'flex cursor-pointer gap-4 rounded-2xl border bg-card p-3 transition hover:shadow-md',
        active ? 'border-brand ring-2 ring-brand/20' : 'border-line'
      )}
    >
      <div className="relative shrink-0">
        <FoodArt r={r} className="size-24 sm:size-32" />
        {r.corkage.freeMentions > 0 && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <FileText size={11} /> 후기 {r.corkage.freeMentions}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {r.region} · {r.area} <span className="text-line">|</span> {r.food} <DataBadge r={r} />
            </p>
            <h3 className="mt-0.5 truncate text-lg font-bold">{r.name}</h3>
          </div>
          <HeartButton id={r.id} className="-mr-1 -mt-1" />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <CorkageBadge status={r.corkage.status} />
          {r.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0 text-[13px] leading-relaxed text-muted">
            <p className="line-clamp-1">{s.reasons.slice(0, 3).join(' · ') || r.category}</p>
            <p>{r.priceFor2 != null ? `2인 약 ${money(r.priceFor2)}` : '가격 정보 없음'}{r.drinks.length ? ` · ${r.drinks.slice(0, 2).join('·')}` : ''}</p>
          </div>
          <div className="shrink-0 rounded-xl bg-brand-soft px-2.5 py-1 text-center">
            <p className="text-[10px] font-semibold text-brand">적합도</p>
            <p className="text-lg font-extrabold leading-tight text-brand">{s.score}%</p>
          </div>
        </div>
      </div>
    </article>
  );
}

/** 사진 큰 카드 (홈 추천) */
export function RestaurantTile({ s }: { s: Scored }) {
  const { openDetail } = useStore();
  const { r } = s;
  return (
    <article onClick={() => openDetail(r.id)} className="group cursor-pointer overflow-hidden rounded-2xl border border-line bg-card transition hover:shadow-lg">
      <div className="relative">
        <FoodArt r={r} className="aspect-[4/3] w-full" rounded="rounded-none" />
        <HeartButton id={r.id} className="absolute right-2 top-2 bg-card/80 backdrop-blur" />
        <span className="absolute left-2 top-2">
          <DataBadge r={r} />
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-accent">
          {r.region} · {r.area}
        </p>
        <h3 className="mt-0.5 truncate text-lg font-bold">{r.name}</h3>
        <p className="mt-1 text-2xl font-extrabold text-brand">{s.score}점</p>
        <CorkageBadge status={r.corkage.status} className="mt-1 !px-0" />
        <p className="mt-1 text-sm text-muted">{r.priceFor2 != null ? `2인 ${money(r.priceFor2)}` : r.food}</p>
      </div>
    </article>
  );
}
