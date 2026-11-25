import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CalendarHeart,
  Compass,
  Dices,
  Heart,
  Home,
  Inbox,
  MapPin,
  Menu,
  Search,
  Settings,
  Sparkles,
  Wine,
  X,
} from 'lucide-react';
import { useStore } from '@/store/AppStore';
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

const BOTTOM = ['/', '/explore', '/recommend', '/wishlist', '/visits'];

function Brand({ small }: { small?: boolean }) {
  return (
    <div>
      <p className={cx('flex items-center gap-2 font-extrabold tracking-wide', small ? 'text-lg' : 'text-[22px]')}>
        <Wine size={small ? 20 : 24} /> OUR TABLE <Heart size={small ? 14 : 16} className="fill-current text-brand-2" />
      </p>
      {!small && <p className="mt-1 text-xs text-side-muted">by 김실장 · 우리 둘만의 콜키지 프리 맛집 가이드</p>}
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { wishes } = useStore();
  return (
    <nav className="space-y-1">
      {MENU.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition',
              isActive ? 'bg-white/15 font-bold text-side-fg shadow-inner' : 'text-side-muted hover:bg-white/5 hover:text-side-fg'
            )
          }
        >
          <Icon size={19} />
          <span className="flex-1">{label}</span>
          {to === '/wishlist' && wishes.size > 0 && <span className="rounded-full bg-brand-2/90 px-2 text-xs font-bold text-white">{wishes.size}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function DataStatus() {
  const { realCount, storage, showSamples } = useStore();
  return (
    <p className="text-[11px] leading-relaxed text-side-muted">
      ● 실제 수집 {realCount}곳{showSamples || realCount === 0 ? ' · 가상 예시 포함' : ''}
      <br />● 기록 저장: {storage === 'supabase' ? 'Supabase 동기화' : '이 브라우저'}
    </p>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <div className="min-h-dvh">
      {/* PC 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-side to-side-2 px-4 py-7 text-side-fg lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <p className="text-2xl">🥂</p>
          <p className="mt-1 text-sm font-semibold">오늘도 좋은 음식과, 좋은 술로 ♡</p>
          <div className="mt-3">
            <DataStatus />
          </div>
        </div>
      </aside>

      {/* 모바일 상단바 */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-r from-side to-side-2 px-4 py-3 text-side-fg lg:hidden" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <Brand small />
        <button aria-label="전체 메뉴" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-full hover:bg-white/10">
          <Menu size={22} />
        </button>
      </header>

      {/* 모바일 전체 메뉴 */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="ml-auto flex h-full w-72 flex-col bg-gradient-to-b from-side to-side-2 p-5 text-side-fg">
            <div className="mb-6 flex items-center justify-between">
              <Brand small />
              <button aria-label="닫기" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <DataStatus />
            </div>
          </div>
        </div>
      )}

      <main key={loc.pathname} className="mx-auto max-w-[1500px] px-4 pb-28 pt-4 sm:px-6 lg:ml-64 lg:px-8 lg:pb-10 lg:pt-6">
        {children}
      </main>

      {/* 모바일 하단 탭 */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-card/95 backdrop-blur lg:hidden">
        {MENU.filter((m) => BOTTOM.includes(m.to)).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[11px]', isActive ? 'font-bold text-brand' : 'text-muted')}
          >
            <Icon size={21} />
            {label.replace('맛집 ', '').replace('데이트 ', '').replace('위시리스트', '찜')}
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted">
          <Compass size={21} />
          더보기
        </button>
      </nav>
    </div>
  );
}

/** 페이지 상단 히어로 (감성 타이포 + 와인 일러스트) */
export function PageHero({ title, subtitle, icon, children }: { title: string; subtitle?: ReactNode; icon?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hero-1 via-hero-1 to-hero-2 px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-4 hidden select-none text-[110px] leading-none opacity-90 drop-shadow-xl sm:block md:text-[140px]">
        🍷<span className="text-[80px] md:text-[100px]">🥩</span>
      </div>
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-[32px]">
          {icon ?? <Sparkles className="text-warn" />} {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">{subtitle}</p>}
        {children && <div className="mt-5 space-y-3">{children}</div>}
      </div>
    </section>
  );
}
