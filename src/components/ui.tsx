import { Heart, FlaskConical, Database } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { CorkageStatus, Restaurant } from '@/types';
import { CORKAGE_LABEL, CORKAGE_STYLE, FOOD_EMOJI } from '@/lib/constants';
import { useStore } from '@/store/AppStore';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function CorkageBadge({ status, className }: { status: CorkageStatus; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold', CORKAGE_STYLE[status], className)}>
      🍷 {CORKAGE_LABEL[status]}
    </span>
  );
}

/** 가상/실제 데이터 구분 배지 */
export function DataBadge({ r }: { r: Restaurant }) {
  return r.isSample ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
      <FlaskConical size={11} /> 가상
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
      <Database size={11} /> 실제 수집
    </span>
  );
}

export function HeartButton({ id, className }: { id: string; className?: string }) {
  const { wishes, toggleWish } = useStore();
  const on = wishes.has(id);
  return (
    <button
      aria-label={on ? '위시리스트에서 빼기' : '위시리스트에 담기'}
      onClick={(e) => {
        e.stopPropagation();
        toggleWish(id);
      }}
      className={cx('grid size-9 place-items-center rounded-full transition hover:bg-brand-soft', className)}
    >
      <Heart size={20} className={on ? 'fill-brand text-brand' : 'text-muted'} />
    </button>
  );
}

/** 메뉴 사진. 없으면 음식 이모지 일러스트 */
export function FoodArt({ r, className, rounded = 'rounded-xl' }: { r: Restaurant; className?: string; rounded?: string }) {
  const [broken, setBroken] = useState(false);
  const img = broken ? undefined : r.images[0];
  if (img)
    return (
      <div className={cx('relative overflow-hidden bg-card2', rounded, className)}>
        <img src={img.thumb} alt={`${r.name} 메뉴 사진`} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-full object-cover" />
      </div>
    );
  return (
    <div
      className={cx('grid place-items-center bg-gradient-to-br from-hero-1 to-hero-2', rounded, className)}
      aria-label="메뉴 일러스트"
    >
      <span className="text-5xl drop-shadow-md">{r.emoji || FOOD_EMOJI[r.food]}</span>
    </div>
  );
}

export function Chip({ active, onClick, children, icon }: { active?: boolean; onClick?: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition',
        active ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-card text-fg hover:border-brand/50'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Card className="py-12 text-center text-muted">{children}</Card>;
}

export function PrimaryButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={cx('rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-2.5 font-bold text-brand-ink shadow-sm transition hover:opacity-90 disabled:opacity-50', className)}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={cx('rounded-xl border border-line bg-card px-4 py-2.5 font-medium text-fg transition hover:border-brand/50', className)}>
      {children}
    </button>
  );
}

export const inputCls = 'w-full rounded-xl border border-line bg-card2 px-3 py-2.5 text-fg placeholder:text-muted focus:border-brand focus:outline-none';
