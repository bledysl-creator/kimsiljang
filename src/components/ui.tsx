import { FlaskConical, Heart, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CorkageStatus, Restaurant, ReviewSignal } from '@/types';
import { CORKAGE_META, REVIEW_LABEL } from '@/lib/constants';
import { useStore } from '@/store/AppStore';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** 콜키지 상태: 색 + 아이콘 + 글자 */
export function CorkageBadge({ status, className }: { status: CorkageStatus; className?: string }) {
  const m = CORKAGE_META[status];
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold', m.color, m.bg, className)}>
      <span aria-hidden>{m.icon}</span>
      콜키지 {m.label}
    </span>
  );
}

/** 폐업 의심 (자동 교차 확인). 확정이 아니에요 */
export function ClosureBadge({ r }: { r: Restaurant }) {
  if (r.closure.status !== 'suspected') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-st-disputed/40 bg-card px-2 py-0.5 text-xs font-bold text-st-disputed" title={r.closure.signals.join(' · ')}>
      <span aria-hidden>⚠</span> 폐업 의심
    </span>
  );
}

/** 블로그 후기 신호 (확인 상태와 별개) */
export function ReviewBadge({ signal, count }: { signal: ReviewSignal; count: number }) {
  if (signal === 'none') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs text-muted">
      {REVIEW_LABEL[signal]}
      {count > 0 && ` ${count}건`}
    </span>
  );
}

/** 테스트용 가상 데이터 표시 (앱의 실제 데이터에는 아무것도 표시하지 않아요) */
export function DataBadge({ r }: { r: Restaurant }) {
  return r.isSample ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted/60 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
      <FlaskConical size={11} aria-hidden /> 가상 예시
    </span>
  ) : null;
}

export function HeartButton({ id, className }: { id: string; className?: string }) {
  const { wishes, toggleWish } = useStore();
  const on = wishes.has(id);
  return (
    <button
      aria-label={on ? '위시리스트에서 빼기' : '위시리스트에 담기'}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation();
        toggleWish(id);
      }}
      className={cx('grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-brand-soft', className)}
    >
      <Heart size={21} className={on ? 'fill-brand text-brand' : 'text-muted'} />
    </button>
  );
}

/** 직접 등록·허가된 사진만 보여주고, 없으면 중립 플레이스홀더 (CLAUDE.md 2.4-5, 4절) */
export function PhotoBox({ r, className, rounded = 'rounded-xl' }: { r: Restaurant; className?: string; rounded?: string }) {
  const p = r.photos[0];
  if (p)
    return (
      <div className={cx('overflow-hidden bg-card2', rounded, className)}>
        <img src={p.url} alt={`${r.name} 사진 (${p.credit})`} loading="lazy" className="size-full object-cover" />
      </div>
    );
  return (
    <div className={cx('grid place-items-center border border-line bg-card2 text-muted', rounded, className)} aria-label="등록된 사진 없음">
      <div className="flex flex-col items-center gap-1">
        <UtensilsCrossed size={26} className="opacity-60" aria-hidden />
        <span className="text-[11px]">{r.food}</span>
      </div>
    </div>
  );
}

export function Chip({ active, onClick, children, icon, ...rest }: { active?: boolean; onClick?: () => void; children: ReactNode; icon?: ReactNode } & React.AriaAttributes) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      {...rest}
      className={cx(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition',
        active ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-card text-fg hover:border-brand/50'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]', className)}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Card className="py-12 text-center text-muted">{children}</Card>;
}

export function PrimaryButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={cx('min-h-11 rounded-xl bg-brand px-4 py-2.5 font-bold text-brand-ink transition hover:bg-brand-active disabled:opacity-50', className)}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={cx('min-h-11 rounded-xl border border-line bg-card px-4 py-2.5 font-medium text-fg transition hover:border-brand/50', className)}>
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-xl', className)} aria-hidden />;
}

/** 적합도: 정보 충족률이 낮으면 숫자 대신 '정보 부족' */
export function FitBadge({ score, coverage }: { score: number; coverage: number }) {
  const show = coverage >= 0.5;
  return (
    <div className="shrink-0 rounded-xl bg-brand-soft px-2.5 py-1 text-center" title={`정보 충족률 ${Math.round(coverage * 100)}%`}>
      <p className="text-[11px] font-semibold text-brand">적합도</p>
      <p className="text-lg font-extrabold leading-tight text-brand">{show ? `${score}%` : '–'}</p>
      <p className="text-[10px] text-muted">정보 {Math.round(coverage * 100)}%</p>
    </div>
  );
}

export const inputCls = 'min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-fg placeholder:text-muted focus:border-brand focus:outline-none';

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('grid gap-1.5 text-sm font-medium text-muted', className)}>
      {label}
      {children}
    </label>
  );
}

/** 결과 목록 로딩/오류 상태 */
export function ListState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry(): void }) {
  if (loading)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-card p-3">
            <Skeleton className="size-[110px] shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  if (error)
    return (
      <Card className="space-y-3 text-center" >
        <p role="alert" className="text-sm">
          실제 수집 데이터를 불러오지 못했어요. ({error})
          <br />
          <span className="text-muted">이전에 받아 둔 데이터가 없으면 목록이 비어 보여요.</span>
        </p>
        <GhostButton onClick={onRetry}>다시 시도</GhostButton>
      </Card>
    );
  return null;
}
