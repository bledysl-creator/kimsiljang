import type { CorkageStatus, Drink, Food, Region } from '@/types';

export const REGIONS: Region[] = ['서울', '성남', '수원', '기타 경기'];
export const FOODS: Food[] = ['일식·이자카야', '양식·다이닝', '한식', '중식', '고기', '해산물·회', '기타'];
export const DRINKS: Drink[] = ['와인', '사케', '위스키', '소주·전통주', '기타'];

export const CORKAGE_LABEL: Record<CorkageStatus, string> = {
  free: '콜키지 FREE',
  conditional: '조건부 무료',
  paid: '콜키지 유료',
  unknown: '콜키지 미확인',
};

export const CORKAGE_STYLE: Record<CorkageStatus, string> = {
  free: 'bg-ok-soft text-ok',
  conditional: 'bg-warn-soft text-warn',
  paid: 'bg-line text-muted',
  unknown: 'bg-accent-soft text-accent',
};

export const FOOD_EMOJI: Record<Food, string> = {
  '일식·이자카야': '🍢',
  '양식·다이닝': '🍝',
  한식: '🍲',
  중식: '🥟',
  고기: '🥩',
  '해산물·회': '🍣',
  기타: '🍽️',
};

export const money = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export const naverMapUrl = (name: string, area: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(`${name} ${area}`)}`;
export const kakaoMapUrl = (name: string, area: string) =>
  `https://map.kakao.com/link/search/${encodeURIComponent(`${name} ${area}`)}`;

export const TAGS = ['데이트', '분위기', '조용한', '룸', '주차', '단체', '늦게까지', '뷰'] as const;
