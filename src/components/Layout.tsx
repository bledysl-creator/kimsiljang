import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, CalendarHeart, Dices, Heart, Home, Inbox, MapPin, Menu, Search, Settings, Sparkles, Wine, X } from 'lucide-react';
import { useStore } from '@/store/AppStore';
import { PROJECT_NAME, SERVICE_NAME } from '@/lib/constants';
import { cx } from './ui';

export const MENU = [
  { to: '/', label: '홈', icon: Home },
  { to: '/explore', label: '맛집 탐색', icon: Search },
  { to: '/map', label: '지도 탐색', icon: MapPin },
  { to: '/recommend', label: 'AI 추천', icon: Sparkles },
  { to: '/discover', label: '신규 발견', icon: Inbox },
  { to: '/wishlist', label: '위시리스트', icon: Heart },
  { to: '/visits', label: '데이트 기록', icon: CalendarHeart },
  { to: '/cellar', label: '술장고', icon: Wine },
  { to: '/random', label: '랜덤 데이트', icon: Dices },
  { to: '/stats', label: '통계·분석', icon: BarChart3 },
  { to: '/settings', label: '설정', icon: Settings },
] as const;

const BOTTOM: { to: string; label: string }[] = [
  { to: '/', label: '홈' },
  { to: '/explore', label: '탐색' },
  { to: '/recommend', label: 'AI 추천' },
  { to: '/wishlist', label: '찜' },
  { to: '/visits', label: '기록' },
];

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'text-center' : ''}>
      <p className={cx('flex items-center gap-2 font-extrabold', compact ? 'justify-center' : 'text-xl')}>
        <Wine size={compact ? 24 : 22} aria-hidden />
        {!compact && (
          <>
            {SERVICE_NAME} <Heart size={14} className="fill-current text-brand-soft" aria-hidden />
          </>
        )}
      </p>
      {!compact && <p className="mt-1 text-xs text-side-muted">{PROJECT_NAME} · 우리 둘만의 콜키지 프리 맛집 가이드</p>}
    </div>
  );
}

function NavItems({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { wishes } = useStore();
  return (
    <nav className="space-y-1" aria-label="주 메뉴">
      {MENU.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          title={compact ? label : undefined}
          aria-label={compact ? label : undefined}
          className={({ isActive }) =>
            cx(
              'relative flex min-h-11 items-center gap-3 rounded-xl text-[15px] font-medium transition',
              compact ? 'justify-center px-0' : 'px-4',
              isActive ? 'bg-brand-active font-bold text-white' : 'text-side-muted hover:bg-white/10 hover:text-side-fg'
            )
          }
        >
          <Icon size={19} aria-hidden />
          {!compact && <span className="flex-1">{label}</span>}
          {to === '/wishlist' && wishes.size > 0 && (
            <span className={cx('rounded-full bg-brand-soft px-2 text-xs font-bold text-brand', compact && 'absolute right-1 top-1 px-1.5 text-[10px]')}>{wishes.size}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function DataStatus() {
  const { realCount, storage, showSamples, lastSuccessAt } = useStore();
  return (
    <p className="text-[11px] leading-relaxed text-side-muted">
      실제 수집 {realCount}곳{showSamples || realCount === 0 ? ' · 가상 예시 포함' : ''}
      <br />
      마지막 수집 {lastSuccessAt ?? '없음'}
      <br />
      기록 저장: {storage === 'supabase' ? 'Supabase 공유' : '이 브라우저'}
    </p>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const menuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const close = () => {
    setOpen(false);
    menuBtn.current?.focus();
  };

  return (
    <div className="min-h-dvh">
      {/* 태블릿: 축소 사이드바 / 데스크톱: 전체 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col bg-gradient-to-b from-side-from to-side-to px-2 py-6 text-side-fg md:flex desk:w-60 desk:px-4">
        <div className="desk:hidden">
          <Brand compact />
        </div>
        <div className="hidden px-2 desk:block">
          <Brand />
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">
          <div className="desk:hidden">
            <NavItems compact />
          </div>
          <div className="hidden desk:block">
            <NavItems />
          </div>
        </div>
        <div className="mt-4 hidden rounded-2xl bg-white/10 p-4 desk:block">
          <p className="text-sm font-semibold">오늘도 좋은 음식과, 좋은 술로 ♡</p>
          <div className="mt-2">
            <DataStatus />
          </div>
        </div>
      </aside>

      {/* 모바일 상단바 */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-r from-side-from to-side-to px-4 py-2.5 text-side-fg md:hidden" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <Brand />
        <button ref={menuBtn} aria-label="전체 메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <Menu size={22} aria-hidden />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={close}>
          <div role="dialog" aria-modal="true" aria-label="전체 메뉴" onClick={(e) => e.stopPropagation()} className="ml-auto flex h-full w-72 flex-col overflow-y-auto bg-gradient-to-b from-side-from to-side-to p-5 text-side-fg">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button aria-label="메뉴 닫기" onClick={close} className="grid size-11 place-items-center" autoFocus>
                <X aria-hidden />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-6">
              <DataStatus />
            </div>
          </div>
        </div>
      )}

      <main key={loc.pathname} className="px-4 pb-28 pt-4 md:ml-[72px] md:px-6 md:pb-8 desk:ml-60 desk:px-8 desk:pt-6">
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>

      {/* 모바일 하단 탭 */}
      <nav aria-label="하단 탭" className="pb-safe fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-card md:hidden">
        {BOTTOM.map(({ to, label }) => {
          const Icon = MENU.find((m) => m.to === to)!.icon;
          return (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cx('flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]', isActive ? 'font-bold text-brand' : 'text-muted')}>
              <Icon size={21} aria-hidden />
              {label}
            </NavLink>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted">
          <Menu size={21} aria-hidden />
          더보기
        </button>
      </nav>
    </div>
  );
}

/** 페이지 헤더 — 허가된 배너 사진이 없으므로 단색 배경 (CLAUDE.md 2.2) */
export function PageHeader({ title, subtitle, icon, children }: { title: string; subtitle?: ReactNode; icon?: ReactNode; children?: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] bg-card2 px-5 pb-5 pt-5 sm:px-7 sm:pt-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-[28px]">
        {icon} {title}
      </h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-[15px]">{subtitle}</p>}
      {children && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}
