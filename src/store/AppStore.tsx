import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { CellarItem, CollectionRun, MyVerification, Preferences, Restaurant, RestaurantDataset, Visit } from '@/types';
import { SAMPLE_RESTAURANTS } from '@/data/sample';
import { DEFAULT_PREFS, localRepo, supabaseRepo, type UserRepo } from '@/lib/userRepo';
import { supabase } from '@/lib/supabase';
import { normalizeRestaurant } from '@/lib/normalize';

interface Store {
  /** 화면에 보이는 전체 목록 (실제 + 설정에 따라 가상) */
  restaurants: Restaurant[];
  realCount: number;
  dataUpdatedAt: string | null;
  lastRun: CollectionRun | null;
  lastSuccessAt: string | null;
  loading: boolean;
  loadError: string | null;
  reload(): void;
  verifications: Record<string, MyVerification>;
  saveVerification(id: string, v: MyVerification | null): void;
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
  const [lastRun, setLastRun] = useState<CollectionRun | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [verifications, setVerifications] = useState<Record<string, MyVerification>>({});
  const [showSamples, setShowSamplesState] = useState(() => localStorage.getItem('ot_samples') !== '0');

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
    setLoading(true);
    setLoadError(null);
    fetch(`${import.meta.env.BASE_URL}data/restaurants.json`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`데이터를 불러오지 못했어요 (${r.status})`);
        return r.json();
      })
      .then((d: RestaurantDataset) => {
        setReal((d.restaurants ?? []).map(normalizeRestaurant));
        setUpdatedAt(d.updatedAt ?? null);
        setLastRun(d.lastRun ?? null);
        setLastSuccessAt(d.lastSuccessAt ?? d.updatedAt ?? null);
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [reloadKey]);

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
        setRepo(cid ? supabaseRepo(cid, session.user.id) : localRepo);
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
        setVerifications(d.verifications);
        setSyncError(null);
      })
      .catch((e) => setSyncError(String(e?.message ?? e)));
  }, [repo]);

  const run = useCallback((p: Promise<void>) => p.catch((e) => setSyncError(String(e?.message ?? e))), []);

  // 우리가 직접 확인한 정보가 있으면 그게 우선이에요
  const restaurants = useMemo(() => {
    const base = showSamples || real.length === 0 ? [...real, ...SAMPLE_RESTAURANTS] : real;
    return base.map((r) => {
      const v = verifications[r.id];
      if (!v) return r;
      return {
        ...r,
        corkage: {
          ...r.corkage,
          status: v.status,
          freeBottles: v.freeBottles ?? r.corkage.freeBottles,
          extraFee: v.extraFee ?? r.corkage.extraFee,
          conditions: v.note ? [v.note, ...r.corkage.conditions] : r.corkage.conditions,
          verifiedAt: v.verifiedAt,
          verificationMethod: v.method,
        },
      };
    });
  }, [real, showSamples, verifications]);

  const value: Store = {
    restaurants,
    realCount: real.length,
    dataUpdatedAt: updatedAt,
    lastRun,
    lastSuccessAt,
    loading,
    loadError,
    reload: () => setReloadKey((k) => k + 1),
    verifications,
    saveVerification(id, v) {
      setVerifications((p) => {
        const n = { ...p };
        if (v) n[id] = v;
        else delete n[id];
        return n;
      });
      run(repo.saveVerification(id, v));
    },
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
        if (on) n.add(id);
        else n.delete(id);
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
