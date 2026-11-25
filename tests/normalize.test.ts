import { describe, expect, it } from 'vitest';
import { normalizeRestaurant, reviewSignalOf } from '../src/lib/normalize';

const v1 = {
  id: 'k1',
  name: '테스트',
  region: '성남',
  area: '분당구 정자동',
  food: '해산물·회',
  category: '일식 > 회',
  drinks: ['와인'],
  priceFor2: null,
  address: '경기 성남시',
  lat: 37.3,
  lng: 127.1,
  phone: '',
  kakaoUrl: 'http://place.map.kakao.com/1',
  naverUrl: null,
  corkage: { status: 'free', bottleLimit: null, conditions: [], freeMentions: 5, paidMentions: 0, confidence: 80, verifiedAt: '2026-11-25', verifiedBy: 'auto' },
  evidence: [{ title: 't', url: 'https://blog.naver.com/a', date: '2026-11-01', snippet: 's', source: 'naver-blog', signal: 'free' }],
  images: [{ thumb: 'https://x/1.jpg', sourceUrl: null, sourceName: 'x' }],
  emoji: '🍣',
  tags: [],
  menus: [],
  firstSeen: '2026-11-25',
  isSample: false,
};

describe('예전 데이터 변환', () => {
  it('자동 판정 free → unknown + 후기 신호 free (확인 완료 아님)', () => {
    const r = normalizeRestaurant(v1);
    expect(r.corkage.status).toBe('unknown');
    expect(r.corkage.reviewSignal).toBe('free');
    expect(r.corkage.verifiedAt).toBeNull();
    expect(r.corkage.reviewCheckedAt).toBe('2026-11-25');
    expect(r.food).toBe('회·해산물');
    expect(r.corkage.drinkTypes).toEqual(['와인']);
  });

  it('외부 이미지 핫링크와 본문 요약은 버려요', () => {
    const r = normalizeRestaurant(v1);
    expect(r.photos).toEqual([]);
    expect(r.evidence[0]).not.toHaveProperty('snippet');
  });

  it('카카오 장소 링크는 응답 그대로 출처로', () => {
    expect(normalizeRestaurant(v1).sources).toEqual([{ provider: 'kakao', label: '카카오맵 장소', url: 'http://place.map.kakao.com/1' }]);
  });

  it('직접 확인(manual) 기록은 확인 상태로', () => {
    const r = normalizeRestaurant({ ...v1, corkage: { ...v1.corkage, status: 'conditional', verifiedBy: 'manual', bottleLimit: 1 } });
    expect(r.corkage.status).toBe('conditional_free');
    expect(r.corkage.freeBottles).toBe(1);
  });

  it('상충 신호', () => {
    expect(reviewSignalOf(4, 3)).toBe('mixed');
    expect(reviewSignalOf(10, 1)).toBe('free');
    expect(reviewSignalOf(0, 3)).toBe('paid');
    expect(reviewSignalOf(1, 0)).toBe('none');
  });
});
