// ⚠️ 가상 데이터: 화면 확인용 예시예요. 실제 가게가 아니에요. (isSample: true)
import type { Restaurant } from '@/types';

const base: Pick<Restaurant, 'address' | 'phone' | 'kakaoUrl' | 'naverUrl' | 'lat' | 'lng' | 'evidence' | 'images' | 'firstSeen' | 'isSample' | 'menus'> = {
  address: '',
  phone: '',
  kakaoUrl: null,
  naverUrl: null,
  lat: null,
  lng: null,
  evidence: [],
  images: [],
  firstSeen: '2026-11-25',
  isSample: true,
  menus: [],
};

const ck = (status: Restaurant['corkage']['status'], extra: Partial<Restaurant['corkage']> = {}) => ({
  status,
  bottleLimit: null,
  conditions: [],
  freeMentions: 0,
  paidMentions: 0,
  confidence: 0,
  verifiedAt: null,
  verifiedBy: 'none' as const,
  ...extra,
});

export const SAMPLE_RESTAURANTS: Restaurant[] = [
  { ...base, id: 'sample-1', name: '달빛 사시미 (예시)', region: '성남', area: '분당', food: '해산물·회', category: '일식 > 회', drinks: ['사케', '와인'], priceFor2: 65000, tags: ['데이트','조용한','주차'], emoji: '🍣', lat: 37.3849, lng: 127.1233, corkage: ck('free', { conditions: ['병 수 제한 없음 (예시)'] }) },
  { ...base, id: 'sample-2', name: '로제 테이블 (예시)', region: '수원', area: '광교', food: '양식·다이닝', category: '양식 > 스테이크', drinks: ['와인'], priceFor2: 89000, tags: ['데이트','분위기'], emoji: '🥩', lat: 37.2851, lng: 127.0573, corkage: ck('free', { conditions: ['와인잔 제공 (예시)'] }) },
  { ...base, id: 'sample-3', name: '밤의 이자카야 (예시)', region: '서울', area: '성수', food: '일식·이자카야', category: '술집 > 이자카야', drinks: ['위스키', '사케'], priceFor2: 78000, tags: ['늦게까지','분위기'], emoji: '🍢', lat: 37.5445, lng: 127.056, corkage: ck('conditional', { bottleLimit: 1, conditions: ['1병까지 무료 (예시)', '얼음 별도 (예시)'] }) },
  { ...base, id: 'sample-4', name: '한우와 저녁 (예시)', region: '수원', area: '행궁동', food: '고기', category: '한식 > 소고기', drinks: ['와인'], priceFor2: 110000, tags: ['단체','주차'], emoji: '🥩', lat: 37.2826, lng: 127.0145, corkage: ck('unknown') },
  { ...base, id: 'sample-5', name: '초록 식탁 (예시)', region: '성남', area: '판교', food: '양식·다이닝', category: '양식 > 이탈리안', drinks: ['와인'], priceFor2: 55000, tags: ['데이트','뷰'], emoji: '🍝', lat: 37.3947, lng: 127.1112, corkage: ck('free') },
  { ...base, id: 'sample-6', name: '저녁 바다 (예시)', region: '기타 경기', area: '용인', food: '해산물·회', category: '일식 > 해산물', drinks: ['사케', '소주·전통주'], priceFor2: 72000, tags: ['조용한','룸'], emoji: '🐟', lat: 37.3236, lng: 127.0974, corkage: ck('conditional', { bottleLimit: 2, conditions: ['2병까지 무료 (예시)'] }) },
];
