// ---- 공용 타입 (프론트엔드와 수집 스크립트가 같이 써요) ----

export type Region = '서울' | '성남' | '수원' | '기타 경기';
export type Food = '일식·이자카야' | '양식' | '한식' | '중식' | '고기' | '회·해산물' | '기타';
export type Drink = '와인' | '사케' | '위스키' | '소주·전통주' | '맥주' | '기타';
export type Mood = '데이트' | '조용한' | '활기찬' | '룸' | '뷰';

/**
 * 콜키지 확인 상태 (CLAUDE.md 4절)
 * - verified_free / conditional_free / paid : 공식 안내 또는 직접 문의로 확인된 경우만
 * - unknown  : 확인 전 (블로그 후기만 있는 경우도 여기)
 * - disputed : 근거가 서로 상충 → 무료 확정 필터에서 제외
 */
export type CorkageStatus = 'verified_free' | 'conditional_free' | 'paid' | 'unknown' | 'disputed';

/** 블로그 후기에서 읽은 신호. 확인 상태와 별개로 표시해요 */
export type ReviewSignal = 'free' | 'conditional' | 'paid' | 'mixed' | 'none';

export type VerificationMethod = 'official' | 'phone' | 'visit' | 'review' | 'none';

export interface CorkageInfo {
  status: CorkageStatus;
  reviewSignal: ReviewSignal;
  /** 무료 병 수. 모르면 null */
  freeBottles: number | null;
  /** 반입 가능한 주종. 모르면 빈 배열 */
  drinkTypes: Drink[];
  /** 추가 요금 (예: '초과 시 병당 2만원'). 모르면 null */
  extraFee: string | null;
  /** 잔·얼음 제공 */
  glassIce: string | null;
  /** 최소 주문 조건 */
  minOrder: string | null;
  conditions: string[];
  /** 블로그 후기 중 무료 언급 / 유료 언급 글 수 */
  freeMentions: number;
  paidMentions: number;
  /** 공식·직접 확인 일자 (status 근거) */
  verifiedAt: string | null;
  verificationMethod: VerificationMethod;
  /** 후기 자동 분석 일자 */
  reviewCheckedAt: string | null;
}

export interface Evidence {
  title: string;
  url: string;
  date: string;
  source: 'naver-blog' | 'manual';
  signal: 'free' | 'paid' | 'conditional' | 'mention';
}

export interface SourceLink {
  provider: 'kakao' | 'naver' | 'official' | 'manual';
  label: string;
  /** 실제 API 응답이나 직접 입력에서 얻은 링크만 */
  url: string;
}

export interface MenuPhoto {
  /** 직접 등록했거나 사용 허가를 받은 사진만 */
  url: string;
  credit: string;
}

export interface Restaurant {
  id: string;
  name: string;
  region: Region;
  area: string;
  food: Food;
  category: string;
  /** 2인 예상 가격. 근거가 없으면 null */
  priceFor2: number | null;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  sources: SourceLink[];
  corkage: CorkageInfo;
  evidence: Evidence[];
  photos: MenuPhoto[];
  /** 블로그 후기 2개 이상에서 나온 분위기·편의 태그 */
  tags: string[];
  menus: string[];
  firstSeen: string;
  /** true 면 화면 확인용 가상 데이터 */
  isSample: boolean;
}

export interface CollectionRun {
  status: 'success' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt: string;
  count: number;
  error: string | null;
}

export interface RestaurantDataset {
  updatedAt: string | null;
  source: string;
  lastRun: CollectionRun | null;
  lastSuccessAt: string | null;
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
  revisit: 'yes' | 'maybe' | 'no';
  note: string;
}

export interface CellarItem {
  id: string;
  name: string;
  type: Drink;
  note: string;
  addedAt: string;
}

export interface PersonPref {
  name: string;
  foods: Food[];
  drinks: Drink[];
  moods: Mood[];
  budget: number;
}

export interface Preferences {
  people: [PersonPref, PersonPref];
  regions: Region[];
}

/** 우리가 직접 전화·방문으로 확인한 콜키지 정보 (가게 id 별) */
export interface MyVerification {
  status: Exclude<CorkageStatus, 'unknown' | 'disputed'>;
  freeBottles: number | null;
  extraFee: string | null;
  note: string;
  method: 'phone' | 'visit' | 'official';
  verifiedAt: string;
}
