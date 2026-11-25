import { describe, expect, it } from 'vitest';
import { SAMPLE_RESTAURANTS } from '../src/data/sample';
import { DEFAULT_FILTERS, activeFilters, matches, type Filters } from '../src/store/filters';

const f = (p: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...p });
const ids = (p: Partial<Filters>) => SAMPLE_RESTAURANTS.filter((r) => matches(r, f(p))).map((r) => r.id);

describe('필터', () => {
  it('기본 필터는 전부 통과', () => {
    expect(ids({})).toHaveLength(SAMPLE_RESTAURANTS.length);
  });

  it('무료 확인만: verified_free 만', () => {
    expect(ids({ corkage: 'free' })).toEqual(['sample-1', 'sample-2']);
  });

  it('조건부 무료 포함: disputed 와 후기 신호만 있는 곳은 빠져요', () => {
    const r = ids({ corkage: 'free_cond' });
    expect(r).toEqual(['sample-1', 'sample-2', 'sample-3']);
    expect(r).not.toContain('sample-6');
    expect(r).not.toContain('sample-4');
  });

  it('후기상 무료까지: unknown+후기 무료 포함, disputed 는 제외', () => {
    const r = ids({ corkage: 'review' });
    expect(r).toContain('sample-4');
    expect(r).not.toContain('sample-6');
  });

  it('지역 · 음식 · 주차 · 반입 주종', () => {
    expect(ids({ region: '수원' })).toEqual(['sample-2', 'sample-4']);
    expect(ids({ region: '분당·판교' })).toEqual(['sample-1', 'sample-5']);
    expect(ids({ food: '양식' })).toEqual(['sample-2', 'sample-5']);
    expect(ids({ parking: true })).toEqual(['sample-1', 'sample-4']);
    expect(ids({ drink: '사케' })).toEqual(['sample-1', 'sample-3']);
  });

  it('예산: 가격 정보가 있으면 초과는 제외', () => {
    expect(ids({ budget: 70000 })).toEqual(['sample-1', 'sample-5']);
  });

  it('검색어', () => {
    expect(ids({ q: '이자카야' })).toEqual(['sample-3']);
  });

  it('지도 영역', () => {
    expect(ids({ bounds: { sw: [37.2, 126.9], ne: [37.3, 127.1] } })).toEqual(['sample-2', 'sample-4']);
  });

  it('활성 필터 목록', () => {
    expect(activeFilters(f({ region: '서울', parking: true })).map((a) => a.key)).toEqual(['region', 'parking']);
  });
});
