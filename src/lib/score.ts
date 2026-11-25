// 추천 점수 (규칙 기반). 외부 AI 호출 없이 취향·콜키지 근거·예산으로 계산해요.
import type { Preferences, Restaurant } from '@/types';

export interface Scored {
  r: Restaurant;
  score: number;
  reasons: string[];
}

export function scoreRestaurant(r: Restaurant, pref: Preferences, wished = false): Scored {
  let s = 50;
  const reasons: string[] = [];

  if (r.corkage.status === 'free') {
    s += 20;
    reasons.push('콜키지 무료');
  } else if (r.corkage.status === 'conditional') {
    s += 12;
    reasons.push('조건부 무료');
  } else if (r.corkage.status === 'paid') s -= 15;

  if (r.corkage.freeMentions) {
    s += Math.min(10, r.corkage.freeMentions * 3);
    reasons.push(`블로그 무료 언급 ${r.corkage.freeMentions}건`);
  }
  if (pref.foods.includes(r.food)) {
    s += 10;
    reasons.push(`좋아하는 ${r.food}`);
  }
  const drinkHit = r.drinks.find((d) => pref.drinks.includes(d));
  if (drinkHit) {
    s += 6;
    reasons.push(`${drinkHit} 페어링`);
  }
  if (pref.regions.length && pref.regions.includes(r.region)) {
    s += 5;
    reasons.push(`${r.region} 선호`);
  }
  if (r.priceFor2 != null) {
    if (r.priceFor2 <= pref.budget) {
      s += 4;
      reasons.push('예산 안');
    } else s -= 12;
  }
  if (r.images.length) s += 3;
  if (wished) s += 2;

  return { r, score: Math.max(0, Math.min(100, Math.round(s))), reasons };
}

export function rank(list: Restaurant[], pref: Preferences, wishes: Set<string>) {
  return list.map((r) => scoreRestaurant(r, pref, wishes.has(r.id))).sort((a, b) => b.score - a.score);
}
