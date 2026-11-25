// 추천 점수 — CLAUDE.md 7절
// 가중치: 콜키지 35 · 음식 25 · 분위기 15 · 예산 15 · 위치 10
// 두 사람 점수의 평균을 쓰고, 정보가 없는 항목은 0점이 아니라 '평가 불가'로 빼고 정규화해요.
// 정보 충족률 = 평가 가능한 가중치 합 / 100
import type { PersonPref, Preferences, Restaurant } from '@/types';

export const WEIGHTS = { corkage: 35, food: 25, mood: 15, budget: 15, location: 10 } as const;
type Key = keyof typeof WEIGHTS;

export interface Scored {
  r: Restaurant;
  /** 0~100, 평가 가능한 항목 기준 */
  score: number;
  /** 0~1 */
  coverage: number;
  reasons: string[];
  /** 추정·미확인 안내 */
  caveats: string[];
}

const MOOD_TAGS: Record<string, string[]> = {
  데이트: ['데이트', '분위기'],
  조용한: ['조용한', '룸'],
  활기찬: ['활기찬', '단체', '늦게까지'],
  룸: ['룸'],
  뷰: ['뷰'],
};

function corkagePart(r: Restaurant): { s: number | null; reason?: string; caveat?: string } {
  const c = r.corkage;
  switch (c.status) {
    case 'verified_free':
      return { s: 1, reason: '콜키지 무료 확인' };
    case 'conditional_free':
      return { s: 0.8, reason: `조건부 무료${c.freeBottles ? ` (${c.freeBottles}병)` : ''}` };
    case 'paid':
      return { s: 0.1 };
    case 'disputed':
      return { s: 0.2, caveat: '콜키지 정보가 서로 달라요' };
    default:
      if (c.reviewSignal === 'free' || c.reviewSignal === 'conditional')
        return { s: 0.5, reason: `후기상 무료 ${c.freeMentions}건`, caveat: '콜키지는 후기 기준 추정 (미확인)' };
      if (c.reviewSignal === 'paid') return { s: 0.15, caveat: '후기상 유료' };
      return { s: null, caveat: '콜키지 미확인' };
  }
}

function personFood(p: PersonPref, r: Restaurant) {
  return p.foods.length === 0 ? null : p.foods.includes(r.food) ? 1 : 0.2;
}
function personMood(p: PersonPref, r: Restaurant) {
  if (!r.tags.length || !p.moods.length) return null;
  const hit = p.moods.some((m) => MOOD_TAGS[m]?.some((t) => r.tags.includes(t)));
  return hit ? 1 : 0.3;
}
function personBudget(p: PersonPref, r: Restaurant) {
  if (r.priceFor2 == null || !p.budget) return null;
  if (r.priceFor2 <= p.budget) return 1;
  if (r.priceFor2 <= p.budget * 1.2) return 0.5;
  return 0;
}
const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export function scoreRestaurant(r: Restaurant, pref: Preferences): Scored {
  const parts: Partial<Record<Key, number | null>> = {};
  const reasons: string[] = [];
  const caveats: string[] = [];

  const ck = corkagePart(r);
  parts.corkage = ck.s;
  if (ck.reason) reasons.push(ck.reason);
  if (ck.caveat) caveats.push(ck.caveat);

  parts.food = avg(pref.people.map((p) => personFood(p, r)));
  if (parts.food != null && parts.food >= 0.6) reasons.push(`둘 다 좋아하는 ${r.food}`);
  else if (parts.food != null && parts.food > 0.2) reasons.push(`한 사람이 좋아하는 ${r.food}`);

  parts.mood = avg(pref.people.map((p) => personMood(p, r)));
  if (parts.mood != null && parts.mood >= 0.6) reasons.push(`분위기: ${r.tags.slice(0, 2).join('·')}`);
  if (parts.mood == null) caveats.push('분위기 정보 없음');
  else if (!r.isSample && r.corkage.reviewCheckedAt) caveats.push('분위기는 후기 기반 추정');

  parts.budget = avg(pref.people.map((p) => personBudget(p, r)));
  if (parts.budget === 1) reasons.push('예산 안');
  if (parts.budget == null) caveats.push('가격 정보 없음');

  parts.location = pref.regions.length ? (pref.regions.includes(r.region) ? 1 : 0) : null;
  if (parts.location === 1) reasons.push(`${r.region} 선호`);

  let got = 0;
  let wsum = 0;
  for (const k of Object.keys(WEIGHTS) as Key[]) {
    const v = parts[k];
    if (v == null) continue;
    got += WEIGHTS[k] * v;
    wsum += WEIGHTS[k];
  }
  return {
    r,
    score: wsum ? Math.round((got / wsum) * 100) : 0,
    coverage: wsum / 100,
    reasons,
    caveats,
  };
}

export function rank(list: Restaurant[], pref: Preferences) {
  return list.map((r) => scoreRestaurant(r, pref)).sort((a, b) => b.score * (0.5 + b.coverage / 2) - a.score * (0.5 + a.coverage / 2));
}

/** 정보 충족률이 이 이상일 때만 적합도를 숫자로 보여줘요 */
export const MIN_COVERAGE_TO_SHOW = 0.5;
