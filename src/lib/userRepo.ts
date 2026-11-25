// 사용자 데이터 저장소.
// Supabase 로그인 + 커플 연결 → 서버(두 사람 공유), 아니면 이 브라우저(localStorage).
// 테이블 구조: supabase/migrations/0001_init.sql
import type { CellarItem, MyVerification, PersonPref, Preferences, Visit } from '@/types';
import { supabase } from './supabase';

export interface UserData {
  wishes: string[];
  visits: Visit[];
  cellar: CellarItem[];
  prefs: Preferences;
  verifications: Record<string, MyVerification>;
}

const person = (name: string, extra: Partial<PersonPref> = {}): PersonPref => ({
  name,
  foods: [],
  drinks: [],
  moods: [],
  budget: 100000,
  ...extra,
});

export const DEFAULT_PREFS: Preferences = {
  people: [person('나', { foods: ['회·해산물', '일식·이자카야'], drinks: ['와인'], moods: ['데이트', '조용한'] }), person('상대', { foods: ['양식', '고기'], drinks: ['와인', '사케'], moods: ['데이트'] })],
  regions: [],
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
  saveVerification(restaurantId: string, v: MyVerification | null): Promise<void>;
}

// ---------- 로컬 ----------
const K = { wishes: 'ot_wishes', visits: 'ot_visits', cellar: 'ot_cellar', prefs: 'ot_prefs_v2', ver: 'ot_verifications' };
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
    const p = read<Partial<Preferences>>(K.prefs, {});
    return {
      wishes: read<string[]>(K.wishes, []),
      visits: read<Visit[]>(K.visits, []).map((v) => ({ ...v, revisit: v.revisit ?? 'maybe' })),
      cellar: read<CellarItem[]>(K.cellar, []),
      prefs: { ...DEFAULT_PREFS, ...p, people: p.people ?? DEFAULT_PREFS.people },
      verifications: read<Record<string, MyVerification>>(K.ver, {}),
    };
  },
  async setWish(id, on) {
    const w = new Set(read<string[]>(K.wishes, []));
    if (on) w.add(id);
    else w.delete(id);
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
  async saveVerification(rid, v) {
    const all = read<Record<string, MyVerification>>(K.ver, {});
    if (v) all[rid] = v;
    else delete all[rid];
    write(K.ver, all);
  },
};

// ---------- Supabase ----------
type Row = Record<string, unknown>;
const must = <T,>({ data, error }: { data: T | null; error: unknown }): T => {
  if (error) throw error;
  return (data ?? ([] as unknown)) as T;
};

export function supabaseRepo(coupleId: string, userId: string): UserRepo {
  const db = supabase!;
  let partnerId: string | null = null;

  return {
    kind: 'supabase',
    async load() {
      const [members, w, v, c, ev] = await Promise.all([
        db.from('profiles').select('id, nickname, preferences').eq('couple_id', coupleId),
        db.from('wishes').select('restaurant_id').eq('couple_id', coupleId),
        db.from('visits').select('*, ratings(user_id, food, revisit)').eq('couple_id', coupleId).order('date', { ascending: false }),
        db.from('cellar').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
        db.from('corkage_evidence').select('*').eq('couple_id', coupleId).order('verified_at', { ascending: false }),
      ]);
      const profs = must<Row[]>(members);
      const me = profs.find((p) => p.id === userId);
      const partner = profs.find((p) => p.id !== userId);
      partnerId = (partner?.id as string) ?? null;
      const pp = (p: Row | undefined, fallback: PersonPref): PersonPref => ({ ...fallback, ...((p?.preferences as Partial<PersonPref>) ?? {}), name: (p?.nickname as string) || fallback.name });
      const verifications: Record<string, MyVerification> = {};
      for (const e of must<Row[]>(ev)) {
        const rid = e.restaurant_id as string;
        if (verifications[rid]) continue;
        verifications[rid] = {
          status: e.status as MyVerification['status'],
          freeBottles: (e.free_bottles as number) ?? null,
          extraFee: (e.extra_fee as string) ?? null,
          note: ((e.conditions as string[]) ?? []).join(', '),
          method: e.verification_method as MyVerification['method'],
          verifiedAt: String(e.verified_at).slice(0, 10),
        };
      }
      return {
        wishes: must<Row[]>(w).map((r) => r.restaurant_id as string),
        visits: must<Row[]>(v).map((r) => {
          const ratings = (r.ratings as Row[]) ?? [];
          const mine = ratings.find((x) => x.user_id === userId);
          const theirs = ratings.find((x) => x.user_id !== userId);
          return {
            id: r.id as string,
            restaurantId: r.restaurant_id as string,
            restaurantName: (r.restaurant_name as string) ?? '',
            date: r.date as string,
            cost: (r.total_cost as number) ?? 0,
            myRating: (mine?.food as number) ?? 0,
            partnerRating: (theirs?.food as number) ?? 0,
            revisit: ((mine?.revisit as Visit['revisit']) ?? 'maybe'),
            note: (r.notes as string) ?? '',
          };
        }),
        cellar: must<Row[]>(c).map((r) => ({ id: r.id as string, name: r.name as string, type: r.drink_type as CellarItem['type'], note: (r.note as string) ?? '', addedAt: r.created_at as string })),
        prefs: { people: [pp(me, DEFAULT_PREFS.people[0]), pp(partner, DEFAULT_PREFS.people[1])], regions: ((me?.preferences as { regions?: Preferences['regions'] })?.regions ?? []) },
        verifications,
      };
    },
    async setWish(id, on) {
      if (on) must(await db.from('wishes').upsert({ couple_id: coupleId, restaurant_id: id }));
      else must(await db.from('wishes').delete().eq('couple_id', coupleId).eq('restaurant_id', id));
    },
    async addVisit(v) {
      must(await db.from('visits').insert({ id: v.id, couple_id: coupleId, restaurant_id: v.restaurantId, restaurant_name: v.restaurantName, date: v.date, total_cost: v.cost, notes: v.note }));
      const rows = [{ visit_id: v.id, user_id: userId, food: v.myRating, revisit: v.revisit }];
      if (partnerId && v.partnerRating) rows.push({ visit_id: v.id, user_id: partnerId, food: v.partnerRating, revisit: v.revisit });
      must(await db.from('ratings').insert(rows));
    },
    async removeVisit(id) {
      must(await db.from('visits').delete().eq('id', id));
    },
    async addCellar(c) {
      must(await db.from('cellar').insert({ id: c.id, couple_id: coupleId, name: c.name, drink_type: c.type, note: c.note }));
    },
    async removeCellar(id) {
      must(await db.from('cellar').delete().eq('id', id));
    },
    async savePrefs(p) {
      // 내 취향만 저장 (상대 취향은 상대 계정에서 저장해요)
      const { name, ...mine } = p.people[0];
      must(await db.from('profiles').update({ nickname: name, preferences: { ...mine, regions: p.regions } }).eq('id', userId));
    },
    async saveVerification(rid, v) {
      if (!v) {
        must(await db.from('corkage_evidence').delete().eq('couple_id', coupleId).eq('restaurant_id', rid));
        return;
      }
      must(
        await db.from('corkage_evidence').insert({
          couple_id: coupleId,
          restaurant_id: rid,
          status: v.status,
          free_bottles: v.freeBottles,
          extra_fee: v.extraFee,
          conditions: v.note ? [v.note] : [],
          verified_at: v.verifiedAt,
          verification_method: v.method,
        })
      );
    },
  };
}
