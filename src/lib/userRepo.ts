// 사용자 데이터 저장소. Supabase 로그인 + 커플 연결이 되어 있으면 서버에, 아니면 이 브라우저(localStorage)에 저장해요.
import type { CellarItem, Preferences, Visit } from '@/types';
import { supabase } from './supabase';

export interface UserData {
  wishes: string[];
  visits: Visit[];
  cellar: CellarItem[];
  prefs: Preferences;
}

export const DEFAULT_PREFS: Preferences = {
  foods: ['해산물·회', '일식·이자카야'],
  drinks: ['와인', '사케'],
  regions: [],
  budget: 100000,
  mood: '조용한',
};

export interface UserRepo {
  kind: 'local' | 'supabase';
  load(): Promise<UserData>;
  setWish(id: string, on: boolean): Promise<void>;
  addVisit(v: Visit): Promise<void>;
  removeVisit(id: string): Promise<void>;
  addCellar(c: CellarItem): Promise<void>;
  removeCellar(id: string): Promise<void>;
  savePrefs(p: Preferences): Promise<void>;
}

// ---------- 로컬 ----------
const K = { wishes: 'ot_wishes', visits: 'ot_visits', cellar: 'ot_cellar', prefs: 'ot_prefs' };
const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

export const localRepo: UserRepo = {
  kind: 'local',
  async load() {
    return {
      wishes: read<string[]>(K.wishes, []),
      visits: read<Visit[]>(K.visits, []),
      cellar: read<CellarItem[]>(K.cellar, []),
      prefs: { ...DEFAULT_PREFS, ...read<Partial<Preferences>>(K.prefs, {}) },
    };
  },
  async setWish(id, on) {
    const w = new Set(read<string[]>(K.wishes, []));
    on ? w.add(id) : w.delete(id);
    write(K.wishes, [...w]);
  },
  async addVisit(v) {
    write(K.visits, [v, ...read<Visit[]>(K.visits, [])]);
  },
  async removeVisit(id) {
    write(K.visits, read<Visit[]>(K.visits, []).filter((v) => v.id !== id));
  },
  async addCellar(c) {
    write(K.cellar, [c, ...read<CellarItem[]>(K.cellar, [])]);
  },
  async removeCellar(id) {
    write(K.cellar, read<CellarItem[]>(K.cellar, []).filter((c) => c.id !== id));
  },
  async savePrefs(p) {
    write(K.prefs, p);
  },
};

// ---------- Supabase (테이블 구조는 supabase/schema.sql) ----------
export function supabaseRepo(coupleId: string): UserRepo {
  const db = supabase!;
  const must = <T,>({ data, error }: { data: T | null; error: unknown }): T => {
    if (error) throw error;
    return (data ?? ([] as unknown)) as T;
  };
  return {
    kind: 'supabase',
    async load() {
      const [w, v, c, p] = await Promise.all([
        db.from('wishlists').select('restaurant_id').eq('couple_id', coupleId),
        db.from('visits').select('*').eq('couple_id', coupleId).order('visited_on', { ascending: false }),
        db.from('cellar_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
        db.from('preferences').select('data').eq('couple_id', coupleId).maybeSingle(),
      ]);
      return {
        wishes: must(w).map((r: { restaurant_id: string }) => r.restaurant_id),
        visits: must(v).map((r: Record<string, never>) => ({
          id: r.id,
          restaurantId: r.restaurant_id,
          restaurantName: r.restaurant_name,
          date: r.visited_on,
          cost: r.cost,
          myRating: r.my_rating,
          partnerRating: r.partner_rating,
          note: r.note ?? '',
        })),
        cellar: must(c).map((r: Record<string, never>) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          note: r.note ?? '',
          addedAt: r.created_at,
        })),
        prefs: { ...DEFAULT_PREFS, ...((must(p) as { data?: Preferences } | null)?.data ?? {}) },
      };
    },
    async setWish(id, on) {
      if (on) must(await db.from('wishlists').upsert({ couple_id: coupleId, restaurant_id: id }));
      else must(await db.from('wishlists').delete().eq('couple_id', coupleId).eq('restaurant_id', id));
    },
    async addVisit(v) {
      must(
        await db.from('visits').insert({
          id: v.id,
          couple_id: coupleId,
          restaurant_id: v.restaurantId,
          restaurant_name: v.restaurantName,
          visited_on: v.date,
          cost: v.cost,
          my_rating: v.myRating,
          partner_rating: v.partnerRating,
          note: v.note,
        })
      );
    },
    async removeVisit(id) {
      must(await db.from('visits').delete().eq('id', id));
    },
    async addCellar(c) {
      must(await db.from('cellar_items').insert({ id: c.id, couple_id: coupleId, name: c.name, type: c.type, note: c.note }));
    },
    async removeCellar(id) {
      must(await db.from('cellar_items').delete().eq('id', id));
    },
    async savePrefs(p) {
      must(await db.from('preferences').upsert({ couple_id: coupleId, data: p }));
    },
  };
}
