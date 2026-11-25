// 테스트 전용 가상 가게 (앱에는 나오지 않아요)
import type { CorkageInfo, Restaurant } from '../src/types';

const ck = (status: CorkageInfo['status'], extra: Partial<CorkageInfo> = {}): CorkageInfo => ({
  status,
  reviewSignal: 'none',
  freeBottles: null,
  drinkTypes: [],
  extraFee: null,
  glassIce: null,
  minOrder: null,
  conditions: [],
  freeMentions: 0,
  paidMentions: 0,
  verifiedAt: null,
  verificationMethod: 'none',
  reviewCheckedAt: null,
  ...extra,
});

const base = {
  address: '',
  phone: '',
  sources: [],
  evidence: [],
  photos: [],
  menus: [],
  firstSeen: '2026-11-25',
  isSample: true,
} satisfies Partial<Restaurant>;

export const SAMPLE_RESTAURANTS: Restaurant[] = [
  { ...base, id: 'sample-1', name: '달빛 사시미 (예시)', region: '성남', area: '분당', food: '회·해산물', category: '일식 > 회', priceFor2: 65000, tags: ['데이트', '조용한', '주차'], lat: 37.3849, lng: 127.1233, corkage: ck('verified_free', { drinkTypes: ['와인', '사케'], glassIce: '와인잔 제공 (예시)', verifiedAt: '2026-11-20', verificationMethod: 'phone' }) },
  { ...base, id: 'sample-2', name: '로제 테이블 (예시)', region: '수원', area: '광교', food: '양식', category: '양식 > 스테이크', priceFor2: 89000, tags: ['데이트', '분위기'], lat: 37.2851, lng: 127.0573, corkage: ck('verified_free', { drinkTypes: ['와인'], verifiedAt: '2026-11-18', verificationMethod: 'official' }) },
  { ...base, id: 'sample-3', name: '밤의 이자카야 (예시)', region: '서울', area: '성수', food: '일식·이자카야', category: '술집 > 이자카야', priceFor2: 78000, tags: ['활기찬', '늦게까지'], lat: 37.5445, lng: 127.056, corkage: ck('conditional_free', { freeBottles: 1, extraFee: '초과 시 병당 1만원 (예시)', drinkTypes: ['위스키', '사케'], verifiedAt: '2026-11-10', verificationMethod: 'phone' }) },
  { ...base, id: 'sample-4', name: '한우와 저녁 (예시)', region: '수원', area: '행궁동', food: '고기', category: '한식 > 소고기', priceFor2: 110000, tags: ['단체', '주차'], lat: 37.2826, lng: 127.0145, corkage: ck('unknown', { reviewSignal: 'free', freeMentions: 3 }) },
  { ...base, id: 'sample-5', name: '초록 식탁 (예시)', region: '성남', area: '판교', food: '양식', category: '양식 > 이탈리안', priceFor2: 55000, tags: ['데이트', '뷰'], lat: 37.3947, lng: 127.1112, corkage: ck('paid', { extraFee: '병당 2만원 (예시)', verifiedAt: '2026-11-12', verificationMethod: 'phone' }) },
  { ...base, id: 'sample-6', name: '저녁 바다 (예시)', region: '기타 경기', area: '용인', food: '회·해산물', category: '일식 > 해산물', priceFor2: 72000, tags: ['조용한', '룸'], lat: 37.3236, lng: 127.0974, corkage: ck('disputed', { reviewSignal: 'mixed', freeMentions: 2, paidMentions: 2 }) },
];
