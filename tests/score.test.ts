import { describe, expect, it } from 'vitest';
import { SAMPLE_RESTAURANTS } from './fixtures';
import { WEIGHTS, rank, scoreRestaurant } from '../src/lib/score';
import { DEFAULT_PREFS } from '../src/lib/userRepo';
import type { Preferences, Restaurant } from '../src/types';

const byId = (id: string) => SAMPLE_RESTAURANTS.find((r) => r.id === id)!;
const prefs: Preferences = {
  people: [
    { name: 'A', foods: ['회·해산물'], drinks: ['와인'], moods: ['데이트'], budget: 80000 },
    { name: 'B', foods: ['양식'], drinks: ['사케'], moods: ['조용한'], budget: 70000 },
  ],
  regions: ['성남'],
};

describe('추천 점수', () => {
  it('가중치 합은 100', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('모든 항목을 평가할 수 있으면 정보 충족률 100%', () => {
    const s = scoreRestaurant(byId('sample-1'), prefs);
    expect(s.coverage).toBe(1);
    expect(s.score).toBeGreaterThan(70);
  });

  it('두 사람 점수를 평균해요 (한 사람만 좋아하는 음식은 중간 점수)', () => {
    const r = byId('sample-1'); // 회·해산물: A 만 좋아함
    const both: Preferences = { ...prefs, people: [prefs.people[0], { ...prefs.people[1], foods: ['회·해산물'] }] };
    expect(scoreRestaurant(r, both).score).toBeGreaterThan(scoreRestaurant(r, prefs).score);
  });

  it('정보가 없는 항목은 0점이 아니라 빼고 정규화해요', () => {
    const r: Restaurant = { ...byId('sample-1'), priceFor2: null, tags: [] };
    const s = scoreRestaurant(r, prefs);
    expect(s.coverage).toBeCloseTo((100 - WEIGHTS.budget - WEIGHTS.mood) / 100);
    expect(s.caveats).toContain('가격 정보 없음');
  });

  it('미확인(후기 신호 없음) 가게는 콜키지 항목이 빠지고 caveat 에 표시', () => {
    const r: Restaurant = { ...byId('sample-4'), corkage: { ...byId('sample-4').corkage, reviewSignal: 'none' } };
    const s = scoreRestaurant(r, prefs);
    expect(s.caveats).toContain('콜키지 미확인');
    expect(s.coverage).toBeLessThan(1);
  });

  it('무료 확인 가게가 유료 가게보다 위', () => {
    const order = rank([byId('sample-5'), byId('sample-1')], prefs).map((s) => s.r.id);
    expect(order[0]).toBe('sample-1');
  });

  it('기본 취향은 두 사람', () => {
    expect(DEFAULT_PREFS.people).toHaveLength(2);
  });
});
