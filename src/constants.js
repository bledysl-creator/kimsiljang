export const REGIONS = ['전체', '서울', '성남', '수원', '기타 경기'];
export const CATEGORIES = ['전체', '회', '이자카야', '와인바', '고기', '기타'];

export const CORKAGE = {
  free: { label: '완전 무료', short: '무료', color: '#1f7a4d' },
  conditional: { label: '조건부 무료', short: '조건부', color: '#b7791f' },
  paid: { label: '유료', short: '유료', color: '#8a8a8a' },
  unknown: { label: '확인 필요', short: '확인필요', color: '#6b6bb3' },
};

export const CATEGORY_EMOJI = { 회: '🐟', 이자카야: '🏮', 와인바: '🍷', 고기: '🥩', 기타: '🍶' };

export const naverMapUrl = (p) =>
  `https://map.naver.com/p/search/${encodeURIComponent(`${p.name.replace('[샘플] ', '')} ${p.district || p.region}`)}`;
export const kakaoMapUrl = (p) =>
  p.kakaoPlaceUrl || `https://map.kakao.com/link/search/${encodeURIComponent(`${p.name.replace('[샘플] ', '')} ${p.district || p.region}`)}`;
export const naverBlogSearchUrl = (p) =>
  `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(`${p.name.replace('[샘플] ', '')} 콜키지`)}`;
