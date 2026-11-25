import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { CellarItem, Preferences, Restaurant, RestaurantDataset, Visit } from '@/types';
import { SAMPLE_RESTAURANTS } from '@/data/sample';
import { DEFAULT_PREFS, localRepo, supabaseRepo, type UserRepo } from '@/lib/userRepo';
import { supabase } from '@/lib/supabase';

type Theme = 'light' | 'dark';

interface Store {
  /** 화면에 보이는 전체 목록 (실제 + 설정에 따라 가상) */
  restaurants: Restaurant[];
  realCount: number;
  dataUpdatedAt: string | null;
  loading: boolean;
  showSamples: boolean;
  setShowSamples(v: boolean): void;

  wishes: Set<string>;
  toggleWish(id: string): void;
  visits: Visit[];
  addVisit(v: Omit<Visit, 'id'>): void;
  removeVisit(id: string): void;
  cellar: CellarItem[];
  addCellar(c: Omit<CellarItem, 'id' | 'addedAt'>): void;
  removeCellar(id: string): void;
  prefs: Preferences;
  savePrefs(p: Preferences): void;

  theme: Theme;
  setTheme(t: Theme): void;

  session: Session | null;
  coupleId: string | null;
  storage: UserRepo['kind'];
  syncError: string | null;

  selectedId: string | null;
  openDetail(id: string | null): void;
}

const Ctx = createContext<Store | null>(null);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [real, setReal] = useState<Restaurant[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSamples, setShowSamplesState] = useState(() => localStorage.getItem('ot_samples') !== '0');
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('ot_theme') as Theme) || 'light');

  const [wishes, setWishes] = useState<Set<string>>(new Set());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [cellar, setCellar] = useState<CellarItem[]>([]);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);

  const [session, setSession] = useState<Session | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [repo, setRepo] = useState<UserRepo>(localRepo);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 실제 수집 데이터 (scripts/collect.ts 가 만든 파일)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/restaurants.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: RestaurantDataset | null) => {
        setReal((d?.restaurants ?? []).map((r) => ({ ...r, isSample: false })));
        setUpdatedAt(d?.updatedAt ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 로그인 상태
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // 로그인 + 커플 연결이면 Supabase, 아니면 로컬
  useEffect(() => {
    if (!supabase || !session) {
      setCoupleId(null);
      setRepo(localRepo);
      return;
    }
    supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const cid = (data?.couple_id as string | null) ?? null;
        setCoupleId(cid);
        setRepo(cid ? supabaseRepo(cid) : localRepo);
      });
  }, [session]);

  useEffect(() => {
    repo
      .load()
      .then((d) => {
        setWishes(new Set(d.wishes));
        setVisits(d.visits);
        setCellar(d.cellar);
        setPrefs(d.prefs);
        setSyncError(null);
      })
      .catch((e) => setSyncError(String(e?.message ?? e)));
  }, [repo]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#16181f' : '#f8f3ec');
  }, [theme]);

  const run = useCallback((p: Promise<void>) => p.catch((e) => setSyncError(String(e?.message ?? e))), []);

  const restaurants = useMemo(
    () => (showSamples || real.length === 0 ? [...real, ...SAMPLE_RESTAURANTS] : real),
    [real, showSamples]
  );

  const value: Store = {
    restaurants,
    realCount: real.length,
    dataUpdatedAt: updatedAt,
    loading,
    showSamples,
    setShowSamples(v) {
      localStorage.setItem('ot_samples', v ? '1' : '0');
      setShowSamplesState(v);
    },
    wishes,
    toggleWish(id) {
      const on = !wishes.has(id);
      setWishes((prev) => {
        const n = new Set(prev);
        on ? n.add(id) : n.delete(id);
        return n;
      });
      run(repo.setWish(id, on));
    },
    visits,
    addVisit(v) {
      const full = { ...v, id: uid() };
      setVisits((p) => [full, ...p]);
      run(repo.addVisit(full));
    },
    removeVisit(id) {
      setVisits((p) => p.filter((v) => v.id !== id));
      run(repo.removeVisit(id));
    },
    cellar,
    addCellar(c) {
      const full = { ...c, id: uid(), addedAt: new Date().toISOString() };
      setCellar((p) => [full, ...p]);
      run(repo.addCellar(full));
    },
    removeCellar(id) {
      setCellar((p) => p.filter((c) => c.id !== id));
      run(repo.removeCellar(id));
    },
    prefs,
    savePrefs(p) {
      setPrefs(p);
      run(repo.savePrefs(p));
    },
    theme,
    setTheme(t) {
      localStorage.setItem('ot_theme', t);
      setThemeState(t);
    },
    session,
    coupleId,
    storage: repo.kind,
    syncError,
    selectedId,
    openDetail: setSelectedId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('AppStoreProvider 밖에서 useStore 를 썼어요');
  return s;
}
