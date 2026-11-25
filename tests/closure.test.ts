import { describe, expect, it } from 'vitest';
import { closureOf, normalizeRestaurant } from '../src/lib/normalize';

const today = '2026-11-25';

describe('폐업 교차 확인', () => {
  it('카카오에 같은 장소가 있으면 영업 중으로 봐요', () => {
    expect(closureOf({ kakaoFound: true, naverFound: true, latestPost: '2026-11-01', today }).status).toBe('ok');
  });

  it('카카오와 네이버 둘 다 안 보이면 폐업 의심', () => {
    const c = closureOf({ kakaoFound: false, naverFound: false, latestPost: '2026-10-01', today });
    expect(c.status).toBe('suspected');
    expect(c.signals).toHaveLength(2);
  });

  it('카카오만 안 보이고 후기가 오래됐으면 폐업 의심', () => {
    expect(closureOf({ kakaoFound: false, naverFound: true, latestPost: '2024-01-01', today }).status).toBe('suspected');
  });

  it('한 가지 신호만으로는 의심하지 않아요', () => {
    expect(closureOf({ kakaoFound: false, naverFound: true, latestPost: '2026-10-01', today }).status).toBe('unknown');
    expect(closureOf({ kakaoFound: true, naverFound: null, latestPost: '2020-01-01', today }).status).toBe('ok');
  });

  it('API 오류면 판단하지 않아요', () => {
    expect(closureOf({ kakaoFound: null, naverFound: null, latestPost: null, today }).status).toBe('unknown');
    expect(closureOf({ kakaoFound: false, naverFound: null, latestPost: '2026-10-01', today }).status).toBe('unknown');
  });

  it('예전 데이터에는 확인 전(unknown)으로 채워요', () => {
    const r = normalizeRestaurant({ id: 'k1', name: 'x', region: '서울', corkage: {} });
    expect(r.closure).toEqual({ status: 'unknown', checkedAt: null, signals: [] });
  });
});
