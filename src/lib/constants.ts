import type { CorkageStatus, Drink, Food, Mood, Region, ReviewSignal } from '@/types';

export const SERVICE_NAME = '김실장';
export const PROJECT_NAME = 'OUR TABLE';

export const REGIONS: Region[] = ['서울', '성남', '수원', '기타 경기'];
export const FOODS: Food[] = ['일식·이자카야', '양식', '한식', '중식', '고기', '회·해산물', '기타'];
export const DRINKS: Drink[] = ['와인', '사케', '위스키', '소주·전통주', '맥주', '기타'];
export const MOODS: Mood[] = ['데이트', '조용한', '활기찬', '룸', '뷰'];

export const CORKAGE_META: Record<CorkageStatus, { label: string; short: string; icon: string; color: string; bg: string }> = {
  verified_free: { label: '무료 확인', short: '무료', icon: '✓', color: 'text-st-free', bg: 'bg-st-free/10' },
  conditional_free: { label: '조건부 무료', short: '조건부', icon: '◐', color: 'text-st-cond', bg: 'bg-st-cond/10' },
  paid: { label: '유료', short: '유료', icon: '₩', color: 'text-st-paid', bg: 'bg-st-paid/10' },
  unknown: { label: '미확인', short: '미확인', icon: '?', color: 'text-st-unknown', bg: 'bg-st-unknown/10' },
  disputed: { label: '정보 상충', short: '상충', icon: '!', color: 'text-st-disputed', bg: 'bg-st-disputed/10' },
};

/** 지도 마커 색 (토큰과 같은 값) */
export const STATUS_HEX: Record<CorkageStatus, string> = {
  verified_free: '#20764D',
  conditional_free: '#A66B18',
  paid: '#66666D',
  unknown: '#7063A6',
  disputed: '#B42318',
};

export const REVIEW_LABEL: Record<ReviewSignal, string> = {
  free: '후기상 무료',
  conditional: '후기상 조건부 무료',
  paid: '후기상 유료',
  mixed: '후기 엇갈림',
  none: '',
};

export const money = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export const isFreeConfirmed = (s: CorkageStatus) => s === 'verified_free' || s === 'conditional_free';
