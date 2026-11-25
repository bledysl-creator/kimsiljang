import { describe, expect, it } from 'vitest';
import { foodOf, judge, manualCorkage } from '../scripts/collect';

const post = (text: string, date = '2026-11-01') => ({ title: text.slice(0, 20), link: `https://blog.naver.com/x/${Math.random()}`, description: text, date, text });

describe('judge (블로그 후기 분석)', () => {
  it('후기만으로는 확인 완료가 되지 않고 unknown + 후기 신호로 남아요', () => {
    const r = judge([post('정자동 맛집 콜키지 프리 와인 가져갔어요'), post('여기 콜키지 무료라서 와인 들고감')]);
    expect(r.corkage.status).toBe('unknown');
    expect(r.corkage.reviewSignal).toBe('free');
    expect(r.corkage.freeMentions).toBe(2);
    expect(r.corkage.verifiedAt).toBeNull();
    expect(r.corkage.verificationMethod).toBe('review');
    expect(r.corkage.drinkTypes).toContain('와인');
  });

  it('무료와 유료 후기가 상충하면 disputed', () => {
    const r = judge([post('콜키지 프리'), post('콜키지 무료'), post('콜키지 병당 20,000원'), post('콜키지 비용 2만원 받아요')]);
    expect(r.corkage.reviewSignal).toBe('mixed');
    expect(r.corkage.status).toBe('disputed');
  });

  it('병 수 제한이 2개 이상 글에서 나오면 조건부 신호와 병 수', () => {
    const r = judge([post('콜키지 1병까지 무료'), post('콜키지는 1병만 무료예요')]);
    expect(r.corkage.reviewSignal).toBe('conditional');
    expect(r.corkage.freeBottles).toBe(1);
  });

  it('근거 글에는 본문 요약을 저장하지 않아요', () => {
    const r = judge([post('콜키지 프리')]);
    expect(r.evidence[0]).not.toHaveProperty('snippet');
  });

  it('글이 없으면 신호 없음', () => {
    const r = judge([]);
    expect(r.corkage.reviewSignal).toBe('none');
    expect(r.corkage.status).toBe('unknown');
  });
});

describe('manualCorkage (직접 확인)', () => {
  it('예전 free 표기도 verified_free 로 읽고 확인 방법을 남겨요', () => {
    const c = manualCorkage(judge([]).corkage, { corkage: { status: 'free', bottleLimit: 2 } });
    expect(c.status).toBe('verified_free');
    expect(c.freeBottles).toBe(2);
    expect(c.verificationMethod).toBe('phone');
    expect(c.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('foodOf', () => {
  it('카테고리를 새 음식 분류로', () => {
    expect(foodOf('음식점 > 일식 > 회')).toBe('회·해산물');
    expect(foodOf('음식점 > 양식 > 이탈리안')).toBe('양식');
    expect(foodOf('음식점 > 술집 > 이자카야')).toBe('일식·이자카야');
    expect(foodOf('음식점 > 한식 > 육류,고기')).toBe('고기');
  });
});
