// ---- 공용 타입 (프론트엔드와 수집 스크립트가 같이 써요) ----

export type Region = '서울' | '성남' | '수원' | '기타 경기';
export type Food = '일식·이자카야' | '양식·다이닝' | '한식' | '중식' | '고기' | '해산물·회' | '기타';
export type Drink = '와인' | '사케' | '위스키' | '소주·전통주' | '기타';

/** free: 무료 · conditional: 조건부 무료 · paid: 유료 · unknown: 미확인 */
export type CorkageStatus = 'free' | 'conditional' | 'paid' | 'unknown';

export interface CorkageInfo {
  status: CorkageStatus;
  /** 무료 병 수 제한 (예: 1 = 1병까지 무료). 모르면 null */
  bottleLimit: number | null;
  /** 잔/얼음/추가 비용 등 반입 조건 메모 */
  conditions: string[];
  /** 블로그에서 '콜키지 프리/무료' 를 언급한 글 수 */
  freeMentions: number;
  /** 블로그에서 '콜키지 비용/유료' 를 언급한 글 수 */
  paidMentions: number;
  /** 0~100. 근거가 많고 최근일수록 높아요 */
  confidence: number;
  verifiedAt: string | null;
  verifiedBy: 'auto' | 'manual' | 'none';
}

export interface Evidence {
  title: string;
  url: string;
  date: string;
  snippet: string;
  source: 'naver-blog' | 'manual';
  signal: 'free' | 'paid' | 'conditional' | 'mention';
}

export interface MenuImage {
  thumb: string;
  sourceUrl: string | null;
  sourceName: string;
}

export interface Restaurant {
  id: string;
  name: string;
  region: Region;
  area: string;
  food: Food;
  category: string;
  drinks: Drink[];
  /** 2인 예상 가격. 실제 데이터는 대부분 null 이에요 */
  priceFor2: number | null;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  kakaoUrl: string | null;
  naverUrl: string | null;
  corkage: CorkageInfo;
  evidence: Evidence[];
  images: MenuImage[];
  firstSeen: string;
  /** true 면 화면 확인용 가상 데이터예요 */
  isSample: boolean;
  emoji: string;
  /** 블로그 글에서 뽑은 분위기·편의 태그 (데이트, 주차, 룸 등) */
  tags: string[];
  /** 대표 메뉴 (블로그·수동 입력) */
  menus: string[];
}

export interface RestaurantDataset {
  updatedAt: string | null;
  source: string;
  restaurants: Restaurant[];
}

// ---- 사용자 데이터 ----
export interface Visit {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  cost: number;
  myRating: number;
  partnerRating: number;
  note: string;
}

export interface CellarItem {
  id: string;
  name: string;
  type: Drink;
  note: string;
  addedAt: string;
}

export interface Preferences {
  foods: Food[];
  drinks: Drink[];
  regions: Region[];
  budget: number;
  mood: '조용한' | '활기찬' | '상관없음';
}
